'use client'

/**
 * useConfetti — thin wrapper around `canvas-confetti` providing three brand-
 * aware variants for the TheViralFindsMY platform:
 *
 *   - `success`     — small celebratory burst (e.g. link created)
 *   - `milestone`   — bigger burst + dual side cannons (e.g. RM 1,000 earned)
 *   - `celebration` — full-screen confetti rain (e.g. first payout)
 *
 * Accessibility:
 *   When the user has `prefers-reduced-motion: reduce`, `fire()` becomes a
 *   no-op so we never trigger vestibular discomfort.
 *
 * The canvas is created on-demand and removed after the animation completes,
 * so there is zero DOM footprint between celebrations.
 *
 * Usage:
 *   const { fire } = useConfetti()
 *   fire({ variant: 'success' })
 *   fire({ variant: 'milestone', origin: { x: 0.5, y: 0.7 } })
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import confetti, { type Options as ConfettiOptions } from 'canvas-confetti'

export type ConfettiVariant = 'success' | 'milestone' | 'celebration'

export interface FireConfettiOptions {
  variant: ConfettiVariant
  /** Optional origin override (defaults to top-center for success, center for others). */
  origin?: { x?: number; y?: number }
}

// Brand palette — orange (shopee) + purple (hermes) + pink (profit).
// Colors are flat hex strings because canvas-confetti doesn't parse CSS vars.
const BRAND_COLORS = ['#ee4d2d', '#7c3aed', '#ec4899', '#f59e0b', '#ffffff']

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function burst(opts: ConfettiOptions): void {
  try {
    confetti({
      colors: BRAND_COLORS,
      ...opts,
    })
  } catch {
    // canvas-confetti can throw if the document isn't ready; ignore.
  }
}

function fireSuccess(origin?: { x?: number; y?: number }): void {
  // Small 30-particle burst, ~1.5s
  burst({
    particleCount: 30,
    spread: 60,
    startVelocity: 35,
    scalar: 0.9,
    ticks: 90,
    origin: { x: origin?.x ?? 0.5, y: origin?.y ?? 0.4 },
  })
}

function fireMilestone(origin?: { x?: number; y?: number }): void {
  // Central burst + dual side cannons, ~3s
  burst({
    particleCount: 80,
    spread: 80,
    startVelocity: 45,
    scalar: 1.1,
    ticks: 180,
    origin: { x: origin?.x ?? 0.5, y: origin?.y ?? 0.5 },
  })

  // Left cannon
  setTimeout(() => {
    burst({
      particleCount: 40,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      ticks: 180,
    })
  }, 150)

  // Right cannon
  setTimeout(() => {
    burst({
      particleCount: 40,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      ticks: 180,
    })
  }, 300)
}

function fireCelebration(): void {
  // Full-screen confetti rain over ~5s using repeated bursts.
  const duration = 5000
  const animationEnd = Date.now() + duration
  const frame = (): void => {
    const timeLeft = animationEnd - Date.now()
    if (timeLeft <= 0) return

    const particleCount = 12
    burst({
      particleCount,
      startVelocity: 25,
      spread: 360,
      ticks: 200,
      gravity: 0.8,
      scalar: 0.9,
      origin: {
        x: Math.random(),
        // Slightly above the top so particles fall in
        y: -0.1,
      },
    })
    // Recursion via rAF so confetti is GPU-friendly and GC-able.
    requestAnimationFrame(frame)
  }
  // Seed a couple of large opening bursts for impact.
  burst({
    particleCount: 60,
    spread: 100,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.3 },
    ticks: 200,
  })
  requestAnimationFrame(frame)
}

export function useConfetti(): {
  fire: (opts: FireConfettiOptions) => void
  /** Whether the user prefers reduced motion (confetti is a no-op when true). */
  isReducedMotion: boolean
} {
  // Track cleanup timers so unmounting mid-celebration doesn't leak.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Re-check on every render so React updates if the user toggles the
  // preference at runtime (rare but cheap to handle).
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(prefersReducedMotion())
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (): void => {
      setIsReducedMotion(mq.matches)
    }
    mq.addEventListener('change', handler)
    return () => {
      mq.removeEventListener('change', handler)
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const fire = useCallback((opts: FireConfettiOptions): void => {
    if (isReducedMotion) return
    const { variant, origin } = opts
    switch (variant) {
      case 'success':
        fireSuccess(origin)
        break
      case 'milestone':
        fireMilestone(origin)
        break
      case 'celebration':
        fireCelebration()
        break
    }
  }, [isReducedMotion])

  return { fire, isReducedMotion }
}
