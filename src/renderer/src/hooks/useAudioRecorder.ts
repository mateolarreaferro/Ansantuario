import { useState, useRef, useCallback } from 'react'

interface AudioRecorderState {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
  error: string | null
}

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ]
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }))

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up analyser for waveform
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = getSupportedMimeType()
      if (!mimeType) {
        stream.getTracks().forEach((t) => t.stop())
        setState((prev) => ({ ...prev, error: 'Tu navegador no soporta grabación de audio.' }))
        return
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setState((prev) => ({ ...prev, audioBlob: blob, isRecording: false }))
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(100) // collect data every 100ms
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }))
      }, 1000)

      setState({ isRecording: true, duration: 0, audioBlob: null, error: null })
    } catch (err) {
      console.error('Failed to start recording:', err)
      setState((prev) => ({
        ...prev,
        error: 'No se pudo iniciar la grabación. Verifica los permisos del micrófono.'
      }))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetRecording = useCallback(() => {
    setState({ isRecording: false, duration: 0, audioBlob: null, error: null })
    chunksRef.current = []
  }, [])

  const getAnalyserData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current) return null
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    return data
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    getAnalyserData
  }
}
