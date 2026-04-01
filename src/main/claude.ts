import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    // electron-vite injects MAIN_VITE_ vars via import.meta.env
    const apiKey = (import.meta as any).env?.MAIN_VITE_ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('MAIN_VITE_ANTHROPIC_API_KEY not set — check your .env file')
    client = new Anthropic({ apiKey })
  }
  return client
}

const MODEL = 'claude-sonnet-4-5-20250929'

function extractJson<T>(text: string): T | null {
  const match = text.match(/[\[{][\s\S]*[\]}]/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
  return null
}

// ─── Search ────────────────────────────────────────────────────────────

interface NoteSearchData {
  id: string
  type: string
  searchText: string
  createdBy: string
  createdAt: string
}

interface SearchResult {
  noteId: string
  relevance: string
  snippet: string
}

export async function searchMemories(
  query: string,
  notes: NoteSearchData[]
): Promise<SearchResult[]> {
  try {
    const anthropic = getClient()

    const notesContext = notes
      .map((n) => `[ID:${n.id}] (${n.type} by ${n.createdBy}, ${n.createdAt}): ${n.searchText}`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `Eres un asistente de búsqueda de recuerdos para un muro de memorias compartido entre dos personas (Marielisa y Mateo).
Dada una colección de notas/recuerdos y una consulta de búsqueda, encuentra las notas más relevantes.
Devuelve los resultados como un array JSON de objetos con: noteId, relevance (explicación breve en español), snippet (extracto breve).
Solo devuelve notas que sean genuinamente relevantes. Devuelve máximo 5 resultados. Devuelve SOLO JSON válido, sin otro texto.`,
      messages: [
        {
          role: 'user',
          content: `Here are all the memories:\n${notesContext}\n\nSearch query: "${query}"\n\nReturn matching results as JSON array:`
        }
      ]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return extractJson<SearchResult[]>(text) || []
  } catch (err) {
    console.error('Claude search error:', err)
    throw err
  }
}

// ─── Sentiment Analysis ────────────────────────────────────────────────

export interface SentimentResult {
  tone: string
  emotions: string[]
  summary?: string
}

export async function analyzeSentiment(
  text: string,
  noteType: string
): Promise<SentimentResult> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `Eres un analizador emocional para un muro de memorias compartido entre Marielisa y Mateo.
Analiza el tono emocional del texto dado.
Devuelve JSON con:
- "tone": una palabra en español que describe el tono (ej: "cálido", "reflexivo", "alegre", "nostálgico", "juguetón")
- "emotions": array de 1-3 etiquetas de esta lista: amor, alegría, nostalgia, gratitud, ternura, tristeza, emoción, humor, esperanza, reflexión
${noteType === 'voice' ? '- "summary": resumen de 1 frase del contenido' : ''}
Devuelve SOLO JSON válido.`,
    messages: [
      { role: 'user', content: text }
    ]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return extractJson<SentimentResult>(raw) || { tone: 'neutral', emotions: [] }
}

// ─── Photo Description (Vision) ────────────────────────────────────────

export async function describePhoto(imageUrl: string): Promise<string> {
  const anthropic = getClient()

  // Fetch image and convert to base64
  const res = await fetch(imageUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  const base64 = buffer.toString('base64')
  const contentType = res.headers.get('content-type') || 'image/jpeg'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `Eres un descriptor de fotos para un muro de memorias entre Marielisa y Mateo.
Describe brevemente lo que ves en la foto en español (1-2 oraciones).
Sé cálido y descriptivo pero conciso. Si ves personas, comida, lugares, actividades, menciónalo.
Devuelve SOLO la descripción, sin comillas ni explicación.`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64
            }
          },
          { type: 'text', text: 'Describe esta foto:' }
        ]
      }
    ]
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : 'Foto'
}

// ─── Related Memories ──────────────────────────────────────────────────

