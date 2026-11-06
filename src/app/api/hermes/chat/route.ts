import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { validateBody, hermesChatSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

const SYSTEM_PROMPT = `You are Hermes, a Shopee Affiliate Marketing Expert AI Agent. You help affiliate marketers optimize their campaigns, analyze product trends, generate promotional content, and maximize their earnings on Shopee Malaysia.

Key expertise areas:
- Shopee affiliate program strategies and best practices
- Product selection and commission optimization
- Content creation for affiliate marketing (social media, blogs, reviews)
- Campaign performance analysis and improvement
- Market trend analysis for Malaysian e-commerce
- SEO optimization for affiliate content
- Conversion rate optimization techniques

Always provide actionable, practical advice. Use data-driven insights when possible. Format responses with clear headings and bullet points when appropriate. Be concise but thorough.`

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { message, conversationId } = await validateBody(request, hermesChatSchema)

    // Get or create conversation
    let conversation = conversationId
      ? await db.hermesConversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
          },
        })
      : null

    if (!conversation) {
      // Get or create default connection
      let connection = await db.hermesConnection.findFirst({
        where: { isActive: true },
      })
      if (!connection) {
        connection = await db.hermesConnection.create({
          data: {
            name: 'Default Hermes Connection',
            endpoint: 'https://api.z-ai.com',
            model: 'hermes-3',
            isActive: true,
            status: 'connected',
          },
        })
      }

      conversation = await db.hermesConversation.create({
        data: {
          connectionId: connection.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          messageCount: 0,
          isActive: true,
        },
        include: { messages: true },
      })
    }

    // Save user message
    await db.hermesMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    // Build conversation history for the AI
    const conversationHistory = (conversation.messages || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    // Call AI
    let assistantContent = ''

    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      assistantContent =
        completion.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
    } catch (aiError) {
      console.error('AI completion error:', aiError)
      assistantContent = generateFallbackResponse(message)
    }

    // Save assistant message
    const assistantMessage = await db.hermesMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantContent,
      },
    })

    // Update conversation message count
    await db.hermesConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: assistantMessage.id,
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantContent,
      createdAt: assistantMessage.createdAt.toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('product') || lowerMessage.includes('recommend')) {
    return `**Product Recommendations for Shopee Malaysia**\n\nHere are some top-performing categories right now:\n\n• **Electronics** - Wireless earbuds, phone accessories, smart home devices\n• **Fashion** - Affordable trendy clothing and accessories\n• **Home & Living** - Organization tools, kitchen gadgets\n• **Health & Beauty** - Skincare sets, fitness equipment\n\n**Tips for selecting products:**\n1. Look for items with 4.5+ star ratings\n2. Choose products with commission rates above 4%\n3. Focus on trending items with high search volume\n4. Consider seasonal demands\n\nWould you like me to analyze a specific product category?`
  }

  if (lowerMessage.includes('campaign') || lowerMessage.includes('strateg')) {
    return `**Campaign Strategy Recommendations**\n\nTo maximize your Shopee affiliate earnings:\n\n1. **Timing is Key** - Run campaigns during Shopee's major sale events (9.9, 11.11, 12.12)\n2. **Content Variety** - Mix product reviews, comparisons, and unboxing content\n3. **Multi-Channel** - Distribute links across social media, blogs, and messaging apps\n4. **Track Performance** - Monitor which links convert best and double down\n5. **A/B Testing** - Test different headlines and call-to-actions\n\nWould you like help setting up a specific campaign?`
  }

  if (lowerMessage.includes('earn') || lowerMessage.includes('commission') || lowerMessage.includes('money')) {
    return `**Maximizing Your Earnings**\n\nHere are proven strategies to boost your Shopee affiliate income:\n\n• **Focus on high-commission products** - Target items with 5%+ commission rates\n• **Volume strategy** - Promote affordable items with mass appeal for volume conversions\n• **Premium strategy** - Target higher-priced items for larger per-sale commissions\n• **Recurring content** - Create evergreen content that generates clicks over time\n• **Seasonal planning** - Prepare content ahead of major sale events\n\nCurrent average performance metrics:\n- Conversion rate: 3-7%\n- Average commission per sale: RM 2-8\n- Top affiliates earn RM 5,000+ monthly\n\nWant me to help you set earning goals?`
  }

  return `**Hello! I'm Hermes, your Shopee Affiliate Marketing Expert.** 🤖\n\nI can help you with:\n\n• **Product Research** - Find trending products with high commission potential\n• **Campaign Strategy** - Optimize your marketing campaigns for better conversions\n• **Content Creation** - Generate promotional content for your affiliate links\n• **Performance Analysis** - Analyze your clicks, conversions, and earnings\n• **Market Trends** - Stay updated on Malaysian e-commerce trends\n\nHow can I assist you today? Just ask about any of these topics!`
}
