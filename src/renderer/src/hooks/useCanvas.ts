import { useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

const MIN_SCALE = 0.2
const MAX_SCALE = 3
const ZOOM_SENSITIVITY = 0.005

export function useCanvas() {
  const { viewport, setViewport, resetViewport } = useAppStore()
  const isPanningRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only pan with middle mouse or when clicking on canvas background
      if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).dataset.canvas)) {
        isPanningRef.current = true
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    []
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanningRef.current) return

      const dx = e.clientX - lastPointerRef.current.x
      const dy = e.clientY - lastPointerRef.current.y
      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      setViewport({
        x: viewport.x + dx,
        y: viewport.y + dy
      })
    },
    [viewport.x, viewport.y, setViewport]
  )

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      // Pinch zoom (trackpad)
      if (e.ctrlKey) {
        const delta = -e.deltaY * ZOOM_SENSITIVITY
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * (1 + delta)))

        // Zoom toward cursor position
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top

        const scaleRatio = newScale / viewport.scale
        const newX = cursorX - (cursorX - viewport.x) * scaleRatio
        const newY = cursorY - (cursorY - viewport.y) * scaleRatio

        setViewport({ x: newX, y: newY, scale: newScale })
      } else {
        // Pan (scroll)
        setViewport({
          x: viewport.x - e.deltaX,
          y: viewport.y - e.deltaY
        })
      }
    },
    [viewport, setViewport]
  )

  const zoomIn = useCallback(() => {
    const newScale = Math.min(MAX_SCALE, viewport.scale * 1.35)
    setViewport({ scale: newScale })
  }, [viewport.scale, setViewport])

  const zoomOut = useCallback(() => {
    const newScale = Math.max(MIN_SCALE, viewport.scale / 1.35)
    setViewport({ scale: newScale })
  }, [viewport.scale, setViewport])

  const flyTo = useCallback(
    (x: number, y: number) => {
      // Center the viewport on the given world coordinates (reset to scale 1)
      const container = document.getElementById('canvas-container')
      if (!container) return
      const rect = container.getBoundingClientRect()
      const targetScale = 1
      setViewport({
        x: rect.width / 2 - x * targetScale,
        y: rect.height / 2 - y * targetScale,
        scale: targetScale
      })
    },
    [setViewport]
  )

  return {
    viewport,
    isPanning: isPanningRef.current,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    zoomIn,
    zoomOut,
    resetViewport,
    flyTo
  }
}
