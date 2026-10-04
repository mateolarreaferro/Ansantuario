import { Timestamp } from 'firebase/firestore'

export type NoteType = 'text' | 'voice' | 'link' | 'photo'
export type UserIdentity = 'marielisa' | 'mateo'

export interface LinkPreview {
  title?: string
  description?: string
  image?: string
  favicon?: string
}

export type ReactionType = 'heart' | 'smile' | 'flame' | 'sparkle' | 'abrazo' | 'teardrop'

export const REACTION_TYPES: ReactionType[] = ['heart', 'smile', 'flame', 'sparkle', 'abrazo', 'teardrop']

export const REACTION_COLORS: Record<ReactionType, string> = {
  heart: '#E07A5F',
  smile: '#D4A043',
  flame: '#E07A5F',
  sparkle: '#C9922E',
  abrazo: '#5E9E7E',
  teardrop: '#6B8FAB'
}

export type EmotionTag = 'amor' | 'alegría' | 'nostalgia' | 'gratitud' | 'ternura' | 'tristeza' | 'emoción' | 'humor' | 'esperanza' | 'reflexión'

export interface NoteSentiment {
  tone: string          // e.g. "cálido", "reflexivo", "alegre"
  emotions: EmotionTag[]
  summary?: string      // short AI summary (used for voice notes)
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
  reactions?: Record<string, UserIdentity[]>
  sentiment?: NoteSentiment
  aiDescription?: string  // AI-generated description for photos
  authorName?: string     // open wall only: the visitor's name, if they gave one
  mine?: boolean          // open wall only: written by this browser's visitor
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

export interface PhotoNote extends BaseNote {
  type: 'photo'
  imageUrl: string
  imagePath: string
  caption?: string
}

export type Note = TextNote | VoiceNote | LinkNote | PhotoNote

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
