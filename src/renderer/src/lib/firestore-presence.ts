import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserIdentity } from '../types/note'

const PRESENCE_COLLECTION = 'presence'

export function setPresence(identity: UserIdentity, online: boolean) {
  const ref = doc(db, PRESENCE_COLLECTION, identity)
  return setDoc(ref, {
    online,
    lastSeen: serverTimestamp(),
    identity
  }, { merge: true })
}

export function subscribeToPresence(
  otherUser: UserIdentity,
  callback: (data: { online: boolean; lastSeen: Date | null }) => void
): () => void {
  const ref = doc(db, PRESENCE_COLLECTION, otherUser)
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      const lastSeen = data.lastSeen?.toDate() || null
      // Consider stale if lastSeen > 2 min ago
      const isStale = lastSeen && (Date.now() - lastSeen.getTime() > 2 * 60 * 1000)
      callback({
        online: data.online && !isStale,
        lastSeen
      })
    } else {
      callback({ online: false, lastSeen: null })
    }
  })
}
