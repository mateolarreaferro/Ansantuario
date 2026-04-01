import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import type { Note } from '../../types/note'

export default function OnThisDayWidget() {
  const { notes, isOnThisDayDismissed, setOnThisDayDismissed, setViewport } = useAppStore()

  const memories = useMemo(() => {
    const now = new Date()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()

    return notes.filter((n) => {
      if (!n.createdAt?.toDate) return false
      const d = n.createdAt.toDate()
      if (d.getMonth() !== todayMonth || d.getDate() !== todayDate) return false
      // Must be from a different day (at least 24h ago)
      return (now.getTime() - d.getTime()) > 24 * 60 * 60 * 1000
    })
  }, [notes])

  const handleNavigate = (note: Note) => {
    const container = document.getElementById('canvas-container')
    if (!container) return
    const rect = container.getBoundingClientRect()
    setViewport({
      x: rect.width / 2 - note.x - note.width / 2,
      y: rect.height / 2 - note.y - note.height / 2,
      scale: 1
    })
  }

  if (memories.length === 0 || isOnThisDayDismissed) return null

  const getNotePreview = (note: Note): string => {
    switch (note.type) {
      case 'text': return note.content?.slice(0, 60) || 'Nota de texto'
      case 'voice': return note.transcript?.slice(0, 60) || `Nota de voz (${note.duration}s)`
      case 'link': return note.preview?.title || note.url || 'Enlace'
      case 'photo': return note.caption || 'Foto'
      default: return 'Nota'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ delay: 2, duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 20px',
          maxWidth: 380,
          width: '85vw',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Close */}
        <button
          onClick={() => setOnThisDayDismissed(true)}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 16,
            lineHeight: 1,
            padding: 4
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}>
            En este día...
          </span>
        </div>

        {/* Memory cards — horizontal scroll */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-1)',
          scrollbarWidth: 'thin'
        }}>
          {memories.slice(0, 5).map((note) => (
            <motion.button
              key={note.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleNavigate(note)}
              style={{
                flex: '0 0 auto',
                width: 140,
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                background: note.color,
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid var(--border)'
              }}
            >
              {note.type === 'photo' && note.imageUrl && (
                <img
                  src={note.imageUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                />
              )}
              <div style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {getNotePreview(note)}
              </div>
              <div style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                marginTop: 4
              }}>
                {note.createdAt?.toDate().toLocaleDateString('es', { year: 'numeric' })}
                {' · '}
                {note.createdBy}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
