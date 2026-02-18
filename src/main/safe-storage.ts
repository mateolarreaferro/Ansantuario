import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'

interface StoreData {
  passwordHash?: string
  identity?: string
}

function getStorePath(): string {
  const dir = join(app.getPath('userData'), 'ansantuario')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'config.json')
}

function readStore(): StoreData {
  const path = getStorePath()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return {}
  }
}

function writeStore(data: StoreData): void {
  writeFileSync(getStorePath(), JSON.stringify(data, null, 2))
}

export async function setPassword(password: string, identity: string): Promise<void> {
  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash(password, salt)
  const data = readStore()

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(hash)
    data.passwordHash = encrypted.toString('base64')
  } else {
    data.passwordHash = hash
  }
  data.identity = identity
  writeStore(data)
}

export async function verifyPassword(password: string): Promise<boolean> {
  const data = readStore()
  if (!data.passwordHash) return false

  let hash: string
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(data.passwordHash, 'base64')
      hash = safeStorage.decryptString(buffer)
    } catch {
      hash = data.passwordHash
    }
  } else {
    hash = data.passwordHash
  }

  return bcrypt.compare(password, hash)
}

export function hasPassword(): boolean {
  const data = readStore()
  return !!data.passwordHash
}

export function getIdentity(): string | undefined {
  return readStore().identity
}
