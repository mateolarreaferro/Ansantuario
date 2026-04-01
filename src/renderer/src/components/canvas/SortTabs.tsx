import { motion } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import { playSfxClick } from '../../lib/audio'

type SortMode = 'free' | 'recent' | 'oldest' | 'mine' | 'theirs' | 'favorites'

const TABS: { mode: SortMode; label: string }[] = [
  { mode: 'free', label: 'Libre' },
  { mode: 'recent', label: 'Recientes' },
  { mode: 'oldest', label: 'Antiguas' },
  { mode: 'mine', label: 'Mías' },
  { mode: 'theirs', label: 'Suyas' },
  { mode: 'favorites', label: 'Favoritas' }
]

export default function SortTabs() {
  const { sortMode, setSortMode } = useAppStore()

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--space-12)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border)',
        zIndex: 'var(--z-toolbar)' as unknown as number
      }}
    >
      {TABS.map(({ mode, label }) => (
        <button
          key={mode}
          onClick={() => {
            setSortMode(mode)
            playSfxClick()
          }}
          style={{
            position: 'relative',
            padding: '6px 14px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
            color: sortMode === mode ? 'var(--white)' : 'var(--text-secondary)',
            background: 'transparent',
            zIndex: 1,
            transition: 'color 0.2s'
          }}
        >
          {sortMode === mode && (
            <motion.div
              layoutId="sort-tab-indicator"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-terracotta)',
                zIndex: -1
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30
              }}
            />
          )}
          {label}
        </button>
      ))}
    </div>
  )
}
