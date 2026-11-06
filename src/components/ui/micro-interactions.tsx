'use client'

/**
 * micro-interactions.tsx — premium reusable animation primitives.
 *
 * Components:
 *   - <ShimmerButton>    CTA button with diagonal shimmer overlay
 *   - <HoverCard>        Card with hover lift + border highlight
 *   - <FloatingText>     "+RM 30.00" floating animation for new earnings
 *   - <AnimatedNumber>   Count-up number with thousand separators
 *   - <TypingDots>       Three-dot "AI is thinking" indicator
 *   - <PulsingDot>       Live/recording indicator with ping animation
 *
 * Design constraints:
 *   - Respects prefers-reduced-motion everywhere
 *   - NO indigo or blue colors — brand palette only (shopee orange, hermes
 *     purple, profit pink, emerald for positive earnings)
 *   - All animations via Framer Motion (CSS classes for pure-decoration ones)
 */

import * as React from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCountUp, formatCountUp } from '@/hooks/use-count-up'
import type { VariantProps } from 'class-variance-authority'

/* ============================================================
   1. ShimmerButton
   ============================================================ */

type ShimmerButtonVariant = 'shopee' | 'hermes'

interface ShimmerButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  /** Visual variant — shopee (orange) or hermes (purple). Default shopee. */
  shimmerVariant?: ShimmerButtonVariant
  /** Disable the shimmer overlay (still keep hover scale). Default false. */
  shimmerDisabled?: boolean
  /** Render as a different element via Slot (e.g. asChild). */
  asChild?: boolean
}

const SHIMMER_VARIANT_CLASSES: Record<ShimmerButtonVariant, string> = {
  shopee:
    'bg-shopee text-white hover:bg-shopee-dark shadow-[0_4px_14px_0_hsl(var(--shopee)/0.35)] hover:shadow-[0_6px_20px_0_hsl(var(--shopee)/0.45)]',
  hermes:
    'bg-hermes text-white hover:bg-hermes-dark shadow-[0_4px_14px_0_hsl(var(--hermes)/0.35)] hover:shadow-[0_6px_20px_0_hsl(var(--hermes)/0.45)]',
}

/**
 * ShimmerButton — primary CTA with an animated diagonal shimmer overlay and
 * subtle scale-on-hover. The shimmer is a CSS `background-position` animation
 * defined in globals.css under `.shimmer-effect` (2s infinite).
 *
 * The shimmer overlay is white-on-color, which works in both light and dark
 * modes because it sits on top of a saturated brand background.
 */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      className,
      shimmerVariant = 'shopee',
      shimmerDisabled = false,
      children,
      size,
      asChild = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        asChild={asChild}
        size={size}
        className={cn(
          'relative overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
          SHIMMER_VARIANT_CLASSES[shimmerVariant],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {/* children rendered via Button's asChild-aware Slot */}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        {!shimmerDisabled && (
          <span
            aria-hidden
            className="shimmer-effect pointer-events-none absolute inset-0 z-0"
          />
        )}
      </Button>
    )
  }
)
ShimmerButton.displayName = 'ShimmerButton'

/* ============================================================
   2. HoverCard
   ============================================================ */

interface HoverCardProps extends React.ComponentProps<typeof motion.div> {
  /** Lift strength in px (default -2). */
  lift?: number
  /** Highlight border color on hover. Default "shopee". */
  highlight?: 'shopee' | 'hermes' | 'profit'
  /** Disable hover lift (still renders the wrapper). */
  disabled?: boolean
}

const HIGHLIGHT_BORDER_CLASS: Record<NonNullable<HoverCardProps['highlight']>, string> = {
  shopee: 'hover:border-shopee/50',
  hermes: 'hover:border-hermes/50',
  profit: 'hover:border-profit/50',
}

/**
 * HoverCard — wraps children in a motion.div with a subtle lift + border
 * highlight on hover. Uses a spring transition (stiffness 300, damping 25)
 * for a tactile feel. Drop into product cards, listing cards, KPI tiles.
 *
 * NOTE: This is a *visual* hover card (lift effect), distinct from the
 * Radix `HoverCard` popover primitive in `@/components/ui/hover-card`.
 * Import paths are different so the two can coexist.
 */
