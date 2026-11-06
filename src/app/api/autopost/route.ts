import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBody, createAutoPostSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

// POST /api/autopost - Create a scheduled post
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, createAutoPostSchema)
    const { caption, platforms, scheduledAt, productUrl, affiliateLink, imageUrl, hashtags } = data

    const scheduledDate = new Date(scheduledAt)

    // Try to generate affiliate link if productUrl is provided but no affiliateLink
    let finalAffiliateLink = affiliateLink || null
    if (productUrl && !affiliateLink) {
      try {
        const linkRes = await fetch(new URL('/api/shopee/generate-link', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productUrl }),
        })
        if (linkRes.ok) {
          const linkData = await linkRes.json()
          if (linkData.link?.generateUrl) {
            finalAffiliateLink = linkData.link.generateUrl
          }
        }
      } catch {
        // Non-fatal: affiliate link generation failed
      }
    }

    const post = await db.scheduledPost.create({
      data: {
        caption,
        platforms: JSON.stringify(platforms),
        productUrl: productUrl || null,
        affiliateLink: finalAffiliateLink,
        imageUrl: imageUrl || null,
        hashtags: hashtags ? JSON.stringify(hashtags) : null,
        status: 'scheduled',
        scheduledAt: scheduledDate,
      },
    })

    return NextResponse.json({
      ...post,
      platforms: JSON.parse(post.platforms),
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

// GET /api/autopost - List scheduled posts
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && ['scheduled', 'published', 'failed'].includes(status)) {
      where.status = status
    }
    if (platform) {
      // Search for platform in JSON array string
      where.platforms = { contains: platform }
    }

    const [posts, total] = await Promise.all([
      db.scheduledPost.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      db.scheduledPost.count({ where }),
    ])

    const parsedPosts = posts.map((post) => ({
      ...post,
      platforms: JSON.parse(post.platforms),
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      result: post.result ? JSON.parse(post.result) : null,
    }))

    return NextResponse.json({
      posts: parsedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleError(error)
  }
}
