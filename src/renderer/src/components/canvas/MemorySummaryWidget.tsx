import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'

interface SummaryData {
  summary: string
  themes: string[]
  highlight: string
  noteCount: number
}

export default function MemorySummaryWidget() {
  const notes = useAppStore((s) => s.notes)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  const generateSummary = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError('')
    setVisible(true)

    try {
      // Get notes from the last 7 days
      const now = Date.now()
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000

      const recentNotes = notes
        .filter((n) => {
          const ts = (n.createdAt as any)?.seconds ? (n.createdAt as any).seconds * 1000 : 0
          return ts > weekAgo && n.searchText
        })
        .map((n) => ({
          searchText: n.searchText,
          createdBy: n.createdBy,
          createdAt: new Date(
            (n.createdAt as any)?.seconds ? (n.createdAt as any).seconds * 1000 : Date.now()
          ).toLocaleDateString('es'),
          type: n.type
        }))

      if (recentNotes.length < 2) {
        setError('Necesitan al menos 2 notas esta semana para generar un resumen')
        setLoading(false)
        return
      }

      const result: SummaryData = await (window as any).api.ai.memorySummary(
        recentNotes,
        'últimos 7 días'
      )
      setSummaryData(result)
    } catch (err) {
      console.error('Summary generation failed:', err)
      setError('No se pudo generar el resumen')
    } finally {
      setLoading(false)
    }
  }, [notes, loading])

  return (
    <>
      {/* Trigger button — above the zoom controls in bottom-left */}
      <button
        onClick={generateSummary}
        title="Resumen semanal"
        style={{
          position: 'fixed',
          bottom: 160,
          left: 24,
          zIndex: 9990,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          transition: 'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 200,
              left: 24,
              zIndex: 9991,
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '20px 22px',
              maxWidth: 380,
              width: '85vw',
              boxShadow: 'var(--shadow-lg)',
              fontFamily: 'var(--font-body, Georgia, serif)'
            }}
          >
            <button
              onClick={() => { setVisible(false); setSummaryData(null); setError('') }}
              style={{
                position: 'absolute', top: 10, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 4
              }}
            >
              ×
            </button>

            <div style={{
              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600
            }}>
              Resumen semanal
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 20, height: 20, border: '2px solid var(--text-muted)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite', margin: '0 auto 8px'
                }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generando resumen...</div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                {error}
              </div>
            )}

            {summaryData && !loading && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: 12 }}>
                  {summaryData.summary}
                </p>

                {summaryData.highlight && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(224, 122, 95, 0.08)',
                    borderLeft: '3px solid var(--accent-terracotta)',
                    marginBottom: 10
                  }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent-terracotta)', fontWeight: 600, marginBottom: 2 }}>
                      Momento especial
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {summaryData.highlight}
                    </div>
                  </div>
                )}

                {summaryData.themes.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {summaryData.themes.map((theme) => (
                      <span key={theme} style={{
                        fontSize: '0.6rem', padding: '3px 8px',
                        borderRadius: 10, background: 'rgba(94, 158, 126, 0.1)',
                        color: 'var(--accent-sage, #5E9E7E)', fontWeight: 500
                      }}>
                        {theme}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 8, opacity: 0.6 }}>
                  Basado en {summaryData.noteCount} notas
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
