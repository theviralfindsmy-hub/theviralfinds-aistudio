import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getTikTokServiceFromDB } from '@/lib/tiktok/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { validateBody } from '@/lib/validation'
import crypto from 'crypto'

/**
 * POST /api/tiktok/generate-link
 * Generate a TikTok Shop affiliate tracking link.
 * Priority: real TikTok API → DB link creation.
 *
 * Body: { productId?, productUrl?, subId?, productName?, productImage?, productPrice?, commissionRate?, category? }
 *  - At least one of `productId` or `productUrl` is required.
 */
const tiktokGenerateLinkSchema = z
  .object({
    productId: z.union([z.string(), z.number()]).optional(),
    productUrl: z.string().url().optional(),
    subId: z.string().max(100).optional(),
    productName: z.string().max(300).optional(),
    productImage: z.string().url().optional(),
    productPrice: z.number().nonnegative().optional(),
    commissionRate: z.number().nonnegative().max(100).optional(),
    category: z.string().max(100).optional(),
  })
  .refine((data) => data.productId || data.productUrl, {
    message: 'Either productId or productUrl is required',
    path: ['productId'],
  })

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    const data = await validateBody(request, tiktokGenerateLinkSchema)
    const { productId, productUrl, subId } = data

    let shortUrl = ''
    let longUrl = ''
    let deepLink = ''
    let generateUrl = ''
    let trackingId = ''
    let linkSource = 'db'

    // ── 1. Try real TikTok API first ──
    const service = await getTikTokServiceFromDB()
    if (!service.isUsingMock) {
      try {
        const link = await service.generateAffiliateLink({
          productId: productId !== undefined ? String(productId) : undefined,
          productUrl: productUrl || undefined,
          subId: subId || undefined,
        })
        shortUrl = link.shortUrl
        longUrl = link.longUrl
        deepLink = link.deepLink || ''
        generateUrl = link.generateUrl || longUrl
        trackingId = link.trackingId || ''
        linkSource = link.source === 'api' ? 'api' : 'db'
      } catch (apiError) {
        console.error('[TikTok Generate Link] API failed, creating DB link:', apiError)
      }
    }

    // ── 2. If no API access, create the affiliate link in DB with proper tracking ──
    if (!shortUrl && !longUrl) {
      const shortCode = crypto.randomBytes(4).toString('hex')
      shortUrl = `https://tvf.my/t/${shortCode}`
      longUrl = productUrl || `https://shop.tiktok.com/view/product/${productId || ''}`
      deepLink = `tiktok://product/${productId || 0}`
      generateUrl = longUrl
      trackingId = `tt-${shortCode}`
      linkSource = 'db'
    }

    // Generate a short code for the link
    const shortCode = trackingId || crypto.randomBytes(4).toString('hex')

    // Persist to AffiliateLink table
    let dbLinkId: string | null = null
    let saved = false

    try {
      const affiliateLink = await db.affiliateLink.create({
        data: {
          name: `TikTok Link - ${data.productName || productId || productUrl}`,
          productUrl: productUrl || `https://shop.tiktok.com/view/product/${productId || ''}`,
          affiliateUrl: shortUrl || longUrl,
          productId: productId ? String(productId) : null,
          productName: data.productName || null,
          productImage: data.productImage || null,
          productPrice: data.productPrice || null,
          commissionRate: data.commissionRate || null,
          category: data.category || null,
          shortCode,
          status: 'active',
          userId: userId || null,
        },
      })
      dbLinkId = affiliateLink.id
      saved = true
    } catch (dbError) {
      console.error('Failed to save TikTok affiliate link to DB:', dbError)
      // Non-fatal — link was generated, just not saved
    }

    return NextResponse.json({
      link: {
        shortUrl,
        longUrl,
        deepLink,
        generateUrl,
        trackingId,
      },
      saved,
      dbLinkId,
      source: linkSource,
    })
  } catch (error) {
    return handleError(error)
  }
}
