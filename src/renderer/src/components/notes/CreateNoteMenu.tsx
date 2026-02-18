import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import { useNotes } from '../../hooks/useNotes'
import type { NoteType } from '../../types/note'

const noteTypes: { type: NoteType; label: string; icon: string; color: string }[] = [
  { type: 'text', label: 'Text', icon: '✎', color: 'var(--accent-terracotta)' },
  { type: 'voice', label: 'Voice', icon: '♪', color: 'var(--accent-sage)' },
  { type: 'link', label: 'Link', icon: '⚯', color: 'var(--accent-gold)' }
]

export default function CreateNoteMenu() {
  const { isCreateMenuOpen, setCreateMenuOpen } = useAppStore()
  const { createNote } = useNotes()

  const handleCreate = async (type: NoteType) => {
    await createNote(type)
    setCreateMenuOpen(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 'var(--z-menu)' as unknown as number
      }}
    >
      <AnimatePresence>
        {isCreateMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute',
              bottom: 60,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {noteTypes.map((item) => (
              <motion.button
                key={item.type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCreate(item.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: 'transparent',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text)'
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 14
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isCreateMenuOpen ? 45 : 0 }}
        onClick={() => setCreateMenuOpen(!isCreateMenuOpen)}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent-terracotta)',
          color: 'var(--white)',
          fontSize: '1.5rem',
          fontWeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        +
      </motion.button>
    </div>
  )
}
