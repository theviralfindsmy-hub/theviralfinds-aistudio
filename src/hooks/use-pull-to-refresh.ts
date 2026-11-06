'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PullToRefreshOptions {
  /** Distance (px) the user must pull before a refresh triggers. Default 70. */
  threshold?: number
  /** Maximum visual pull distance (px). Default 90. */
  maxPull?: number
  /** Dampening factor (0–1) — lower = harder to pull. Default 0.5. */
  resistance?: number
  /** Only enable on touch devices. Default true. */
  touchOnly?: boolean
}

interface PullToRefreshResult {
  /** Current pull distance in px (already damped). 0 when at rest. */
  pullDistance: number
  /** True while the refresh callback is running. */
  isRefreshing: boolean
  /** True while the user is actively pulling (for showing hint UI). */
  isPulling: boolean
  /** 0–1 progress toward the threshold. */
  progress: number
}

/**
 * usePullToRefresh
 * ------------------
 * Adds native-style pull-to-refresh to a page on mobile.
 *
 * Usage:
 *   const { pullDistance, isRefreshing, progress } = usePullToRefresh(async () => {
 *     await refetch()
 *   })
 *
 *   return (
 *     <div style={{ transform: `translateY(${pullDistance}px)` }}>
 *       <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
 *       {children}
 *     </div>
 *   )
 *
 * The hook only triggers when:
 *   - The window is scrolled to the very top (window.scrollY === 0)
 *   - The user is dragging downward
 *   - The touch started at scrollY === 0
 *
 * This avoids hijacking normal scroll-to-top gestures.
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: PullToRefreshOptions = {}
): PullToRefreshResult {
  const {
    threshold = 70,
    maxPull = 90,
    resistance = 0.5,
    touchOnly = true,
  } = options

  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  // Latest callback kept in a ref so we don't re-bind listeners on every render
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Don't start a new pull while a refresh is in progress
      if (isRefreshing) return
      // Only start pulling when at the very top of the page
      if (window.scrollY > 0) return
      // Ignore multi-touch
      if (e.touches.length !== 1) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
      setIsPulling(true)
    },
    [isRefreshing]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pullingRef.current) return
      const currentY = e.touches[0].clientY
      const distance = currentY - startYRef.current
      if (distance <= 0) {
        // User is scrolling up — reset state, let normal scroll happen
        if (pullDistance > 0) setPullDistance(0)
        return
      }
      // Dampen the pull so it feels like rubber-banding
      const damped = Math.min(distance * resistance, maxPull)
      setPullDistance(damped)
      // Prevent the browser's native pull-to-refresh only once we're clearly pulling
      if (damped > 4 && window.scrollY === 0) {
        e.preventDefault?.()
      }
    },
    [maxPull, resistance, pullDistance]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) {
      setPullDistance(0)
      setIsPulling(false)
      return
    }
    pullingRef.current = false
    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      // Snap to a "refreshing" position (small fixed offset so the spinner is visible)
      setPullDistance(48)
      try {
        await onRefreshRef.current()
      } catch (err) {
        console.warn('[pull-to-refresh] refresh callback threw:', err)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Animate back to 0
      setPullDistance(0)
    }
  }, [pullDistance, threshold, isRefreshing])

  useEffect(() => {
    if (touchOnly && typeof window !== 'undefined') {
      // Coarse pointer = touch / mobile. Skip on devices with only a mouse.
      const mq = window.matchMedia('(pointer: coarse)')
      if (!mq.matches) return
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    // touchmove MUST be non-passive to call preventDefault — but we only call it
    // conditionally. Marking passive:false is required for that.
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, touchOnly])

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    progress: Math.min(pullDistance / threshold, 1),
  }
}
