import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import { startMusic, playSfxClick } from '../../lib/audio'
import { useT, type Key, type Lang } from '../../lib/i18n'

/*
  The open wall's splash (web build only): the name, the language, and how
  it works, written as four small sticky notes. It opens on every visit and
  again from "how it works". Its button is also the press browsers require
  before sound, so the music starts the first time it closes.
*/

const STEPS: { key: Key; color: string; tilt: number }[] = [
  { key: 'step1', color: '#FFF5CC', tilt: -2 },
  { key: 'step2', color: '#FFD6D6', tilt: 1.5 },
  { key: 'step3', color: '#D6EDFF', tilt: 1 },
  { key: 'step4', color: '#D6FFE8', tilt: -1.5 }
]

const LANGS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'es', label: 'Español' }
]

let musicStarted = false

function enter(): void {
  const { setIntroOpen, setMusicEnabled } = useAppStore.getState()
  setIntroOpen(false)
  if (!musicStarted) {
    musicStarted = true
    startMusic()
    setMusicEnabled(true)
  }
}

export default function WallIntro() {
  const { lang, setLang } = useAppStore()
  const t = useT()

  // Registered once: the app's own Escape handler re-renders this synchronously,
  // and a listener swapped mid-dispatch would never be called.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') enter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wall-intro-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        overflowY: 'auto',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text)'
      }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ width: '100%', maxWidth: 560, margin: 'auto', textAlign: 'center' }}
      >
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 'var(--radius-full)', background: 'var(--white)', boxShadow: 'var(--shadow-md)' }}>
          {LANGS.map((l) => (
            <button
              key={l.lang}
              onClick={() => {
                setLang(l.lang)
                playSfxClick()
              }}
              aria-pressed={lang === l.lang}
              style={{
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                background: lang === l.lang ? 'var(--text)' : 'transparent',
                color: lang === l.lang ? 'var(--bg)' : 'var(--text-secondary)',
                transition: 'background 0.15s, color 0.15s'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <h1
          id="wall-intro-title"
          style={{
            margin: 'var(--space-6) 0 var(--space-1)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 8vw, 3.2rem)',
            fontWeight: 700,
            lineHeight: 1.1
          }}
        >
          {t('title')}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{t('tagline')}</p>

        <ol
          style={{
            listStyle: 'none',
            margin: 'var(--space-8) 0 var(--space-6)',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            textAlign: 'left'
          }}
        >
          {STEPS.map((step, i) => (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, y: 12, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: step.tilt }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.08 }}
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: step.color,
                color: '#3D3229',
                boxShadow: 'var(--shadow-md)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5
              }}
            >
              {t(step.key)}
            </motion.li>
          ))}
        </ol>

        <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t('step5')}</p>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={enter}
          autoFocus
          style={{
            padding: 'var(--space-2) var(--space-8)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-terracotta)',
            color: 'var(--white)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('enter')}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
