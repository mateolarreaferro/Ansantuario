/*
  The open wall: the web build (npm run build:web, vite.web.config.ts) where
  anyone can leave a note, hosted at mateolarreaferro.com/ansantuario. The
  desktop app is unchanged; PUBLIC_WALL is false there and nothing here runs.

  A visitor has no account. They are a random token kept in this browser,
  and may sign their notes with a name or leave them anonymous.
*/

export const PUBLIC_WALL = import.meta.env.VITE_PUBLIC_WALL === '1'

/** Where the host serves the open wall's notes. */
export const API = '/api/ansantuario'

const TOKEN_KEY = 'ansantuario-visitor'
const NAME_KEY = 'ansantuario-name'
let token: string | null = null
let name: string | null = null

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private window: the token lasts for this visit only.
  }
}

export function visitorToken(): string {
  if (token) return token
  token = read(TOKEN_KEY)
  if (!token || !/^[0-9a-f]{32}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
    write(TOKEN_KEY, token)
  }
  return token
}

/** The name new notes are signed with; empty for anonymous. */
export function authorName(): string {
  if (name === null) name = read(NAME_KEY) ?? ''
  return name
}

export function setAuthorName(value: string): void {
  name = value.slice(0, 40)
  write(NAME_KEY, name)
}
