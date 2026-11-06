import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import { validateBody, generateLinkSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'
import crypto from 'crypto'

/**
 * POST /api/shopee/generate-link
 * Generate a Shopee affiliate tracking link and save to DB
 *
 * Body: { productId?, productUrl?, subId?, deepLinkType? }
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    const userId = request.headers.get('x-user-id') || undefined
    const data = await validateBody(request, generateLinkSchema)
    const { productId, productUrl, subId, deepLinkType } = data

    let shortUrl = ''
    let longUrl = ''
    let deepLink = ''
    let generateUrl = ''
    let linkSource = 'db'

    // ── 1. Try real Shopee API first if credentials exist ──
    try {
      const shopeeService = await getShopeeServiceFromDB()
      if (shopeeService && !shopeeService.isUsingMock) {
        const link = await shopeeService.generateAffiliateLink({
          itemId: productId ? Number(productId) : undefined,
          productUrl: productUrl || undefined,
          subId: subId || undefined,
          deepLinkType: (deepLinkType as 'default' | 'app_only') || 'default',
        })
        shortUrl = link.shortUrl
        longUrl = link.longUrl
        deepLink = link.deepLink
        generateUrl = link.generateUrl
        linkSource = link.source === 'graphql_api' ? 'graphql_api' : 'api'
      }
    } catch (apiError) {
      console.error('[Shopee Generate Link] API failed, creating DB link:', apiError)
    }

    // ── 2. If no API access, create the affiliate link in our DB with proper tracking ──
    if (!shortUrl && !longUrl) {
      const productIdentifier = productId || productUrl || 'unknown'
      shortUrl = `https://tvf.my/s/${crypto.randomBytes(4).toString('hex')}`
      longUrl = productUrl || `https://shopee.com.my/product/-/${productId || 0}`
      deepLink = `shopee://product/${productId || 0}`
      generateUrl = longUrl
      linkSource = 'db'
    }

    // Generate a short code for the link
    const shortCode = crypto.randomBytes(4).toString('hex')

    // Store in AffiliateLink table
    let dbLinkId: string | null = null
    let saved = false

    try {
      const affiliateLink = await db.affiliateLink.create({
        data: {
          name: `Shopee Link - ${productId || productUrl || shortCode}`,
          productUrl: productUrl || `https://shopee.com.my/product/-/${productId || 0}`,
          affiliateUrl: shortUrl || longUrl,
          productId: productId ? String(productId) : null,
          shortCode,
          status: 'active',
          userId: userId || null,
        },
      })
      dbLinkId = affiliateLink.id
      saved = true
    } catch (dbError) {
      console.error('Failed to save affiliate link to DB:', dbError)
      // Non-fatal — link was generated, just not saved
    }

    return NextResponse.json({
      link: {
        shortUrl,
        longUrl,
        deepLink,
        generateUrl,
      },
      saved,
      dbLinkId,
      source: linkSource,
    })
  } catch (error) {
    return handleError(error)
  }
}
