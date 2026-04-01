import { useState, useRef } from 'react'
import { updateNote } from '../../lib/firestore-notes'
import { deleteField } from 'firebase/firestore'
import { uploadImage, deleteImage } from '../../lib/firebase-storage'
import type { Note, PhotoNote as PhotoNoteType } from '../../types/note'

interface PhotoNoteProps {
  note: PhotoNoteType
  isSelected: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function PhotoNote({ note, isSelected }: PhotoNoteProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [caption, setCaption] = useState(note.caption || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('Archivo muy grande (máx 5MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes')
      return
    }

    setError('')
    setUploading(true)
    try {
      // Delete old image if replacing
      if (note.imagePath) {
        await deleteImage(note.imagePath)
      }
      const { url, path } = await uploadImage(file, note.id)
      await updateNote(note.id, { imageUrl: url, imagePath: path, searchText: caption || 'Foto' } as Partial<Note>)

      // AI: auto-describe the photo in background for searchability
      try {
        const aiDescription: string = await (window as any).api.ai.describePhoto(url)
        if (aiDescription) {
          await updateNote(note.id, {
            aiDescription,
            searchText: aiDescription + (caption ? ` — ${caption}` : '')
          } as Partial<Note>)
        }
      } catch (err) {
        console.error('AI photo description failed:', err)
      }
    } catch {
      setError('Error al subir')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleCaptionBlur = () => {
    if (caption !== (note.caption || '')) {
      updateNote(note.id, { caption, searchText: caption || 'Foto' } as Partial<Note>)
    }
  }

  // Empty state — file picker
  if (!note.imageUrl) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          minHeight: 120,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          borderRadius: 'var(--radius-sm)',
          border: '2px dashed var(--border)',
          padding: 'var(--space-3)'
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
        {uploading ? (
          <div style={{ width: 20, height: 20, border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }}>
              Arrastra o haz clic
            </span>
            {/* Convert back to text */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const captionText = note.caption || ''
                updateNote(note.id, {
                  type: 'text',
                  content: captionText,
                  searchText: captionText,
                  imageUrl: deleteField(),
                  imagePath: deleteField(),
                  caption: deleteField()
                } as any)
              }}
              style={{
                marginTop: 'var(--space-1)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textDecoration: 'underline',
                background: 'none'
              }}
            >
              Volver a texto
            </button>
          </>
        )}
        {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-terracotta)' }}>{error}</span>}
      </div>
    )
  }

  // Image loaded state
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <img
        src={note.imageUrl}
        alt={note.caption || 'Foto'}
        onClick={() => isSelected && fileRef.current?.click()}
        style={{
          width: '100%',
          maxHeight: note.height - 60,
          objectFit: 'cover',
          borderRadius: 'var(--radius-sm)',
          cursor: isSelected ? 'pointer' : 'default'
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={handleCaptionBlur}
        placeholder={isSelected ? 'Escribe algo sobre esta foto...' : ''}
        rows={caption ? Math.min(6, Math.max(2, Math.ceil(caption.length / 30))) : 2}
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          width: '100%',
          resize: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.5,
          display: isSelected || caption ? 'block' : 'none',
          pointerEvents: isSelected ? 'auto' : 'none'
        }}
      />
      {note.aiDescription && !caption && (
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.3,
          opacity: 0.7
        }}>
          {note.aiDescription}
        </div>
      )}
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-terracotta)' }}>{error}</span>}
    </div>
  )
}
