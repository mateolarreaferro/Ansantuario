import { useState, useRef, useEffect, useCallback } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { updateNote } from '../../lib/firestore-notes'
import { uploadAudio } from '../../lib/firebase-storage'
import type { VoiceNote as VoiceNoteType } from '../../types/note'

interface VoiceNoteProps {
  note: VoiceNoteType
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function VoiceNote({ note }: VoiceNoteProps) {
  const { isRecording, duration, audioBlob, error, startRecording, stopRecording, resetRecording } =
    useAudioRecorder()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playProgress, setPlayProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [retranscribing, setRetranscribing] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const autoStartedRef = useRef(false)

  const hasAudio = !!note.audioUrl

  // Auto-start recording for fresh voice notes
  useEffect(() => {
    if (!hasAudio && !isRecording && !autoStartedRef.current) {
      autoStartedRef.current = true
      startRecording().catch(() => {
        // Permission denied — revert to showing the button
        autoStartedRef.current = false
      })
    }
  }, [])

  // Save audio blob to Firebase Storage when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      setSaving(true)

      // Upload to Firebase Storage
      uploadAudio(audioBlob, note.id)
        .then(async ({ url, path }) => {
          await updateNote(note.id, {
            audioUrl: url,
            audioPath: path,
            duration,
            searchText: `Nota de voz (${duration}s)`
          } as Partial<VoiceNoteType>)

          // Transcribe in background using a local data URL (not stored in Firestore)
          setTranscribing(true)
          try {
            const dataUrl = await blobToDataUrl(audioBlob)
            const transcript: string = await (window as any).api.audio.transcribe(dataUrl)
            if (transcript) {
              await updateNote(note.id, {
                transcript,
                searchText: transcript
              } as Partial<VoiceNoteType>)

              // AI: analyze sentiment + generate summary for voice note
              try {
                const sentiment = await (window as any).api.ai.analyzeSentiment(transcript, 'voice')
                if (sentiment) {
                  await updateNote(note.id, { sentiment } as any)
                }
              } catch (err) {
                console.error('Voice sentiment analysis failed:', err)
              }
            }
          } catch (err) {
            console.error('Transcription failed:', err)
          } finally {
            setTranscribing(false)
          }

          resetRecording()
        })
        .catch((err) => {
          console.error('Audio upload failed:', err)
        })
        .finally(() => {
          setSaving(false)
        })
    }
  }, [audioBlob, isRecording])

  // Retry transcription for existing notes that have audio but no transcript
  const handleRetranscribe = useCallback(async () => {
    if (!note.audioUrl || retranscribing) return
    setRetranscribing(true)
    try {
      let dataUrl: string
      if (note.audioUrl.startsWith('data:')) {
        dataUrl = note.audioUrl
      } else {
        const response = await fetch(note.audioUrl)
        const blob = await response.blob()
        dataUrl = await blobToDataUrl(blob)
      }
      const transcript: string = await (window as any).api.audio.transcribe(dataUrl)
      if (transcript) {
        await updateNote(note.id, {
          transcript,
          searchText: transcript
        } as Partial<VoiceNoteType>)
      }
    } catch (err) {
      console.error('Retranscription failed:', err)
    } finally {
      setRetranscribing(false)
    }
  }, [note.audioUrl, note.id, retranscribing])

  const togglePlay = useCallback(() => {
    if (!note.audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(note.audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlayProgress(0)
        cancelAnimationFrame(animFrameRef.current)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      const tick = () => {
        if (audioRef.current) {
          setPlayProgress(audioRef.current.currentTime / audioRef.current.duration)
        }
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    }
  }, [isPlaying, note.audioUrl])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div onPointerDown={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {isRecording && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#E07A5F', margin: '0 auto 8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{formatTime(duration)}</div>
          <button
            onClick={stopRecording}
            style={{ padding: '6px 20px', borderRadius: 12, background: '#E07A5F', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Detener Grabación
          </button>
        </div>
      )}

      {saving && (
        <div style={{ textAlign: 'center', padding: 12, color: '#9B8E82', fontSize: '0.875rem' }}>Guardando...</div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 12, color: '#E07A5F', fontSize: '0.8rem' }}>{error}</div>
      )}

      {!hasAudio && !isRecording && !saving && (
        <button
          onClick={() => startRecording()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8,
            background: '#E07A5F', color: '#fff', fontSize: '0.875rem', fontWeight: 500,
            cursor: 'pointer', justifyContent: 'center'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          Grabar
        </button>
      )}

      {hasAudio && !isRecording && !saving && (
        <div>
          <div style={{ height: 40, borderRadius: 8, background: 'rgba(61,50,41,0.05)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 8 + Math.sin(i * 0.8 + note.id.charCodeAt(0)) * 12,
                  borderRadius: 2,
                  background: i / 24 <= playProgress ? '#E07A5F' : 'rgba(61,50,41,0.15)',
                  transition: 'background 0.1s'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={togglePlay}
              style={{ width: 32, height: 32, borderRadius: '50%', background: '#E07A5F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
            >
              {isPlaying ? '\u275A\u275A' : '\u25B6'}
            </button>
            <span style={{ fontSize: '0.75rem', color: '#9B8E82' }}>{formatTime(note.duration)}</span>
          </div>

          {/* Transcription */}
          {(transcribing || retranscribing) && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#9B8E82', fontStyle: 'italic' }}>
              Transcribiendo...
            </div>
          )}
          {note.transcript && !transcribing && !retranscribing && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#6B5E52', fontStyle: 'italic', lineHeight: 1.4 }}>
                {note.transcript}
              </div>
              {(note as any).sentiment?.summary && (
                <div style={{
                  marginTop: 6,
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{ opacity: 0.6 }}>Resumen:</span> {(note as any).sentiment.summary}
                </div>
              )}
              {(note as any).sentiment?.tone && (
                <div style={{
                  marginTop: 3,
                  fontSize: '0.6rem',
                  color: 'var(--accent-terracotta)',
                  opacity: 0.7
                }}>
                  Tono: {(note as any).sentiment.tone}
                </div>
              )}
            </div>
          )}
          {/* Retry transcription button for notes without transcript */}
          {!note.transcript && !transcribing && !retranscribing && (
            <button
              onClick={handleRetranscribe}
              style={{
                marginTop: 8,
                padding: '4px 12px',
                borderRadius: 8,
                background: 'rgba(61,50,41,0.08)',
                color: '#6B5E52',
                fontSize: '0.7rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Transcribir
            </button>
          )}
        </div>
      )}
    </div>
  )
}
