/**
 * Custom on-brand SVG illustrations for the EmptyState component.
 * Pure SVG (no client directive) — animation handled by parent via Framer Motion
 * wrappers and CSS classes (.animate-float, .animate-pulse, .animate-spin-slow).
 *
 * Color discipline:
 *  - Main shape uses `currentColor` so it inherits the parent text color
 *  - Background tint circle uses a low-opacity orange/purple fill
 *  - NO indigo or blue anywhere
 *  - Brand palette: shopee (orange oklch 0.63 0.22 30) + hermes (purple oklch 0.55 0.18 280)
 *
 * Each illustration is a 180x180 viewport, accessible (role="img" + aria-label),
 * and accepts a `className` prop for color overrides.
 */
import type { SVGProps } from 'react'

type IllustrationProps = SVGProps<SVGSVGElement>

// ─── 1. No Data — Empty inbox / box with floating dots ───────────────────────

export function NoDataIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty box illustration"
      {...props}
    >
      {/* Background gradient circle */}
      <circle cx="90" cy="90" r="78" fill="var(--shopee)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--shopee)" opacity="0.06" />

      {/* Floating dots (top) */}
      <circle cx="48" cy="42" r="3" fill="var(--shopee)" opacity="0.5" className="animate-float" style={{ animationDelay: '0s' }} />
      <circle cx="132" cy="38" r="2.5" fill="var(--shopee)" opacity="0.4" className="animate-float" style={{ animationDelay: '0.6s' }} />
      <circle cx="140" cy="62" r="2" fill="var(--shopee)" opacity="0.5" className="animate-float" style={{ animationDelay: '1.2s' }} />
      <circle cx="38" cy="68" r="2" fill="var(--shopee)" opacity="0.4" className="animate-float" style={{ animationDelay: '0.3s' }} />

      {/* Box body */}
      <g className="animate-float" style={{ animationDelay: '0.2s' }}>
        {/* Back flaps */}
        <path
          d="M55 78 L90 58 L125 78 L90 98 Z"
          fill="var(--shopee-light)"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Front face */}
        <path
          d="M55 78 L90 98 L90 138 L55 118 Z"
          fill="var(--shopee)"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right face */}
        <path
          d="M125 78 L90 98 L90 138 L125 118 Z"
          fill="var(--shopee)"
          fillOpacity="0.32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Top inside (empty cavity shadow) */}
        <path
          d="M62 81 L90 67 L118 81 L90 95 Z"
          fill="var(--shopee-dark)"
          fillOpacity="0.15"
        />
      </g>

      {/* Sparkle */}
      <g className="animate-float" style={{ animationDelay: '0.9s' }}>
        <path
          d="M150 100 L152 105 L157 107 L152 109 L150 114 L148 109 L143 107 L148 105 Z"
          fill="var(--shopee)"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}

// ─── 2. No API — Disconnected plug/cable with spark particles ────────────────

export function NoApiIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Disconnected plug illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--hermes)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--hermes)" opacity="0.06" />

      {/* Cable curving to the right (disconnected, frayed) */}
      <path
        d="M30 90 C50 90 50 60 70 60 C90 60 90 90 110 90"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Frayed cable ends (spark lines) */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="110" y1="84" x2="118" y2="78" />
        <line x1="110" y1="90" x2="120" y2="90" />
        <line x1="110" y1="96" x2="118" y2="102" />
      </g>

      {/* Plug body (left side) */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        {/* Plug head */}
        <rect x="20" y="78" width="22" height="24" rx="3" fill="var(--hermes-light)" stroke="currentColor" strokeWidth="2.5" />
        {/* Prongs */}
        <line x1="6" y1="84" x2="20" y2="84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="6" y1="96" x2="20" y2="96" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {/* Highlight */}
        <rect x="24" y="82" width="14" height="3" rx="1.5" fill="var(--hermes)" opacity="0.3" />
      </g>

      {/* Socket / port (right side, separated) */}
      <g className="animate-float" style={{ animationDelay: '0.5s' }}>
        <rect x="130" y="74" width="28" height="32" rx="4" fill="var(--hermes-light)" stroke="currentColor" strokeWidth="2.5" />
        {/* Socket holes */}
        <circle cx="144" cy="84" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="144" cy="96" r="2" fill="currentColor" opacity="0.5" />
      </g>

      {/* Spark particles in the gap */}
      <g className="animate-float" style={{ animationDelay: '0.8s' }}>
        <circle cx="125" cy="80" r="1.5" fill="var(--hermes)" opacity="0.8" />
        <circle cx="120" cy="90" r="2" fill="var(--shopee)" opacity="0.9" />
        <circle cx="125" cy="100" r="1.5" fill="var(--hermes)" opacity="0.8" />
        <path
          d="M118 74 L120 78 L124 79 L120 80 L118 84 L116 80 L112 79 L116 78 Z"
          fill="var(--shopee)"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}

