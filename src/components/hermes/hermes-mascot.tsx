'use client'

/**
 * HermesMascot — Animated SVG robot/owl character
 *
 * The visual identity of HERMES AI throughout TheViralFindsMY.
 * Hermes purple (#a855f7 / oklch var --hermes) with shopee orange accents.
 *
 * Animations (Framer Motion):
 *   - Idle: subtle bobbing (y: 0 → -2 → 0, 2s infinite)
 *   - Blinking eyes (every ~4s, 0.18s blink)
 *   - Antenna glow pulse (1.6s loop)
 *
 * Props:
 *   - size: 'sm' | 'md' | 'lg' | 'xl'  (32 / 48 / 96 / 160 px wide)
 *   - expression: 'happy' | 'thinking' | 'excited' | 'neutral'
 *   - animate: turn idle/blink/glow on or off (default on)
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type HermesExpression = 'happy' | 'thinking' | 'excited' | 'neutral'
export type HermesMascotSize = 'sm' | 'md' | 'lg' | 'xl'

export interface HermesMascotProps {
  size?: HermesMascotSize
  expression?: HermesExpression
  animate?: boolean
  className?: string
}

const SIZE_PX: Record<HermesMascotSize, number> = {
  sm: 32,
  md: 48,
  lg: 96,
  xl: 160,
}

// Eye geometry per expression (ry = vertical radius, pupil offset)
const EYE_GEOMETRY: Record<HermesExpression, { ry: number; pupilDx: number; pupilDy: number }> = {
  happy: { ry: 6, pupilDx: 0, pupilDy: 0 },
  thinking: { ry: 2.5, pupilDx: 0, pupilDy: -2 }, // squint + looking up
  excited: { ry: 8, pupilDx: 0, pupilDy: 0 },
  neutral: { ry: 5, pupilDx: 0, pupilDy: 0 },
}

// Mouth path per expression
const MOUTH_PATH: Record<HermesExpression, string> = {
  happy: 'M 38 66 Q 50 76 62 66',
  thinking: 'M 42 70 Q 50 67 58 70',
  excited: 'M 36 64 Q 50 82 64 64',
  neutral: 'M 42 70 Q 50 72 58 70',
}

export function HermesMascot({
  size = 'md',
  expression = 'happy',
  animate = true,
  className,
}: HermesMascotProps) {
  const px = SIZE_PX[size]
  const eye = EYE_GEOMETRY[expression]
  const mouth = MOUTH_PATH[expression]

  return (
    <motion.svg
      width={px}
      height={px * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none pointer-events-none', className)}
      role="img"
      aria-label="HERMES AI mascot"
      initial={animate ? { y: 0 } : undefined}
      animate={animate ? { y: [0, -2, 0] } : undefined}
      transition={animate ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <defs>
        <linearGradient id="hermesHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--hermes)" />
          <stop offset="100%" stopColor="var(--hermes-dark)" />
        </linearGradient>
        <linearGradient id="hermesBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--hermes-dark)" />
          <stop offset="100%" stopColor="var(--hermes)" />
        </linearGradient>
        <radialGradient id="hermesGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--shopee)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--shopee)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Antenna glow halo */}
      {animate && (
        <motion.circle
          cx="50"
          cy="5"
          r="8"
          fill="url(#hermesGlow)"
          initial={{ opacity: 0.4, scale: 0.9 }}
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '50px 5px' }}
        />
      )}

      {/* Antenna stalk */}
      <line x1="50" y1="8" x2="50" y2="16" stroke="var(--hermes-dark)" strokeWidth="2" strokeLinecap="round" />

      {/* Antenna bulb (orange, pulsing) */}
      <motion.circle
        cx="50"
        cy="5"
        r="3"
        fill="var(--shopee)"
        initial={animate ? { scale: 0.95 } : undefined}
        animate={animate ? { scale: [0.95, 1.15, 0.95] } : undefined}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 5px' }}
      />

      {/* Side ears (orange accent) */}
      <circle cx="14" cy="40" r="6" fill="var(--shopee)" opacity="0.95" />
      <circle cx="86" cy="40" r="6" fill="var(--shopee)" opacity="0.95" />
      <circle cx="14" cy="40" r="3" fill="var(--hermes-dark)" />
      <circle cx="86" cy="40" r="3" fill="var(--hermes-dark)" />

      {/* Head */}
      <rect x="18" y="14" width="64" height="56" rx="20" fill="url(#hermesHeadGrad)" />

      {/* Head shine */}
      <ellipse cx="38" cy="24" rx="14" ry="5" fill="white" opacity="0.18" />

      {/* Face panel (lighter inner) */}
      <rect x="26" y="22" width="48" height="40" rx="14" fill="rgba(255,255,255,0.12)" />

      {/* Left eye (white) */}
      <motion.ellipse
        cx="40"
        cy="40"
        rx="6"
        ry={eye.ry}
        fill="white"
        initial={animate ? { ry: eye.ry } : undefined}
        animate={animate ? { ry: [eye.ry, eye.ry, 0.4, eye.ry, eye.ry] } : undefined}
        transition={{
          duration: 0.18,
          times: [0, 0.4, 0.5, 0.6, 1],
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />
      {/* Right eye (white) */}
      <motion.ellipse
        cx="60"
        cy="40"
        rx="6"
        ry={eye.ry}
        fill="white"
        initial={animate ? { ry: eye.ry } : undefined}
        animate={animate ? { ry: [eye.ry, eye.ry, 0.4, eye.ry, eye.ry] } : undefined}
        transition={{
          duration: 0.18,
          times: [0, 0.4, 0.5, 0.6, 1],
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />

      {/* Pupils */}
      <circle cx={40 + eye.pupilDx} cy={40 + eye.pupilDy} r="2.4" fill="#1e1b2e" />
      <circle cx={60 + eye.pupilDx} cy={40 + eye.pupilDy} r="2.4" fill="#1e1b2e" />
      {/* Pupil shine */}
      <circle cx={40 + eye.pupilDx + 0.8} cy={40 + eye.pupilDy - 0.8} r="0.8" fill="white" />
      <circle cx={60 + eye.pupilDx + 0.8} cy={40 + eye.pupilDy - 0.8} r="0.8" fill="white" />

      {/* Cheeks (orange, only on happy/excited) */}
      {(expression === 'happy' || expression === 'excited') && (
        <>
          <circle cx="30" cy="56" r="3" fill="var(--shopee)" opacity="0.55" />
          <circle cx="70" cy="56" r="3" fill="var(--shopee)" opacity="0.55" />
        </>
      )}

      {/* Mouth */}
      <motion.path
        d={mouth}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Body */}
      <rect x="28" y="72" width="44" height="36" rx="14" fill="url(#hermesBodyGrad)" />

      {/* Body shine */}
      <ellipse cx="40" cy="80" rx="10" ry="3" fill="white" opacity="0.15" />

      {/* HERMES "H" logo on body */}
      <g>
        <rect x="44" y="84" width="12" height="16" rx="3" fill="rgba(255,255,255,0.18)" />
        <text
          x="50"
          y="97"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="white"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0"
        >
          H
        </text>
      </g>

      {/* Tiny feet */}
      <rect x="34" y="106" width="10" height="6" rx="3" fill="var(--hermes-dark)" />
      <rect x="56" y="106" width="10" height="6" rx="3" fill="var(--hermes-dark)" />
    </motion.svg>
  )
}

export default HermesMascot
