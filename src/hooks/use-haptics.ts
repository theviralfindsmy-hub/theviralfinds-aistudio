'use client'

import { useMemo } from 'react'

/**
 * useHaptics
 * ----------
 * Wraps the Vibration API to provide native-app-style haptic feedback.
 *
 * - `light()`     → 10ms tap (tab switches, button presses)
 * - `medium()`    → 20ms tap (FAB open, swipe gestures)
 * - `heavy()`     → 50ms tap (drawer open/close, modals)
 * - `success()`   → pattern [10,30,10] (milestone achievements, saves)
 * - `error()`     → pattern [50,30,50] (failures, deletions)
 * - `selection()` → 8ms tick (snap point changes, segment switches)
 *
 * On devices without Vibration API (iOS Safari, desktop browsers), every
 * method gracefully no-ops — no errors, no console warnings.
 *
 * The returned object is memoized so consumers can safely include it in
 * `useEffect` dependency arrays without triggering re-runs.
 *
 * Usage:
 *   const haptics = useHaptics()
 *   <button onClick={haptics.light}>Tap me</button>
 */
export function useHaptics() {
  return useMemo(() => {
    // Cache the support check so we don't re-evaluate on every call.
    const supported =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'

    const vibrate = (pattern: number | number[]) => {
      if (!supported) return
      try {
        navigator.vibrate!(pattern)
      } catch {
        // Silently ignore — some browsers throw on certain patterns
      }
    }

    return {
      light: () => vibrate(10),
      medium: () => vibrate(20),
      heavy: () => vibrate(50),
      success: () => vibrate([10, 30, 10]),
      error: () => vibrate([50, 30, 50]),
      selection: () => vibrate(8),
      /** Is the Vibration API available on this device? */
      isSupported: supported,
    }
  }, [])
}

export type HapticsApi = ReturnType<typeof useHaptics>
