/*
  window.api is the Electron bridge (src/preload). The open wall has no main
  process, so the AI features answer "nothing": search falls back to its
  local text matching, and sentiment, related memories, digests and
  milestones simply stay empty. Loaded first by the web entry.
*/
const nothing = async (): Promise<null> => null
const none = async (): Promise<[]> => []

;(window as unknown as { api: unknown }).api = {
  auth: {
    hasPassword: async () => true,
    setPassword: async () => true,
    verifyPassword: async () => true,
    getIdentity: async () => undefined
  },
  search: { memories: none },
  link: { preview: async () => ({}) },
  audio: {
    transcribe: async () => {
      throw new Error('Voice notes are not part of the open wall.')
    }
  },
  question: { daily: nothing },
  ai: {
    analyzeSentiment: nothing,
    describePhoto: nothing,
    relatedMemories: none,
    memorySummary: nothing,
    detectMilestones: none
  }
}

export {}
