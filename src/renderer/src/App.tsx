import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAppStore } from './stores/appStore'
import { startMusic } from './lib/audio'
import PasswordScreen from './components/auth/PasswordScreen'
import InfiniteCanvas from './components/canvas/InfiniteCanvas'

export default function App() {
  const {
    isAuthenticated,
    isDarkMode,
    setSearchOpen,
    setSelectedNoteId,
    setHighlightedNoteIds,
    setDimNonHighlighted
  } = useAppStore()

  // Apply dark mode on mount
  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : ''
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isAuthenticated) return

      // Cmd+F or Ctrl+F — open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      }

      // Escape — close everything, clear highlights
      if (e.key === 'Escape') {
        setSelectedNoteId(null)
        setSearchOpen(false)
        setHighlightedNoteIds([])
        setDimNonHighlighted(false)
      }
    },
    [isAuthenticated, setSearchOpen, setSelectedNoteId, setHighlightedNoteIds, setDimNonHighlighted]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Start background music once authenticated
  useEffect(() => {
    if (isAuthenticated) startMusic()
  }, [isAuthenticated])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            <PasswordScreen />
          </motion.div>
        ) : (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            <InfiniteCanvas />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
