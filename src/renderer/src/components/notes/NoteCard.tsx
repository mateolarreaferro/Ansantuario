import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useDrag } from '../../hooks/useDrag'
import { useAppStore } from '../../stores/appStore'
import { playSfxSelect, playSfxHover } from '../../lib/audio'
import type { Note, PhotoNote as PhotoNoteT } from '../../types/note'

const DARK_NOTE_COLORS: Record<string, string> = {
  '#FFF8E7': '#2E2A24',
  '#FFE8D6': '#302622',
  '#FFD6D6': '#302424',
  '#E8D6FF': '#282430',
  '#D6FFE8': '#242E28',
  '#D6EDFF': '#24282E',
  '#FFF5CC': '#2E2C22',
  '#FFD1C1': '#302422',
  '#D6EBD6': '#262E26',
  '#E8D6F0': '#2A2430'
}
import TextNote from './TextNote'
import VoiceNote from './VoiceNote'
import LinkNote from './LinkNote'
import PhotoNote from './PhotoNote'
import NoteToolbar from './NoteToolbar'
import ReactionBar from './ReactionBar'
import RelatedMemories from './RelatedMemories'
import { PUBLIC_WALL } from '../../lib/wall'
import { useT } from '../../lib/i18n'

interface NoteCardProps {
  note: Note
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isHidden: boolean
  overridePos?: { x: number; y: number }
  onSelect: () => void
}

export default function NoteCard({ note, isSelected, isHighlighted, isDimmed, isHidden, overridePos, onSelect }: NoteCardProps) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const { displayX, displayY, dragHandlers } = useDrag(note.id, note.x, note.y)
  const isDarkMode = useAppStore((s) => s.isDarkMode)
  const noteColor = isDarkMode ? (DARK_NOTE_COLORS[note.color] || '#262220') : note.color

  const finalX = overridePos ? overridePos.x : displayX
  const finalY = overridePos ? overridePos.y : displayY

  // Stable random float params per note so each drifts differently
  const floatStyle = useMemo(() => {
    // Simple hash from note id to get a 0-1 value
    let h = 0
    for (let i = 0; i < note.id.length; i++) h = ((h << 5) - h + note.id.charCodeAt(i)) | 0
    const t = Math.abs(h % 1000) / 1000
    const duration = 5 + t * 4 // 5–9s
    const delay = t * -9 // negative so it starts mid-cycle
    return {
      animation: `noteFloat ${duration.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s infinite`,
      willChange: 'transform' as const
    }
  }, [note.id])

  const renderContent = () => {
    switch (note.type) {
      case 'text':
        return <TextNote note={note} isSelected={isSelected} />
      case 'voice':
        return <VoiceNote note={note} />
      case 'link':
        return <LinkNote note={note} isSelected={isSelected} />
      case 'photo':
        return <PhotoNote note={note as PhotoNoteT} isSelected={isSelected} />
      default:
        return null
    }
  }

  return (
    /* Outer div handles positioning + drag — NOT a motion.div */
    <div
      id={`note-${note.id}`}
      onPointerDown={(e) => {
        e.stopPropagation()
        dragHandlers.onPointerDown(e)
        onSelect()
        playSfxSelect()
      }}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onMouseEnter={() => playSfxHover()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
      style={{
        position: 'absolute',
        left: finalX,
        top: finalY,
        transform: `rotate(${overridePos ? 0 : note.rotation}deg)`,
        width: note.width,
        minHeight: note.type === 'text' ? 60 : note.height,
        ...(note.type === 'photo' ? { minHeight: note.height } : {}),
        zIndex: note.zIndex,
        cursor: overridePos ? 'pointer' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        transition: overridePos !== undefined ? 'left 0.6s cubic-bezier(0.16, 1, 0.3, 1), top 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease' : 'none',
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto'
      }}
    >
      {/* Float wrapper — separate from motion.div so CSS animation doesn't clash with framer-motion transform */}
      <div style={{ width: '100%', minHeight: 'inherit', ...(isSelected ? {} : floatStyle) }}>
      {/* Inner motion.div handles animations only */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isDimmed ? 0.25 : 1,
          scale: isHighlighted ? 1.03 : 1
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          width: '100%',
          minHeight: 'inherit',
          background: noteColor,
          borderRadius: 'var(--radius-md)',
          boxShadow: isHighlighted
            ? '0 0 0 3px var(--accent-terracotta), var(--shadow-note-hover)'
            : isSelected ? 'var(--shadow-note-hover)' : 'var(--shadow-note)',
          overflow: 'visible',
          outline: isSelected && !isHighlighted ? '2px solid var(--accent-terracotta)' : 'none',
          outlineOffset: 2,
          filter: isDimmed ? 'grayscale(0.5)' : 'none',
          transition: 'filter 0.3s, box-shadow 0.2s'
        }}
      >
        {/* Tape decoration */}
        <div
          style={{
            position: 'absolute', top: -5, left: '50%',
            transform: 'translateX(-50%) rotate(-2deg)',
            width: 36, height: 12,
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 2, pointerEvents: 'none'
          }}
        />

        {/* Highlight glow */}
        {isHighlighted && (
          <div style={{
            position: 'absolute', inset: -6,
            borderRadius: 'calc(var(--radius-md) + 6px)',
            border: '2px solid var(--accent-terracotta)',
            opacity: 0.5, animation: 'pulse 2s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
        )}

        {/* Content — pointer-events disabled when not selected so entire card is draggable */}
        <div style={{
          padding: 'var(--space-3)',
          pointerEvents: isSelected ? 'auto' : 'none'
        }}>
          {renderContent()}

          <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.5 }}>
              {note.createdAt?.toDate().toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
              {note.createdAt?.toDate().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', opacity: 0.6 }}>
              {PUBLIC_WALL ? note.authorName || t('anonymous') : note.createdBy}
            </span>
          </div>

          {/* Sentiment badge */}
          {note.sentiment?.tone && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 2
            }}>
              <span style={{
                fontSize: '0.55rem',
                color: 'var(--accent-terracotta)',
                opacity: 0.6,
                fontStyle: 'italic'
              }}>
                {note.sentiment.tone}
              </span>
              {note.sentiment.emotions?.slice(0, 2).map((e) => (
                <span key={e} style={{
                  fontSize: '0.5rem',
                  background: 'rgba(224, 122, 95, 0.1)',
                  color: 'var(--accent-terracotta)',
                  padding: '1px 5px',
                  borderRadius: 8,
                  opacity: 0.7
                }}>
                  {e}
                </span>
              ))}
            </div>
          )}

          <ReactionBar noteId={note.id} reactions={note.reactions} isSelected={isSelected} />

          {/* Related memories (only when selected) */}
          {isSelected && !PUBLIC_WALL && <RelatedMemories note={note} />}
        </div>

        {/* Reply indicator */}
        {note.replyTo && (
          <div style={{
            position: 'absolute',
            top: -18,
            left: 8,
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            pointerEvents: 'none'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            respuesta
          </div>
        )}

        {isSelected && <NoteToolbar noteId={note.id} noteColor={note.color} noteType={note.type} noteX={note.x} noteY={note.y} noteContent={note.type === 'text' ? note.content : ''} />}
      </motion.div>
      </div>
    </div>
  )
}
