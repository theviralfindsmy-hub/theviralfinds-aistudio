/**
 * useCountUp — animates a number from its previous value → target over
 * `duration` ms using an ease-out cubic curve. Respects prefers-reduced-motion
 * (returns the target immediately when `enabled` is false).
 *
 * All setState calls happen inside rAF / setTimeout callbacks (never
 * synchronously inside the effect body) so it complies with the project's
 * `react-hooks/set-state-in-effect` lint rule.
 *
 * Usage:
 *   const value = useCountUp(12694, { duration: 1500 })
 *   // then format with formatCountUp(value, { prefix: 'RM ' })
 */
'use client'

import { useEffect, useRef, useState } from 'react'

export interface UseCountUpOptions {
  /** Animation duration in milliseconds. Default 1500. */
  duration?: number
  /** Number of decimal places to round to during animation. Default 0. */
  decimals?: number
  /** When false, jumps to target immediately (e.g. reduced motion). Default true. */
  enabled?: boolean
  /** Delay before the animation starts (ms). Default 0. */
  startDelay?: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(
  target: number,
  {
    duration = 1500,
    decimals = 0,
    enabled = true,
    startDelay = 0,
  }: UseCountUpOptions = {}
): number {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const rafRef = useRef<number | null>(null)
  // Track the latest displayed value in a ref so the next animation can start
  // from where the last one left off (smooth re-targeting) without reading
  // state inside the effect (which would re-trigger it).
  const displayRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return // caller should fall back to `target` directly

    const startVal = displayRef.current
    const delta = target - startVal

    // No animation needed if value hasn't changed.
    if (delta === 0) return

    let cancelled = false
    let startTime: number | null = null

    const tick = (timestamp: number) => {
      if (cancelled) return
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = startVal + delta * eased
      const rounded =
        decimals === 0
          ? Math.round(current)
          : Number(current.toFixed(decimals))
      displayRef.current = rounded
      setDisplayValue(rounded)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        displayRef.current = target
        setDisplayValue(target)
      }
    }

    const timeoutId = setTimeout(() => {
      if (cancelled) return
      rafRef.current = requestAnimationFrame(tick)
    }, startDelay)

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(timeoutId)
    }
  }, [target, duration, decimals, enabled, startDelay])

  return enabled ? displayValue : target
}

/**
 * formatCountUp — helper to render an animated number with thousand separators,
 * optional prefix (e.g. "RM ") and suffix (e.g. "%").
 */
export function formatCountUp(
  value: number,
  {
    prefix = '',
    suffix = '',
    decimals = 0,
  }: { prefix?: string; suffix?: string; decimals?: number } = {}
): string {
  const fixed = value.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const withSep = Number(intPart).toLocaleString('en-MY')
  return `${prefix}${withSep}${decPart ? '.' + decPart : ''}${suffix}`
}
