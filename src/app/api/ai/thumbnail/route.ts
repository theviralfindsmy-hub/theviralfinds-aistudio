import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { getTemplate } from '@/lib/thumbnails/templates'
import { getSize, getSdkSizeForPlatform } from '@/lib/thumbnails/sizes'
import type {
  ThumbnailPlatform,
  ThumbnailResult,
  ThumbnailTemplateId,
} from '@/lib/thumbnails/types'

/**
 * Lightweight body parser. We intentionally do not pull in the shared
 * `validateBody` helper here because we want a custom error shape that
 * includes the failed field name for the form UI.
 */
const bodySchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(300),
  price: z.number().nonnegative(),
  commissionRate: z.number().nonnegative().max(100),
  template: z.enum([
    'flash_sale',
    'product_demo',
    'comparison',
    'unboxing',
    'tutorial',
    'testimonial',
  ]),
  platform: z.enum([
    'tiktok',
    'instagram_square',
    'instagram_story',
    'facebook',
    'youtube',
  ]),
  customText: z.string().max(200).optional(),
})

/**
 * Build the prompt sent to the z-ai-web-dev-sdk image model. The prompt is
 * intentionally explicit about layout, typography, and Malaysian context so
 * the model produces thumbnails that look click-worthy on TikTok / IG / FB.
 */
function buildPrompt(args: {
  productName: string
  price: number
  commissionRate: number
  templateId: ThumbnailTemplateId
  platform: ThumbnailPlatform
  customText?: string
}): string {
  const tpl = getTemplate(args.templateId)
  const size = getSize(args.platform)
  const headline = (args.customText?.trim() || tpl.sampleText).toUpperCase()
  const rm = `RM ${args.price.toFixed(2)}`
  const commission = `${args.commissionRate.toFixed(1)}% commission`

  const styleNotes: Record<ThumbnailTemplateId, string> = {
    flash_sale:
      'Bold red-to-orange diagonal gradient background, giant yellow "60% OFF" headline centered, product name at the bottom in white, urgency ribbon saying "LIMITED TIME ONLY", high-contrast social media thumbnail aesthetic, no watermark',
    product_demo:
      'Clean white studio background, product centered with soft shadow, "NEW ARRIVAL" badge in the top-right corner, product name along the bottom in dark sans-serif, minimal premium e-commerce thumbnail style, no watermark',
    comparison:
      'Split-screen layout with a vertical divider, "BEFORE" label on the left (desaturated, dull) and "AFTER" label on the right (vibrant, glowing), product name along the bottom in white, dark moody background, no watermark',
    unboxing:
      'Warm amber-to-rose gradient, excited surprised face emoji in the top-left, large "UNBOXING" tag at the top, "WORTH IT?" question text near the product, playful and curiosity-driven TikTok thumbnail style, no watermark',
    tutorial:
      'Emerald-to-teal gradient background, "HOW TO" tag at the top in a yellow pill, three numbered step previews (1 · 2 · 3) running down the side, product name along the bottom, clean educational YouTube thumbnail style, no watermark',
    testimonial:
      'Golden amber gradient background, five large gold stars (★★★★★) at the center, customer quote bubble in the middle, "REAL CUSTOMER REVIEW" subtext, trustworthy testimonial card aesthetic, no watermark',
  }

  return [
    `A ${size.orientation} (${size.width}x${size.height}) social media thumbnail for the Malaysian market.`,
    `Product: ${args.productName}.`,
    `Price label: ${rm}. Commission tag: ${commission}.`,
    `Headline text: "${headline}".`,
    `Visual style: ${styleNotes[args.templateId]}.`,
    `Make it click-worthy, eye-catching, and clearly readable at small sizes. No watermarks, no extra text beyond what is specified.`,
  ].join(' ')
}

/**
 * Generate a mock placeholder image as an SVG data URL. The SVG mimics the
 * selected template so the UI still gets a believable preview even when the
 * z-ai-web-dev-sdk image endpoint is unavailable (network error, quota, etc).
 */
