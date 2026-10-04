/*
  The open wall: the renderer built as a plain web page called sticky notes,
  hosted by mateolarreaferro.com at /sticky-notes (npm run build:web, out to
  dist-web). Nothing in it names the private app: the password screen, the
  page title and the song's name are all replaced.
  The Electron app is untouched; this build swaps out everything that reaches
  the private wall:

    lib/firestore-notes        src/web/notes.ts (the host's open-wall API)
    lib/firebase, presence,    src/web/stubs.ts
      storage, questions,
      the password screen
    firebase/*                 src/web/firestore.ts or nothing at all
    window.api (Electron)      src/web/api.ts

  It also reads no .env, so no Firebase config or key can be bundled.
*/
import { resolve } from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const web = (file: string) => resolve(__dirname, 'src/web', file)
const SWAPS: [RegExp, string][] = [
  [/\/lib\/firestore-notes$/, web('notes.ts')],
  [/\/lib\/(firebase|firestore-presence|firebase-storage|firestore-questions)$/, web('stubs.ts')],
  [/\/components\/auth\/PasswordScreen$/, web('stubs.ts')],
  [/^firebase\/firestore$/, web('firestore.ts')]
]

function openWall(): Plugin {
  return {
    name: 'open-wall',
    enforce: 'pre',
    resolveId(source) {
      for (const [pattern, target] of SWAPS) if (pattern.test(source)) return target
      if (/^firebase(\/|$)/.test(source)) throw new Error(`The open wall must not import ${source}`)
      return null
    },
    transform(code, id) {
      // The Electron bridge has to exist before the app's first import runs.
      if (id.endsWith('src/renderer/src/main.tsx')) return `import '${web('api.ts')}'\n${code}`
      // Served from /sticky-notes, where a relative ./audio would miss; the
      // host serves the song as music.mp3, and it goes untitled.
      if (id.endsWith('src/renderer/src/lib/audio.ts')) {
        const out = code.replace(/\{ src: '\.\/audio\/bicho\.wav', title: 'Bicho' \}/, "{ src: '/sticky-notes/audio/music.mp3', title: '' }")
        if (out === code) throw new Error('The song entry in lib/audio.ts changed; update vite.web.config.ts')
        return out
      }
      return null
    },
    transformIndexHtml(html) {
      return html.replace(/<title>.*<\/title>/, '<title>sticky notes</title>')
    }
  }
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: '/sticky-notes/',
  // The music is copied by the host as a compressed mp3; the 140 MB of wav stays out.
  publicDir: false,
  envDir: resolve(__dirname, 'src/web'),
  define: { 'import.meta.env.VITE_PUBLIC_WALL': JSON.stringify('1') },
  plugins: [openWall(), react()],
  build: { outDir: resolve(__dirname, 'dist-web'), emptyOutDir: true }
})
