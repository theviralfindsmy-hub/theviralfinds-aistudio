import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shopee/chat
 *
 * Get chat conversations or messages from HermesConversation/HermesMessage tables.
 *
 * Query params:
 *   type            - 'conversations' | 'messages' (default: 'conversations')
 *   conversation_id - Conversation ID (required when type=messages)
 *   offset          - Pagination offset (default: 0)
 *   page_size       - Items per page (default: 20, max: 100)
 *
 * POST /api/shopee/chat
 *
 * Send a chat message using real LLM for seller chat assistance.
 *
 * Body:
 *   conversation_id - Conversation ID (required)
 *   message         - Message text (required)
 *   message_type    - 'TEXT' | 'IMAGE' | 'STICKER' (default: 'TEXT')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'conversations'
    const conversationId = searchParams.get('conversation_id') || undefined
    const offset = parseInt(searchParams.get('offset') || '0')
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('page_size') || '20'), 1),
      100
    )

    // Validate type
    const validTypes = ['conversations', 'messages'] as const
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // messages requires conversation_id
    if (type === 'messages' && !conversationId) {
      return NextResponse.json(
        { error: '"conversation_id" is required when type is "messages"', code: 400 },
        { status: 400 }
      )
    }

    // Validate pagination
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid "offset" parameter', code: 400 },
        { status: 400 }
      )
    }

    switch (type) {
      case 'conversations': {
        // Query HermesConversation table
        const [conversations, total] = await Promise.all([
          db.hermesConversation.findMany({
            skip: offset,
            take: pageSize,
            orderBy: { updatedAt: 'desc' },
            include: {
              _count: { select: { messages: true } },
              messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          }),
          db.hermesConversation.count(),
        ])

        return NextResponse.json({
          success: true,
          data: {
            conversations: conversations.map((conv) => ({
              conversation_id: conv.id,
              title: conv.title,
              summary: conv.summary,
              message_count: conv.messageCount || conv._count.messages,
              is_active: conv.isActive,
              last_message: conv.messages[0]
                ? {
                    content: conv.messages[0].content,
                    role: conv.messages[0].role,
                    created_at: conv.messages[0].createdAt.toISOString(),
                  }
                : null,
              created_at: conv.createdAt.toISOString(),
              updated_at: conv.updatedAt.toISOString(),
            })),
            pagination: {
              has_next: total > offset + pageSize,
              total,
            },
          },
          meta: { type: 'conversations', offset, page_size: pageSize, source: 'db' },
        })
      }

      case 'messages': {
        // Query HermesMessage table for the conversation
        const [messages, total] = await Promise.all([
          db.hermesMessage.findMany({
            where: { conversationId: conversationId! },
            skip: offset,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          db.hermesMessage.count({
            where: { conversationId: conversationId! },
          }),
        ])

        return NextResponse.json({
          success: true,
          data: {
            messages: messages.map((msg) => ({
              message_id: msg.id,
              conversation_id: msg.conversationId,
              role: msg.role,
              content: msg.content,
              tokens: msg.tokens,
              metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
              created_at: msg.createdAt.toISOString(),
            })),
            pagination: {
              has_next: total > offset + pageSize,
              total,
            },
          },
          meta: { type: 'messages', conversation_id: conversationId, offset, page_size: pageSize, source: 'db' },
        })
      }
    }
  } catch (error) {
    console.error('[Shopee Chat GET API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { conversation_id, message, message_type } = body as {
      conversation_id?: string
      message?: string
      message_type?: 'TEXT' | 'IMAGE' | 'STICKER'
    }

    // Validate required fields
    if (!conversation_id) {
      return NextResponse.json(
        { error: '"conversation_id" is required', code: 400 },
        { status: 400 }
      )
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '"message" is required and must be a non-empty string', code: 400 },
        { status: 400 }
      )
    }

    // Validate message_type
    const validMessageTypes = ['TEXT', 'IMAGE', 'STICKER'] as const
    const resolvedType = message_type ?? 'TEXT'
    if (!validMessageTypes.includes(resolvedType)) {
      return NextResponse.json(
        { error: `Invalid "message_type". Must be one of: ${validMessageTypes.join(', ')}`, code: 400 },
        { status: 400 }
      )
    }

    // Save user message to DB
    const userMessage = await db.hermesMessage.create({
      data: {
        conversationId: conversation_id,
        role: 'user',
        content: message.trim(),
      },
    })

    // Use real LLM for seller chat assistance
    let aiResponse = ''
    let tokens = 0
    let aiSource = 'ai'

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      // Get conversation context from DB
      const recentMessages = await db.hermesMessage.findMany({
        where: { conversationId: conversation_id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const conversationContext = recentMessages
        .reverse()
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')

      const chatResponse = await zai.chat.completions.create({
        model: 'default',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Shopee seller assistant for the Malaysian market. Help the seller respond to buyer inquiries in a friendly, professional manner. Use Manglish (Malaysian English) when appropriate. Be concise and actionable. You can suggest product recommendations, pricing strategies, and customer service tips.',
          },
          {
            role: 'user',
            content: `Conversation context:\n${conversationContext}\n\nHelp me respond to this buyer message: "${message.trim()}"`,
          },
        ],
      })

      aiResponse = chatResponse.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.'
      tokens = chatResponse.usage?.total_tokens || 0
      aiSource = 'ai'
    } catch (aiError) {
      console.error('[Shopee Chat] LLM failed:', aiError)
      aiResponse = 'Thank you for your message. Our team will get back to you shortly. Terima kasih!'
      aiSource = 'fallback'
    }

    // Save AI response to DB
    const assistantMessage = await db.hermesMessage.create({
      data: {
        conversationId: conversation_id,
        role: 'assistant',
        content: aiResponse,
        tokens,
        metadata: JSON.stringify({ source: aiSource, message_type: resolvedType }),
      },
    })

    // Update conversation message count
    await db.hermesConversation.update({
      where: { id: conversation_id },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    }).catch(() => {
      // Non-fatal if conversation doesn't exist
    })

    return NextResponse.json({
      success: true,
      data: {
        user_message: {
          message_id: userMessage.id,
          conversation_id: conversation_id,
          role: 'user',
          content: message.trim(),
          created_at: userMessage.createdAt.toISOString(),
        },
        ai_suggested_reply: {
          message_id: assistantMessage.id,
          conversation_id: conversation_id,
          role: 'assistant',
          content: aiResponse,
          tokens,
          created_at: assistantMessage.createdAt.toISOString(),
        },
      },
      meta: {
        conversation_id,
        message_type: resolvedType,
        source: aiSource,
      },
    })
  } catch (error) {
    console.error('[Shopee Chat POST API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }
}
