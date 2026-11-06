/**
 * A/B Content Testing — Type definitions
 * Fasa 3.4 — TheViralFindsMY
 *
 * These types are shared between the API routes (generate / track) and the
 * client dashboard. Keep them side-effect free so they can be imported from
 * both server and client code.
 */

/** Variant label — A / B / C */
export type VariantLabel = 'A' | 'B' | 'C'

/** Variant style — drives content generation prompt */
export type VariantStyle = 'direct' | 'story' | 'urgency'

/** Platforms supported by the A/B tester */
export type AbPlatform = 'shopee' | 'tiktok' | 'lazada'

/** Niche selectors */
export type AbNiche = 'Beauty' | 'Tech' | 'Fashion' | 'Home' | 'Food'

/** Optional tone override */
export type AbTone = 'Casual' | 'Professional' | 'Hype' | 'Educational'

/** Per-dimension score breakdown — each value is 0-100 */
export interface PredictionBreakdown {
  /** Opening-hook quality (first ~80 chars) */
  hook: number
  /** Call-to-action clarity */
  cta: number
  /** Hashtag diversity + relevance */
  hashtags: number
  /** Emotional trigger density */
  emotion: number
}

/** Actual logged performance for a variant (after posting) */
export interface PerformanceMetric {
  clicks: number
  conversions: number
  /** Conversion rate = conversions / clicks * 100 (0 if no clicks) */
  ctr: number
  loggedAt: string | null
}

/** A single content variant inside an A/B test */
export interface ContentVariant {
  id: string
  testId: string
  /** A / B / C */
  label: VariantLabel
  /** direct / story / urgency */
  style: VariantStyle
  /** Human-friendly style name e.g. "Direct & Punchy" */
  styleName: string
  /** The generated content text */
  content: string
  /** Hashtags extracted from the content */
  hashtags: string[]
  /** AI-predicted overall score (0-100) */
  predictedScore: number
  /** Per-dimension score breakdown */
  scoreBreakdown: PredictionBreakdown
  /** True when the user marks this variant as the winner */
  isWinner?: boolean
  /** Actual performance — null until user logs results */
  actual: PerformanceMetric | null
  /** Where the content came from */
  source: 'ai' | 'mock' | 'db'
  createdAt: string
}

/** Aggregated score output from the scorer */
export interface VariantScore {
  predictedScore: number
  breakdown: PredictionBreakdown
}

/** A full A/B test result (3 variants + metadata) */
export interface AbTestResult {
  id: string
  product: string
  platform: AbPlatform
  niche: AbNiche
  tone?: AbTone | null
  variants: ContentVariant[]
  /** ID of the variant the user picked as the winner */
  winnerVariantId?: string | null
  createdAt: string
  source: 'ai' | 'mock' | 'db'
}

/** POST /api/abtesting/generate request body */
export interface GenerateRequest {
  product: string
  platform: AbPlatform
  niche: AbNiche
  tone?: AbTone
}

/** POST /api/abtesting/generate response */
export interface GenerateResponse {
  testId: string
  product: string
  platform: AbPlatform
  niche: AbNiche
  tone: AbTone | null
  variants: ContentVariant[]
  source: 'ai' | 'mock'
  createdAt: string
}

/** POST /api/abtesting/track request body */
export interface TrackRequest {
  variantId: string
  actualClicks: number
  actualConversions: number
}

/** POST /api/abtesting/track response */
export interface TrackResponse {
  variant: ContentVariant
  test: AbTestResult
}

/** GET /api/abtesting/track response */
export interface ListResponse {
  tests: AbTestResult[]
  total: number
}

/** Human-friendly display metadata for each variant style */
export const VARIANT_STYLE_META: Record<
  VariantStyle,
  { label: VariantLabel; name: string; description: string; emoji: string }
> = {
  direct: {
    label: 'A',
    name: 'Direct & Punchy',
    description: 'Short, power-word heavy, immediate CTA. Best for impulse buys.',
    emoji: '⚡',
  },
  story: {
    label: 'B',
    name: 'Story-Driven',
    description: 'Narrative hook, relatable journey, soft CTA. Best for trust building.',
    emoji: '📖',
  },
  urgency: {
    label: 'C',
    name: 'Urgency-Focused',
    description: 'Scarcity + FOMO + countdown. Best for flash sales & limited stock.',
    emoji: '⏰',
  },
}
