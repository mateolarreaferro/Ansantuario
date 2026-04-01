import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import type { Note } from '../../types/note'

interface RelatedMemoriesProps {
  note: Note
}

interface RelatedResult {
  noteId: string
  relevance: string
  snippet: string
}

export default function RelatedMemories({ note }: RelatedMemoriesProps) {
  const [related, setRelated] = useState<RelatedResult[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const notes = useAppStore((s) => s.notes)
  const setViewport = useAppStore((s) => s.setViewport)

  const noteText = note.searchText || (note.type === 'text' ? note.content : '') || ''

  useEffect(() => {
    if (!expanded || noteText.length < 10) return

    let cancelled = false
    setLoading(true)

    const notesData = notes
      .filter((n) => n.searchText && n.id !== note.id)
      .map((n) => ({
        id: n.id,
        type: n.type,
        searchText: n.searchText,
        createdBy: n.createdBy,
        createdAt: new Date(
          (n.createdAt as any)?.seconds ? (n.createdAt as any).seconds * 1000 : Date.now()
        ).toLocaleDateString()
      }))

    if (notesData.length === 0) {
      setLoading(false)
      return
    }

    ;(window as any).api.ai.relatedMemories(note.id, noteText, notesData)
      .then((results: RelatedResult[]) => {
        if (!cancelled) setRelated(results || [])
      })
      .catch(() => {
        if (!cancelled) setRelated([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [expanded, note.id])

  const navigateToNote = (targetId: string) => {
    const target = notes.find((n) => n.id === targetId)
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

  if (noteText.length < 10) return null

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: '2px 0',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center',
          gap: 3
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {expanded ? 'Ocultar conexiones' : 'Ver conexiones'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {loading && (
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '4px 0', fontStyle: 'italic' }}>
                Buscando conexiones...
              </div>
            )}
            {!loading && related.length === 0 && (
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '4px 0' }}>
                Sin conexiones encontradas
              </div>
            )}
            {related.map((r) => (
              <button
                key={r.noteId}
                onClick={() => navigateToNote(r.noteId)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '4px 6px',
                  marginTop: 3,
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {r.snippet}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--accent-terracotta)', opacity: 0.7, marginTop: 1 }}>
                  {r.relevance}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
