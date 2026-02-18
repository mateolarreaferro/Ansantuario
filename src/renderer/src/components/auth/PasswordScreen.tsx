import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppStore } from '../../stores/appStore'
import type { UserIdentity } from '../../types/note'

export default function PasswordScreen() {
  const { setAuthenticated, setFirstLaunch, setIdentity, isFirstLaunch } = useAppStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedIdentity, setSelectedIdentity] = useState<UserIdentity | null>(null)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'loading' | 'login' | 'setup-identity' | 'setup-password'>(
    'loading'
  )

  useEffect(() => {
    async function checkSetup() {
      const hasPass = await window.api.auth.hasPassword()
      if (hasPass) {
        setFirstLaunch(false)
        setStep('login')
      } else {
        setFirstLaunch(true)
        setStep('setup-identity')
      }
      setLoading(false)
    }
    checkSetup()
  }, [setFirstLaunch])

  const handleLogin = async () => {
    if (!password) return
    setError('')

    const valid = await window.api.auth.verifyPassword(password)
    if (valid) {
      const identity = await window.api.auth.getIdentity()
      if (identity) setIdentity(identity as UserIdentity)
      setAuthenticated(true)
    } else {
      setError('Contraseña incorrecta')
      setShakeKey((k) => k + 1)
    }
  }

  const handleSetup = async () => {
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres')
      setShakeKey((k) => k + 1)
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setShakeKey((k) => k + 1)
      return
    }
    if (!selectedIdentity) return

    await window.api.auth.setPassword(password, selectedIdentity)
    setIdentity(selectedIdentity)
    setAuthenticated(true)
  }

  if (loading) return null

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 'var(--space-8)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: 'var(--space-2)'
          }}
        >
          Ansantuario
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          {isFirstLaunch ? 'Un portal entre Boston y Palo Alto' : 'Solo quiero preguntarte, si mañana vas a estar'}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'setup-identity' && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-5)'
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              ¿Quién eres?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              {(['marielisa', 'mateo'] as UserIdentity[]).map((name) => (
                <motion.button
                  key={name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedIdentity(name)
                    setStep('setup-password')
                  }}
                  style={{
                    padding: 'var(--space-4) var(--space-8)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--white)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    color: 'var(--text)',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'border-color var(--duration-fast)'
                  }}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'setup-password' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              width: 300
            }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              ¡Hola {selectedIdentity}! Crea una contraseña para tu santuario.
            </p>
            <motion.div
              key={shakeKey}
              animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('confirm-input')?.focus()}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 'var(--text-base)',
                  border: error ? '2px solid var(--accent-terracotta)' : '2px solid var(--border)'
                }}
              />
              <input
                id="confirm-input"
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 'var(--text-base)',
                  border: error ? '2px solid var(--accent-terracotta)' : '2px solid var(--border)'
                }}
              />
            </motion.div>
            {error && (
              <p style={{ color: 'var(--accent-terracotta)', fontSize: 'var(--text-sm)' }}>
                {error}
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSetup}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-terracotta)',
                color: 'var(--white)',
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                cursor: 'pointer',
                marginTop: 'var(--space-2)'
              }}
            >
              Crear Santuario
            </motion.button>
          </motion.div>
        )}

        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              width: 300
            }}
          >
            <motion.div
              key={shakeKey}
              animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              <input
                type="password"
                placeholder="Ingresa la contraseña"
                value={password}
                autoFocus
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 'var(--text-base)',
                  border: error ? '2px solid var(--accent-terracotta)' : '2px solid var(--border)'
                }}
              />
            </motion.div>
            {error && (
              <p style={{ color: 'var(--accent-terracotta)', fontSize: 'var(--text-sm)' }}>
                {error}
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-terracotta)',
                color: 'var(--white)',
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                cursor: 'pointer'
              }}
            >
              Entrar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
