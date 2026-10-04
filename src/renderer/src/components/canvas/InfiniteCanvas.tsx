import { useCallback, useMemo, useState, useLayoutEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { useCanvas } from '../../hooks/useCanvas'
import { useNotes } from '../../hooks/useNotes'
import { useFirestore } from '../../hooks/useFirestore'
import { useAppStore } from '../../stores/appStore'
import { playSfxCreate } from '../../lib/audio'
import GridBackground from './GridBackground'
import CanvasControls from './CanvasControls'
import SortTabs from './SortTabs'
import PresenceIndicator from './PresenceIndicator'
import OnThisDayWidget from './OnThisDayWidget'
import NoteCard from '../notes/NoteCard'
import SearchPanel from '../search/SearchPanel'
import DailyQuestion from './DailyQuestion'
import MemorySummaryWidget from './MemorySummaryWidget'
import MilestoneWidget from './MilestoneWidget'
import type { Note } from '../../types/note'
import { PUBLIC_WALL } from '../../lib/wall'
import PublicWallBar from './PublicWallBar'
import WallIntro from './WallIntro'
import { useT } from '../../lib/i18n'

const GRID_GAP = 28
const GRID_PADDING = 80

/** Read actual rendered heights from the DOM for each note */
function measureNoteHeights(noteIds: string[]): Map<string, number> {
  const heights = new Map<string, number>()
  for (const id of noteIds) {
    const el = document.getElementById(`note-${id}`)
    if (el) {
      heights.set(id, el.getBoundingClientRect().height)
    }
  }
  return heights
}

function computeGridPositions(
  notes: Note[],
  containerWidth: number,
  measuredHeights: Map<string, number>,
  scale: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  if (notes.length === 0) return positions

  const maxNoteWidth = Math.max(260, ...notes.map((n) => n.width))
  const cols = Math.max(1, Math.floor((containerWidth - GRID_PADDING * 2) / (maxNoteWidth + GRID_GAP)))
  const colWidth = maxNoteWidth + GRID_GAP

  // Masonry layout: track the bottom edge of each column independently
  const colBottoms = new Array(cols).fill(GRID_PADDING)

  for (const note of notes) {
    let shortest = 0
    for (let c = 1; c < cols; c++) {
      if (colBottoms[c] < colBottoms[shortest]) shortest = c
    }

    const x = GRID_PADDING + shortest * colWidth
    const y = colBottoms[shortest]
    positions.set(note.id, { x, y })

    // Use actual DOM height (divided by scale since DOM is scaled) or fall back to stored height + buffer
    const measured = measuredHeights.get(note.id)
    const noteHeight = measured ? measured / scale + 10 : note.height + 80
    colBottoms[shortest] = y + noteHeight + GRID_GAP
  }

  return positions
}

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
  const { isSearchOpen, highlightedNoteIds, dimNonHighlighted, isDarkMode, sortMode, identity, isIntroOpen } = useAppStore()
  const t = useT()

  // Measured DOM heights for grid layout (updated after render)
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map())

  // Sort & filter notes for grid view
  const { sortedNotes, gridPositions, hiddenIds } = useMemo(() => {
    if (sortMode === 'free') {
      return { sortedNotes: notes, gridPositions: new Map(), hiddenIds: new Set<string>() }
    }

    let filtered = [...notes]
    const hidden = new Set<string>()

    // Filter
    if (sortMode === 'mine') {
      const others = notes.filter((n) => n.createdBy !== identity)
      others.forEach((n) => hidden.add(n.id))
      filtered = notes.filter((n) => n.createdBy === identity)
    } else if (sortMode === 'theirs') {
      const mine = notes.filter((n) => n.createdBy === identity)
      mine.forEach((n) => hidden.add(n.id))
      filtered = notes.filter((n) => n.createdBy !== identity)
    } else if (sortMode === 'favorites') {
      const noReactions = notes.filter((n) => !n.reactions || Object.keys(n.reactions).length === 0)
      noReactions.forEach((n) => hidden.add(n.id))
      filtered = notes.filter((n) => n.reactions && Object.keys(n.reactions).length > 0)
    }

    // Sort
    if (sortMode === 'recent' || sortMode === 'mine' || sortMode === 'theirs' || sortMode === 'favorites') {
      filtered.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime() || 0
        const tb = b.createdAt?.toDate?.()?.getTime() || 0
        return tb - ta
      })
    } else if (sortMode === 'oldest') {
      filtered.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime() || 0
        const tb = b.createdAt?.toDate?.()?.getTime() || 0
        return ta - tb
      })
    }

    const container = document.getElementById('canvas-container')
    const width = container?.getBoundingClientRect().width || 1200
    const scale = viewport.scale || 1
    const positions = computeGridPositions(filtered, width / scale, measuredHeights, scale)

    return { sortedNotes: filtered, gridPositions: positions, hiddenIds: hidden }
  }, [sortMode, notes, identity, viewport.scale, measuredHeights])

  // After render, measure actual DOM heights and recalculate if they changed
  useLayoutEffect(() => {
    if (sortMode === 'free') return
    const ids = notes.map((n) => n.id)
    const newHeights = measureNoteHeights(ids)
    // Only update state if heights actually changed to avoid infinite loop
    let changed = false
    for (const [id, h] of newHeights) {
      if (Math.abs((measuredHeights.get(id) || 0) - h) > 2) {
        changed = true
        break
      }
    }
    if (changed) setMeasuredHeights(newHeights)
  })

  // Build reply connectors
  const replyConnectors = useMemo(() => {
    const noteMap = new Map<string, Note>()
    for (const n of notes) noteMap.set(n.id, n)

    const connectors: { parentX: number; parentY: number; parentW: number; parentH: number; childX: number; childY: number; childW: number; childH: number }[] = []
    for (const n of notes) {
      if (n.replyTo) {
        const parent = noteMap.get(n.replyTo)
        if (parent) {
          connectors.push({
            parentX: parent.x, parentY: parent.y, parentW: parent.width, parentH: parent.height,
            childX: n.x, childY: n.y, childW: n.width, childH: n.height
          })
        }
      }
    }
    return connectors
  }, [notes])

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
        background: isDarkMode
          ? 'linear-gradient(135deg, #1A1614, #1E1A22, #181C22, #1E1A18, #1A201A, #1A1614)'
          : 'linear-gradient(135deg, #F0E8DC, #EDE4F0, #DCE8F0, #F0E4DC, #E4F0E4, #F0E8DC)',
        backgroundSize: '400% 400%',
        animation: 'canvasGradient 60s ease infinite',
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
        {/* Reply connectors */}
        {replyConnectors.length > 0 && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {replyConnectors.map((c, i) => {
              const x1 = c.parentX + c.parentW / 2
              const y1 = c.parentY + c.parentH / 2
              const x2 = c.childX + c.childW / 2
              const y2 = c.childY + c.childH / 2
              const mx = (x1 + x2) / 2
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${mx} ${y1} ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--accent-terracotta, #E07A5F)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.35"
                />
              )
            })}
          </svg>
        )}

        <AnimatePresence>
          {notes.map((note) => {
            const isHighlighted = highlightedNoteIds.includes(note.id)
            const isDimmed = dimNonHighlighted && highlightedNoteIds.length > 0 && !isHighlighted
            const isHidden = hiddenIds.has(note.id)
            const overridePos = sortMode !== 'free' ? gridPositions.get(note.id) : undefined

            return (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                isHidden={isHidden}
                overridePos={overridePos}
                onSelect={() => selectNote(note.id)}
              />
            )
          })}
        </AnimatePresence>
      </div>

      <SortTabs />

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
            {t('emptyTitle')}
          </span>
          {t('emptyHint')}
        </div>
      )}

      <AnimatePresence>
        {isSearchOpen && <SearchPanel />}
      </AnimatePresence>

      {PUBLIC_WALL ? (
        <>
          <PublicWallBar count={notes.length} />
          <AnimatePresence>{isIntroOpen && <WallIntro />}</AnimatePresence>
        </>
      ) : (
        <>
          <DailyQuestion />
          <OnThisDayWidget />
          <PresenceIndicator />
          <MemorySummaryWidget />
          <MilestoneWidget />
        </>
      )}
    </div>
  )
}
