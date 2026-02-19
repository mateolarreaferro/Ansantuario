import { useState, useEffect } from 'react'
import { getTodayQuestion, saveDailyQuestion, getPastQuestions } from '../lib/firestore-questions'
import { useAppStore } from '../stores/appStore'

function todayId(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function useDailyQuestion() {
  const identity = useAppStore((s) => s.identity)
  const dateId = todayId()
  const dismissedKey = `daily-question-dismissed-${dateId}`

  const [question, setQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [answeredByMe, setAnsweredByMe] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(dismissedKey) === 'true'
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
            // Check if current user already answered
            if (identity && existing.answeredBy?.includes(identity)) {
              setAnsweredByMe(true)
            }
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
    sessionStorage.setItem(dismissedKey, 'true')
  }

  return { question, loading, dismissed, dismiss, answeredByMe, setAnsweredByMe, dateId }
}
