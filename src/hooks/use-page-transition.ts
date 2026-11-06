'use client'

/**
 * Enhanced Framer Motion animation utilities for TheViralFindsMY.
 *
 * All hooks respect `prefers-reduced-motion` and return static variants
 * when the user has enabled the accessibility setting.
 *
 * Usage:
 *   const pageTransition = usePageTransition()
 *   <motion.div variants={pageTransition} initial="hidden" animate="visible">
 *     ...
 *   </motion.div>
 */

import { useEffect, useState, useCallback } from 'react'
import type { Variants, Transition } from 'framer-motion'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Hook that tracks reduced-motion preference reactively */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion())
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (): void => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ---------------------------------------------------------------------------
// Spring presets (brutalist feel — snappy, low damping)
// ---------------------------------------------------------------------------

export const SPRINGS = {
  cyber: { type: 'spring' as const, stiffness: 380, damping: 26 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 350, damping: 20 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 30 },
  brutal: { type: 'spring' as const, stiffness: 500, damping: 28 },
} satisfies Record<string, Transition>

// ---------------------------------------------------------------------------
// usePageTransition — fade + slide-up
// ---------------------------------------------------------------------------

const MOTION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
}

const STATIC_VARIANTS: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
}

export function usePageTransition(): Variants {
  const reduced = useReducedMotion()
  return reduced ? STATIC_VARIANTS : MOTION_VARIANTS
}

// ---------------------------------------------------------------------------
// useStaggerContainer — sequential child reveal
// ---------------------------------------------------------------------------

export function useStaggerContainer(staggerChildren = 0.06): Variants {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { duration: 0 } },
    }
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren,
        delayChildren: 0.05,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// useCardVariants — stagger + scale for card grids
// ---------------------------------------------------------------------------

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
}

export function useCardVariants(): Variants {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
    }
  }
  return CARD_VARIANTS
}

// ---------------------------------------------------------------------------
// useSlideInVariants — horizontal slide from direction
// ---------------------------------------------------------------------------

export function useSlideInVariants(direction: 'left' | 'right' | 'up' | 'down' = 'up', distance = 24): Variants {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1, x: 0, y: 0 },
      visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0 } },
    }
  }
  const offset = { x: 0, y: 0 }
  if (direction === 'left') offset.x = -distance
  if (direction === 'right') offset.x = distance
  if (direction === 'up') offset.y = distance
  if (direction === 'down') offset.y = -distance
  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  }
}

// ---------------------------------------------------------------------------
// useScaleInVariants — scale from small with spring
// ---------------------------------------------------------------------------

const SCALE_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRINGS.snappy,
  },
}

export function useScaleInVariants(): Variants {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1, scale: 1 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0 } },
    }
  }
  return SCALE_VARIANTS
}

// ---------------------------------------------------------------------------
// useCountUp — animated number counter hook
// ---------------------------------------------------------------------------

export function useCountUp(
  end: number,
  duration = 1200,
  enabled = true
): { value: number; motionProps: { initial: number; animate: number; transition: Transition } } {
  const reduced = useReducedMotion()

  return {
    value: end,
    motionProps: reduced || !enabled
      ? { initial: end, animate: end, transition: { duration: 0 } }
      : {
          initial: 0,
          animate: end,
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
        },
  }
}

// ---------------------------------------------------------------------------
// useScrollReveal — trigger animation when element enters viewport
// ---------------------------------------------------------------------------

export function useScrollReveal(threshold = 0.15): {
  ref: React.RefCallback<HTMLDivElement>
  inView: boolean
  variants: Variants
} {
  const [inView, setInView] = useState(false)
  const reduced = useReducedMotion()

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(node)
  }, [threshold])

  const variants: Variants = reduced
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      }

  return { ref, inView, variants }
}

// ---------------------------------------------------------------------------
// useHoverLift — micro-interaction for hover lift effect
// ---------------------------------------------------------------------------

export function useHoverLift() {
  const reduced = useReducedMotion()
  return {
    whileHover: reduced ? {} : { y: -4, boxShadow: '4px 4px 0 0 rgba(0,0,0,1)' },
    whileTap: reduced ? {} : { scale: 0.98 },
    transition: SPRINGS.snappy,
  }
}
