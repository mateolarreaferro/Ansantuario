import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadAudio(
  blob: Blob,
  noteId: string
): Promise<{ url: string; path: string }> {
  const path = `audio/${noteId}_${Date.now()}.webm`
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, blob, {
    contentType: 'audio/webm'
  })

  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function deleteAudio(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch {
    // File may already be deleted
  }
}
