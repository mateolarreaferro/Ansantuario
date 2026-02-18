import { useState, useEffect } from 'react'
import { getTodayQuestion, saveDailyQuestion, getPastQuestions } from '../lib/firestore-questions'
import { useAppStore } from '../stores/appStore'

const DISMISSED_KEY = 'daily-question-dismissed'

export function useDailyQuestion() {
  const [question, setQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(DISMISSED_KEY) === 'true'
  })
  const notes = useAppStore((s) => s.notes)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Check if today's question already exists
        const existing = await getTodayQuestion()
        if (existing) {
          if (!cancelled) {
            setQuestion(existing.question)
            setLoading(false)
          }
          return
        }

        // Fetch past usage to avoid repeats
        const { usedStarterIndices } = await getPastQuestions()

        // Build notes context for personalized question generation
        const notesContext = notes
          .filter((n) => n.searchText)
          .slice(-30)
          .map((n) => n.searchText)

        // Ask main process to generate/pick a question
        const result = await (window as any).api.question.daily(
          usedStarterIndices,
          notesContext
        )

        if (!cancelled && result.question) {
          const today = new Date()
          const dateId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

          // Save to Firestore so both users see the same question
          await saveDailyQuestion(result.question, dateId, result.starterIndex)
          setQuestion(result.question)
        }
      } catch (err) {
        console.error('Daily question error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, 'true')
  }

  return { question, loading, dismissed, dismiss }
}
