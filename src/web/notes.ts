/*
  The open wall's notes: the web build's stand-in for lib/firestore-notes.ts
  (vite.web.config.ts swaps it in). Same exports, so the canvas, cards and
  toolbar are unchanged; the notes live on the host site instead of in the
  private Firestore wall, which this build never touches.

  The server (mateolarreaferro.com/api/sticky-notes) holds published notes. A
  visitor is a random token kept in this browser; the server stores only a
  hash of it and answers `mine: true` on that visitor's notes. A visitor may
  edit, move and delete only their own; moving someone else's note moves it
  for this visitor alone. The site password (see the host's public/unlock.js)
  makes a visitor a moderator, who may delete any note.

  A new note is a local draft until it has text: blank notes never go public.
*/
import { Timestamp } from 'firebase/firestore'
import type { Note, NoteType, UserIdentity, LinkPreview, ReactionType } from '../renderer/src/types/note'
import { NOTE_COLORS, NOTE_SIZES } from '../renderer/src/types/note'
import { API, visitorToken, authorName } from '../renderer/src/lib/wall'
import { tr } from '../renderer/src/lib/i18n'
import { useAppStore } from '../renderer/src/stores/appStore'

type Wire = {
  id: string
  content: string
  authorName?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
  replyTo?: string
  createdAt: number
  updatedAt: number
  mine: boolean
  reactions: Record<string, string[]>
}

const POLL_MS = 4000
const listeners = new Set<(notes: Note[]) => void>()
let published = new Map<string, Wire>()
const drafts = new Map<string, Wire>()
// Edits not yet confirmed by the server, kept on top of what it last said.
const local = new Map<string, Partial<Wire>>()
const zIndex = new Map<string, number>()
const removed = new Set<string>()
let version = -1
let moderator = false
let timer: ReturnType<typeof setTimeout> | null = null

// x-wall-lang picks the language of the server's refusals.
const headers = () => ({ 'Content-Type': 'application/json', 'x-wall-visitor': visitorToken(), 'x-wall-lang': useAppStore.getState().lang })
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')

function toNote(w: Wire, me: UserIdentity): Note {
  const merged = { ...w, ...local.get(w.id) }
  const reactions: Record<string, UserIdentity[]> = {}
  for (const [type, ids] of Object.entries(merged.reactions || {})) {
    reactions[type] = ids.map((id) => (id === 'me' ? me : id)) as UserIdentity[]
  }
  return {
    id: merged.id,
    type: 'text',
    content: merged.content,
    searchText: merged.content,
    authorName: merged.authorName,
    mine: merged.mine,
    createdBy: (merged.mine ? me : 'otro') as UserIdentity,
    createdAt: Timestamp.fromMillis(merged.createdAt),
    updatedAt: Timestamp.fromMillis(merged.updatedAt),
    x: merged.x,
    y: merged.y,
    width: merged.width,
    height: merged.height,
    rotation: merged.rotation,
    color: merged.color,
    zIndex: zIndex.get(merged.id) ?? merged.createdAt,
    replyTo: merged.replyTo,
    reactions
  } as Note
}

function notify(): void {
  const me = visitorToken() as UserIdentity
  const all = [...published.values(), ...drafts.values()].filter((w) => !removed.has(w.id))
  all.sort((a, b) => a.createdAt - b.createdAt)
  const notes = all.map((w) => toNote(w, me))
  listeners.forEach((fn) => fn(notes))
}

async function pull(): Promise<void> {
  try {
    const res = await fetch(`${API}/notes?since=${version}`, { headers: headers(), cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    moderator = Boolean(data.moderator)
    if (data.unchanged) return
    version = data.version
    published = new Map((data.notes as Wire[]).map((w) => [w.id, w]))
    for (const id of removed) if (!published.has(id)) removed.delete(id)
    notify()
  } catch {
    // Offline for a moment; the next poll catches up.
  }
}

function schedule(): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    if (document.visibilityState === 'visible') await pull()
    schedule()
  }, POLL_MS)
}

