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
  }
}

contextBridge.exposeInMainWorld('api', api)
