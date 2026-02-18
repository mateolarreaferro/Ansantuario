import { useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { useCanvas } from '../../hooks/useCanvas'
import { useNotes } from '../../hooks/useNotes'
import { useFirestore } from '../../hooks/useFirestore'
import { useAppStore } from '../../stores/appStore'
import { playSfxCreate } from '../../lib/audio'
import GridBackground from './GridBackground'
import CanvasControls from './CanvasControls'
import NoteCard from '../notes/NoteCard'
import SearchPanel from '../search/SearchPanel'
import DailyQuestion from './DailyQuestion'

export default function InfiniteCanvas() {
  const {
    viewport,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    zoomIn,
    zoomOut,
    resetViewport
  } = useCanvas()

  const { notes, selectedNoteId, createNoteAt, selectNote, deselectNote } = useNotes()
  const { isSearchOpen, highlightedNoteIds, dimNonHighlighted } = useAppStore()

  // Subscribe to Firestore changes
  useFirestore()

  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).dataset.canvas) {
        deselectNote()
      }
    },
    [deselectNote]
  )

  // Right-click → create note at cursor (only on canvas background)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if ((e.target as HTMLElement).dataset.canvas) {
        createNoteAt(e.clientX, e.clientY)
        playSfxCreate()
      }
    },
    [createNoteAt]
  )

  // Double-click → also create note
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.canvas) {
        createNoteAt(e.clientX, e.clientY)
        playSfxCreate()
      }
    },
    [createNoteAt]
  )

  return (
    <div
      id="canvas-container"
      data-canvas="true"
      onPointerDown={(e) => {
        handlePointerDown(e)
        handleCanvasClick(e)
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--canvas)',
        cursor: 'default',
        touchAction: 'none'
      }}
    >
      <div className="titlebar-drag" />
      <GridBackground viewport={viewport} />

      {/* World container */}
      <div
        data-canvas="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform'
        }}
      >
        <AnimatePresence>
          {notes.map((note) => {
            const isHighlighted = highlightedNoteIds.includes(note.id)
            const isDimmed = dimNonHighlighted && highlightedNoteIds.length > 0 && !isHighlighted

            return (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                onSelect={() => selectNote(note.id)}
              />
            )
          })}
        </AnimatePresence>
      </div>

      <CanvasControls
        scale={viewport.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetViewport}
      />

      {/* Hint text when canvas is empty */}
      {notes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.8
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', display: 'block', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            No te guardes nada
          </span>
          Haz clic derecho o doble clic en cualquier lugar para dejar una nota
        </div>
      )}

      <AnimatePresence>
        {isSearchOpen && <SearchPanel />}
      </AnimatePresence>

      <DailyQuestion />
    </div>
  )
}
