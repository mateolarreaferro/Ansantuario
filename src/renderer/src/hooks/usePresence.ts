import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { setPresence, subscribeToPresence } from '../lib/firestore-presence'
import { authReady } from '../lib/firebase'

export function usePresence() {
  const identity = useAppStore((s) => s.identity)
  const [otherOnline, setOtherOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<Date | null>(null)

  const otherUser = identity === 'mateo' ? 'marielisa' : 'mateo'

  useEffect(() => {
    if (!identity) return

    let heartbeat: ReturnType<typeof setInterval>
    let unsubscribe: (() => void) | null = null

    authReady.then(() => {
      // Set online
      setPresence(identity, true)

      // Heartbeat every 60s
      heartbeat = setInterval(() => {
        setPresence(identity, true)
      }, 60_000)

      // Watch other user
      unsubscribe = subscribeToPresence(otherUser, ({ online, lastSeen: ls }) => {
        setOtherOnline(online)
        setLastSeen(ls)
      })
    })

    // Go offline on close/hide
    const handleVisibility = () => {
      if (document.hidden) {
        setPresence(identity, false)
      } else {
        setPresence(identity, true)
      }
    }
    const handleUnload = () => setPresence(identity, false)

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(heartbeat)
      unsubscribe?.()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleUnload)
      if (identity) setPresence(identity, false)
    }
  }, [identity, otherUser])

  return { otherUser, otherOnline, lastSeen }
}
