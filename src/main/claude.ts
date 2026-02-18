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
      model: 'claude-sonnet-4-5-20250929',
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

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (err) {
    console.error('Claude search error:', err)
    throw err
  }
}
