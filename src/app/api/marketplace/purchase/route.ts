import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import {
  MARKETPLACE_FEE_PERCENT,
  type MarketplaceDataSource,
  type PaymentMethod,
  type Purchase,
  type PurchaseRequest,
  type PurchaseResponse,
} from '@/lib/marketplace/types'

const VALID_METHODS: PaymentMethod[] = ['stripe', 'billplz']

/**
 * POST /api/marketplace/purchase
 *
 * Record a purchase (increment downloadCount).
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<PurchaseResponse | { error: string; source: MarketplaceDataSource }>> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as MarketplaceDataSource },
        { status: 401 },
      )
    }

    let body: PurchaseRequest
    try {
      body = (await request.json()) as PurchaseRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!body.listingId || typeof body.listingId !== 'string') {
      return NextResponse.json(
        {
          error: 'Field "listingId" is required.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!VALID_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json(
        {
          error: 'Field "paymentMethod" must be one of: stripe, billplz.',
          source: 'db' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    const listing = await db.marketplaceListing.findUnique({
      where: { id: body.listingId },
    })

    if (!listing || listing.status !== 'active') {
      return NextResponse.json(
        {
          error: `Listing "${body.listingId}" not found or no longer available.`,
          source: 'db' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    // Compute amounts.
    const amount = Math.round(Number(listing.price) * 100) / 100
    const fee = Math.round((amount * MARKETPLACE_FEE_PERCENT) / 100 * 100) / 100
    const sellerPayout = Math.round((amount - fee) * 100) / 100

    // Increment download count
    await db.marketplaceListing.update({
      where: { id: body.listingId },
      data: { downloadCount: { increment: 1 } },
    })

    // Generate a mock purchase ID and download URL
    const purchaseId = `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const downloadUrl = `marketplace://download/${listing.id}/${purchaseId}`

    const purchase: Purchase = {
      id: purchaseId,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerName: 'You',
      amount,
      fee,
      sellerPayout,
      paymentMethod: body.paymentMethod,
      downloadUrl,
      purchasedAt: new Date().toISOString(),
      status: 'completed',
    }

    // Re-fetch listing with incremented count
    const updatedListing = await db.marketplaceListing.findUnique({
      where: { id: body.listingId },
    })

    const parsedContent = updatedListing ? JSON.parse(updatedListing.content) as Record<string, unknown> : {}

    const purchasedListing: PurchaseResponse['listing'] = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category as PurchaseResponse['listing']['category'],
      platform: (listing.platform ?? 'all') as PurchaseResponse['listing']['platform'],
      niche: (listing.niche ?? 'beauty') as PurchaseResponse['listing']['niche'],
      price: amount,
      sellerId: listing.sellerId,
      sellerName: listing.sellerId,
      sellerAvatar: `https://picsum.photos/seed/${encodeURIComponent(listing.sellerId)}/80/80`,
      downloads: updatedListing?.downloadCount ?? listing.downloadCount + 1,
      rating: listing.rating?.toNumber() ?? 0,
      reviewCount: 0,
      previewUrl: `https://picsum.photos/seed/${encodeURIComponent(listing.id)}/400/300`,
      tags: listing.tags ? JSON.parse(listing.tags) : [],
      previewSnippet: listing.description.slice(0, 100),
      content: parsedContent as { body: string; usageNotes?: string },
      features: Array.isArray(parsedContent?.features) ? parsedContent.features as string[] : [],
      isActive: true,
      isPurchased: true,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }

    const response: PurchaseResponse = {
      success: true,
      purchase,
      listing: purchasedListing,
      source: 'db' as MarketplaceDataSource,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[POST /api/marketplace/purchase] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process purchase.',
        source: 'db' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}
