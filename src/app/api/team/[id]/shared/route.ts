import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/team/[id]/shared
 *
 * List all shared resources (affiliate links) for a team.
 * Maps team members' affiliate links as shared resources.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const team = await db.team.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const memberUserIds = team.members.map((m) => m.userId)

    // Get affiliate links shared by team members
    const links = await db.affiliateLink.findMany({
      where: { userId: { in: memberUserIds } },
      orderBy: { createdAt: 'desc' },
    })

    // Also get content library items
    const contentItems = await db.contentLibrary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const resources = [
      ...links.map((l) => ({
        id: l.id,
        teamId: id,
        type: 'affiliate_link' as const,
        title: l.name,
        description: l.productName ?? '',
        product: l.productName ?? '',
        platform: (l.category as 'shopee' | 'tiktok' | 'lazada') ?? undefined,
        affiliateUrl: l.affiliateUrl,
        clicks: l.clicks,
        conversions: l.conversions,
        earnings: Number(l.earnings),
        contentType: undefined,
        niche: undefined,
        usageCount: undefined,
        ownerId: l.userId ?? '',
        ownerName: '',
        createdAt: l.createdAt.toISOString(),
        tags: l.tags ? JSON.parse(l.tags) : [],
      })),
      ...contentItems.map((c) => ({
        id: c.id,
        teamId: id,
        type: 'content' as const,
        title: c.product ?? c.type,
        description: c.content.slice(0, 100),
        product: undefined,
        platform: c.platform as 'shopee' | 'tiktok' | 'lazada' | undefined,
        affiliateUrl: undefined,
        clicks: undefined,
        conversions: undefined,
        earnings: undefined,
        contentType: c.type as 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial' | undefined,
        niche: c.niche ?? undefined,
        usageCount: c.usageCount,
        ownerId: '',
        ownerName: '',
        createdAt: c.createdAt.toISOString(),
        tags: [],
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(
      { resources, total: resources.length, source: 'db' as const },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id]/shared GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch shared resources',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team/[id]/shared
 *
 * Add a new shared resource. For affiliate links, creates an AffiliateLink.
 * For content, creates a ContentLibrary entry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = await params

    const team = await db.team.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'db' },
        { status: 404 },
      )
    }

    const body = await request.json()

    if (!body.type || !['affiliate_link', 'content'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid resource type', source: 'db' },
        { status: 400 },
      )
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters', source: 'db' },
        { status: 400 },
      )
    }

    let resource

    if (body.type === 'affiliate_link') {
      // Create an affiliate link shared with the team
      const shortCodeBytes = new Uint8Array(6)
      crypto.getRandomValues(shortCodeBytes)
      const shortCode = Array.from(shortCodeBytes, (b) => b.toString(36).charAt(0)).join('')

      const link = await db.affiliateLink.create({
        data: {
          name: body.title.trim(),
          productUrl: body.affiliateUrl ?? '',
          affiliateUrl: body.affiliateUrl ?? '',
          productName: body.product,
          category: body.platform,
          userId: userId,
          shortCode: `team_${shortCode}`,
          tags: body.tags ? JSON.stringify(body.tags) : null,
        },
      })

      resource = {
        id: link.id,
        teamId: id,
        type: 'affiliate_link' as const,
        title: link.name,
        description: link.productName ?? '',
        product: link.productName ?? '',
        platform: (link.category as 'shopee' | 'tiktok' | 'lazada') ?? undefined,
        affiliateUrl: link.affiliateUrl,
        clicks: 0,
        conversions: 0,
        earnings: 0,
        ownerId: link.userId ?? '',
        ownerName: 'You',
        createdAt: link.createdAt.toISOString(),
        tags: body.tags ?? [],
      }
    } else {
      // Create a content library item shared with the team
      const content = await db.contentLibrary.create({
        data: {
          type: body.contentType ?? 'caption',
          platform: body.platform ?? 'shopee',
          niche: body.niche,
          product: body.title.trim(),
          content: body.description ?? '',
          language: 'manglish',
          tone: 'casual',
        },
      })

      resource = {
        id: content.id,
        teamId: id,
        type: 'content' as const,
        title: content.product ?? content.type,
        description: content.content.slice(0, 100),
        contentType: content.type as 'caption' | 'video_script' | 'image_prompt' | 'review' | 'tutorial',
        niche: content.niche ?? undefined,
        usageCount: 0,
        ownerId: '',
        ownerName: 'You',
        createdAt: content.createdAt.toISOString(),
        tags: body.tags ?? [],
      }
    }

    return NextResponse.json(
      { resource, source: 'db' },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/shared POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add shared resource',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'db',
      },
      { status: 500 },
    )
  }
}