export function HoverCard({
  children,
  className,
  lift = -2,
  highlight = 'shopee',
  disabled = false,
  ...props
}: HoverCardProps) {
  const reduceMotion = useReducedMotion()
  const motionProps = disabled || reduceMotion
    ? {}
    : {
        whileHover: { y: lift },
        transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
      }

  return (
    <motion.div
      className={cn(
        'rounded-xl border bg-card transition-colors duration-200',
        HIGHLIGHT_BORDER_CLASS[highlight],
        'hover:shadow-md',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* ============================================================
   3. FloatingText
   ============================================================ */

interface FloatingTextProps {
  /** Text to display, e.g. "+RM 30.00". */
  text: string
  /** Animation duration in seconds. Default 2. */
  duration?: number
  /** Color — emerald (default, positive earnings), shopee, hermes, profit. */
  color?: 'emerald' | 'shopee' | 'hermes' | 'profit'
  /** Trigger — when this changes, the animation re-runs. */
  trigger?: number | string
  className?: string
}

const FLOATING_TEXT_COLORS: Record<NonNullable<FloatingTextProps['color']>, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  shopee: 'text-shopee',
  hermes: 'text-hermes',
  profit: 'text-profit',
}

/**
 * FloatingText — renders `text` and floats it upward + fades out, useful for
 * "you just earned RM 30" notifications. Mounts, plays once, then calls
 * `onComplete` so the parent can unmount it.
 *
 * Pair with `AnimatePresence` in the parent for clean exit handling.
 */
export function FloatingText({
  text,
  duration = 2,
  color = 'emerald',
  trigger,
  className,
}: FloatingTextProps) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = React.useState(true)

  // Re-trigger animation when `trigger` changes.
  React.useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), duration * 1000)
    return () => clearTimeout(t)
  }, [trigger, duration])

  if (reduceMotion) {
    return visible ? (
      <span className={cn('font-semibold tabular-nums', FLOATING_TEXT_COLORS[color], className)}>
        {text}
      </span>
    ) : null
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          key={String(trigger) + text}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -40 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeOut' }}
          className={cn(
            'pointer-events-none absolute font-semibold tabular-nums',
            FLOATING_TEXT_COLORS[color],
            className
          )}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   4. AnimatedNumber
   ============================================================ */

interface AnimatedNumberProps {
  /** Target value. */
  value: number
  /** Prefix shown before the number, e.g. "RM ". */
  prefix?: string
  /** Suffix shown after the number, e.g. "%". */
  suffix?: string
  /** Animation duration in ms. Default 1500. */
  duration?: number
  /** Decimal places. Default 0. */
  decimals?: number
  /** Extra classes. */
  className?: string
}

/**
 * AnimatedNumber — renders `value` with a count-up animation using the P1-c
 * `useCountUp` hook. Formats with thousand separators (en-MY locale) so
 * `12694.5` → `"RM 12,694.50"`.
 *
 * Respects prefers-reduced-motion (the underlying hook jumps to target).
 */
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion()
  const animated = useCountUp(value, {
    duration,
    decimals,
    enabled: !reduceMotion,
  })
  const formatted = formatCountUp(animated, { prefix, suffix, decimals })
  return (
    <span className={cn('tabular-nums', className)} aria-label={formatted}>
      {formatted}
    </span>
  )
}

/* ============================================================
   5. TypingDots
   ============================================================ */

interface TypingDotsProps {
  /** Optional label shown after the dots, e.g. "HERMES is thinking". */
  label?: string
  /** Dot color — hermes (default), shopee, profit, emerald. */
  color?: 'hermes' | 'shopee' | 'profit' | 'emerald' | 'muted'
  className?: string
}

const TYPING_DOT_BG: Record<NonNullable<TypingDotsProps['color']>, string> = {
  hermes: 'bg-hermes',
  shopee: 'bg-shopee',
  profit: 'bg-profit',
  emerald: 'bg-emerald-500',
  muted: 'bg-muted-foreground',
}

/**
 * TypingDots — three bouncing dots for AI "thinking" states. Uses Framer
 * Motion with staggered delays so it stays in sync with the rest of the
 * platform's motion system (rather than the older CSS `.typing-dot` rule).
 */
export function TypingDots({
  label,
  color = 'hermes',
  className,
}: TypingDotsProps) {
  const reduceMotion = useReducedMotion()
  const dotClass = TYPING_DOT_BG[color]

  if (reduceMotion) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn('inline-flex items-center gap-1.5', className)}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </span>
    )
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn('h-1.5 w-1.5 rounded-full', dotClass)}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
        />
      ))}
      {label && (
        <span className="ml-1 text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  )
}

/* ============================================================
   6. PulsingDot
   ============================================================ */

interface PulsingDotProps {
  /** Semantic color. Default green (live). */
  color?: 'green' | 'amber' | 'red' | 'shopee' | 'hermes'
  /** Optional label shown next to the dot. */
  label?: string
  /** Disable the outer ping ring (still show the solid dot). */
  ping?: boolean
  className?: string
}

const PULSING_DOT_COLORS: Record<NonNullable<PulsingDotProps['color']>, { dot: string; ping: string }> = {
  green: { dot: 'bg-emerald-500', ping: 'bg-emerald-500/60' },
  amber: { dot: 'bg-amber-500', ping: 'bg-amber-500/60' },
  red: { dot: 'bg-red-500', ping: 'bg-red-500/60' },
  shopee: { dot: 'bg-shopee', ping: 'bg-shopee/60' },
  hermes: { dot: 'bg-hermes', ping: 'bg-hermes/60' },
}

/**
 * PulsingDot — solid dot with a CSS `animate-ping` ring expanding outward.
 * Use for "live" indicators (activity feed, recording state, alert badges).
 *
 * The ping is suppressed under prefers-reduced-motion; the solid dot remains.
 */
export function PulsingDot({
  color = 'green',
  label,
  ping = true,
  className,
}: PulsingDotProps) {
  const reduceMotion = useReducedMotion()
  const c = PULSING_DOT_COLORS[color]
  const showPing = ping && !reduceMotion

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
    >
      <span className="relative inline-flex h-2 w-2">
        {showPing && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              c.ping
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', c.dot)} />
      </span>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </span>
  )
}
