import { Timestamp } from 'firebase/firestore'

export type NoteType = 'text' | 'voice' | 'link'
export type UserIdentity = 'marielisa' | 'mateo'

export interface LinkPreview {
  title?: string
  description?: string
  image?: string
  favicon?: string
}

export interface BaseNote {
  id: string
  type: NoteType
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: UserIdentity
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
  zIndex: number
  searchText: string
  replyTo?: string
}

export interface TextNote extends BaseNote {
  type: 'text'
  content: string
}

export interface VoiceNote extends BaseNote {
  type: 'voice'
  audioUrl: string
  audioPath: string
  duration: number
  transcript?: string
}

export interface LinkNote extends BaseNote {
  type: 'link'
  url: string
  preview: LinkPreview
}

export type Note = TextNote | VoiceNote | LinkNote

export const NOTE_COLORS = [
  '#FFF8E7', // cream
  '#FFE8D6', // peach
  '#FFD6D6', // blush
  '#E8D6FF', // lavender
  '#D6FFE8', // mint
  '#D6EDFF', // sky
  '#FFF5CC', // butter
  '#FFD1C1', // coral
  '#D6EBD6', // sage
  '#E8D6F0'  // lilac
] as const

export const NOTE_SIZES = {
  S: { width: 180, height: 180 },
  M: { width: 240, height: 240 },
  L: { width: 320, height: 320 }
} as const