// ─── 3. No Links — Broken chain link with question mark ──────────────────────

export function NoLinksIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Broken chain link illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--shopee)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--shopee)" opacity="0.06" />

      {/* Left chain link */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        <rect
          x="32"
          y="60"
          width="40"
          height="60"
          rx="20"
          fill="var(--shopee-light)"
          stroke="currentColor"
          strokeWidth="3"
        />
        <rect
          x="44"
          y="74"
          width="16"
          height="32"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </g>

      {/* Right chain link (separated) */}
      <g className="animate-float" style={{ animationDelay: '0.4s' }}>
        <rect
          x="108"
          y="60"
          width="40"
          height="60"
          rx="20"
          fill="var(--shopee-light)"
          stroke="currentColor"
          strokeWidth="3"
        />
        <rect
          x="120"
          y="74"
          width="16"
          height="32"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </g>

      {/* Question mark between the broken links */}
      <g className="animate-float" style={{ animationDelay: '0.7s' }}>
        <circle cx="90" cy="90" r="14" fill="var(--shopee)" opacity="0.2" />
        <text
          x="90"
          y="97"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="currentColor"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          ?
        </text>
      </g>

      {/* Spark particles */}
      <circle cx="78" cy="48" r="1.5" fill="var(--shopee)" opacity="0.6" className="animate-float" style={{ animationDelay: '1s' }} />
      <circle cx="102" cy="48" r="1.5" fill="var(--shopee)" opacity="0.6" className="animate-float" style={{ animationDelay: '1.3s' }} />
    </svg>
  )
}

// ─── 4. No Campaigns — Empty megaphone with sound waves ──────────────────────

export function NoCampaignsIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty megaphone illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--shopee)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--shopee)" opacity="0.06" />

      {/* Sound waves (radiating out) */}
      <g className="animate-float" style={{ animationDelay: '0.2s' }}>
        <path d="M118 70 Q126 90 118 110" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M132 64 Q144 90 132 116" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M146 58 Q160 90 146 122" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.3" />
      </g>

      {/* Megaphone body */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        {/* Cone */}
        <path
          d="M30 78 L30 102 L96 124 L96 56 Z"
          fill="var(--shopee-light)"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Cone opening (front) */}
        <path
          d="M96 56 L96 124 L108 116 L108 64 Z"
          fill="var(--shopee)"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Handle */}
        <rect x="22" y="82" width="10" height="16" rx="2" fill="var(--shopee-dark)" stroke="currentColor" strokeWidth="2.5" />
        {/* Inside shadow */}
        <path d="M36 84 L36 96 L92 110 L92 70 Z" fill="var(--shopee-dark)" fillOpacity="0.1" />
      </g>

      {/* Sparkles around megaphone */}
      <g className="animate-float" style={{ animationDelay: '0.9s' }}>
        <circle cx="40" cy="50" r="2" fill="var(--shopee)" opacity="0.7" />
        <circle cx="60" cy="42" r="1.5" fill="var(--shopee)" opacity="0.5" />
        <path d="M30 130 L32 134 L36 135 L32 136 L30 140 L28 136 L24 135 L28 134 Z" fill="var(--shopee)" opacity="0.6" />
      </g>
    </svg>
  )
}

// ─── 5. Locked — Padlock with keyhole + crown ────────────────────────────────

