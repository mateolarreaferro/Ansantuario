import { ipcMain } from 'electron'
import { setPassword, verifyPassword, hasPassword, getIdentity } from './safe-storage'
import {
  searchMemories,
  analyzeSentiment,
  describePhoto,
  findRelatedMemories,
  generateMemorySummary,
  detectMilestones
} from './claude'
import { fetchLinkPreview } from './link-preview'
import { transcribeAudio } from './whisper'
import { generateDailyQuestion } from './daily-questions'

export function registerIpcHandlers(): void {
  ipcMain.handle('auth:has-password', () => {
    return hasPassword()
  })

  ipcMain.handle('auth:set-password', async (_event, password: string, identity: string) => {
    await setPassword(password, identity)
    return true
  })

  ipcMain.handle('auth:verify-password', async (_event, password: string) => {
    return verifyPassword(password)
  })

  ipcMain.handle('auth:get-identity', () => {
    return getIdentity()
  })

  ipcMain.handle(
    'search:memories',
    async (
      _event,
      query: string,
      notes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[]
    ) => {
      return searchMemories(query, notes)
    }
  )

  ipcMain.handle('link:preview', async (_event, url: string) => {
    return fetchLinkPreview(url)
  })

  ipcMain.handle('audio:transcribe', async (_event, dataUrl: string) => {
    return transcribeAudio(dataUrl)
  })

  ipcMain.handle(
    'question:daily',
    async (
      _event,
      usedStarterIndices: number[],
      notesContext: string[]
    ) => {
      return generateDailyQuestion(usedStarterIndices, notesContext)
    }
  )

  // ─── New AI Handlers ──────────────────────────────────────────────

  ipcMain.handle(
    'ai:analyze-sentiment',
    async (_event, text: string, noteType: string) => {
      return analyzeSentiment(text, noteType)
    }
  )

  ipcMain.handle('ai:describe-photo', async (_event, imageUrl: string) => {
    return describePhoto(imageUrl)
  })

  ipcMain.handle(
    'ai:related-memories',
    async (
      _event,
      noteId: string,
      noteText: string,
      allNotes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[]
    ) => {
      return findRelatedMemories(noteId, noteText, allNotes)
    }
  )

  ipcMain.handle(
    'ai:memory-summary',
    async (
      _event,
      notes: { searchText: string; createdBy: string; createdAt: string; type: string }[],
      period: string
    ) => {
      return generateMemorySummary(notes, period)
    }
  )

  ipcMain.handle(
    'ai:detect-milestones',
    async (
      _event,
      notes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[],
      todayStr: string
    ) => {
      return detectMilestones(notes, todayStr)
    }
  )
}
