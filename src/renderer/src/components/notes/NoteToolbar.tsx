import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { updateNote, deleteNote, addNote, canModify, canDelete } from '../../lib/firestore-notes'
import { PUBLIC_WALL } from '../../lib/wall'
import { deleteField } from 'firebase/firestore'
import { NOTE_COLORS, NOTE_SIZES } from '../../types/note'
import type { Note, NoteType } from '../../types/note'
import { useAppStore } from '../../stores/appStore'
import { playSfxClick, playSfxDelete, playSfxCreate } from '../../lib/audio'

interface NoteToolbarProps {
  noteId: string
  noteColor: string
  noteType: NoteType
  noteX: number
  noteY: number
  noteContent?: string
}

export default function NoteToolbar({ noteId, noteColor, noteType, noteX, noteY, noteContent }: NoteToolbarProps) {
  const [showColors, setShowColors] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { setSelectedNoteId, identity } = useAppStore()
  // On the open wall a visitor styles only their own notes; a moderator may also delete others'.
  const editable = canModify({ id: noteId })
  const deletable = canDelete({ id: noteId })

  const handleColorChange = (color: string) => {
    updateNote(noteId, { color } as Partial<Note>)
    setShowColors(false)
    playSfxClick()
  }

  const handleResize = (size: keyof typeof NOTE_SIZES) => {
    const { width, height } = NOTE_SIZES[size]
    updateNote(noteId, { width, height } as Partial<Note>)
    playSfxClick()
  }

  const handleConvertToVoice = () => {
    updateNote(noteId, { type: 'voice', audioUrl: '', audioPath: '', duration: 0, content: deleteField(), searchText: '' } as any)
    playSfxClick()
  }

  const handleReply = async () => {
    if (!identity) return
    playSfxCreate()
    const id = await addNote('text', identity, { x: noteX + 260, y: noteY + 20 }, {
      replyTo: noteId
    } as any)
    setSelectedNoteId(id)
  }

  const handleDelete = async () => {
    playSfxDelete()
    await deleteNote(noteId)
    setSelectedNoteId(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: -44,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 'var(--space-1)',
        padding: 'var(--space-1)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 'var(--z-toolbar)' as unknown as number,
        whiteSpace: 'nowrap'
      }}
    >
      {editable && (
        <>
      {/* Color picker toggle */}
      <button
        onClick={() => { setShowColors(!showColors); setShowConfirm(false) }}
        style={toolbarBtnStyle}
        title="Color"

      >
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: noteColor, border: '2px solid var(--border)' }} />
      </button>

      {/* Size buttons */}
      {(['S', 'M', 'L'] as const).map((size) => (
        <button
          key={size}
          onClick={() => handleResize(size)}
          style={{ ...toolbarBtnStyle, fontSize: 'var(--text-xs)', fontWeight: 600 }}
          title={`Tamaño ${size}`}
        >
          {size}
        </button>
      ))}

        </>
      )}

      {/* Mic — convert text note to voice */}
      {noteType === 'text' && !PUBLIC_WALL && (
        <button
          onClick={handleConvertToVoice}
          style={{ ...toolbarBtnStyle, fontSize: 14 }}
          title="Grabar voz"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>
      )}

      {/* Photo — convert text note to photo */}
      {noteType === 'text' && !PUBLIC_WALL && (
        <button
          onClick={() => {
            updateNote(noteId, { type: 'photo', imageUrl: '', imagePath: '', caption: noteContent || '', content: deleteField(), searchText: noteContent || 'Foto' } as any)
            playSfxClick()
          }}
          style={{ ...toolbarBtnStyle, fontSize: 14 }}
          title="Agregar foto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
      )}

      {/* Reply */}
      <button
        onClick={handleReply}
        style={toolbarBtnStyle}
        title="Responder"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Delete */}
      {deletable && (
      <button
        onClick={() => { setShowConfirm(!showConfirm); setShowColors(false) }}
        style={{ ...toolbarBtnStyle, color: 'var(--accent-terracotta)' }}
        title="Eliminar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        </svg>
      </button>
      )}

      {/* Color picker popup */}
      <AnimatePresence>
        {showColors && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'absolute',
              bottom: 44,
              left: 0,
              display: 'flex',
              gap: 'var(--space-1)',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-lg)',
              flexWrap: 'wrap',
              width: 140
            }}
          >
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: color,
                  border: color === noteColor ? '2.5px solid var(--accent-terracotta)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'absolute',
              bottom: 44,
              right: 0,
              display: 'flex',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-lg)',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>¿Eliminar?</span>
            <button
              onClick={handleDelete}
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-terracotta)',
                color: 'var(--white)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sí
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--border)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer'
              }}
            >
              No

            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const toolbarBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--text-secondary)',
  transition: 'background var(--duration-fast)'
}
