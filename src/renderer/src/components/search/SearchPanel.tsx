import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useSearch } from '../../hooks/useSearch'
import { useCanvas } from '../../hooks/useCanvas'
import { useAppStore } from '../../stores/appStore'
import { playSfxOpen } from '../../lib/audio'
import SearchResultCard from './SearchResultCard'

export default function SearchPanel() {
  const { query, results, isSearching, error, search, clearSearch } = useSearch()
  const { flyTo } = useCanvas()
  const {
    notes,
    setSearchOpen,
    setSelectedNoteId,
    setHighlightedNoteIds,
    setDimNonHighlighted,
    dimNonHighlighted
  } = useAppStore()

  // Play SFX on mount
  useEffect(() => { playSfxOpen() }, [])

  // Update highlighted notes whenever results change
  useEffect(() => {
    const ids = results.map((r) => r.noteId)
    setHighlightedNoteIds(ids)
  }, [results, setHighlightedNoteIds])

  // Clear highlights when closing
  useEffect(() => {
    return () => {
      setHighlightedNoteIds([])
      setDimNonHighlighted(false)
    }
  }, [setHighlightedNoteIds, setDimNonHighlighted])

  const handleFlyTo = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      flyTo(note.x + note.width / 2, note.y + note.height / 2)
      setSelectedNoteId(noteId)
    }
  }

  const handleClose = () => {
    setSearchOpen(false)
    setHighlightedNoteIds([])
    setDimNonHighlighted(false)
  }

  const toggleFilter = () => {
    setDimNonHighlighted(!dimNonHighlighted)
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: 'var(--bg)',
        boxShadow: '-4px 0 24px rgba(61, 50, 41, 0.1)',
        zIndex: 'var(--z-search)' as unknown as number,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-6) var(--space-4) var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text)'
          }}
        >
          Buscar Recuerdos
        </h2>
        <button
          onClick={handleClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Search input */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="¿Qué estás buscando?"
            autoFocus
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              paddingRight: query ? 'var(--space-8)' : 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-sm)',
              fontSize: 'var(--text-sm)',
              border: '1px solid var(--border)'
            }}
          />
          {query && (
            <button
              onClick={() => { clearSearch(); setHighlightedNoteIds([]); setDimNonHighlighted(false) }}
              style={{
                position: 'absolute',
                right: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter toggle */}
      {results.length > 0 && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <button
            onClick={toggleFilter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: dimNonHighlighted ? 'var(--accent-terracotta)' : 'var(--white)',
              color: dimNonHighlighted ? 'var(--white)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              border: dimNonHighlighted ? 'none' : '1px solid var(--border)',
              transition: 'all 0.15s'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {dimNonHighlighted ? 'Mostrando solo coincidencias' : 'Enfocar en coincidencias'}
          </button>
        </div>
      )}

      {/* Results */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 var(--space-4) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}
      >
        {isSearching && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent-terracotta)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto var(--space-2)' }} />
            Buscando...
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            No se encontraron recuerdos
          </div>
        )}

        {error && (
          <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--note-peach)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {error}
          </div>
        )}

        {results.map((result) => (
          <SearchResultCard
            key={result.noteId}
            noteId={result.noteId}
            relevance={result.relevance}
            snippet={result.snippet}
            onFlyTo={handleFlyTo}
          />
        ))}

        {!query && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
            Pregunta sobre tus recuerdos...
            <br />
            <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
              Las notas que coincidan brillarán en el lienzo
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