export async function findRelatedMemories(
  noteId: string,
  noteText: string,
  allNotes: NoteSearchData[]
): Promise<SearchResult[]> {
  const anthropic = getClient()

  const otherNotes = allNotes.filter((n) => n.id !== noteId)
  if (otherNotes.length === 0) return []

  const notesContext = otherNotes
    .map((n) => `[ID:${n.id}] (${n.type} by ${n.createdBy}, ${n.createdAt}): ${n.searchText}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `Eres un asistente que encuentra conexiones emocionales y temáticas entre recuerdos de Marielisa y Mateo.
Dada una nota específica y una colección de otros recuerdos, encuentra los más relacionados temática o emocionalmente.
Devuelve un array JSON de objetos con: noteId, relevance (explicación breve en español de la conexión), snippet (extracto breve).
Máximo 3 resultados. Solo incluye conexiones genuinas. Devuelve SOLO JSON válido.`,
    messages: [
      {
        role: 'user',
        content: `Nota actual: "${noteText}"\n\nOtros recuerdos:\n${notesContext}\n\nEncuentra recuerdos relacionados:`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return extractJson<SearchResult[]>(text) || []
}

// ─── Memory Summary (Digest) ───────────────────────────────────────────

export interface MemorySummary {
  summary: string
  themes: string[]
  highlight: string
  noteCount: number
}

export async function generateMemorySummary(
  notes: { searchText: string; createdBy: string; createdAt: string; type: string }[],
  period: string
): Promise<MemorySummary> {
  const anthropic = getClient()

  const notesContext = notes
    .map((n) => `(${n.type} by ${n.createdBy}, ${n.createdAt}): ${n.searchText}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: `Eres un narrador cálido que resume los recuerdos compartidos entre Marielisa y Mateo.
Genera un resumen narrativo del período indicado, como si escribieras una carta cariñosa sobre lo que compartieron.
Devuelve JSON con:
- "summary": párrafo narrativo en español (3-5 oraciones, tono cálido y personal)
- "themes": array de 2-4 temas principales (ej: ["viajes", "música", "cocina"])
- "highlight": el momento o recuerdo más especial del período (1 oración)
- "noteCount": número de notas analizadas
Devuelve SOLO JSON válido.`,
    messages: [
      {
        role: 'user',
        content: `Período: ${period}\nNúmero de notas: ${notes.length}\n\nNotas:\n${notesContext}\n\nGenera el resumen:`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return extractJson<MemorySummary>(text) || {
    summary: 'No hay suficientes recuerdos para generar un resumen.',
    themes: [],
    highlight: '',
    noteCount: notes.length
  }
}

// ─── Milestone Detection ───────────────────────────────────────────────

export interface Milestone {
  type: 'anniversary' | 'theme' | 'streak' | 'first'
  title: string
  description: string
  relatedNoteIds?: string[]
}

export async function detectMilestones(
  notes: NoteSearchData[],
  todayStr: string
): Promise<Milestone[]> {
  const anthropic = getClient()

  if (notes.length < 5) return []

  const notesContext = notes
    .map((n) => `[ID:${n.id}] (${n.type} by ${n.createdBy}, ${n.createdAt}): ${n.searchText}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `Eres un detector de momentos especiales para el muro de memorias de Marielisa y Mateo.
Analiza sus notas y detecta hitos, aniversarios, temas recurrentes o momentos dignos de celebrar.
Fecha de hoy: ${todayStr}

Tipos de hitos a buscar:
- "anniversary": fechas significativas que se repiten (ej: "Hace un año compartieron su primer viaje juntos")
- "theme": temas o bromas recurrentes que forman parte de su identidad como pareja
- "streak": rachas de actividad (ej: "Han compartido notas todos los días esta semana")
- "first": primeras veces (ej: "Primera nota de voz", "Primera foto juntos")

Devuelve un array JSON de objetos con:
- "type": tipo del hito
- "title": título corto y celebratorio en español
- "description": descripción cálida en español (1-2 oraciones)
- "relatedNoteIds": array de IDs de notas relacionadas (opcional)

Máximo 3 hitos. Solo incluye hitos genuinos e interesantes. Devuelve SOLO JSON válido.`,
    messages: [
      {
        role: 'user',
        content: `Notas:\n${notesContext}\n\nDetecta hitos y momentos especiales:`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return extractJson<Milestone[]>(text) || []
}

// ─── Gap-Aware Question Topics ─────────────────────────────────────────

export async function detectTopicGaps(
  recentNotes: string[],
  allTopics: string[]
): Promise<string> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `Eres un compañero reflexivo para Marielisa y Mateo.
Analiza sus notas recientes e identifica qué temas emocionales NO han explorado últimamente.
Temas posibles: sueños, miedos, gratitud, recuerdos de infancia, planes futuros, lo que extrañan del otro, música, comida, viajes, familia, trabajo, crecimiento personal.

Genera UNA sola pregunta reflexiva en español que invite a explorar un tema que llevan tiempo sin tocar.
Menciona sutilmente el tema ausente. La pregunta debe ser personal pero no invasiva.
Devuelve SOLO la pregunta, sin explicación ni comillas.`,
    messages: [
      {
        role: 'user',
        content: `Notas recientes:\n${recentNotes.join('\n')}\n\nTemas que ya han tocado recientemente:\n${allTopics.join(', ')}\n\nGenera una pregunta sobre un tema que no han explorado:`
      }
    ]
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
