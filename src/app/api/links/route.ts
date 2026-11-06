import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { validateBody, createLinkSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

function generateShortCode(): string {
  return randomBytes(4).toString('hex')
}

/** Format an AffiliateLink row for API response (convert Decimal fields) */
function formatLink(link: Record<string, unknown>) {
  return {
    ...link,
    productPrice: link.productPrice ? Number(link.productPrice) : null,
    commission: link.commission ? Number(link.commission) : null,
    commissionRate: link.commissionRate ? Number(link.commissionRate) : null,
    earnings: Number(link.earnings),
    ctr: link.ctr ? Number(link.ctr) : null,
  }
}

/**
 * GET /api/links
 *
 * Query params: status, category, search, campaignId, page, limit, sort, order
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const userId = request.headers.get('x-user-id') || undefined
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const campaignId = searchParams.get('campaignId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (category) where.category = category
    if (campaignId) where.campaignId = campaignId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { productName: { contains: search } },
        { shortCode: { contains: search } },
        { productUrl: { contains: search } },
      ]
    }

    const [links, total] = await Promise.all([
      db.affiliateLink.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.affiliateLink.count({ where }),
    ])

    return NextResponse.json({
      links: links.map(formatLink),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/links
 *
 * Create a new AffiliateLink. Validates body with createLinkSchema.
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const userId = request.headers.get('x-user-id') || undefined
    const data = await validateBody(request, createLinkSchema)

    // Generate unique short code (retry on collision)
    let shortCode = generateShortCode()
    let existing = await db.affiliateLink.findUnique({ where: { shortCode } })
    let attempts = 0
    while (existing && attempts < 5) {
      shortCode = generateShortCode()
      existing = await db.affiliateLink.findUnique({ where: { shortCode } })
      attempts++
    }

    const link = await db.affiliateLink.create({
      data: {
        name: data.name,
        productUrl: data.productUrl,
        affiliateUrl: data.affiliateUrl,
        productId: data.productId || null,
        productName: data.productName || null,
        productImage: data.productImage || null,
        productPrice: data.productPrice || null,
        commission: data.commission || null,
        commissionRate: data.commissionRate || 5,
        category: data.category || null,
        campaignId: data.campaignId || null,
        userId: userId || data.userId || null,
        shortCode,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : null,
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(formatLink(link), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/links
 *
 * Update an existing AffiliateLink. Body must include `id`.
 */
export async function PUT(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const userId = request.headers.get('x-user-id') || undefined
    const body = await request.json()
    const { id, ...updates } = body

    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('Link id is required')
    }

    // Verify ownership if userId is present
    const existing = await db.affiliateLink.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Link not found')
    }
    if (userId && existing.userId && existing.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this link')
    }

    // Build update data (only allow certain fields)
    const data: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'productUrl', 'affiliateUrl', 'productId', 'productName',
      'productImage', 'productPrice', 'commission', 'commissionRate',
      'category', 'campaignId', 'status', 'expiresAt', 'tags',
    ]
    for (const field of allowedFields) {
      if (field in updates) {
        if (field === 'expiresAt' && updates[field]) {
          data[field] = new Date(updates[field])
        } else if (field === 'tags' && Array.isArray(updates[field])) {
          data[field] = JSON.stringify(updates[field])
        } else {
          data[field] = updates[field]
        }
      }
    }

    const link = await db.affiliateLink.update({
      where: { id },
      data,
      include: {
        campaign: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(formatLink(link))
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/links
 *
 * Delete an AffiliateLink. Body must include `id`.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const userId = request.headers.get('x-user-id') || undefined
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('Link id is required')
    }

    const existing = await db.affiliateLink.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Link not found')
    }
    if (userId && existing.userId && existing.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this link')
    }

    await db.affiliateLink.delete({ where: { id } })

    return NextResponse.json({ message: 'Link deleted successfully', id })
  } catch (error) {
    return handleError(error)
  }
}
