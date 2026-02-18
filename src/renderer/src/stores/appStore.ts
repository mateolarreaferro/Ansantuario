import { create } from 'zustand'
import type { Note, UserIdentity } from '../types/note'

interface Viewport {
  x: number
  y: number
  scale: number
}

interface AppState {
  // Auth
  isAuthenticated: boolean
  isFirstLaunch: boolean
  identity: UserIdentity | null
  setAuthenticated: (value: boolean) => void
  setFirstLaunch: (value: boolean) => void
  setIdentity: (identity: UserIdentity) => void

  // Viewport
  viewport: Viewport
  setViewport: (viewport: Partial<Viewport>) => void
  resetViewport: () => void

  // Notes
  notes: Note[]
  setNotes: (notes: Note[]) => void
  selectedNoteId: string | null
  setSelectedNoteId: (id: string | null) => void

  // UI
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
  isDragging: boolean
  setDragging: (dragging: boolean) => void

  // AI Search highlights
  highlightedNoteIds: string[]
  setHighlightedNoteIds: (ids: string[]) => void
  dimNonHighlighted: boolean
  setDimNonHighlighted: (dim: boolean) => void

  // Audio
  isMusicEnabled: boolean
  setMusicEnabled: (enabled: boolean) => void
  currentTrackTitle: string
  setCurrentTrackTitle: (title: string) => void
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 }

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  isFirstLaunch: true,
  identity: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setFirstLaunch: (value) => set({ isFirstLaunch: value }),
  setIdentity: (identity) => set({ identity }),

  // Viewport
  viewport: DEFAULT_VIEWPORT,
  setViewport: (partial) =>
    set((state) => ({ viewport: { ...state.viewport, ...partial } })),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),

  // Notes
  notes: [],
  setNotes: (notes) => set({ notes }),
  selectedNoteId: null,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  // UI
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  isDragging: false,
  setDragging: (dragging) => set({ isDragging: dragging }),

  // AI Search highlights
  highlightedNoteIds: [],
  setHighlightedNoteIds: (ids) => set({ highlightedNoteIds: ids }),
  dimNonHighlighted: false,
  setDimNonHighlighted: (dim) => set({ dimNonHighlighted: dim }),

  // Audio
  isMusicEnabled: true,
  setMusicEnabled: (enabled) => set({ isMusicEnabled: enabled }),
  currentTrackTitle: 'Bicho',
  setCurrentTrackTitle: (title) => set({ currentTrackTitle: title })
}))
