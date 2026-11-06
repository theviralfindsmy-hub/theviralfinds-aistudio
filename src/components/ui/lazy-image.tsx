'use client'

import { useState, useCallback, useMemo } from 'react'
import NextImage from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * LazyImage
 * ---------
 * Image with blur-up placeholder, fade-in on load, and graceful error state.
 *
 * Why this exists:
 *   - Plain `<img>` flashes blank while loading and shows a broken-image icon
 *     on failure. Neither is acceptable in a polished dashboard.
 *   - `next/image` is great but only lazy-loads with `priority=false`; we want
 *     to apply our own brand-friendly placeholder + Framer Motion fade.
 *
 * Behavior:
 *   - If `priority` is set → uses `next/image` with `priority` (above-fold).
 *   - Otherwise → uses a native `<img loading="lazy">` (below-fold).
 *   - Shows a blur placeholder (`blurDataURL` if provided, else a generated
 *     gradient) while the image loads, then cross-fades to the image.
 *   - On error → shows a subtle gradient + image icon (no broken-image glyph).
 *   - Respects `prefers-reduced-motion` (instant instead of fade).
 *
 * @example
 *   <LazyImage
 *     src="https://..."
 *     alt="Product photo"
 *     width={120}
 *     height={120}
 *     className="rounded-xl"
 *     blurDataURL="data:image/jpeg;base64,..."
 *   />
 */

export interface LazyImageProps {
  /** Image source URL. */
  src: string
  /** Accessibility text — required. */
  alt: string
  /** Intrinsic pixel width (used for aspect ratio + next/image). */
  width?: number
  /** Intrinsic pixel height (used for aspect ratio + next/image). */
  height?: number
  /** Tailwind classes applied to the outer wrapper AND the image. */
  className?: string
  /** Tiny base64 placeholder (e.g. 8x8 blurred JPEG) shown until the image loads. */
  blurDataURL?: string
  /** Skip lazy loading — use for above-the-fold images (LCP-critical). */
  priority?: boolean
  /** Object-fit style for the image. Defaults to `cover`. */
  fit?: 'cover' | 'contain' | 'fill'
}

/** Deterministic warm gradient so the same URL always gets the same placeholder. */
function gradientFor(src: string): string {
  // Simple hash → pick from a warm palette (no blue/indigo).
  let hash = 0
  for (let i = 0; i < src.length; i++) {
    hash = (hash * 31 + src.charCodeAt(i)) | 0
  }
  const palettes: Array<[string, string]> = [
    ['#fff7ed', '#fed7aa'], // amber
    ['#fef3c7', '#fcd34d'], // gold
    ['#fce7f3', '#f9a8d4'], // pink
    ['#fae8ff', '#e9d5ff'], // rose/purple
    ['#fee2e2', '#fca5a5'], // red
    ['#d1fae5', '#6ee7b7'], // emerald
  ]
  const [from, to] = palettes[Math.abs(hash) % palettes.length]
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  blurDataURL,
  priority = false,
  fit = 'cover',
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const reduceMotion = useReducedMotion()

  const handleLoad = useCallback(() => setLoaded(true), [])
  const handleError = useCallback(() => {
    setErrored(true)
    setLoaded(true)
  }, [])

  // Wrapper style preserves the box dimensions even before the image loads.
  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    }),
    [width, height]
  )

  // Placeholder background = explicit blurDataURL if provided, else gradient.
  const placeholderBg = blurDataURL
    ? `url(${blurDataURL})`
    : gradientFor(src)

  // Framer Motion variants — fade-in only when motion is allowed.
  const motionProps = reduceMotion
    ? {
        animate: { opacity: loaded ? 1 : 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: loaded ? 1 : 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }

  // -------- Error state: subtle gradient + image icon --------
  if (errored) {
    return (
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center bg-muted',
          className
        )}
        style={{
          ...wrapperStyle,
          backgroundImage: gradientFor(src),
        }}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-1/4 h-1/4 text-muted-foreground/40" />
      </div>
    )
  }

  // -------- Priority path: next/image with priority --------
  if (priority && width && height) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={wrapperStyle}
      >
        {/* Placeholder layer (cross-faded away once the image loads) */}
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: placeholderBg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: loaded ? 0 : 1,
          }}
        />
        <motion.div
          className="absolute inset-0"
          {...motionProps}
        >
          <NextImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: fit, width: '100%', height: '100%' }}
          />
        </motion.div>
      </div>
    )
  }

  // -------- Default path: native lazy <img> --------
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={wrapperStyle}
    >
      {/* Placeholder layer */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundImage: placeholderBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: loaded ? 0 : 1,
        }}
      />
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: fit }}
        {...motionProps}
      />
    </div>
  )
}

export default LazyImage