function buildMockSvg(args: {
  productName: string
  price: number
  commissionRate: number
  templateId: ThumbnailTemplateId
  platform: ThumbnailPlatform
  customText?: string
}): string {
  const tpl = getTemplate(args.templateId)
  const size = getSize(args.platform)
  const headline = (args.customText?.trim() || tpl.sampleText).toUpperCase()
  const sub = tpl.sampleSubtext
  const rm = `RM ${args.price.toFixed(2)}`
  const commission = `${args.commissionRate.toFixed(1)}% KOMISEN`

  // Gradient stops per template — kept in sync with the UI preview cards.
  const gradients: Record<ThumbnailTemplateId, [string, string]> = {
    flash_sale: ['#dc2626', '#f97316'],
    product_demo: ['#f8fafc', '#cbd5e1'],
    comparison: ['#18181b', '#52525b'],
    unboxing: ['#f59e0b', '#f43f5e'],
    tutorial: ['#059669', '#0d9488'],
    testimonial: ['#fbbf24', '#fde047'],
  }
  const [c1, c2] = gradients[args.templateId]
  const isLightBg = args.templateId === 'product_demo' || args.templateId === 'testimonial'
  const textMain = isLightBg ? '#0f172a' : '#ffffff'
  const textSub = isLightBg ? '#475569' : 'rgba(255,255,255,0.85)'

  // Approximate font sizing relative to image width.
  const headSize = Math.round(size.width * 0.13)
  const nameSize = Math.round(size.width * 0.055)
  const subSize = Math.round(size.width * 0.035)
  const tagSize = Math.round(size.width * 0.045)

  const yByPos =
    tpl.textPosition === 'top'
      ? size.height * 0.22
      : tpl.textPosition === 'bottom'
        ? size.height * 0.78
        : size.height * 0.42

  // Optional accent ribbon at the top for "tag" templates.
  const tag =
    args.templateId === 'unboxing' || args.templateId === 'tutorial'
      ? `
        <g>
          <rect x="0" y="0" width="${size.width * 0.5}" height="${size.height * 0.08}" fill="${tpl.accentColor}" />
          <text x="${size.width * 0.06}" y="${size.height * 0.055}" font-family="Arial, sans-serif" font-weight="800" font-size="${tagSize}" fill="${args.templateId === 'unboxing' ? '#7c2d12' : '#0f172a'}">${tpl.icon} ${tpl.sampleText}</text>
        </g>`
      : ''

  // Comparison split divider.
  const comparisonOverlay =
    args.templateId === 'comparison'
      ? `
        <line x1="${size.width / 2}" y1="0" x2="${size.width / 2}" y2="${size.height}" stroke="${tpl.accentColor}" stroke-width="6" />
        <text x="${size.width * 0.25}" y="${size.height * 0.5}" font-family="Arial, sans-serif" font-weight="800" font-size="${headSize * 0.7}" fill="#ffffff" text-anchor="middle">BEFORE</text>
        <text x="${size.width * 0.75}" y="${size.height * 0.5}" font-family="Arial, sans-serif" font-weight="800" font-size="${headSize * 0.7}" fill="${tpl.accentColor}" text-anchor="middle">AFTER</text>`
      : ''

  // Testimonial stars.
  const stars =
    args.templateId === 'testimonial'
      ? `<text x="${size.width / 2}" y="${size.height * 0.35}" font-family="Arial, sans-serif" font-weight="800" font-size="${headSize}" fill="${tpl.accentColor === '#fde68a' ? '#b45309' : tpl.accentColor}" text-anchor="middle">★★★★★</text>`
      : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    ${tag}
    ${comparisonOverlay}
    ${stars}
    <text x="${size.width / 2}" y="${yByPos}" font-family="Arial, sans-serif" font-weight="900" font-size="${headSize}" fill="${textMain}" text-anchor="middle">${escapeXml(headline)}</text>
    <text x="${size.width / 2}" y="${yByPos + headSize * 0.9}" font-family="Arial, sans-serif" font-weight="600" font-size="${subSize * 1.2}" fill="${textSub}" text-anchor="middle">${escapeXml(sub)}</text>
    <text x="${size.width / 2}" y="${size.height * 0.85}" font-family="Arial, sans-serif" font-weight="800" font-size="${nameSize * 1.2}" fill="${textMain}" text-anchor="middle">${escapeXml(args.productName)}</text>
    <text x="${size.width / 2}" y="${size.height * 0.91}" font-family="Arial, sans-serif" font-weight="700" font-size="${nameSize}" fill="${tpl.accentColor}" text-anchor="middle">${rm} · ${commission}</text>
    <text x="${size.width / 2}" y="${size.height * 0.97}" font-family="Arial, sans-serif" font-weight="500" font-size="${subSize}" fill="${textSub}" text-anchor="middle">${tpl.icon} ${tpl.name} • ${size.label}</text>
  </svg>`

  // Base64-encode the SVG so it can be served as a data URL.
  const base64 = Buffer.from(svg, 'utf8').toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.ai)
    if (limited) return limited

    let body: unknown
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    const { productName, price, commissionRate, template, platform, customText } =
      parsed.data
    const size = getSize(platform)
    const prompt = buildPrompt({
      productName,
      price,
      commissionRate,
      templateId: template,
      platform,
      customText,
    })

    // --- Try the real z-ai-web-dev-sdk image endpoint ----------------------
    try {
      const zai = await ZAI.create()
      const sdkSize = getSdkSizeForPlatform(platform)
      const gen = await zai.images.generations.create({
        prompt,
        size: sdkSize,
      })

      const b64 = gen?.data?.[0]?.base64
      if (b64) {
        const dataUrl = b64.startsWith('data:')
          ? b64
          : `data:image/png;base64,${b64}`
        const result: ThumbnailResult = {
          imageUrl: dataUrl,
          template,
          platform,
          size,
          source: 'ai',
          prompt,
          meta: {
            generatedAt: new Date().toISOString(),
            durationMs: Date.now() - startedAt,
            model: 'z-ai-image',
          },
        }
        return NextResponse.json(result)
      }
      // If we got no base64, fall through to the mock generator.
      console.warn('[api/ai/thumbnail] AI returned no image data, using mock')
    } catch (aiError) {
      console.error('[api/ai/thumbnail] AI generation error:', aiError)
      // fall through to mock
    }

    // --- Mock fallback -----------------------------------------------------
    const mockUrl = buildMockSvg({
      productName,
      price,
      commissionRate,
      templateId: template,
      platform,
      customText,
    })
    const mockResult: ThumbnailResult = {
      imageUrl: mockUrl,
      template,
      platform,
      size,
      source: 'mock',
      prompt,
      meta: {
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        model: 'mock-svg',
      },
    }
    return NextResponse.json(mockResult)
  } catch (error) {
    return handleError(error)
  }
}

/** Lightweight GET endpoint — used by the UI to verify the route is alive. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/ai/thumbnail',
    method: 'POST',
    templates: [
      'flash_sale',
      'product_demo',
      'comparison',
      'unboxing',
      'tutorial',
      'testimonial',
    ],
    platforms: [
      'tiktok',
      'instagram_square',
      'instagram_story',
      'facebook',
      'youtube',
    ],
  })
}
