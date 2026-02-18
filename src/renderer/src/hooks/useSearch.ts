import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

interface SearchResult {
  noteId: string
  relevance: string
  snippet: string
}

function localSearch(query: string, notes: { id: string; searchText: string; createdBy: string }[]): SearchResult[] {
  const q = query.toLowerCase()
  return notes
    .filter((n) => n.searchText && n.searchText.toLowerCase().includes(q))
    .map((n) => ({
      noteId: n.id,
      relevance: `Contiene "${query}"`,
      snippet: n.searchText.slice(0, 100)
    }))
    .slice(0, 5)
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const notes = useAppStore((s) => s.notes)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    (q: string) => {
      setQuery(q)
      setError('')

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (!q.trim()) {
        setResults([])
        return
      }

      // Instant local search first
      const localResults = localSearch(
        q,
        notes.map((n) => ({ id: n.id, searchText: n.searchText, createdBy: n.createdBy }))
      )
      setResults(localResults)

      // Then try AI search (with debounce)
      debounceRef.current = setTimeout(async () => {
        const notesData = notes
          .filter((n) => n.searchText)
          .map((n) => ({
            id: n.id,
            type: n.type,
            searchText: n.searchText,
            createdBy: n.createdBy,
            createdAt: new Date(
              (n.createdAt as any)?.seconds ? (n.createdAt as any).seconds * 1000 : Date.now()
            ).toLocaleDateString()
          }))

        if (notesData.length === 0) return

        setIsSearching(true)
        try {
          const aiResults = await window.api.search.memories(q, notesData)
          if (aiResults && aiResults.length > 0) {
            setResults(aiResults)
          }
        } catch (err: any) {
          console.error('AI search failed, using local results:', err)
          setError('Búsqueda IA no disponible — mostrando coincidencias de texto')
        } finally {
          setIsSearching(false)
        }
      }, 800)
    },
    [notes]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError('')
  }, [])

  return { query, results, isSearching, error, search, clearSearch }
}
