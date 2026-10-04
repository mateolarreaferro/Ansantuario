import { useState, useRef, useEffect } from 'react'
import { updateNoteContent, updateNote, updateNoteLink, canModify } from '../../lib/firestore-notes'
import { PUBLIC_WALL } from '../../lib/wall'
import type { TextNote as TextNoteType } from '../../types/note'

const URL_REGEX = /^https?:\/\/[^\s]+$/

interface TextNoteProps {
  note: TextNoteType
  isSelected: boolean
}

export default function TextNote({ note, isSelected }: TextNoteProps) {
  const [content, setContent] = useState(note.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isSelected) setContent(note.content)
  }, [note.content, isSelected])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [content])

  useEffect(() => {
    if (isSelected) {
      // Small delay so pointer-events switch takes effect first
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isSelected])

  const handleChange = (value: string) => {
    setContent(value)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateNoteContent(note.id, value)
    }, 300)
  }

  const editable = canModify(note)

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (PUBLIC_WALL) return
    const text = e.clipboardData.getData('text/plain').trim()
    if (URL_REGEX.test(text) && !content.trim()) {
      e.preventDefault()
      try {
        updateNote(note.id, { type: 'link', url: text, preview: {}, searchText: text } as any)
        const preview = await window.api.link.preview(text)
        updateNoteLink(note.id, text, preview)
      } catch {
        handleChange(text)
      }
    }
  }

  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (content !== note.content) {
      updateNoteContent(note.id, content)

      // AI: analyze sentiment in background when content is substantial
      if (!PUBLIC_WALL && content.trim().length >= 20) {
        ;(window as any).api.ai.analyzeSentiment(content, 'text')
          .then((sentiment: any) => {
            if (sentiment) {
              updateNote(note.id, { sentiment } as any)
            }
          })
          .catch((err: any) => console.error('Sentiment analysis failed:', err))
      }
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => handleChange(e.target.value)}
      onPaste={handlePaste}
      onBlur={handleBlur}
      onPointerDown={(e) => e.stopPropagation()}
      readOnly={!editable}
      maxLength={PUBLIC_WALL ? 1000 : undefined}
      placeholder={PUBLIC_WALL ? 'Deja algo aquí...' : 'Cuéntame todo...'}
      style={{
        width: '100%',
        minHeight: 40,
        background: 'transparent',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.6,
        color: 'var(--text)',
        cursor: editable ? 'text' : 'default',
        fontFamily: 'var(--font-body)'
      }}
    />
  )
}
