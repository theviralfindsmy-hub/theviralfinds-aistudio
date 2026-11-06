import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, createCampaignSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/** Format a Campaign row for API response */
function formatCampaign(c: {
  id: string
  name: string
  description: string | null
  status: string
  budget: { toNumber: () => number } | null
  spent: { toNumber: () => number }
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: { links: number }
}) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    budget: c.budget ? c.budget.toNumber() : null,
    spent: c.spent.toNumber(),
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
    linksCount: c._count?.links ?? 0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

/**
 * GET /api/campaigns
 *
 * Query params: status, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          _count: { select: { links: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.campaign.count({ where }),
    ])

    return NextResponse.json({
      campaigns: campaigns.map(formatCampaign),
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
 * POST /api/campaigns
 *
 * Create a new Campaign.
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const data = await validateBody(request, createCampaignSchema)

    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: (data.status as 'active' | 'paused' | 'completed') || 'active',
        budget: data.budget || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json(formatCampaign(campaign), { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/campaigns
 *
 * Update a Campaign. Body must include `id`.
 */
export async function PUT(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('Campaign id is required')
    }

    const existing = await db.campaign.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Campaign not found')
    }

    // Build update data (only allow certain fields)
    const data: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'description', 'status', 'budget', 'spent', 'startDate', 'endDate',
    ]
    for (const field of allowedFields) {
      if (field in updates) {
        if ((field === 'startDate' || field === 'endDate') && updates[field]) {
          data[field] = new Date(updates[field])
        } else {
          data[field] = updates[field]
        }
      }
    }

    const campaign = await db.campaign.update({
      where: { id },
      data,
    })

    return NextResponse.json(formatCampaign(campaign))
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/campaigns
 *
 * Delete a Campaign. Body must include `id`.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('Campaign id is required')
    }

    const existing = await db.campaign.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Campaign not found')
    }

    // SetNull on links — campaignId on AffiliateLink will be set to null
    await db.campaign.delete({ where: { id } })

    return NextResponse.json({ message: 'Campaign deleted successfully', id })
  } catch (error) {
    return handleError(error)
  }
}
