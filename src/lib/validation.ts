import { z, type ZodType } from 'zod'
import { ApiError } from './api-error'

/**
 * Validate `body` against a Zod schema. Throws ApiError(400) on failure.
 *
 * @example
 *   const Schema = z.object({ name: z.string().min(1), url: z.string().url() })
 *   const data = await validateBody(req, Schema)
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<T> {
  let body: unknown
  try {
    const text = await req.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    throw ApiError.badRequest('Invalid JSON in request body')
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodIssues(result.error.issues))
  }
  return result.data
}

/**
 * Validate query string params against a Zod schema.
 * Throws ApiError(400) on failure.
 *
 * @example
 *   const Schema = z.object({ q: z.string().min(1), page: z.coerce.number().int().positive().default(1) })
 *   const { q, page } = validateQuery(request, Schema)
 */
export function validateQuery<T>(
  req: Request,
  schema: ZodType<T>
): T {
  const url = new URL(req.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)
  if (!result.success) {
    throw ApiError.badRequest(
      'Invalid query parameters',
      formatZodIssues(result.error.issues)
    )
  }
  return result.data
}

function formatZodIssues(
  issues: Array<{ path?: PropertyKey[]; message?: string }>
) {
  return issues.map((i) => ({
    path: Array.isArray(i.path) ? i.path.join('.') : '',
    message: i.message ?? 'Invalid value',
  }))
}

// ─── Pre-built Schemas for Common API Routes ─────────────────────────────────

/** POST /api/links */
export const createLinkSchema = z.object({
  name: z.string().min(1, 'Link name is required').max(200),
  productUrl: z.string().url('productUrl must be a valid URL'),
  affiliateUrl: z.string().url('affiliateUrl must be a valid URL'),
  productId: z.string().optional().nullable(),
  productName: z.string().max(300).optional().nullable(),
  productImage: z.string().url().optional().nullable(),
  productPrice: z.number().nonnegative().optional().nullable(),
  commission: z.number().nonnegative().optional().nullable(),
  commissionRate: z.number().nonnegative().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  campaignId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
})

/** POST /api/shopee/generate-link */
export const generateLinkSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  productUrl: z.string().url().optional(),
  subId: z.string().max(100).optional(),
  deepLinkType: z.enum(['default', 'deep_link', 'short_link']).optional(),
}).refine(
  (data) => data.productId || data.productUrl,
  { message: 'Either productId or productUrl is required', path: ['productId'] }
)

/** POST /api/shopee/connect */
export const shopeeConnectSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  secret: z.string().min(1, 'Secret is required'),
  region: z.enum(['MY', 'SG', 'ID', 'TH', 'PH', 'VN']).default('MY'),
  accessToken: z.string().optional().nullable(),
})

/** POST /api/hermes/chat */
export const hermesChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10_000),
  conversationId: z.string().optional().nullable(),
})

/** POST /api/hermes/connection */
export const hermesConnectionSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid URL'),
  apiKey: z.string().optional().nullable(),
  model: z.string().max(100).optional(),
  name: z.string().max(100).optional(),
})

/** POST /api/content/generate */
export const contentGenerateSchema = z.object({
  type: z.enum(['caption', 'script', 'hashtags', 'live_script', 'review', 'comparison']),
  product: z.string().min(1, 'Product is required').max(500),
  niche: z.string().max(200).optional(),
  platform: z.enum(['tiktok', 'instagram', 'facebook', 'youtube', 'shopee_live']).optional(),
  language: z.enum(['english', 'bahasa', 'manglish']).optional(),
  tone: z.enum(['casual', 'professional', 'excited', 'funny']).optional(),
})

/** POST /api/content/library */
export const contentLibraryCreateSchema = z.object({
  type: z.string().min(1).max(50),
  platform: z.string().max(50).optional().nullable(),
  niche: z.string().max(100).optional().nullable(),
  product: z.string().max(300).optional().nullable(),
  content: z.string().min(1).max(10_000),
  language: z.string().max(50).optional().nullable(),
  tone: z.string().max(50).optional().nullable(),
})

