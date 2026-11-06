import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import type {
  MarketplaceDataSource,
  MarketplaceListing,
  SellerDashboard,
  SellerProfile,
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
 * GET /api/marketplace/seller
 *
 * Get seller's listings.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<SellerDashboard | { error: string; source: MarketplaceDataSource }>> {
  try {
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId') ?? userId ?? 'unknown'

    // Get listings owned by this seller
    const listings = await db.marketplaceListing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    })

    // Build seller profile from listing data
    const totalSales = listings.reduce((s, l) => s + l.downloadCount, 0)
    const totalRevenue = listings.reduce((s, l) => s + Number(l.price) * l.downloadCount, 0)
    const avgRating = listings.length > 0
      ? listings.reduce((s, l) => s + (l.rating?.toNumber() ?? 0), 0) / listings.length
      : 0

    const profile: SellerProfile = {
      id: sellerId,
      name: sellerId,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(sellerId)}/80/80`,
      bio: '',
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      listingCount: listings.filter((l) => l.status === 'active').length,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: 0,
      joinedAt: listings.length > 0 ? listings[listings.length - 1].createdAt.toISOString() : new Date().toISOString(),
      isCurrentUser: sellerId === userId,
    }

    // Monthly sales data (simplified — use download counts)
    const monthlyMap: Record<string, { sales: number; revenue: number }> = {}
    for (const l of listings) {
      const month = l.createdAt.toISOString().slice(0, 7)
      if (!monthlyMap[month]) monthlyMap[month] = { sales: 0, revenue: 0 }
      monthlyMap[month].sales += l.downloadCount
      monthlyMap[month].revenue += Number(l.price) * l.downloadCount
    }

    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleString('en', { month: 'short' }),
        sales: data.sales,
        revenue: Math.round(data.revenue * 100) / 100,
      }))

    const dashboard: SellerDashboard = {
      profile,
      listings: listings.map(mapListing),
      recentSales: [],
      monthly,
      totalEarnings: Math.round(totalRevenue * 100) / 100,
      totalSales,
      avgRating: Math.round(avgRating * 10) / 10,
      pendingPayout: 0,
      source: 'db' as MarketplaceDataSource,
    }

    return NextResponse.json(dashboard, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/seller] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch seller dashboard.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/marketplace/seller
 *
 * Update seller profile (for now, just return success).
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as MarketplaceDataSource },
        { status: 401 },
      )
    }

    const body = await request.json().catch(() => ({}))

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        {
          error: 'Name must be at least 2 characters.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    // In a full implementation, we'd have a SellerProfile table.
    // For now, return a success response with the profile data.
    const profile: SellerProfile = {
      id: userId,
      name: body.name.trim(),
      avatar: body.avatar?.trim() || `https://picsum.photos/seed/${encodeURIComponent(userId)}/80/80`,
      bio: body.bio?.trim() ?? '',
      totalSales: 0,
      totalRevenue: 0,
      listingCount: 0,
      rating: 0,
      reviewCount: 0,
      joinedAt: new Date().toISOString(),
      isCurrentUser: true,
    }

    return NextResponse.json({
      success: true,
      profile,
      source: 'db' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[POST /api/marketplace/seller] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create seller profile.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}
