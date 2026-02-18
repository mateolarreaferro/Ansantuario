import { ipcMain } from 'electron'
import { setPassword, verifyPassword, hasPassword, getIdentity } from './safe-storage'
import { searchMemories } from './claude'
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
}
