/**
 * Types for the AI Video Thumbnail Generator (Fasa 3.2)
 *
 * Thumbnails are designed for the Malaysian affiliate market — RM pricing,
 * Shopee / TikTok / IG / FB / YouTube platforms, Manglish-friendly CTA copy.
 */

/** Supported thumbnail templates — each defines the visual style + sample copy. */
export type ThumbnailTemplateId =
  | 'flash_sale'
  | 'product_demo'
  | 'comparison'
  | 'unboxing'
  | 'tutorial'
  | 'testimonial'

/** Platform identifiers — maps to a single canonical ThumbnailSize entry. */
export type ThumbnailPlatform =
  | 'tiktok'
  | 'instagram_square'
  | 'instagram_story'
  | 'facebook'
  | 'youtube'

/** A single thumbnail output size, keyed by platform. */
export interface ThumbnailSize {
  platform: ThumbnailPlatform
  label: string
  width: number
  height: number
  /** CSS aspect-ratio string, e.g. "9 / 16" for vertical video. */
  aspectRatio: string
  orientation: 'vertical' | 'square' | 'horizontal'
}

/** Static definition of a thumbnail template — colours, layout + sample text. */
export interface ThumbnailTemplate {
  id: ThumbnailTemplateId
  name: string
  /** Short Malay/English description shown in the UI. */
  description: string
  /** Emoji used as a visual marker in the UI cards. */
  icon: string
  /** Tailwind gradient classes, e.g. "from-red-500 to-orange-500". */
  bgGradient: string
  /** Hex accent colour for badges, underlines, call-outs. */
  accentColor: string
  /** Where the main headline sits on the thumbnail. */
  textPosition: 'top' | 'center' | 'bottom'
  /** Default headline copy used when customText is not supplied. */
  sampleText: string
  /** Secondary supporting copy, e.g. "Limited Time Only". */
  sampleSubtext: string
  /** Best-fit platforms recommendation. */
  bestFor: ThumbnailPlatform[]
}

/** Body accepted by POST /api/ai/thumbnail. */
export interface ThumbnailRequest {
  productName: string
  price: number
  commissionRate: number
  template: ThumbnailTemplateId
  platform: ThumbnailPlatform
  /** Optional override for the headline text. */
  customText?: string
}

/** Response returned by the thumbnail generation API. */
export interface ThumbnailResult {
  /** Generated image URL (data URL for AI, placeholder URL for mock). */
  imageUrl: string
  template: ThumbnailTemplateId
  platform: ThumbnailPlatform
  size: ThumbnailSize
  /** Indicates whether the image came from z-ai-web-dev-sdk or a mock. */
  source: 'ai' | 'mock'
  /** Optional prompt that was sent to the image model. */
  prompt?: string
  /** Optional metadata about the generation (timing, model, etc.). */
  meta?: {
    generatedAt: string
    durationMs?: number
    model?: string
  }
}

/** Compact history entry kept client-side for the "Recent" strip. */
export interface ThumbnailHistoryEntry {
  id: string
  imageUrl: string
  template: ThumbnailTemplateId
  platform: ThumbnailPlatform
  productName: string
  createdAt: string
  source: 'ai' | 'mock'
}
