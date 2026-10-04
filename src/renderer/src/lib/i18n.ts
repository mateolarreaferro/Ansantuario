import { useAppStore } from '../stores/appStore'
import { PUBLIC_WALL } from './wall'

/*
  The interface's words in English and Spanish. The desktop app is always
  Spanish, so its column must keep the desktop's own wording; where the open
  wall (sticky notes) says something different, PUBLIC_WALL picks it here
  rather than in the components.
*/

export type Lang = 'en' | 'es'

const es = {
  title: 'sticky notes',
  tagline: 'Un muro donde cualquiera puede dejar una nota.',
  // Non-breaking spaces keep the button's name on one line.
  step1: 'Haz doble clic en cualquier lugar, o pulsa "+\u00a0dejar\u00a0una\u00a0nota".',
  step2: 'Escribe lo que quieras. Firma con tu nombre o quédate anónimo.',
  step3: 'Arrastra el muro para moverte. Usa la rueda o pellizca para acercar.',
  step4: 'Solo tú puedes cambiar o borrar tus notas. Cualquiera puede responder o reaccionar.',
  step5: 'El botón de la nota musical enciende o apaga la música.',
  enter: 'entrar',
  howItWorks: 'cómo funciona',
  intro: 'Un muro abierto. Deja una nota con doble clic en cualquier lugar, o aquí abajo.',
  count: ' Ya hay {n}.',
  signAs: 'firmar como',
  anonymous: 'anónimo',
  nameLabel: 'Tu nombre, opcional',
  nameHelp: 'Opcional. Vacío, tus notas quedan anónimas.',
  addNote: '+ dejar una nota',
  moderating: 'Modo moderación: puedes borrar cualquier nota.',
  publishFailed: 'No se pudo publicar la nota.',
  placeholder: PUBLIC_WALL ? 'Deja algo aquí...' : 'Cuéntame todo...',
  emptyTitle: 'No te guardes nada',
  emptyHint: 'Haz clic derecho o doble clic en cualquier lugar para dejar una nota',
  sortFree: 'Libre',
  sortRecent: 'Recientes',
  sortOldest: 'Antiguas',
  sortMine: 'Mías',
  sortTheirs: PUBLIC_WALL ? 'De otros' : 'Suyas',
  sortFavorites: 'Favoritas',
  color: 'Color',
  size: 'Tamaño',
  record: 'Grabar voz',
  photo: 'Agregar foto',
  reply: 'Responder',
  delete: 'Eliminar',
  confirmDelete: '¿Eliminar?',
  yes: 'Sí',
  no: 'No',
  previous: 'Anterior',
  next: 'Siguiente',
  play: PUBLIC_WALL ? 'Poner música' : 'Reproducir',
  pause: PUBLIC_WALL ? 'Quitar música' : 'Pausar',
  lightMode: 'Modo claro',
  darkMode: 'Modo oscuro',
  search: 'Buscar',
  zoomIn: 'Acercar',
  zoomReset: 'Restablecer vista',
  zoomOut: 'Alejar',
  searchTitle: PUBLIC_WALL ? 'Buscar notas' : 'Buscar Recuerdos',
  searchPlaceholder: '¿Qué estás buscando?',
  searchFocusOn: 'Mostrando solo coincidencias',
  searchFocusOff: 'Enfocar en coincidencias',
  searching: 'Buscando...',
  searchNone: PUBLIC_WALL ? 'No se encontraron notas' : 'No se encontraron recuerdos',
  searchHint: PUBLIC_WALL ? 'Busca una palabra en las notas...' : 'Pregunta sobre tus recuerdos...',
  searchHintMore: 'Las notas que coincidan brillarán en el lienzo',
  heart: 'amor',
  smile: 'sonrisa',
  flame: 'fuego',
  sparkle: 'chispa',
  abrazo: 'abrazo',
  teardrop: 'lágrima'
}

export type Key = keyof typeof es

const en: Record<Key, string> = {
  title: 'sticky notes',
  tagline: 'A wall anyone can leave a note on.',
  step1: 'Double-click anywhere, or press "+\u00a0leave\u00a0a\u00a0note".',
  step2: 'Write anything. Sign with your name or stay anonymous.',
  step3: 'Drag the wall to move around. Scroll or pinch to zoom.',
  step4: 'Only you can change or delete your notes. Anyone can reply or react.',
  step5: 'The music note button turns the music on or off.',
  enter: 'enter',
  howItWorks: 'how it works',
  intro: 'An open wall. Double-click anywhere to leave a note, or use the button below.',
  count: ' {n} so far.',
  signAs: 'sign as',
  anonymous: 'anonymous',
  nameLabel: 'Your name, optional',
  nameHelp: 'Optional. Left empty, your notes stay anonymous.',
  addNote: '+ leave a note',
  moderating: 'Moderation on: you can delete any note.',
  publishFailed: 'Could not post the note.',
  placeholder: 'Leave something here...',
  emptyTitle: 'Say anything',
  emptyHint: 'Double-click or right-click anywhere to leave a note',
  sortFree: 'Free',
  sortRecent: 'Newest',
  sortOldest: 'Oldest',
  sortMine: 'Mine',
  sortTheirs: 'Others',
  sortFavorites: 'Favorites',
  color: 'Color',
  size: 'Size',
  record: 'Record voice',
  photo: 'Add photo',
  reply: 'Reply',
  delete: 'Delete',
  confirmDelete: 'Delete?',
  yes: 'Yes',
  no: 'No',
  previous: 'Previous',
  next: 'Next',
  play: 'Play music',
  pause: 'Stop music',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',
  search: 'Search',
  zoomIn: 'Zoom in',
  zoomReset: 'Reset view',
  zoomOut: 'Zoom out',
  searchTitle: 'Search notes',
  searchPlaceholder: 'What are you looking for?',
  searchFocusOn: 'Showing matches only',
  searchFocusOff: 'Focus on matches',
  searching: 'Searching...',
  searchNone: 'No notes found',
  searchHint: 'Look for a word in the notes...',
  searchHintMore: 'Matching notes glow on the wall',
  heart: 'love',
  smile: 'smile',
  flame: 'fire',
  sparkle: 'sparkle',
  abrazo: 'hug',
  teardrop: 'tear'
}

const STRINGS: Record<Lang, Record<Key, string>> = { en, es }

function fill(text: string, vars?: Record<string, string | number>): string {
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : text
}

/** The words in the current language, outside React (re-read on every call). */
export function tr(key: Key, vars?: Record<string, string | number>): string {
  return fill(STRINGS[useAppStore.getState().lang][key], vars)
}

/** The words in the current language; the component re-renders when it changes. */
export function useT(): (key: Key, vars?: Record<string, string | number>) => string {
  const lang = useAppStore((s) => s.lang)
  return (key, vars) => fill(STRINGS[lang][key], vars)
}
