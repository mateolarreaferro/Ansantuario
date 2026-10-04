import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNotes } from '../../hooks/useNotes'
import { authorName, setAuthorName } from '../../lib/wall'
import { becomeModerator } from '../../lib/firestore-notes'
import { playSfxCreate } from '../../lib/audio'

/*
  The open wall's own corner (web build only): what this is, how to leave a
  note, and the name new notes are signed with. Leaving the name empty keeps
  them anonymous. Opening the page with ?moderar asks for the site password,
  after which any note can be deleted.
*/
export default function PublicWallBar({ count }: { count: number }) {
  const { createNoteAt } = useNotes()
  const [name, setName] = useState(authorName)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onMessage = (e: Event) => setMessage((e as CustomEvent<string>).detail)
    window.addEventListener('wall-message', onMessage)
    return () => window.removeEventListener('wall-message', onMessage)
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 6000)
    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('moderar')) {
      becomeModerator().then((ok) => setMessage(ok ? 'Modo moderación: puedes borrar cualquier nota.' : ''))
    }
  }, [])

  const addAtCenter = () => {
    createNoteAt(window.innerWidth / 2, window.innerHeight / 2)
    playSfxCreate()
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 'var(--space-6)',
        left: 'var(--space-6)',
        width: 'min(280px, calc(100vw - 2 * var(--space-6)))',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 'var(--z-menu)' as unknown as number,
        fontFamily: 'var(--font-body)',
        color: 'var(--text)'
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>Ansantuario</div>
      <p style={{ margin: 'var(--space-1) 0 var(--space-3)', fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        Un muro abierto. Deja una nota con doble clic en cualquier lugar, o aquí abajo.
        {count > 0 ? ` Ya hay ${count}.` : ''}
      </p>

      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
        firmar como
      </label>
      <input
        value={name}
        maxLength={40}
        placeholder="anónimo"
        aria-label="Tu nombre, opcional"
        onChange={(e) => {
          setName(e.target.value)
          setAuthorName(e.target.value.trim())
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 'var(--space-2) var(--space-3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          background: 'transparent',
          color: 'var(--text)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          outline: 'none'
        }}
      />
      <p style={{ margin: 'var(--space-1) 0 var(--space-3)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        Opcional. Vacío, tus notas quedan anónimas.
      </p>

      <button
        onClick={addAtCenter}
        style={{
          width: '100%',
          padding: 'var(--space-2)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-terracotta)',
          color: 'var(--white)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer'
        }}
      >
        + dejar una nota
      </button>

      <AnimatePresence>
        {message && (
          <motion.p
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-xs)', color: 'var(--accent-terracotta)' }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
