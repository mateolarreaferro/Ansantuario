import { useRef, useCallback, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { updateNotePosition, bringToFront } from '../lib/firestore-notes'

export function useDrag(noteId: string, noteX: number, noteY: number) {
  const viewport = useAppStore((s) => s.viewport)
  const setDragging = useAppStore((s) => s.setDragging)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const startRef = useRef({ cx: 0, cy: 0, nx: 0, ny: 0 })

  // Keep scale in a ref so document listeners always see the latest value
  const scaleRef = useRef(viewport.scale)
  scaleRef.current = viewport.scale

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()

      draggingRef.current = true
      startRef.current = { cx: e.clientX, cy: e.clientY, nx: noteX, ny: noteY }
      setDragging(true)

      // Use document-level listeners so re-renders can't break the drag
      const handleMove = (ev: PointerEvent): void => {
        if (!draggingRef.current) return
        const dx = (ev.clientX - startRef.current.cx) / scaleRef.current
        const dy = (ev.clientY - startRef.current.cy) / scaleRef.current
        setOffset({ x: dx, y: dy })
      }

      const handleUp = (ev: PointerEvent): void => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setDragging(false)

        const dx = (ev.clientX - startRef.current.cx) / scaleRef.current
        const dy = (ev.clientY - startRef.current.cy) / scaleRef.current
        const finalX = startRef.current.nx + dx
        const finalY = startRef.current.ny + dy

        setOffset({ x: 0, y: 0 })
        updateNotePosition(noteId, finalX, finalY)
        bringToFront(noteId)

        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
    },
    [noteId, noteX, noteY, setDragging]
  )

  return {
    displayX: noteX + offset.x,
    displayY: noteY + offset.y,
    dragHandlers: { onPointerDown }
  }
}
