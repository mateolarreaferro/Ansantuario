import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { subscribeToNotes } from '../lib/firestore-notes'

export function useFirestore() {
  const setNotes = useAppStore((s) => s.setNotes)

  useEffect(() => {
    const unsubscribe = subscribeToNotes((notes) => {
      setNotes(notes)
    })

    return () => unsubscribe()
  }, [setNotes])
}
