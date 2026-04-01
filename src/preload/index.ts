import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  auth: {
    hasPassword: () => Promise<boolean>
    setPassword: (password: string, identity: string) => Promise<boolean>
    verifyPassword: (password: string) => Promise<boolean>
    getIdentity: () => Promise<string | undefined>
  }
  search: {
    memories: (
      query: string,
      notes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[]
    ) => Promise<{ noteId: string; relevance: string; snippet: string }[]>
  }
  link: {
    preview: (
      url: string
    ) => Promise<{ title?: string; description?: string; image?: string; favicon?: string }>
  }
  audio: {
    transcribe: (dataUrl: string) => Promise<string>
  }
  question: {
    daily: (
      usedStarterIndices: number[],
      notesContext: string[]
    ) => Promise<{ question: string; starterIndex?: number }>
  }
  ai: {
    analyzeSentiment: (text: string, noteType: string) => Promise<{
      tone: string
      emotions: string[]
      summary?: string
    }>
    describePhoto: (imageUrl: string) => Promise<string>
    relatedMemories: (
      noteId: string,
      noteText: string,
      allNotes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[]
    ) => Promise<{ noteId: string; relevance: string; snippet: string }[]>
    memorySummary: (
      notes: { searchText: string; createdBy: string; createdAt: string; type: string }[],
      period: string
    ) => Promise<{
      summary: string
      themes: string[]
      highlight: string
      noteCount: number
    }>
    detectMilestones: (
      notes: { id: string; type: string; searchText: string; createdBy: string; createdAt: string }[],
      todayStr: string
    ) => Promise<{
      type: string
      title: string
      description: string
      relatedNoteIds?: string[]
    }[]>
  }
}

const api: ElectronAPI = {
  auth: {
    hasPassword: () => ipcRenderer.invoke('auth:has-password'),
    setPassword: (password, identity) => ipcRenderer.invoke('auth:set-password', password, identity),
    verifyPassword: (password) => ipcRenderer.invoke('auth:verify-password', password),
    getIdentity: () => ipcRenderer.invoke('auth:get-identity')
  },
  search: {
    memories: (query, notes) => ipcRenderer.invoke('search:memories', query, notes)
  },
  link: {
    preview: (url) => ipcRenderer.invoke('link:preview', url)
  },
  audio: {
    transcribe: (dataUrl) => ipcRenderer.invoke('audio:transcribe', dataUrl)
  },
  question: {
    daily: (usedStarterIndices, notesContext) =>
      ipcRenderer.invoke('question:daily', usedStarterIndices, notesContext)
  },
  ai: {
    analyzeSentiment: (text, noteType) => ipcRenderer.invoke('ai:analyze-sentiment', text, noteType),
    describePhoto: (imageUrl) => ipcRenderer.invoke('ai:describe-photo', imageUrl),
    relatedMemories: (noteId, noteText, allNotes) =>
      ipcRenderer.invoke('ai:related-memories', noteId, noteText, allNotes),
    memorySummary: (notes, period) => ipcRenderer.invoke('ai:memory-summary', notes, period),
    detectMilestones: (notes, todayStr) => ipcRenderer.invoke('ai:detect-milestones', notes, todayStr)
  }
}

contextBridge.exposeInMainWorld('api', api)
