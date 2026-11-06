import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import {
  SCRIPT_TEMPLATES,
  fillTemplate,
  getTemplateById,
} from '@/lib/live/script-templates'
import type { GenerateScriptInput, LiveScript } from '@/lib/live/types'
import { MOCK_SESSIONS } from '@/lib/live/mock-data'

// ─── POST /api/live/script — generate a Shopee Live script ──────────────────
// Uses z-ai-web-dev-sdk on the backend. Falls back to algorithmic
// template-based generation if AI fails.
// Also stores the script in the LiveSession DB record.

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateScriptInput

    if (!body.sessionId || !body.templateId) {
      return NextResponse.json(
        { error: 'sessionId and templateId are required' },
        { status: 400 }
      )
    }

    // Look up the session in DB
    let session: {
      id: string
      title: string
      notes: string | null
      products: string | null
      scheduledAt: Date
    } | null = null

    try {
      session = await db.liveSession.findUnique({
        where: { id: body.sessionId },
        select: {
          id: true,
          title: true,
          notes: true,
          products: true,
          scheduledAt: true,
        },
      })
    } catch (dbErr) {
      console.warn('[/api/live/script] DB query failed:', dbErr)
    }

    // Parse products from session
    let products: any[] = []
    if (session?.products) {
      try {
        products = JSON.parse(session.products)
      } catch { /* ignore */ }
    }

    // If not in DB, try mock sessions
    if (!session) {
      const mockSession = MOCK_SESSIONS.find((s) => s.id === body.sessionId)
      if (mockSession) {
        session = {
          id: mockSession.id,
          title: mockSession.title,
          notes: mockSession.description || null,
          products: JSON.stringify(mockSession.products),
          scheduledAt: new Date(mockSession.scheduledAt),
        }
        products = mockSession.products || []
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const product = products.find((p: any) => p.id === body.productId) ?? products[0]
    const template = getTemplateById(body.templateId)

    if (!template) {
      return NextResponse.json(
        { error: `Unknown template: ${body.templateId}` },
        { status: 400 }
      )
    }

    const language = body.language ?? 'mix'
    const tone = body.tone ?? 'excited'

    const placeholderValues = buildPlaceholderValues(session, product)

    // ─── Try AI generation first ───────────────────────────────────────────
    let aiContent: string | null = null
    try {
      aiContent = await generateWithAI(session, product, template, language, tone)
    } catch (aiErr) {
      console.warn('Live script AI generation failed, using template fallback:', aiErr)
    }

    // ─── Fallback: algorithmic template fill ──────────────────────────────
    const finalContent = aiContent ?? fillTemplate(template.body, placeholderValues)
    const generatedBy: 'ai' | 'template' = aiContent ? 'ai' : 'template'

    const script: LiveScript = {
      id: `script_${Date.now()}`,
      sessionId: session.id,
      productId: product?.id,
      templateId: template.id,
      language,
      tone,
      content: finalContent,
      generatedBy,
      generatedAt: new Date().toISOString(),
    }

    // Store script in DB LiveSession record
    try {
      await db.liveSession.update({
        where: { id: session.id },
        data: {
          script: JSON.stringify(script),
        },
      })
    } catch (dbErr) {
      console.warn('[/api/live/script] Failed to store script in DB:', dbErr)
    }

    return NextResponse.json({
      script,
      source: generatedBy,
      templates: SCRIPT_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        durationMin: t.durationMin,
      })),
    })
  } catch (error) {
    console.error('POST /api/live/script error:', error)
    return NextResponse.json(
      { error: 'Failed to generate live script' },
      { status: 500 }
    )
  }
}

