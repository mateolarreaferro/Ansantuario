import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { addNote, deleteNote, updateNoteContent, bringToFront } from '../lib/firestore-notes'

export function useNotes() {
  const { notes, identity, viewport, selectedNoteId, setSelectedNoteId } = useAppStore()

  const createNoteAt = useCallback(
    async (clientX: number, clientY: number) => {
      if (!identity) return

      const container = document.getElementById('canvas-container')
      if (!container) return
      const rect = container.getBoundingClientRect()

      const worldX = (clientX - rect.left - viewport.x) / viewport.scale
      const worldY = (clientY - rect.top - viewport.y) / viewport.scale

      const id = await addNote('text', identity, { x: worldX - 120, y: worldY - 30 })
      setSelectedNoteId(id)

      // Focus the textarea after render
      setTimeout(() => {
        const el = document.querySelector(`#note-${id} textarea`) as HTMLTextAreaElement | null
        el?.focus()
      }, 50)
    },
    [identity, viewport, setSelectedNoteId]
  )

  const removeNote = useCallback(
    (id: string) => {
      deleteNote(id)
      if (selectedNoteId === id) setSelectedNoteId(null)
    },
    [selectedNoteId, setSelectedNoteId]
  )

  const selectNote = useCallback(
    (id: string) => {
      setSelectedNoteId(id)
      bringToFront(id)
    },
    [setSelectedNoteId]
  )

  const deselectNote = useCallback(() => {
    setSelectedNoteId(null)
  }, [setSelectedNoteId])

  return {
    notes,
    selectedNoteId,
    createNoteAt,
    removeNote,
    selectNote,
    deselectNote,
    updateContent: updateNoteContent
  }
}
