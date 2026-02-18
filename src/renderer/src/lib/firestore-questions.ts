import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

const QUESTIONS_COLLECTION = 'daily_questions'

interface DailyQuestionDoc {
  question: string
  date: string
  starterIndex?: number
  createdAt: string
}

function todayId(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function getTodayQuestion(): Promise<DailyQuestionDoc | null> {
  const id = todayId()
  const snap = await getDoc(doc(db, QUESTIONS_COLLECTION, id))
  if (snap.exists()) {
    return snap.data() as DailyQuestionDoc
  }
  return null
}

export async function saveDailyQuestion(
  question: string,
  date: string,
  starterIndex?: number
): Promise<void> {
  await setDoc(doc(db, QUESTIONS_COLLECTION, date), {
    question,
    date,
    starterIndex: starterIndex ?? null,
    createdAt: new Date().toISOString()
  })
}

export async function getPastQuestions(): Promise<{
  dates: string[]
  usedStarterIndices: number[]
}> {
  const snap = await getDocs(collection(db, QUESTIONS_COLLECTION))
  const dates: string[] = []
  const usedStarterIndices: number[] = []

  snap.forEach((doc) => {
    const data = doc.data() as DailyQuestionDoc
    dates.push(data.date)
    if (data.starterIndex != null) {
      usedStarterIndices.push(data.starterIndex)
    }
  })

  return { dates, usedStarterIndices }
}