export function LockedIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Locked padlock illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--hermes)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--hermes)" opacity="0.06" />

      {/* Crown above the padlock */}
      <g className="animate-float" style={{ animationDelay: '0.6s' }}>
        <path
          d="M64 50 L74 62 L90 46 L106 62 L116 50 L112 76 L68 76 Z"
          fill="var(--shopee)"
          fillOpacity="0.85"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Crown jewels */}
        <circle cx="64" cy="50" r="3" fill="var(--shopee)" />
        <circle cx="90" cy="46" r="3" fill="var(--shopee)" />
        <circle cx="116" cy="50" r="3" fill="var(--shopee)" />
        {/* Crown base */}
        <rect x="66" y="76" width="48" height="6" rx="1" fill="var(--shopee-dark)" />
      </g>

      {/* Padlock shackle */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        <path
          d="M70 100 V88 C70 76 78 70 90 70 C102 70 110 76 110 88 V100"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Padlock body */}
      <g>
        <rect
          x="58"
          y="100"
          width="64"
          height="56"
          rx="8"
          fill="var(--hermes-light)"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* Body highlight */}
        <rect x="62" y="104" width="56" height="6" rx="3" fill="var(--hermes)" opacity="0.2" />

        {/* Keyhole */}
        <circle cx="90" cy="120" r="6" fill="currentColor" />
        <rect x="87" y="124" width="6" height="14" rx="3" fill="currentColor" />
      </g>

      {/* Sparkles */}
      <g className="animate-float" style={{ animationDelay: '1s' }}>
        <path
          d="M40 100 L42 105 L47 106 L42 107 L40 112 L38 107 L33 106 L38 105 Z"
          fill="var(--hermes)"
          opacity="0.6"
        />
        <path
          d="M140 100 L142 105 L147 106 L142 107 L140 112 L138 107 L133 106 L138 105 Z"
          fill="var(--hermes)"
          opacity="0.6"
        />
      </g>
    </svg>
  )
}

// ─── 6. No Results — Magnifying glass with X over a search list ──────────────

export function NoResultsIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No search results illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--shopee)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--shopee)" opacity="0.06" />

      {/* Search list (background) */}
      <g opacity="0.5">
        <rect x="40" y="50" width="80" height="80" rx="6" fill="var(--shopee-light)" stroke="currentColor" strokeWidth="2" />
        {/* List rows */}
        <rect x="50" y="60" width="40" height="5" rx="2.5" fill="currentColor" opacity="0.4" />
        <rect x="50" y="72" width="60" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
        <rect x="50" y="80" width="55" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
        <rect x="50" y="92" width="50" height="5" rx="2.5" fill="currentColor" opacity="0.4" />
        <rect x="50" y="104" width="60" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
        <rect x="50" y="112" width="45" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
      </g>

      {/* Magnifying glass */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        {/* Glass circle */}
        <circle
          cx="118"
          cy="92"
          r="26"
          fill="white"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        {/* Glass highlight */}
        <path
          d="M104 78 Q112 72 124 74"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* Handle */}
        <line
          x1="136"
          y1="110"
          x2="150"
          y2="124"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Red X over the glass */}
      <g className="animate-float" style={{ animationDelay: '0.4s' }}>
        <circle cx="118" cy="92" r="14" fill="var(--shopee)" opacity="0.95" />
        <line x1="111" y1="85" x2="125" y2="99" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="125" y1="85" x2="111" y2="99" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ─── 7. Empty Feed — Empty notification bell with zzz ────────────────────────

export function EmptyFeedIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty notification feed illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--hermes)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--hermes)" opacity="0.06" />

      {/* Bell */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        {/* Bell handle on top */}
        <rect x="86" y="40" width="8" height="10" rx="3" fill="currentColor" />
        {/* Bell body */}
        <path
          d="M58 116 C58 86 64 64 90 64 C116 64 122 86 122 116 Z"
          fill="var(--hermes-light)"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Bell rim */}
        <rect x="54" y="116" width="72" height="10" rx="5" fill="var(--hermes-dark)" stroke="currentColor" strokeWidth="3" />
        {/* Bell highlight */}
        <path
          d="M70 96 C70 80 78 72 86 70"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Clapper */}
        <circle cx="90" cy="132" r="6" fill="currentColor" />
      </g>

      {/* "Z z z" floating text */}
      <g className="animate-float" style={{ animationDelay: '0.5s' }}>
        <text
          x="128"
          y="62"
          fontSize="22"
          fontWeight="700"
          fill="var(--hermes)"
          opacity="0.9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Z
        </text>
      </g>
      <g className="animate-float" style={{ animationDelay: '0.8s' }}>
        <text
          x="142"
          y="80"
          fontSize="14"
          fontWeight="600"
          fill="var(--hermes)"
          opacity="0.7"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          z
        </text>
      </g>
      <g className="animate-float" style={{ animationDelay: '1.1s' }}>
        <text
          x="152"
          y="92"
          fontSize="10"
          fontWeight="600"
          fill="var(--hermes)"
          opacity="0.5"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          z
        </text>
      </g>

      {/* Sparkle */}
      <circle cx="44" cy="60" r="2" fill="var(--hermes)" opacity="0.5" className="animate-float" style={{ animationDelay: '1.4s' }} />
    </svg>
  )
}

