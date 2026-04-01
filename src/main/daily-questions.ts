import { detectTopicGaps } from './claude'
import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = (import.meta as any).env?.MAIN_VITE_ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('MAIN_VITE_ANTHROPIC_API_KEY not set — check your .env file')
    client = new Anthropic({ apiKey })
  }
  return client
}

export const STARTER_QUESTIONS: string[] = [
  '¿Qué momento de hoy quisieras recordar para siempre?',
  '¿Qué es algo que nunca le has dicho al otro pero siempre has querido?',
  '¿Cuál es tu recuerdo favorito juntos?',
  '¿Qué canción te recuerda a nosotros y por qué?',
  '¿Qué aprendiste hoy que no sabías ayer?',
  '¿Qué te hizo sonreír hoy?',
  'Si pudieras revivir un día juntos, ¿cuál sería?',
  '¿Qué es algo pequeño que el otro hace y que te llena el corazón?',
  '¿Cuál es tu sueño más loco para nuestro futuro?',
  '¿Qué te da miedo perder?',
  '¿Qué lugar del mundo te gustaría visitar conmigo?',
  '¿Cuándo fue la última vez que lloraste de felicidad?',
  '¿Qué palabra describe cómo te sientes ahora mismo?',
  '¿Qué consejo le darías a tu yo de hace un año?',
  '¿Qué es lo que más extrañas cuando no estamos juntos?',
  '¿Cuál fue el último acto de amor que notaste?',
  '¿Hay algo que quieras soltar o dejar ir hoy?',
  '¿Qué tradición nuestra es tu favorita?'
]

export async function generateDailyQuestion(
  usedStarterIndices: number[],
  notesContext: string[]
): Promise<{ question: string; starterIndex?: number }> {
  // Try to pick an unused starter question first
  const unusedIndices = STARTER_QUESTIONS.map((_, i) => i).filter(
    (i) => !usedStarterIndices.includes(i)
  )

  if (unusedIndices.length > 0) {
    const pick = unusedIndices[Math.floor(Math.random() * unusedIndices.length)]
    return { question: STARTER_QUESTIONS[pick], starterIndex: pick }
  }

  // All starters used — try gap-aware question first, then fall back to general
  const recentNotes = notesContext.slice(0, 30)

  if (recentNotes.length >= 5) {
    try {
      const gapQuestion = await detectTopicGaps(recentNotes, [])
      if (gapQuestion) {
        return { question: gapQuestion }
      }
    } catch (err) {
      console.error('Gap-aware question failed, falling back:', err)
    }
  }

  const anthropic = getClient()
  const contextSnippet = recentNotes.join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    system: `Eres un compañero reflexivo para una pareja (Marielisa y Mateo) que comparten un muro de memorias.
Genera UNA sola pregunta reflexiva en español que invite a la introspección, la gratitud o la conexión emocional.
La pregunta debe ser personal pero no invasiva. Inspírate en sus notas recientes para hacerla relevante.
Devuelve SOLO la pregunta, sin explicación ni comillas.`,
    messages: [
      {
        role: 'user',
        content: contextSnippet
          ? `Aquí hay algunas de sus notas recientes:\n${contextSnippet}\n\nGenera una pregunta reflexiva para hoy:`
          : 'Genera una pregunta reflexiva para hoy:'
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return { question: text || '¿Qué quieres recordar de hoy?' }
}