/** POST /api/autopost */
export const createAutoPostSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(5000),
  platforms: z.array(z.string().min(1)).min(1, 'At least one platform is required'),
  scheduledAt: z.string().datetime('scheduledAt must be an ISO date'),
  productUrl: z.string().url().optional().nullable(),
  affiliateLink: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  hashtags: z.array(z.string()).optional().nullable(),
})

/** PATCH /api/autopost/[id] */
export const updateAutoPostSchema = z.object({
  status: z.enum(['scheduled', 'publishing', 'published', 'failed', 'partial']).optional(),
  caption: z.string().max(5000).optional(),
  platforms: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  result: z.record(z.string(), z.unknown()).optional().nullable(),
  retryCount: z.number().int().min(0).max(10).optional(),
  errorMessage: z.string().max(2000).optional().nullable(),
})

/** POST /api/social/connect — body for initiating OAuth (optional, used for demo) */
export const socialConnectSchema = z.object({
  redirectAfter: z.string().url().optional(),
})

/** POST /api/social/post — publish a scheduled post to platforms */
export const socialPostSchema = z.object({
  postId: z.string().min(1).optional(),
  caption: z.string().min(1).max(5000).optional(),
  platforms: z.array(z.string().min(1)).min(1).optional(),
  productUrl: z.string().url().optional().nullable(),
  affiliateLink: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  hashtags: z.array(z.string()).optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
}).refine(
  (data) => data.postId || (data.caption && data.platforms),
  { message: 'Either postId or (caption + platforms) is required', path: ['postId'] }
)

/** POST /api/profit/calculator */
export const profitCalculatorSchema = z.object({
  product: z.object({
    name: z.string().max(300).optional(),
    price: z.number().positive('Product price must be positive'),
    commissionRate: z.number().nonnegative('Commission rate is required'),
  }),
  dailyViews: z.number().int().positive().max(1_000_000).optional(),
  clickRate: z.number().min(0.01).max(100).optional(),
  conversionRate: z.number().min(0.01).max(100).optional(),
  commissionType: z.enum(['same-shop', 'different-shop']).optional(),
})

/** POST /api/profit/score — wraps the product input */
export const profitScoreSchema = z.object({
  product: z.object({
    name: z.string().min(1, 'Product name is required').max(300),
    price: z.number().positive('Price must be positive'),
    commissionRate: z.number().nonnegative('Commission rate is required'),
    category: z.string().max(100).optional(),
    sales: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
  }),
})

/** POST /api/studio/script */
export const studioScriptSchema = z.object({
  product: z.string().min(1, 'Product is required').max(300),
  template: z.enum([
    'before_after', 'unboxing', 'demo', 'price_reveal',
    'comparison', 'problem_solution', 'testimonial', 'top5',
  ]).default('demo'),
  duration: z.number().int().min(5).max(300).default(30),
  platform: z.enum(['tiktok', 'instagram', 'youtube']).optional(),
  language: z.enum(['english', 'bahasa', 'manglish']).optional(),
})

/** POST /api/studio/tts */
export const studioTtsSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
  voice: z.string().max(50).optional(),
  speed: z.number().min(0.5).max(2).optional(),
})

/** POST /api/studio/caption */
export const studioCaptionSchema = z.object({
  script: z.union([z.string().min(1).max(10_000), z.record(z.string(), z.unknown())]),
  duration: z.number().int().min(5).max(600).optional(),
})

/** POST /api/ai/thumbnail */
export const aiThumbnailSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(300),
  price: z.number().nonnegative('Price must be non-negative'),
  commissionRate: z.number().nonnegative('Commission rate must be non-negative').max(100),
  template: z.enum([
    'flash_sale', 'product_demo', 'comparison',
    'unboxing', 'tutorial', 'testimonial',
  ]),
  platform: z.enum([
    'tiktok', 'instagram_square', 'instagram_story', 'facebook', 'youtube',
  ]),
  customText: z.string().max(200).optional(),
})

/** POST /api/campaigns */
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
})

/** PATCH /api/notifications */
export const updateNotificationsSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
}).refine(
  (data) => data.id || data.ids || data.markAll,
  { message: 'Provide id, ids, or markAll', path: [] }
)