// ─── 8. No Notifications — Quiet phone with moon + stars ─────────────────────

export function NoNotificationsIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No notifications illustration"
      {...props}
    >
      <circle cx="90" cy="90" r="78" fill="var(--hermes)" opacity="0.08" />
      <circle cx="90" cy="90" r="60" fill="var(--hermes)" opacity="0.06" />

      {/* Moon (top right) */}
      <g className="animate-float" style={{ animationDelay: '0.6s' }}>
        <path
          d="M138 50 C132 50 128 56 128 62 C128 70 134 76 142 76 C146 76 150 74 152 72 C148 76 142 78 136 78 C128 78 122 72 122 64 C122 58 126 52 132 50 Z"
          fill="var(--shopee)"
          opacity="0.85"
        />
      </g>

      {/* Stars */}
      <g className="animate-float" style={{ animationDelay: '0.3s' }}>
        <path d="M52 50 L54 55 L59 56 L54 57 L52 62 L50 57 L45 56 L50 55 Z" fill="var(--shopee)" opacity="0.8" />
      </g>
      <g className="animate-float" style={{ animationDelay: '0.9s' }}>
        <path d="M120 38 L121 41 L124 42 L121 43 L120 46 L119 43 L116 42 L119 41 Z" fill="var(--shopee)" opacity="0.6" />
      </g>
      <g className="animate-float" style={{ animationDelay: '1.2s' }}>
        <circle cx="42" cy="80" r="1.5" fill="var(--shopee)" opacity="0.7" />
        <circle cx="148" cy="100" r="1.5" fill="var(--shopee)" opacity="0.6" />
      </g>

      {/* Phone */}
      <g className="animate-float" style={{ animationDelay: '0s' }}>
        <rect
          x="66"
          y="74"
          width="48"
          height="76"
          rx="8"
          fill="var(--hermes-light)"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* Phone screen (dark / quiet) */}
        <rect x="72" y="84" width="36" height="50" rx="3" fill="var(--hermes)" fillOpacity="0.15" />
        {/* Notch */}
        <rect x="84" y="78" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.4" />
        {/* Home indicator */}
        <rect x="82" y="142" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.5" />

        {/* Empty notification placeholder on screen */}
        <line x1="80" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="80" y1="108" x2="96" y2="108" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
        <line x1="80" y1="116" x2="100" y2="116" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <line x1="80" y1="124" x2="94" y2="124" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      </g>
    </svg>
  )
}

// ─── Illustration registry ────────────────────────────────────────────────────

export type EmptyIllustrationKey =
  | 'no-data'
  | 'no-api'
  | 'no-links'
  | 'no-campaigns'
  | 'locked'
  | 'no-results'
  | 'empty-feed'
  | 'no-notifications'

export const ILLUSTRATION_COMPONENTS: Record<
  EmptyIllustrationKey,
  (props: IllustrationProps) => React.ReactElement
> = {
  'no-data': NoDataIllustration,
  'no-api': NoApiIllustration,
  'no-links': NoLinksIllustration,
  'no-campaigns': NoCampaignsIllustration,
  locked: LockedIllustration,
  'no-results': NoResultsIllustration,
  'empty-feed': EmptyFeedIllustration,
  'no-notifications': NoNotificationsIllustration,
}

export const ILLUSTRATION_LABELS: Record<EmptyIllustrationKey, string> = {
  'no-data': 'Empty inbox illustration',
  'no-api': 'Disconnected plug illustration',
  'no-links': 'Broken chain link illustration',
  'no-campaigns': 'Empty megaphone illustration',
  locked: 'Locked padlock illustration',
  'no-results': 'No search results illustration',
  'empty-feed': 'Empty notification feed illustration',
  'no-notifications': 'Quiet phone illustration',
}
