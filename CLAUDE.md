# Ansantuario

Shared memory wall for two people. Electron + React 19 + Firebase + Claude AI.

## Build & Run

```bash
npm install
npm run dev          # development
npm run build:mac    # production .dmg
```

Build tool is `electron-vite` (not plain vite). Three entry points: main, preload, renderer.

## Architecture

- `src/main/` — Electron main process. AI calls (Claude, Groq) happen here, exposed via IPC.
- `src/preload/index.ts` — IPC bridge. All `window.api.*` methods are defined here.
- `src/renderer/` — React 19 app. State via Zustand (`stores/appStore.ts`). Real-time sync via Firestore.

### AI Pipeline

All AI runs in the main process (`src/main/claude.ts`):
- **Search**: semantic memory search via Claude
- **Sentiment**: analyzes tone + emotions for each note
- **Photo descriptions**: Claude Vision auto-describes uploaded images
- **Related memories**: finds thematically connected notes
- **Memory summaries**: weekly narrative digest
- **Milestone detection**: anniversaries, streaks, recurring themes
- **Gap-aware questions**: detects underrepresented topics for daily prompts
- **Voice transcription**: Groq Whisper in `src/main/whisper.ts`

IPC handlers in `src/main/ipc-handlers.ts` bridge main ↔ renderer.

### Key Types

- `Note` (4 variants: text, voice, link, photo) in `src/renderer/src/types/note.ts`
- `NoteSentiment` — tone + emotion tags + optional summary
- `UserIdentity` — `'marielisa' | 'mateo'`

### Data

Firebase collections: `notes`, `daily_questions`, `presence`
Firebase Storage: audio files, images

## Environment

API keys via `.env` (gitignored). See `.env.example`. Renderer vars use `VITE_` prefix, main process vars use `MAIN_VITE_` prefix.

## Style

- Language: TypeScript throughout, Spanish-language UI and prompts
- CSS: custom properties in `globals.css`, no CSS framework
- Components: functional React, hooks-based
- State: Zustand with selectors
