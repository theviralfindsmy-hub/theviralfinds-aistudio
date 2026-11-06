import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBody, contentLibraryCreateSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { z } from 'zod'

// GET - List saved content from library
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')
    const favorite = searchParams.get('favorite')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const where: Record<string, unknown> = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (platform && platform !== 'all') {
      where.platform = platform
    }

    if (favorite === 'true') {
      where.isFavorite = true
    }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { product: { contains: search } },
        { niche: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      db.contentLibrary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contentLibrary.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST - Save content to library
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, contentLibraryCreateSchema)

    // platform is optional in schema but the original handler required it;
    // accept null and store as null.
    const item = await db.contentLibrary.create({
      data: {
        type: data.type,
        platform: data.platform || 'general',
        niche: data.niche || null,
        product: data.product || null,
        content: data.content,
        language: data.language || 'manglish',
        tone: data.tone || 'casual',
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

const libraryPatchSchema = z.object({
  id: z.string().min(1, 'id is required'),
  content: z.string().max(10_000).optional(),
  isFavorite: z.boolean().optional(),
})

// PATCH - Update content in library
export async function PATCH(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, libraryPatchSchema)

    const updateData: Record<string, unknown> = {}
    if (data.content !== undefined) updateData.content = data.content
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite

    // Verify existence first for a clean 404
    const existing = await db.contentLibrary.findUnique({ where: { id: data.id } })
    if (!existing) {
      throw ApiError.notFound('Content item not found')
    }

    const item = await db.contentLibrary.update({
      where: { id: data.id },
      data: updateData,
    })

    return NextResponse.json({ item })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE - Remove content from library
export async function DELETE(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw ApiError.badRequest('Missing required query param: id')
    }

    // Verify existence for a clean 404
    const existing = await db.contentLibrary.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Content item not found')
    }

    await db.contentLibrary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
