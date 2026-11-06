import type { ThumbnailTemplate, ThumbnailTemplateId } from './types'

/**
 * Six click-worthy thumbnail templates tuned for the Malaysian affiliate
 * market. Each template ships with a gradient, accent colour, sample copy
 * (Malay/Manglish friendly), and a "best fit" platform recommendation.
 */
export const THUMBNAIL_TEMPLATES: Record<ThumbnailTemplateId, ThumbnailTemplate> = {
  flash_sale: {
    id: 'flash_sale',
    name: 'Flash Sale',
    description: 'Red-to-orange gradient with a big discount % and urgency text',
    icon: '🔥',
    bgGradient: 'from-red-600 to-orange-500',
    accentColor: '#facc15',
    textPosition: 'center',
    sampleText: '60% OFF',
    sampleSubtext: 'Limited Time Only',
    bestFor: ['tiktok', 'instagram_story', 'facebook'],
  },
  product_demo: {
    id: 'product_demo',
    name: 'Product Demo',
    description: 'Clean white background, product centered, features list',
    icon: '🎯',
    bgGradient: 'from-slate-50 to-slate-200',
    accentColor: '#0f172a',
    textPosition: 'bottom',
    sampleText: 'NEW ARRIVAL',
    sampleSubtext: 'Try It Today',
    bestFor: ['instagram_square', 'youtube', 'facebook'],
  },
  comparison: {
    id: 'comparison',
    name: 'Comparison',
    description: 'Split-screen BEFORE / AFTER or product A vs B layout',
    icon: '⚖️',
    bgGradient: 'from-zinc-900 to-zinc-700',
    accentColor: '#22d3ee',
    textPosition: 'center',
    sampleText: 'BEFORE vs AFTER',
    sampleSubtext: 'Which One Wins?',
    bestFor: ['youtube', 'facebook', 'instagram_square'],
  },
  unboxing: {
    id: 'unboxing',
    name: 'Unboxing',
    description: 'Warm amber tones, surprised face emoji, REVIEW tag',
    icon: '📦',
    bgGradient: 'from-amber-500 to-rose-500',
    accentColor: '#fef3c7',
    textPosition: 'top',
    sampleText: 'UNBOXING',
    sampleSubtext: 'Worth It?',
    bestFor: ['tiktok', 'instagram_story', 'youtube'],
  },
  tutorial: {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Numbered steps preview with a HOW TO tag',
    icon: '📚',
    bgGradient: 'from-emerald-600 to-teal-600',
    accentColor: '#fde68a',
    textPosition: 'top',
    sampleText: 'HOW TO',
    sampleSubtext: 'Step 1 · 2 · 3',
    bestFor: ['youtube', 'instagram_square', 'tiktok'],
  },
  testimonial: {
    id: 'testimonial',
    name: 'Testimonial',
    description: '5-star rating with customer quote styling',
    icon: '💬',
    bgGradient: 'from-amber-400 to-yellow-300',
    accentColor: '#7c2d12',
    textPosition: 'center',
    sampleText: '★★★★★',
    sampleSubtext: 'Real Customer Review',
    bestFor: ['instagram_square', 'facebook', 'youtube'],
  },
}

/** Ordered list of templates — convenient for rendering grids. */
export const THUMBNAIL_TEMPLATE_LIST: ThumbnailTemplate[] = Object.values(
  THUMBNAIL_TEMPLATES
)

/** Look up a template by id with a sensible fallback to flash_sale. */
export function getTemplate(id: ThumbnailTemplateId): ThumbnailTemplate {
  return THUMBNAIL_TEMPLATES[id] ?? THUMBNAIL_TEMPLATES.flash_sale
}
