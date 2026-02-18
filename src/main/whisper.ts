import Groq from 'groq-sdk'
import { Buffer } from 'node:buffer'

let client: Groq | null = null

function getClient(): Groq {
  if (!client) {
    const apiKey = (import.meta as any).env?.MAIN_VITE_GROQ_API_KEY
    if (!apiKey) throw new Error('MAIN_VITE_GROQ_API_KEY not set — check your .env file')
    client = new Groq({ apiKey })
  }
  return client
}

export async function transcribeAudio(dataUrl: string): Promise<string> {
  const groq = getClient()

  // Decode base64 data URL → Buffer
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid data URL')
  const buffer = Buffer.from(base64, 'base64')

  // Determine MIME type from data URL header
  const mimeMatch = dataUrl.match(/^data:(audio\/\w+);/)
  const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'webm'

  // Create a File-like object for the API
  const file = new File([buffer], `audio.${ext}`, {
    type: mimeMatch ? mimeMatch[1] : 'audio/webm'
  })

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'es'
  })

  return transcription.text
}
