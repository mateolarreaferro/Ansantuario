import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import { toggleReaction } from '../../lib/firestore-notes'
import { REACTION_TYPES, REACTION_COLORS } from '../../types/note'
import type { ReactionType, UserIdentity } from '../../types/note'
import ReactionIcon from './ReactionIcons'
import { playSfxClick } from '../../lib/audio'
import { useT } from '../../lib/i18n'

interface ReactionBarProps {
  noteId: string
  reactions?: Record<string, UserIdentity[]>
  isSelected: boolean
}

export default function ReactionBar({ noteId, reactions, isSelected }: ReactionBarProps) {
  const t = useT()
  const [showPicker, setShowPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const identity = useAppStore((s) => s.identity)

  const activeReactions = REACTION_TYPES.filter(
    (r) => reactions?.[r] && reactions[r].length > 0
  )

  const handleToggle = (type: ReactionType) => {
    if (!identity) return
    toggleReaction(noteId, type, identity)
    playSfxClick()
  }

  const showAddButton = isSelected || isHovered

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowPicker(false) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 'var(--space-1)',
        flexWrap: 'wrap',
        minHeight: 22,
        position: 'relative'
      }}
    >
      {activeReactions.map((type) => {
        const users = reactions![type]
        const iMine = identity ? users.includes(identity) : false
        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handleToggle(type) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: iMine ? `${REACTION_COLORS[type]}18` : 'transparent',
              border: `1px solid ${iMine ? REACTION_COLORS[type] + '40' : 'var(--border)'}`,
              cursor: 'pointer',
              color: REACTION_COLORS[type],
              lineHeight: 1
            }}
          >
            <ReactionIcon type={type} size={12} filled={iMine} color={REACTION_COLORS[type]} />
            {users.length > 1 && (
              <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>{users.length}</span>
            )}
          </motion.button>
        )
      })}

      {/* Add reaction button — visible on hover or select */}
      <AnimatePresence>
        {showAddButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker) }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 14,
              lineHeight: 1
            }}
          >
            +
          </motion.button>
        )}
      </AnimatePresence>

      {/* Picker popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            style={{
              position: 'absolute',
              bottom: 26,
              left: 0,
              display: 'flex',
              gap: 4,
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 10
            }}
          >
            {REACTION_TYPES.map((type) => {
              const users = reactions?.[type] || []
              const iMine = identity ? users.includes(identity) : false
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle(type)
                    setShowPicker(false)
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: iMine ? `${REACTION_COLORS[type]}18` : 'transparent',
                    color: REACTION_COLORS[type]
                  }}
                  title={t(type)}
                >
                  <ReactionIcon type={type} size={16} filled={iMine} color={REACTION_COLORS[type]} />
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
