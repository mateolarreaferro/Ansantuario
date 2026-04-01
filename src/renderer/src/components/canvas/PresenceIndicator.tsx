import { motion } from 'motion/react'
import { usePresence } from '../../hooks/usePresence'

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 1) return 'justo ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export default function PresenceIndicator() {
  const { otherUser, otherOnline, lastSeen } = usePresence()

  const displayName = otherUser === 'marielisa' ? 'Marielisa' : 'Mateo'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        zIndex: 'var(--z-toolbar)' as unknown as number
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: otherOnline ? 'var(--accent-sage)' : 'var(--text-muted)',
          animation: otherOnline ? 'presencePulse 2s ease-in-out infinite' : 'none',
          flexShrink: 0
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}>
          {displayName}
        </span>
        {otherOnline && (
          <span style={{
            fontSize: '0.6rem',
            color: 'var(--accent-sage)'
          }}>
            aquí contigo
          </span>
        )}
      </div>
    </motion.div>
  )
}
