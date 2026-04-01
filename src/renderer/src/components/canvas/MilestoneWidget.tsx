import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'

interface Milestone {
  type: string
  title: string
  description: string
  relatedNoteIds?: string[]
}

const MILESTONE_ICONS: Record<string, string> = {
  anniversary: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  theme: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  streak: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  first: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z'
}

export default function MilestoneWidget() {
  const notes = useAppStore((s) => s.notes)
  const setViewport = useAppStore((s) => s.setViewport)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('milestones-dismissed') === 'true'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (dismissed || notes.length < 5) return
    // Only check once per session
    if (sessionStorage.getItem('milestones-checked') === 'true') return

    let cancelled = false
    setLoading(true)

    const notesData = notes
      .filter((n) => n.searchText)
      .map((n) => ({
        id: n.id,
        type: n.type,
        searchText: n.searchText,
        createdBy: n.createdBy,
        createdAt: new Date(
          (n.createdAt as any)?.seconds ? (n.createdAt as any).seconds * 1000 : Date.now()
        ).toLocaleDateString()
      }))

    const today = new Date().toISOString().split('T')[0]

    ;(window as any).api.ai.detectMilestones(notesData, today)
      .then((results: Milestone[]) => {
        if (!cancelled && results?.length > 0) {
          setMilestones(results)
        }
        sessionStorage.setItem('milestones-checked', 'true')
      })
      .catch((err: any) => {
        console.error('Milestone detection failed:', err)
        sessionStorage.setItem('milestones-checked', 'true')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [notes.length, dismissed])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('milestones-dismissed', 'true')
  }

  const navigateToNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId)
    if (!target) return
    const container = document.getElementById('canvas-container')
    if (!container) return
    const rect = container.getBoundingClientRect()
    setViewport({
      x: rect.width / 2 - target.x - target.width / 2,
      y: rect.height / 2 - target.y - target.height / 2,
      scale: 1
    })
  }

  if (dismissed || milestones.length === 0 || loading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: 3, duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 50,
          right: 20,
          zIndex: 9997,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 20px',
          maxWidth: 320,
          width: '80vw',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body, Georgia, serif)'
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 4
          }}
        >
          ×
        </button>

        <div style={{
          fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--accent-terracotta)', marginBottom: 10, fontWeight: 600
        }}>
          Momentos especiales
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {milestones.map((m, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(224, 122, 95, 0.05)',
              border: '1px solid rgba(224, 122, 95, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent-terracotta)" stroke="none" opacity={0.7}>
                  <path d={MILESTONE_ICONS[m.type] || MILESTONE_ICONS.theme} />
                </svg>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                  {m.title}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {m.description}
              </div>
              {m.relatedNoteIds && m.relatedNoteIds.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  {m.relatedNoteIds.slice(0, 2).map((id) => (
                    <button
                      key={id}
                      onClick={() => navigateToNote(id)}
                      style={{
                        fontSize: '0.55rem', padding: '2px 8px',
                        borderRadius: 8, background: 'rgba(224, 122, 95, 0.12)',
                        color: 'var(--accent-terracotta)', cursor: 'pointer',
                        border: 'none', fontWeight: 500
                      }}
                    >
                      Ver nota
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
