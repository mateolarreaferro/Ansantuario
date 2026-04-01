import { motion, AnimatePresence } from 'motion/react'
import { useDailyQuestion } from '../../hooks/useDailyQuestion'
import { useAppStore } from '../../stores/appStore'
import { addNote } from '../../lib/firestore-notes'
import { markQuestionAnswered } from '../../lib/firestore-questions'
import { playSfxCreate } from '../../lib/audio'

export default function DailyQuestion() {
  const { question, loading, dismissed, dismiss, answeredByMe, setAnsweredByMe, dateId } = useDailyQuestion()
  const { identity, viewport, setSelectedNoteId } = useAppStore()

  const handleResponder = async () => {
    if (!identity || !question) return

    // Create note at center of current viewport
    const container = document.getElementById('canvas-container')
    if (!container) return
    const rect = container.getBoundingClientRect()

    const centerX = (rect.width / 2 - viewport.x) / viewport.scale
    const centerY = (rect.height / 2 - viewport.y) / viewport.scale

    const id = await addNote('text', identity, { x: centerX - 120, y: centerY - 120 }, {
      content: `${question}\n\n`,
      searchText: question
    } as any)

    setSelectedNoteId(id)
    playSfxCreate()

    // Persist answered state per user in Firestore
    await markQuestionAnswered(dateId, identity)
    setAnsweredByMe(true)

    // Focus textarea and place cursor at end
    setTimeout(() => {
      const el = document.querySelector(`#note-${id} textarea`) as HTMLTextAreaElement | null
      if (el) {
        el.focus()
        el.selectionStart = el.value.length
        el.selectionEnd = el.value.length
      }
    }, 100)
  }

  if (loading || dismissed || answeredByMe || !question) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 24px',
          maxWidth: 420,
          width: '90vw',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body, Georgia, serif)'
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 18,
            lineHeight: 1,
            padding: 4
          }}
        >
          ×
        </button>

        {/* Label */}
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 8,
            fontWeight: 600
          }}
        >
          Pregunta del día
        </div>

        {/* Question */}
        <div
          style={{
            fontSize: '1rem',
            color: 'var(--text)',
            lineHeight: 1.5,
            marginBottom: 16
          }}
        >
          {question}
        </div>

        {/* Respond button */}
        <button
          onClick={handleResponder}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            background: 'var(--accent-terracotta)',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Responder
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
