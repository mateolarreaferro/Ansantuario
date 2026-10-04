import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNotes } from '../../hooks/useNotes'
import { authorName, setAuthorName } from '../../lib/wall'
import { becomeModerator } from '../../lib/firestore-notes'
import { playSfxCreate, playSfxClick } from '../../lib/audio'
import { useAppStore } from '../../stores/appStore'
import { tr, useT, type Lang } from '../../lib/i18n'

/*
  The open wall's own corner (web build only): what this is, the language,
  the way back to the instructions, and the name new notes are signed with.
  Leaving the name empty keeps them anonymous. Opening the page with
  ?moderate (or ?moderar) asks for the site password, after which any note
  can be deleted.
*/
export default function PublicWallBar({ count }: { count: number }) {
  const { createNoteAt } = useNotes()
  const [name, setName] = useState(authorName)
  const [message, setMessage] = useState('')
  const { lang, setLang, setIntroOpen } = useAppStore()
  const t = useT()

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
    const query = new URLSearchParams(window.location.search)
    if (query.has('moderate') || query.has('moderar')) {
      becomeModerator().then((ok) => setMessage(ok ? tr('moderating') : ''))
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{t('title')}</div>
        <div role="group" aria-label="Language / Idioma" style={{ display: 'flex', gap: 2 }}>
          {(['en', 'es'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l)
                playSfxClick()
              }}
              aria-pressed={lang === l}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: lang === l ? 'var(--text)' : 'transparent',
                color: lang === l ? 'var(--bg)' : 'var(--text-muted)'
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: 'var(--space-1) 0 var(--space-3)', fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        {t('intro')}
        {count > 0 ? t('count', { n: count }) : ''}{' '}
        <button
          onClick={() => setIntroOpen(true)}
          style={{ padding: 0, fontSize: 'inherit', color: 'var(--accent-terracotta)', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer', background: 'transparent' }}
        >
          {t('howItWorks')}
        </button>
      </p>

      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
        {t('signAs')}
      </label>
      <input
        value={name}
        maxLength={40}
        placeholder={t('anonymous')}
        aria-label={t('nameLabel')}
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
        {t('nameHelp')}
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
        {t('addNote')}
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
