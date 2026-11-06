import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const sessionId = searchParams.get('sessionId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (agentId) {
      where.agentId = agentId
    }
    if (sessionId) {
      where.sessionId = sessionId
    }
    if (search) {
      where.content = { contains: search }
    }

    const memories = await db.agentMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formattedMemories = memories.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))

    return NextResponse.json({ memories: formattedMemories, total: formattedMemories.length })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw ApiError.badRequest('Memory entry ID is required')
    }

    const existing = await db.agentMemory.findUnique({ where: { id } })
    if (!existing) {
      throw ApiError.notFound('Memory entry not found')
    }

    await db.agentMemory.delete({ where: { id } })

    return NextResponse.json({ message: 'Memory entry deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
