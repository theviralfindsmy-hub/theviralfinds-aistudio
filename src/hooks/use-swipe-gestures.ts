'use client'

import { useEffect, useRef } from 'react'

export interface SwipeHandlers {
  /** Fired when the user swipes left (finger moves leftward). */
  onSwipeLeft?: () => void
  /** Fired when the user swipes right (finger moves rightward). */
  onSwipeRight?: () => void
  /** Fired when the user swipes up (finger moves upward). */
  onSwipeUp?: () => void
  /** Fired when the user swipes down (finger moves downward). */
  onSwipeDown?: () => void
  /** Minimum distance (px) the finger must travel before a swipe is recognized. Default 50. */
  threshold?: number
  /**
   * Maximum duration (ms) for a swipe gesture. If the touch takes longer than this,
   * it's treated as a slow drag, not a swipe. Default 800.
   */
  maxDuration?: number
  /**
   * If true (default), the hook will call preventDefault on touchmove once a clear
   * swipe direction is detected — preventing the page from scrolling at the same time.
   * Set to false if the element should still scroll vertically (e.g. a long list).
   */
  preventScroll?: boolean
}

/**
 * useSwipeGestures
 * ----------------
 * Attach the returned ref to any element to detect directional swipes on touch devices.
 *
 * The hook:
 *  - Tracks touchstart / touchmove / touchend coordinates
 *  - Calculates the dominant axis (horizontal vs vertical) from the larger delta
 *  - Only fires a handler if the dominant delta exceeds `threshold`
 *  - Calls preventDefault on touchmove (when `preventScroll` is true) once a clear
 *    swipe intent is recognized — this stops the page from scrolling mid-swipe
 *  - Cleans up all listeners on unmount
 *  - Stores handlers in a ref so callbacks can change without re-binding listeners
 *
 * Usage:
 *   const ref = useSwipeGestures({
 *     onSwipeLeft: () => console.log('next'),
 *     onSwipeRight: () => console.log('prev'),
 *     onSwipeUp: () => console.log('open sheet'),
 *   })
 *   return <div ref={ref}>Swipe me</div>
 *
 * Multi-touch is ignored (only single-finger swipes are recognized).
 */
export function useSwipeGestures<T extends HTMLElement = HTMLDivElement>(
  handlers: SwipeHandlers,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null)
  // Keep the latest handlers in a ref so we don't need to re-bind listeners
  const handlersRef = useRef(handlers)
  // Sync the ref inside an effect (never during render) so the latest
  // callbacks are always available to the touch handlers below.
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0
    let startY = 0
    let startT = 0
    let tracking = false
    let decided = false // once true, we know the dominant axis and can preventDefault

    const onTouchStart = (e: TouchEvent) => {
      // Only track single-finger touches
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = Date.now()
      tracking = true
      decided = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return
      const h = handlersRef.current
      // If the consumer didn't ask for preventScroll, do nothing here
      if (h.preventScroll === false) return

      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      const adx = Math.abs(dx)
      const ady = Math.abs(dy)

      // Decide the dominant axis once movement is unambiguous (>8px)
      if (!decided && (adx > 8 || ady > 8)) {
        const horizontal = adx > ady
        const hasHorizontalHandler = !!(h.onSwipeLeft || h.onSwipeRight)
        const hasVerticalHandler = !!(h.onSwipeUp || h.onSwipeDown)
        // Only prevent scroll if there's a handler that matches the dominant axis
        if ((horizontal && hasHorizontalHandler) || (!horizontal && hasVerticalHandler)) {
          decided = true
        }
      }

      // Prevent native scrolling only after we've decided this is a swipe we handle
      if (decided && e.cancelable) {
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      decided = false

      const h = handlersRef.current
      const threshold = h.threshold ?? 50
      const maxDuration = h.maxDuration ?? 800

      const t = e.changedTouches[0]
      if (!t) return

      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const adx = Math.abs(dx)
      const ady = Math.abs(dy)
      const dt = Date.now() - startT

      // Too slow → not a swipe (probably a slow drag for scrolling)
      if (dt > maxDuration) return
      // Not enough travel
      if (adx < threshold && ady < threshold) return

      // Determine dominant axis and fire the appropriate handler
      if (adx > ady) {
        if (dx > 0) h.onSwipeRight?.()
        else h.onSwipeLeft?.()
      } else {
        if (dy > 0) h.onSwipeDown?.()
        else h.onSwipeUp?.()
      }
    }

    const onTouchCancel = () => {
      tracking = false
      decided = false
    }

    // touchstart / touchend are passive (we don't preventDefault on them)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    // touchmove MUST be non-passive so we can call preventDefault
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])

  return ref
}

/**
 * Dispatches a global CustomEvent that the dashboard (or any other page)
 * can listen for. This decouples the swipe source (mobile-nav) from the
 * page that reacts to it — pages don't need to be modified to add a
 * listener; they can opt in later.
 *
 * Event name: `tvf:swipe`
 * Detail:     `{ direction: 'left' | 'right' | 'up' | 'down', page: PageId }`
 */
export function dispatchSwipeEvent(
  direction: 'left' | 'right' | 'up' | 'down',
  page: string,
) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('tvf:swipe', {
      detail: { direction, page },
    }),
  )
}
