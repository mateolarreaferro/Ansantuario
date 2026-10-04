/*
  The open wall: the renderer built as a plain web page, hosted by
  mateolarreaferro.com at /ansantuario (npm run build:web, out to dist-web).
  The Electron app is untouched; this build swaps out everything that reaches
  the private wall:

    lib/firestore-notes        src/web/notes.ts (the host's open-wall API)
    lib/firebase, presence,    src/web/stubs.ts
      storage, questions
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
      // Served from /ansantuario, where a relative ./audio would miss.
      if (id.endsWith('src/renderer/src/lib/audio.ts')) return code.replaceAll("'./audio/bicho.wav'", "'/ansantuario/audio/bicho.mp3'")
      return null
    }
  }
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: '/ansantuario/',
  // The music is copied by the host as a compressed mp3; the 140 MB of wav stays out.
  publicDir: false,
  envDir: resolve(__dirname, 'src/web'),
  define: { 'import.meta.env.VITE_PUBLIC_WALL': JSON.stringify('1') },
  plugins: [openWall(), react()],
  build: { outDir: resolve(__dirname, 'dist-web'), emptyOutDir: true }
})
