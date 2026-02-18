import { useState, useEffect } from 'react'
import { updateNoteLink } from '../../lib/firestore-notes'
import type { LinkNote as LinkNoteType } from '../../types/note'

interface LinkNoteProps {
  note: LinkNoteType
  isSelected: boolean
}

export default function LinkNote({ note, isSelected }: LinkNoteProps) {
  const [url, setUrl] = useState(note.url || '')
  const [loading, setLoading] = useState(false)

  const hasPreview = !!note.preview?.title

  // Sync URL from Firestore
  useEffect(() => {
    if (!isSelected) setUrl(note.url || '')
  }, [note.url, isSelected])

  const handleSubmit = async () => {
    if (!url.trim()) return

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    setLoading(true)
    try {
      const preview = await window.api.link.preview(normalizedUrl)
      await updateNoteLink(note.id, normalizedUrl, preview)
    } catch (err) {
      console.error('Link preview failed:', err)
      await updateNoteLink(note.id, normalizedUrl, { title: normalizedUrl })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>
      {!hasPreview && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Pega una URL..."
            style={{
              flex: 1,
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.5)',
              fontSize: 'var(--text-sm)',
              border: '1px solid var(--border)'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-sage)',
              color: 'var(--white)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '...' : 'Ir'}
          </button>
        </div>
      )}

      {hasPreview && (
        <div>
          {note.preview.image && (
            <div
              style={{
                width: '100%',
                height: 100,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: 'var(--space-2)'
              }}
            >
              <img
                src={note.preview.image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            {note.preview.favicon && (
              <img
                src={note.preview.favicon}
                alt=""
                style={{ width: 14, height: 14, borderRadius: 2 }}
              />
            )}
            <a
              href={note.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault()
                window.open(note.url, '_blank')
              }}
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text)',
                textDecoration: 'none',
                lineHeight: 1.3
              }}
            >
              {note.preview.title}
            </a>
          </div>

          {note.preview.description && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {note.preview.description}
            </p>
          )}

          <div
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {note.url}
          </div>
        </div>
      )}
    </div>
  )
}
