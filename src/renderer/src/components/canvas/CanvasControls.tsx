import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import { toggleMusic, skipTrack, getCurrentTrack, getPlaylist } from '../../lib/audio'

interface CanvasControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export default function CanvasControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset
}: CanvasControlsProps) {
  const { setSearchOpen, isSearchOpen, isMusicEnabled, setMusicEnabled, currentTrackTitle, setCurrentTrackTitle } = useAppStore()
  const hasMultipleTracks = getPlaylist().length > 1

  const handleToggleMusic = () => {
    const nowPlaying = toggleMusic()
    setMusicEnabled(nowPlaying)
  }

  const handleSkip = (direction: 'next' | 'prev') => {
    skipTrack(direction)
    // Update title after the crossfade delay
    setTimeout(() => {
      setCurrentTrackTitle(getCurrentTrack().title)
    }, 500)
  }

  return (
    <>
      {/* Top-right controls */}
      <div
        style={{
          position: 'fixed',
          top: 'var(--space-12)',
          right: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center',
          zIndex: 'var(--z-toolbar)' as unknown as number
        }}
      >
        {/* Mini music player */}
        <div
          style={{
            height: 40,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--white)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '0 var(--space-2)',
            border: '1px solid var(--border)'
          }}
        >
          {/* Prev */}
          {hasMultipleTracks && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSkip('prev')}
              style={playerBtnStyle}
              title="Anterior"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </motion.button>
          )}

          {/* Play / Pause */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleMusic}
            style={playerBtnStyle}
            title={isMusicEnabled ? 'Pausar' : 'Reproducir'}
          >
            {isMusicEnabled ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </motion.button>

          {/* Next */}
          {hasMultipleTracks && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSkip('next')}
              style={playerBtnStyle}
              title="Siguiente"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </motion.button>
          )}

          {/* Track title */}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentTrackTitle}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                fontWeight: 500,
                paddingRight: 'var(--space-2)',
                paddingLeft: 'var(--space-1)',
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentTrackTitle}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Search button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSearchOpen(!isSearchOpen)}
          style={{
            height: 40,
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            background: isSearchOpen ? 'var(--accent-terracotta)' : 'var(--white)',
            color: isSearchOpen ? 'var(--white)' : 'var(--text-secondary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            transition: 'background 0.15s, color 0.15s'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Buscar
        </motion.button>
      </div>

      {/* Zoom controls — bottom left */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          left: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          zIndex: 'var(--z-toolbar)' as unknown as number
        }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomIn}
          style={buttonStyle}
          title="Acercar"
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onReset}
          style={{
            ...buttonStyle,
            fontSize: 'var(--text-xs)',
            fontWeight: 500
          }}
          title="Restablecer vista"
        >
          {Math.round(scale * 100)}%
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onZoomOut}
          style={buttonStyle}
          title="Alejar"
        >
          −
        </motion.button>
      </div>
    </>
  )
}

const playerBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-full)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--text-secondary)',
  transition: 'color 0.15s'
}

const buttonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--white)',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--text-lg)',
  fontWeight: 600,
  color: 'var(--text)',
  cursor: 'pointer',
  border: '1px solid var(--border)'
}