export function subscribeToNotes(callback: (notes: Note[]) => void): () => void {
  listeners.add(callback)
  if (listeners.size === 1) {
    pull().then(schedule)
    document.addEventListener('visibilitychange', onVisible)
  }
  notify()
  return () => {
    listeners.delete(callback)
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

function onVisible(): void {
  if (document.visibilityState === 'visible') pull()
}

/** Whether this visitor wrote the note, so may edit, move, recolour and resize it. */
export function canModify(note: Pick<Note, 'id'>): boolean {
  return drafts.has(note.id) || Boolean(published.get(note.id)?.mine)
}

/** Whether this visitor may delete the note: their own, or any for a moderator. */
export function canDelete(note: Pick<Note, 'id'>): boolean {
  return canModify(note) || moderator
}

/** Whether this visitor can delete any note (holds the site password). */
export function isModerator(): boolean {
  return moderator
}

/** Asks the host for moderation; the host's password box answers it. */
export async function becomeModerator(): Promise<boolean> {
  const res = await fetch(`${API}/moderate`, { headers: headers(), cache: 'no-store' })
  moderator = res.ok
  notify()
  return moderator
}

export async function addNote(
  _type: NoteType,
  _createdBy: UserIdentity,
  position: { x: number; y: number },
  extras?: Partial<Note>
): Promise<string> {
  const now = Date.now()
  const size = NOTE_SIZES.M
  const id = newId()
  drafts.set(id, {
    id,
    content: '',
    authorName: authorName() || undefined,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    rotation: (Math.random() - 0.5) * 6,
    color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    replyTo: extras?.replyTo,
    createdAt: now,
    updatedAt: now,
    mine: true,
    reactions: {}
  })
  zIndex.set(id, now)
  notify()
  return id
}

const pending = new Map<string, ReturnType<typeof setTimeout>>()
const publishing = new Set<string>()

function send(id: string, data: Partial<Wire>): void {
  local.set(id, { ...local.get(id), ...data })
  notify()
  const draft = drafts.get(id)
  if (draft) {
    Object.assign(draft, data)
    local.delete(id)
    if (draft.content.trim()) publish(draft)
    return
  }
  // Coalesce a burst of edits (typing, dragging) into one request.
  clearTimeout(pending.get(id))
  pending.set(id, setTimeout(() => flush(id), 500))
}

async function publish(draft: Wire): Promise<void> {
  if (publishing.has(draft.id)) return
  publishing.add(draft.id)
  const { id, content, authorName, x, y, width, height, rotation, color, replyTo } = draft
  try {
    const res = await fetch(`${API}/notes`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ id, content, authorName, x, y, width, height, rotation, color, replyTo })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || tr('publishFailed'))
    drafts.delete(id)
    published.set(id, data.note)
    version = -1
    // Anything typed while the note was being published goes up now.
    if (draft.content !== data.note.content) send(id, { content: draft.content })
  } catch (error) {
    alertOnce(error instanceof Error ? error.message : tr('publishFailed'))
  } finally {
    publishing.delete(draft.id)
    notify()
  }
}

async function flush(id: string): Promise<void> {
  pending.delete(id)
  const data = local.get(id)
  if (!data) return
  try {
    const res = await fetch(`${API}/notes/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) })
    if (res.ok) {
      const body = await res.json()
      published.set(id, body.note)
    }
  } finally {
    // Keep only what changed again since this request was sent.
    if (local.get(id) === data) local.delete(id)
    notify()
  }
}

let lastAlert = 0
function alertOnce(message: string): void {
  if (Date.now() - lastAlert < 10_000) return
  lastAlert = Date.now()
  window.dispatchEvent(new CustomEvent('wall-message', { detail: message }))
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  if (!canModify({ id })) return
  const allowed: Partial<Wire> = {}
  for (const key of ['content', 'color', 'width', 'height'] as const) {
    if (key in data) (allowed as Record<string, unknown>)[key] = (data as Record<string, unknown>)[key]
  }
  if (Object.keys(allowed).length) send(id, allowed)
}

export async function updateNoteContent(id: string, content: string): Promise<void> {
  if (canModify({ id })) send(id, { content })
}

export async function updateNotePosition(id: string, x: number, y: number): Promise<void> {
  if (canModify({ id })) send(id, { x, y })
  else {
    // Someone else's note: moved here, for this visitor only.
    local.set(id, { ...local.get(id), x, y })
    notify()
  }
}

export async function updateNoteLink(_id: string, _url: string, _preview: LinkPreview): Promise<void> {
  // Text only on the open wall.
}

export async function bringToFront(id: string): Promise<void> {
  zIndex.set(id, Date.now())
  notify()
}

export async function deleteNote(id: string): Promise<void> {
  if (drafts.delete(id)) return notify()
  if (!canDelete({ id })) return
  removed.add(id)
  notify()
  const res = await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: headers() }).catch(() => null)
  if (!res?.ok) {
    removed.delete(id)
    notify()
  }
}

export async function toggleReaction(noteId: string, reaction: ReactionType, _user: UserIdentity): Promise<void> {
  if (!published.has(noteId)) return
  const res = await fetch(`${API}/notes/${noteId}/react`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ type: reaction })
  }).catch(() => null)
  if (res?.ok) {
    published.set(noteId, (await res.json()).note)
    notify()
  }
}
