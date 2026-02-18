import { motion } from 'motion/react'

interface SearchResultCardProps {
  noteId: string
  relevance: string
  snippet: string
  onFlyTo: (noteId: string) => void
}

export default function SearchResultCard({
  noteId,
  relevance,
  snippet,
  onFlyTo
}: SearchResultCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -2 }}
      onClick={() => onFlyTo(noteId)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        border: '1px solid var(--border)',
        transition: 'box-shadow var(--duration-fast)'
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {snippet}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-sage)', fontWeight: 500 }}>
        {relevance}
      </span>
    </motion.button>
  )
}
