interface GridBackgroundProps {
  viewport: { x: number; y: number; scale: number }
}

export default function GridBackground({ viewport }: GridBackgroundProps) {
  const dotSize = 1.5
  const spacing = 30
  const offsetX = viewport.x % (spacing * viewport.scale)
  const offsetY = viewport.y % (spacing * viewport.scale)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-grid)' as unknown as number,
        pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle, var(--text-muted) ${dotSize * viewport.scale}px, transparent ${dotSize * viewport.scale}px)`,
        backgroundSize: `${spacing * viewport.scale}px ${spacing * viewport.scale}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: 0.2
      }}
    />
  )
}
