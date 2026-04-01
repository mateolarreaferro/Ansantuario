import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { subscribeToNotes } from '../lib/firestore-notes'
import { authReady } from '../lib/firebase'

export function useFirestore() {
  const setNotes = useAppStore((s) => s.setNotes)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    authReady.then(() => {
      unsubscribe = subscribeToNotes((notes) => {
        setNotes(notes)
      })
    })

    return () => unsubscribe?.()
  }, [setNotes])
}
