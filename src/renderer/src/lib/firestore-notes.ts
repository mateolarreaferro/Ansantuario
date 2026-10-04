import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from './firebase'
import type { Note, NoteType, UserIdentity, LinkPreview, ReactionType } from '../types/note'
import { NOTE_COLORS, NOTE_SIZES } from '../types/note'

const NOTES_COLLECTION = 'notes'

function randomRotation(): number {
  return (Math.random() - 0.5) * 6 // -3 to +3 degrees
}

function randomColor(): string {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

export async function addNote(
  type: NoteType,
  createdBy: UserIdentity,
  position: { x: number; y: number },
  extras?: Partial<Note>
): Promise<string> {
  const size = NOTE_SIZES.M
  const base = {
    type,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    rotation: randomRotation(),
    color: randomColor(),
    zIndex: Date.now(),
    searchText: '',
    ...extras
  }

  let noteData: Record<string, unknown>
  switch (type) {
    case 'text':
      noteData = { ...base, content: '', ...extras }
      break
    case 'voice':
      noteData = { ...base, audioUrl: '', audioPath: '', duration: 0, ...extras }
      break
    case 'link':
      noteData = { ...base, url: '', preview: {}, ...extras }
      break
    case 'photo':
      noteData = { ...base, imageUrl: '', imagePath: '', caption: '', searchText: 'Foto', ...extras }
      break
    default:
      noteData = base
  }

  const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteData)
  return docRef.id
}

export async function updateNote(
  id: string,
  data: Partial<Note>
): Promise<void> {
  const ref = doc(db, NOTES_COLLECTION, id)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, NOTES_COLLECTION, id))
}

export async function updateNotePosition(
  id: string,
  x: number,
  y: number
): Promise<void> {
  await updateNote(id, { x, y } as Partial<Note>)
}

export async function updateNoteContent(
  id: string,
  content: string
): Promise<void> {
  await updateNote(id, { content, searchText: content } as Partial<Note>)
}

export async function updateNoteLink(
  id: string,
  url: string,
  preview: LinkPreview
): Promise<void> {
  await updateNote(id, {
    url,
    preview,
    searchText: `${url} ${preview.title || ''} ${preview.description || ''}`
  } as Partial<Note>)
}

export async function bringToFront(id: string): Promise<void> {
  await updateNote(id, { zIndex: Date.now() } as Partial<Note>)
}

export function subscribeToNotes(
  callback: (notes: Note[]) => void
): () => void {
  const q = query(collection(db, NOTES_COLLECTION), orderBy('createdAt', 'asc'))

  return onSnapshot(q, (snapshot) => {
    const notes: Note[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Note[]
    callback(notes)
  })
}

/** Both people on the private wall may edit every note. */
export function canModify(_note: Pick<Note, 'id'>): boolean {
  return true
}

export function canDelete(_note: Pick<Note, 'id'>): boolean {
  return true
}

/** Moderation belongs to the open wall; the private wall has two equals. */
export function isModerator(): boolean {
  return false
}

export async function becomeModerator(): Promise<boolean> {
  return false
}

export async function toggleReaction(
  noteId: string,
  reaction: ReactionType,
  user: UserIdentity
): Promise<void> {
  const ref = doc(db, NOTES_COLLECTION, noteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const data = snap.data()
  const reactions: Record<string, UserIdentity[]> = data.reactions || {}
  const users = reactions[reaction] || []

  if (users.includes(user)) {
    reactions[reaction] = users.filter((u) => u !== user)
    if (reactions[reaction].length === 0) delete reactions[reaction]
  } else {
    reactions[reaction] = [...users, user]
  }

  await updateDoc(ref, { reactions })
}
