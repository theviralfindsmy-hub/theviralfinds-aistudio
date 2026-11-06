/**
 * Notification sound effects via Web Audio API.
 *
 * Uses a single shared AudioContext (lazily created on first user gesture
 * to comply with browser autoplay policies). No external audio files needed.
 *
 * Each event type has a distinct tone profile so users can recognise
 * conversions vs clicks vs HERMES insights without looking at the screen.
 */

type SoundType = 'conversion' | 'click' | 'commission_xtra' | 'hermes_insight' | 'notification'

let ctx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx && ctx.state !== 'closed') return ctx
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

/** Mute/unmute all notification sounds (e.g. from Settings page). */
export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem('tvf_realtime_muted', value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  if (muted) return true
  try {
    return localStorage.getItem('tvf_realtime_muted') === '1'
  } catch {
    return false
  }
}

// Initialise mute state from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    muted = localStorage.getItem('tvf_realtime_muted') === '1'
  } catch {
    /* ignore */
  }
}

interface ToneSpec {
  freq: number
  duration: number
  type: OscillatorType
  gain: number
  // optional second tone for richer sound
  second?: { freq: number; delay: number; duration: number; type: OscillatorType; gain: number }
}

const SOUND_PRESETS: Record<SoundType, ToneSpec> = {
  // Cheerful rising two-tone (commission earned!)
  conversion: {
    freq: 880,
    duration: 0.18,
    type: 'sine',
    gain: 0.18,
    second: { freq: 1320, delay: 0.12, duration: 0.22, type: 'sine', gain: 0.16 },
  },
  // Soft single blip
  click: {
    freq: 660,
    duration: 0.08,
    type: 'triangle',
    gain: 0.1,
  },
  // Bright triple-bell (XTRA alert)
  commission_xtra: {
    freq: 988,
    duration: 0.12,
    type: 'square',
    gain: 0.12,
    second: { freq: 1318, delay: 0.1, duration: 0.18, type: 'sine', gain: 0.12 },
  },
  // Warm low chime (HERMES speaks)
  hermes_insight: {
    freq: 523,
    duration: 0.22,
    type: 'sine',
    gain: 0.14,
    second: { freq: 784, delay: 0.14, duration: 0.18, type: 'sine', gain: 0.12 },
  },
  // Default gentle ping
  notification: {
    freq: 740,
    duration: 0.15,
    type: 'sine',
    gain: 0.12,
  },
}

function playTone(spec: ToneSpec, audioCtx: AudioContext, startAt: number) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = spec.type
  osc.frequency.value = spec.freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(spec.gain, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + spec.duration)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start(startAt)
  osc.stop(startAt + spec.duration + 0.02)

  if (spec.second) {
    const osc2 = audioCtx.createOscillator()
    const gain2 = audioCtx.createGain()
    osc2.type = spec.second.type
    osc2.frequency.value = spec.second.freq
    const t2 = startAt + spec.second.delay
    gain2.gain.setValueAtTime(0, t2)
    gain2.gain.linearRampToValueAtTime(spec.second.gain, t2 + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + spec.second.duration)
    osc2.connect(gain2).connect(audioCtx.destination)
    osc2.start(t2)
    osc2.stop(t2 + spec.second.duration + 0.02)
  }
}

export function playNotificationSound(type: SoundType): void {
  if (isMuted()) return
  if (typeof window === 'undefined') return
  const audioCtx = getCtx()
  if (!audioCtx) return

  // Browsers require a user gesture to start AudioContext.
  // If suspended, attempt to resume; if it fails, the user simply won't hear
  // the first sound until they interact with the page.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      /* swallow — sound is best-effort */
    })
  }

  const spec = SOUND_PRESETS[type] || SOUND_PRESETS.notification
  try {
    playTone(spec, audioCtx, audioCtx.currentTime)
  } catch {
    /* ignore — sound is best-effort */
  }
}
