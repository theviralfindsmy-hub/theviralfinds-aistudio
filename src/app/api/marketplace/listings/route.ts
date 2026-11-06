import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import type {
  CreateListingRequest,
  CreateListingResponse,
  ListingCategory,
  ListingNiche,
  ListingPlatform,
  ListingSort,
  MarketplaceDataSource,
  MarketplaceListing,
  MarketplaceListingsResponse,
} from '@/lib/marketplace/types'

const VALID_CATEGORIES: ListingCategory[] = [
  'video_scripts',
  'captions',
  'hashtag_sets',
  'thumbnail_designs',
  'live_scripts',
  'email_templates',
]

const VALID_PLATFORMS: ListingPlatform[] = ['shopee', 'tiktok', 'lazada', 'all']

const VALID_NICHES: ListingNiche[] = ['beauty', 'tech', 'fashion', 'home', 'food']

const VALID_SORTS: ListingSort[] = [
  'popular',
  'newest',
  'price_low',
  'price_high',
  'rating',
]

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
    category: row.category as ListingCategory,
    platform: (row.platform ?? 'all') as ListingPlatform,
    niche: (row.niche ?? 'beauty') as ListingNiche,
    price: row.price.toNumber(),
    sellerId: row.sellerId,
    sellerName: row.sellerId, // Will be enriched later if needed
    sellerAvatar: `https://picsum.photos/seed/${encodeURIComponent(row.sellerId)}/80/80`,
    downloads: row.downloadCount,
    rating: row.rating?.toNumber() ?? 0,
    reviewCount: 0, // Will be enriched
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

function parseCategories(raw: string | null): ListingCategory[] | null {
  if (!raw) return null
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean) as ListingCategory[]
  return parts.filter((c) => VALID_CATEGORIES.includes(c))
}

/**
 * GET /api/marketplace/listings
 *
 * List marketplace listings with pagination + filters.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<MarketplaceListingsResponse>> {
  try {
    const { searchParams } = new URL(request.url)

    const categories = parseCategories(searchParams.get('category'))
    const platform = (searchParams.get('platform') ?? 'all') as ListingPlatform
    const niche = (searchParams.get('niche') ?? 'all') as ListingNiche | 'all'
    const sort = (searchParams.get('sort') ?? 'popular') as ListingSort
    const q = searchParams.get('q')?.trim() ?? ''
    const minPrice = searchParams.has('minPrice')
      ? Number(searchParams.get('minPrice'))
      : 0
    const maxPrice = searchParams.has('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : Infinity
    const limit = searchParams.has('limit')
      ? Number(searchParams.get('limit'))
      : undefined
    const offset = searchParams.has('offset')
      ? Number(searchParams.get('offset'))
      : 0

    // Build where clause
    const where: Record<string, unknown> = {
      status: 'active',
    }

    if (categories && categories.length > 0) {
      where.category = { in: categories }
    }

    if (platform && platform !== 'all') {
      where.platform = platform
    }

    if (niche && niche !== 'all') {
      where.niche = niche
    }

    if (minPrice > 0 || maxPrice < Infinity) {
      where.price = {}
      if (minPrice > 0) (where.price as Record<string, unknown>).gte = minPrice
      if (maxPrice < Infinity) (where.price as Record<string, unknown>).lte = maxPrice
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ]
    }

    // Determine sort order
    const safeSort = VALID_SORTS.includes(sort) ? sort : 'popular'
    let orderBy: Record<string, string> = {}
    switch (safeSort) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price_low':
        orderBy = { price: 'asc' }
        break
      case 'price_high':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'popular':
      default:
        orderBy = { downloadCount: 'desc' }
        break
    }

    const take = limit && limit > 0 ? limit : 50

    const [listings, totalCount] = await Promise.all([
      db.marketplaceListing.findMany({
        where,
        orderBy,
        take,
        skip: offset,
      }),
      db.marketplaceListing.count({ where }),
    ])

    // Get featured listings (top 5 by downloads)
    const featured = await db.marketplaceListing.findMany({
      where: { status: 'active' },
      orderBy: { downloadCount: 'desc' },
      take: 5,
    })

    const mappedListings = listings.map(mapListing).map((l) => ({
      ...l,
      content: undefined, // Strip content from list response
    }))

    const mappedFeatured = featured.map(mapListing).map((l) => ({
      ...l,
      content: undefined,
    }))

    const body: MarketplaceListingsResponse = {
      listings: mappedListings,
      total: totalCount,
      featured: mappedFeatured,
      categories: VALID_CATEGORIES,
      source: 'db' as MarketplaceDataSource,
    }

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/listings] error:', error)
    return NextResponse.json(
      {
        listings: [],
        total: 0,
        featured: [],
        categories: VALID_CATEGORIES,
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/marketplace/listings
 *
 * Create a new listing.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateListingResponse>> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          listing: null as unknown as MarketplaceListing,
          source: 'db' as MarketplaceDataSource,
          error: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    let body: CreateListingRequest
    try {
      body = (await request.json()) as CreateListingRequest
    } catch {
      return NextResponse.json(
        {
          success: false,
          listing: null as unknown as MarketplaceListing,
          source: 'db' as MarketplaceDataSource,
          error: 'Invalid JSON body.',
        },
        { status: 400 },
      )
    }

    // Validate required fields
    const errors: string[] = []
    if (!body.title || body.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters.')
    }
    if (!body.description || body.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters.')
    }
    if (!VALID_CATEGORIES.includes(body.category)) {
      errors.push('Invalid category.')
    }
    if (!VALID_PLATFORMS.includes(body.platform)) {
      errors.push('Invalid platform.')
    }
    if (!VALID_NICHES.includes(body.niche)) {
      errors.push('Invalid niche.')
    }
    if (typeof body.price !== 'number' || body.price < 0 || body.price > 10000) {
      errors.push('Price must be a number between 0 and 10000.')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          listing: null as unknown as MarketplaceListing,
          source: 'db' as MarketplaceDataSource,
          error: errors.join(' '),
        },
        { status: 400 },
      )
    }

    const listing = await db.marketplaceListing.create({
      data: {
        sellerId: userId,
        title: body.title.trim(),
        description: body.description.trim(),
        category: body.category,
        niche: body.niche,
        platform: body.platform,
        price: body.price,
        content: JSON.stringify({
          body: body.contentBody?.trim() ?? '',
          usageNotes: 'Replace [PRODUCT], [PRICE], [BRAND], [AFFILIATE_LINK] with your own.',
          features: body.features ?? ['Custom listing — features to be added by seller.'],
        }),
        tags: body.tags ? JSON.stringify(body.tags) : null,
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      listing: mapListing(listing),
      source: 'db' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[POST /api/marketplace/listings] error:', error)
    return NextResponse.json(
      {
        success: false,
        listing: null as unknown as MarketplaceListing,
        source: 'db' as MarketplaceDataSource,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create marketplace listing.',
      },
      { status: 500 },
    )
  }
}
