/*
  Stand-ins for the private wall's Firebase modules in the web build
  (vite.web.config.ts swaps them in by path). The open wall has no presence,
  no daily question and no uploads, and no Firebase project or config is
  ever bundled into it. Anything here that should not be reached throws, so a
  missed feature fails loudly instead of silently talking to Firebase.
*/

// lib/firebase
export const db = null
export const storage = null
export const auth = null
export const authReady: Promise<void> = Promise.resolve()

// lib/firestore-presence
export function setPresence(): void {}
export function subscribeToPresence(): () => void {
  return () => {}
}

// lib/firebase-storage
export async function uploadImage(): Promise<never> {
  throw new Error('Photos are not part of the open wall.')
}
export async function uploadAudio(): Promise<never> {
  throw new Error('Voice notes are not part of the open wall.')
}
export async function deleteImage(): Promise<void> {}

// lib/firestore-questions
export async function getTodayQuestion(): Promise<null> {
  return null
}
export async function saveDailyQuestion(): Promise<void> {}
export async function getPastQuestions(): Promise<[]> {
  return []
}
export async function markQuestionAnswered(): Promise<void> {}
