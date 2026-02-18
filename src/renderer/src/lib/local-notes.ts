import type { Note, NoteType, UserIdentity, LinkPreview } from '../types/note'
import { NOTE_COLORS, NOTE_SIZES } from '../types/note'
import { Timestamp } from 'firebase/firestore'

const STORAGE_KEY = 'ansantuario-notes'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function randomRotation(): number {
  return (Math.random() - 0.5) * 6
}

function randomColor(): string {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

function nowTimestamp(): Timestamp {
  return Timestamp.now()
}

// --- Persistence ---

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Restore Timestamp objects
    return parsed.map((n: any) => ({
      ...n,
      createdAt: new Timestamp(n.createdAt._seconds || n.createdAt.seconds || 0, 0),
      updatedAt: new Timestamp(n.updatedAt._seconds || n.updatedAt.seconds || 0, 0)
    }))
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]): void {
  try {
    const serializable = notes.map((n) => ({
      ...n,
      createdAt: { seconds: n.createdAt?.seconds ?? Math.floor(Date.now() / 1000) },
      updatedAt: { seconds: n.updatedAt?.seconds ?? Math.floor(Date.now() / 1000) }
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // localStorage might be full
  }
}

// --- Listener system ---
type Listener = (notes: Note[]) => void
const listeners = new Set<Listener>()
let currentNotes: Note[] = loadNotes()

function notify(): void {
  saveNotes(currentNotes)
  listeners.forEach((fn) => fn([...currentNotes]))
}

export function subscribeToNotes(callback: Listener): () => void {
  listeners.add(callback)
  // Immediately fire with current state
  callback([...currentNotes])
  return () => listeners.delete(callback)
}

// --- CRUD ---

export function addNote(
  type: NoteType,
  createdBy: UserIdentity,
  position: { x: number; y: number }
): string {
  const id = generateId()
  const size = NOTE_SIZES.M
  const now = nowTimestamp()

  const base = {
    id,
    type,
    createdBy,
    createdAt: now,
    updatedAt: now,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    rotation: randomRotation(),
    color: randomColor(),
    zIndex: Date.now(),
    searchText: ''
  }

  let note: Note
  switch (type) {
    case 'text':
      note = { ...base, type: 'text', content: '' } as Note
      break
    case 'voice':
      note = { ...base, type: 'voice', audioUrl: '', audioPath: '', duration: 0 } as Note
      break
    case 'link':
      note = { ...base, type: 'link', url: '', preview: {} } as Note
      break
    default:
      note = { ...base, type: 'text', content: '' } as Note
  }

  currentNotes.push(note)
  notify()
  return id
}

export function updateNote(id: string, data: Partial<Note>): void {
  const idx = currentNotes.findIndex((n) => n.id === id)
  if (idx === -1) return
  currentNotes[idx] = { ...currentNotes[idx], ...data, updatedAt: nowTimestamp() } as Note
  notify()
}

export function deleteNote(id: string): void {
  currentNotes = currentNotes.filter((n) => n.id !== id)
  notify()
}

export function updateNotePosition(id: string, x: number, y: number): void {
  updateNote(id, { x, y } as Partial<Note>)
}

export function updateNoteContent(id: string, content: string): void {
  updateNote(id, { content, searchText: content } as Partial<Note>)
}

export function updateNoteLink(id: string, url: string, preview: LinkPreview): void {
  updateNote(id, {
    url,
    preview,
    searchText: `${url} ${preview.title || ''} ${preview.description || ''}`
  } as Partial<Note>)
}

export function bringToFront(id: string): void {
  updateNote(id, { zIndex: Date.now() } as Partial<Note>)
}
