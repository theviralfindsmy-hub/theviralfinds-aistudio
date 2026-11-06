import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import type {
  MarketplaceDataSource,
  MarketplaceListing,
  MarketplaceListingDetailResponse,
  UpdateListingRequest,
} from '@/lib/marketplace/types'

/**
 * Map a Prisma MarketplaceListing to the API MarketplaceListing type.
 */
function mapListing(row: {
  id: string
  sellerId: string
  title: string
  description: string
  category: string
  niche: string | null
  platform: string | null
  price: { toNumber: () => number }
  rating: { toNumber: () => number } | null
  downloadCount: number
  content: string
  tags: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}): MarketplaceListing {
  const parsedContent = JSON.parse(row.content) as Record<string, unknown>
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as MarketplaceListing['category'],
    platform: (row.platform ?? 'all') as MarketplaceListing['platform'],
    niche: (row.niche ?? 'beauty') as MarketplaceListing['niche'],
    price: row.price.toNumber(),
    sellerId: row.sellerId,
    sellerName: row.sellerId,
    sellerAvatar: `https://picsum.photos/seed/${encodeURIComponent(row.sellerId)}/80/80`,
    downloads: row.downloadCount,
    rating: row.rating?.toNumber() ?? 0,
    reviewCount: 0,
    previewUrl: `https://picsum.photos/seed/${encodeURIComponent(row.id)}/400/300`,
    tags: row.tags ? JSON.parse(row.tags) : [],
    previewSnippet: row.description.slice(0, 100),
    content: parsedContent as { body: string; usageNotes?: string },
    features: Array.isArray(parsedContent?.features) ? parsedContent.features as string[] : [],
    isActive: row.status === 'active',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/**
 * GET /api/marketplace/listings/[id]
 *
 * Get listing with reviews.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<
    MarketplaceListingDetailResponse | { error: string; source: MarketplaceDataSource }
  >
> {
  try {
    const { id } = await params
    const listing = await db.marketplaceListing.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!listing || listing.status !== 'active') {
      return NextResponse.json(
        {
          error: `Listing "${id}" not found.`,
          source: 'db' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    const reviews = listing.reviews.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      reviewerName: r.userName,
      reviewerAvatar: `https://picsum.photos/seed/${encodeURIComponent(r.id)}/80/80`,
      rating: r.rating,
      comment: r.comment ?? '',
      createdAt: r.createdAt.toISOString(),
    }))

    // Get related listings (same category, different listing)
    const related = await db.marketplaceListing.findMany({
      where: {
        category: listing.category,
        status: 'active',
        id: { not: id },
      },
      take: 4,
      orderBy: { downloadCount: 'desc' },
    })

    const mappedListing = mapListing(listing)
    // Update review count
    mappedListing.reviewCount = reviews.length

    const body: MarketplaceListingDetailResponse = {
      listing: mappedListing,
      reviews,
      related: related.map(mapListing).map((l) => ({
        ...l,
        content: undefined,
      })),
      source: 'db' as MarketplaceDataSource,
    }

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch listing.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/marketplace/listings/[id]
 *
 * Update a listing owned by the current user.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    const listing = await db.marketplaceListing.findUnique({ where: { id } })

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: `Listing "${id}" not found.`,
          source: 'db' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    if (userId && listing.sellerId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only edit listings you own.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    let body: UpdateListingRequest
    try {
      body = (await request.json()) as UpdateListingRequest
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    const existingContent = JSON.parse(listing.content) as Record<string, unknown>
    const updatedContent = {
      ...existingContent,
      body: body.contentBody?.trim() ?? existingContent.body,
      features: body.features ?? existingContent.features,
    }

    const updated = await db.marketplaceListing.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? listing.title,
        description: body.description?.trim() ?? listing.description,
        price: typeof body.price === 'number' ? body.price : listing.price,
        content: JSON.stringify(updatedContent),
        tags: body.tags ? JSON.stringify(body.tags) : listing.tags,
        status: body.isActive === false ? 'archived' : listing.status,
      },
    })

    return NextResponse.json({
      success: true,
      listing: mapListing(updated),
      source: 'db' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[PATCH /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update listing.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/marketplace/listings/[id]
 *
 * Soft-deletes (sets status='archived') a listing owned by the current user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params
    const listing = await db.marketplaceListing.findUnique({ where: { id } })

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: `Listing "${id}" not found.`,
          source: 'db' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    if (userId && listing.sellerId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only delete listings you own.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    // Soft-delete: mark as archived.
    await db.marketplaceListing.update({
      where: { id },
      data: { status: 'archived' },
    })

    return NextResponse.json({
      success: true,
      source: 'db' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[DELETE /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete listing.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}
