import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * GET /api/hermes/conversations
 *
 * List all Hermes conversations with their latest messages.
 * Query params: limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const offset = parseInt(searchParams.get('offset') || '0') || 0

    const [conversations, total] = await Promise.all([
      db.hermesConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      db.hermesConversation.count(),
    ])

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv.messageCount,
      isActive: conv.isActive,
      lastMessage: conv.messages[0]?.content || '',
      timestamp: conv.updatedAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
    }))

    return NextResponse.json({
      conversations: formatted,
      total,
    })
  } catch (error) {
    return handleError(error)
  }
}
