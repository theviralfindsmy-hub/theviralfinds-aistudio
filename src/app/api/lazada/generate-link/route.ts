import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import crypto from 'crypto'

/**
 * POST /api/lazada/generate-link
 * Generate a Lazada affiliate tracking link.
 * Priority: real Lazada API → DB link creation.
 *
 * Body: { productId?, productUrl?, subId?, productName?, productImage?, productPrice?, commissionRate?, category? }
 * Either productId or productUrl is required.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    let body: {
      productId?: number | string
      productUrl?: string
      subId?: string
      productName?: string
      productImage?: string
      productPrice?: number
      commissionRate?: number
      category?: string
    }
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const { productId, productUrl, subId, productName, productImage, productPrice, commissionRate, category } = body

    if (!productId && !productUrl) {
      throw ApiError.badRequest('Either productId or productUrl is required')
    }

    let shortUrl = ''
    let longUrl = ''
    let deepLink = ''
    let trackingUrl = ''
    let linkSource = 'db'

    // ── 1. Try real Lazada API first ──
    const service = await getLazadaServiceFromDB()
    if (!service.isUsingMock) {
      try {
        const itemId =
          productId !== undefined
            ? typeof productId === 'number'
              ? productId
              : parseInt(String(productId), 10)
            : undefined

        if (itemId !== undefined && isNaN(itemId)) {
          throw ApiError.badRequest('productId must be a valid number')
        }

        const link = await service.generateAffiliateLink({
          itemId,
          productUrl: productUrl || undefined,
          subId: subId || undefined,
        })

        shortUrl = link.shortUrl
        longUrl = link.longUrl
        deepLink = link.deepLink || ''
        trackingUrl = link.trackingUrl || ''
        linkSource = link.source === 'api' ? 'api' : 'db'
      } catch (apiError) {
        console.error('[Lazada Generate Link] API failed, creating DB link:', apiError)
      }
    }

    // ── 2. If no API access, create the affiliate link in DB with proper tracking ──
    if (!shortUrl && !longUrl) {
      const shortCode = crypto.randomBytes(4).toString('hex')
      shortUrl = `https://tvf.my/l/${shortCode}`
      longUrl = productUrl || `https://www.lazada.com.my/products/-i${productId || ''}.html`
      deepLink = `lazada://product/${productId || 0}`
      trackingUrl = longUrl
      linkSource = 'db'
    }

    // Generate a short code for the link
    const shortCode = crypto.randomBytes(4).toString('hex')

    // Persist to AffiliateLink table
    let dbLinkId: string | null = null
    let saved = false

    try {
      const affiliateLink = await db.affiliateLink.create({
        data: {
          name: `Lazada Link - ${productName || productId || productUrl}`,
          productUrl: productUrl || `https://www.lazada.com.my/products/-i${productId || ''}.html`,
          affiliateUrl: shortUrl || longUrl,
          productId: productId ? String(productId) : null,
          productName: productName || null,
          productImage: productImage || null,
          productPrice: productPrice || null,
          commissionRate: commissionRate || null,
          category: category || null,
          shortCode,
          status: 'active',
          userId: userId || null,
        },
      })
      dbLinkId = affiliateLink.id
      saved = true
    } catch (dbError) {
      console.error('Failed to save Lazada affiliate link to DB:', dbError)
      // Non-fatal
    }

    return NextResponse.json({
      link: {
        shortUrl,
        longUrl,
        deepLink,
        trackingUrl,
        subId: subId || null,
      },
      saved,
      dbLinkId,
      source: linkSource,
    })
  } catch (error) {
    return handleError(error)
  }
}
