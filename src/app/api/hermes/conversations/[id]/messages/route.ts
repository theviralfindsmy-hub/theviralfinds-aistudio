import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * GET /api/hermes/conversations/[id]/messages
 *
 * Get all messages for a specific conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const { id } = await params

    const conversation = await db.hermesConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      throw ApiError.notFound('Conversation not found')
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messageCount,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return handleError(error)
  }
}