// ─── AI generation via z-ai-web-dev-sdk ──────────────────────────────────────
async function generateWithAI(
  session: { title: string; notes: string | null; products: string | null; scheduledAt: Date },
  product: any | undefined,
  template: { id: string; name: string; durationMin: number; category: string },
  language: string,
  tone: string
): Promise<string | null> {
  const zai = await ZAI.create()

  const productContext = product
    ? `Product: ${product.name || product} (${product.category || 'General'})
${product.originalPrice ? `Original price: RM${product.originalPrice}` : ''}
${product.livePrice ? `Live price: RM${product.livePrice}` : ''}
${product.baseCommission ? `Base commission: ${product.baseCommission}%` : ''}
${product.totalCommission ? `Total commission: ${product.totalCommission}%` : ''}
${product.estimatedUnits ? `Estimated units: ${product.estimatedUnits}` : ''}
${product.flashSale ? `Flash sale: ${product.flashSale.durationMin} min, first ${product.flashSale.firstNBuyers} buyers at RM${product.flashSale.flashPrice}` : ''}`
    : 'No specific product selected — use a generic Malaysian live shopping product.'

  const prompt = `Generate a Malaysian Shopee Live script for the following:

Session: ${session.title}
${session.notes ? `Description: ${session.notes}` : ''}
Scheduled: ${session.scheduledAt.toISOString()}

${productContext}

Script template type: ${template.name} (${template.category})
Target duration: ${template.durationMin} minutes
Language: ${language === 'mix' ? 'Manglish + Bahasa Malaysia mix (typical Malaysian live host style)' : language}
Tone: ${tone}

Requirements:
- Include opening hook, product demo with concrete features, Q&A prompts (with sample questions and answers), and a flash sale CTA with countdown language
- Use authentic Malaysian Manglish/Bahasa mix — natural for a Shopee Live host
- Include emojis sparingly but at key emotional moments (🔥, ⚡, 🙏, 🚀)
- Use RM (Ringgit Malaysia) for all prices
- Mention Shopee-specific terms like "add to cart", "checkout", "klik link bawah live", "follow saya"
- Format with [SECTION HEADER — X min] markers
- Keep total length around ${template.durationMin * 80}-${template.durationMin * 120} words

Return ONLY the script text, no preamble or explanation.`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Malaysian Shopee Live host and script writer. You write natural, energetic live shopping scripts in Manglish/Bahasa Malaysia mix that convert viewers into buyers. Always use RM for prices.',
      },
      { role: 'user', content: prompt },
    ],
    thinking: { type: 'disabled' },
  })

  const content = completion.choices?.[0]?.message?.content?.trim()
  if (!content || content.length < 50) return null
  return content
}

// ─── Build placeholder values from session + product ────────────────────────
function buildPlaceholderValues(
  session: { title: string; notes: string | null; products: string | null; scheduledAt: Date },
  product: any | undefined
): Record<string, string> {
  const values: Record<string, string> = {
    session_title: session.title,
    host_name: 'Host',
  }

  if (product) {
    values.product_category = product.category || 'General'
    values.product_name = product.name || 'Product'
    values.original_price = String(product.originalPrice || '99')
    values.live_price = String(product.livePrice || '59')
    values.product_features_with_demo_steps =
      '1) Buka packaging depan kamera — tunjuk quality bahan. 2) Demo guna — tunjuk cara guna step by step. 3) Highlight benefit utama (durability, ease of use, value for money).'
    values.discount_label = product.originalPrice
      ? `DISKAUN ${Math.round(((product.originalPrice - (product.livePrice || product.originalPrice)) / product.originalPrice) * 100)}% LIVE`
      : 'DISKAUN SPESIAL LIVE'
    values.duration = product.flashSale ? String(product.flashSale.durationMin) : '5'
    values.first_n_buyers = product.flashSale ? String(product.flashSale.firstNBuyers) : '50'
    values.flash_price = product.flashSale ? String(product.flashSale.flashPrice) : String(product.livePrice || '49')
  }

  values.question_1 = 'Ini ori ke?'
  values.answer_1 = '100% original, ada warranty dari seller'
  values.question_2 = 'Berapa lama shipping?'
  values.answer_2 = '1-3 hari working days, free shipping seluruh Malaysia'

  const next = new Date(session.scheduledAt)
  next.setDate(next.getDate() + 7)
  values.next_session_teaser = `${next.toLocaleDateString('en-MY', { weekday: 'long' })} ${next.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}, 9PM — sesi seterusnya`

  return values
}
