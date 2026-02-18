// ---------------------------------------------------------------------------
// Audio engine — background music + synthesized SFX
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

// ── Background music (playlist) ─────────────────────────────────────────────

export interface Track {
  src: string
  title: string
}

const PLAYLIST: Track[] = [
  { src: './audio/bicho.wav', title: 'Bicho' }
  // Add up to 4 more tracks here, e.g.:
  // { src: './audio/song2.wav', title: 'Moonlight' },
]

let currentTrackIndex = 0
let music = new Audio(PLAYLIST[0].src)
music.volume = 0
let musicPlaying = false
let fadeInterval: ReturnType<typeof setInterval> | null = null

/** Fade volume from current level to `target` over `ms` milliseconds. */
function fadeMusicTo(target: number, ms = 2000) {
  if (fadeInterval) clearInterval(fadeInterval)
  const step = 30
  const ticks = ms / step
  const delta = (target - music.volume) / ticks
  let count = 0
  fadeInterval = setInterval(() => {
    count++
    music.volume = Math.min(1, Math.max(0, music.volume + delta))
    if (count >= ticks) {
      music.volume = Math.min(1, Math.max(0, target))
      clearInterval(fadeInterval!)
      fadeInterval = null
    }
  }, step)
}

function setupAutoAdvance() {
  music.onended = () => {
    if (!musicPlaying) return
    skipTrack('next')
  }
}

/** Start background music with a gentle fade-in (call once after auth). */
export function startMusic() {
  if (musicPlaying) return
  music.loop = true
  music.volume = 0
  music.play().catch(() => {})
  fadeMusicTo(0.25, 3000)
  musicPlaying = true
  setupAutoAdvance()
}

/** Toggle mute / unmute. Returns new playing state. */
export function toggleMusic(): boolean {
  if (musicPlaying) {
    fadeMusicTo(0, 600)
    setTimeout(() => music.pause(), 650)
    musicPlaying = false
  } else {
    music.play().catch(() => {})
    fadeMusicTo(0.25, 600)
    musicPlaying = true
  }
  return musicPlaying
}

export function isMusicPlaying(): boolean {
  return musicPlaying
}

/** Skip to next or previous track with a crossfade. */
export function skipTrack(direction: 'next' | 'prev'): Track {
  const wasPlaying = musicPlaying

  // Fade out current
  fadeMusicTo(0, 400)
  setTimeout(() => {
    music.pause()
    music.currentTime = 0
    music.onended = null

    // Advance index
    if (direction === 'next') {
      currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length
    } else {
      currentTrackIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length
    }

    // Load new track
    music = new Audio(PLAYLIST[currentTrackIndex].src)
    music.loop = true
    music.volume = 0
    setupAutoAdvance()

    if (wasPlaying) {
      music.play().catch(() => {})
      fadeMusicTo(0.25, 400)
    }
  }, 450)

  // Return the track we're switching to
  const nextIndex = direction === 'next'
    ? (currentTrackIndex + 1) % PLAYLIST.length
    : (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length
  return PLAYLIST[nextIndex]
}

export function getCurrentTrack(): Track {
  return PLAYLIST[currentTrackIndex]
}

export function getPlaylist(): Track[] {
  return PLAYLIST
}

// ── SFX helpers ─────────────────────────────────────────────────────────────

const SFX_VOLUME = 0.15

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = SFX_VOLUME
) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

// ── Public SFX functions ────────────────────────────────────────────────────

/** Soft ascending chime — note creation. */
export function playSfxCreate() {
  playTone(660, 0.12, 'sine', SFX_VOLUME)
  setTimeout(() => playTone(880, 0.15, 'sine', SFX_VOLUME * 0.8), 80)
}

/** Gentle pop / tap — note selection. */
export function playSfxSelect() {
  playTone(520, 0.08, 'sine', SFX_VOLUME * 0.7)
}

/** Very subtle soft tick — hover. */
export function playSfxHover() {
  playTone(1200, 0.03, 'sine', SFX_VOLUME * 0.25)
}

/** Low descending tone — delete. */
export function playSfxDelete() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25)
  gain.gain.setValueAtTime(SFX_VOLUME, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

/** Soft sweep upward — open panel. */
export function playSfxOpen() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.18)
  gain.gain.setValueAtTime(SFX_VOLUME * 0.6, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.22)
}

/** Light click — toolbar action. */
export function playSfxClick() {
  playTone(800, 0.04, 'square', SFX_VOLUME * 0.3)
}
