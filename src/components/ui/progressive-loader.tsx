'use client'

import { ReactNode, Suspense, useEffect, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * ProgressiveLoader
 * ------------------
 * Wraps multiple sections of a page and reveals them progressively, so the
 * above-the-fold content appears instantly and lower sections fade in a beat
 * later. This makes the page feel fast even when some data is slow.
 *
 * Strategy:
 *   - Each child is wrapped in a Suspense boundary with a skeleton fallback.
 *   - Sections appear staggered: section 1 immediate, section 2 after `delay`,
 *     section 3 after 2×`delay`, etc.
 *   - Use `<ProgressiveSection>` directly to control the fallback skeleton, or
 *     pass plain children to `<ProgressiveLoader>` for the default skeleton.
 *
 * @example
 *   <ProgressiveLoader>
 *     <KPIs />            {/* appears immediately  *\/}
 *     <Charts />          {/* appears 100ms later  *\/}
 *     <ActivityFeed />    {/* appears 200ms later *\/}
 *   </ProgressiveLoader>
 */

export interface ProgressiveLoaderProps {
  /** Sections to reveal progressively. Each child becomes one section. */
  children: ReactNode[]
  /** Delay (ms) between revealing each section. Defaults to 100. */
  delay?: number
  /** Extra className on the wrapper. */
  className?: string
}

export function ProgressiveLoader({
  children,
  delay = 100,
  className,
}: ProgressiveLoaderProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children.map((child, index) => (
        <ProgressiveSection
          key={index}
          index={index}
          delay={delay}
        >
          {child}
        </ProgressiveSection>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface ProgressiveSectionProps {
  children: ReactNode
  /** Zero-based position in the parent — controls reveal delay. */
  index: number
  /** Delay (ms) between sections. Defaults to 100. */
  delay?: number
  /** Skeleton shown while the child suspends. Defaults to a 96px block. */
  fallback?: ReactNode
  /** Wrapper className. */
  className?: string
}

/**
 * Single progressive section. Reveals its child after `index × delay` ms.
 * If the child suspends (e.g. still loading data), the skeleton fallback is
 * shown instead — and once it resolves, the child fades in.
 */
export function ProgressiveSection({
  children,
  index,
  delay = 100,
  fallback,
  className,
}: ProgressiveSectionProps) {
  const reduceMotion = useReducedMotion()
  // `revealed` flips true after the stagger delay — gated so we don't render
  // the child until its "turn".
  const [revealed, setRevealed] = useState(index === 0)

  useEffect(() => {
    if (index === 0) return // already revealed
    const id = window.setTimeout(() => setRevealed(true), index * delay)
    return () => window.clearTimeout(id)
  }, [index, delay])

  const defaultFallback = (
    <Skeleton className="h-24 w-full rounded-xl" />
  )

  const motionProps = reduceMotion
    ? {
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' as const },
      }

  return (
    <motion.div
      className={className}
      // While waiting for the stagger slot, render nothing visible — the
      // skeleton appears inside Suspense once the child starts rendering.
      {...(revealed ? motionProps : { animate: { opacity: 0 } })}
    >
      {revealed ? (
        <Suspense fallback={fallback ?? defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback ?? defaultFallback
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------

/**
 * Convenience hook: returns a callback that, when called, triggers a
 * progressive reveal of the next N sections. Useful for "Load more" buttons.
 */
export function useProgressiveReveal(totalSections: number, delay = 100) {
  const [visibleCount, setVisibleCount] = useState(1)
  const revealNext = useCallback(() => {
    setVisibleCount((c) => Math.min(c + 1, totalSections))
  }, [totalSections])
  const revealAll = useCallback(() => setVisibleCount(totalSections), [
    totalSections,
  ])

  // For each newly-revealed section, wait `delay` ms before the next auto-flip.
  useEffect(() => {
    if (visibleCount >= totalSections) return
    const id = window.setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 1, totalSections))
    }, delay)
    return () => window.clearTimeout(id)
  }, [visibleCount, totalSections, delay])

  return { visibleCount, revealNext, revealAll }
}
