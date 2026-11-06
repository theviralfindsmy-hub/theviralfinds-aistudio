import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { validateBody, contentGenerateSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  caption: `Generate a social media caption for a Malaysian Shopee affiliate product. 
Use the Hook → Problem → Solution → Social Proof → CTA format.
Make it engaging and scroll-stopping. Include relevant emojis.
Add #ad or #promosi disclosure tag at the end.`,

  script: `Generate a short video script (30-60 seconds) for TikTok/Instagram Reels.
Structure it with: Hook (first 3 seconds), Problem, Solution/Demo, Social Proof, CTA.
Include visual cues in [brackets] for what to show on screen.
Make it feel natural, not scripted. Include #ad or #promosi disclosure.`,

  hashtags: `Generate hashtag suggestions for a Malaysian Shopee affiliate post.
Mix English and Bahasa Malaysia hashtags. Include:
- 3-5 trending/viral hashtags (#RacunShopee, #Budol, etc.)
- 3-5 niche-specific hashtags
- 2-3 product-specific hashtags
- 1-2 disclosure hashtags (#ad, #promosi)
Format: one hashtag per line, no explanations needed.`,

  live_script: `Generate a Shopee Live selling script for a Malaysian audience.
Structure with: Opening/Greeting (warm, engaging), Product Introduction, Key Benefits (3-5 points), 
Price Reveal/Comparison, Urgency/Scarcity (limited stock, flash sale), Q&A Handling, CTA (add to cart now).
Include natural Malaysian expressions and code-switching between English and BM.
Make it feel conversational, not salesy. Add #ad or #promosi disclosure.`,

  review: `Generate an authentic product review text for a Malaysian Shopee affiliate.
Write as if you've personally used the product. Include:
- Honest first impression
- Key features/benefits experienced
- Any minor drawbacks (keeps it authentic)
- Overall verdict/recommendation
- Price-to-value assessment
Make it feel genuine, not like a paid review. Add #ad or #promosi disclosure.`,

  comparison: `Generate a product comparison text for Malaysian Shopee affiliates.
Compare 2-3 products in the same category. Include:
- Brief intro of each product
- Feature comparison (price, quality, value)
- Pros and cons of each
- Winner/recommendation for different needs
- CTA with affiliate link
Be objective and helpful. Add #ad or #promosi disclosure.`,
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: 'Write in English with some Malaysian expressions naturally mixed in.',
  bahasa: 'Write primarily in Bahasa Malaysia with some English terms naturally mixed in.',
  manglish: 'Write in Manglish style - naturally mix English and Bahasa Malaysia. Use Malaysian slang like "terer", "gila", "best giler", "confirm", "tipu kalau tak", "memang shiok", "walao eh", "cedebest", "kaw tim", "chun". Code-switch naturally between English and BM sentences.',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  casual: 'Keep it casual, friendly, and relatable - like talking to a friend.',
  professional: 'Keep it polished and informative while still being approachable.',
  excited: 'Be enthusiastic and energetic! Use exclamation marks and hype words! Make it exciting!',
  funny: 'Be witty and humorous. Add jokes, puns, or funny observations that Malaysians would relate to.',
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { type, product, niche, platform, language, tone } = await validateBody(request, contentGenerateSchema)

    const zai = await ZAI.create()

    const contentTypePrompt = CONTENT_TYPE_PROMPTS[type] || CONTENT_TYPE_PROMPTS.caption
    const languageInstruction = LANGUAGE_INSTRUCTIONS[language || 'manglish'] || LANGUAGE_INSTRUCTIONS.manglish
    const toneInstruction = TONE_INSTRUCTIONS[tone || 'casual'] || TONE_INSTRUCTIONS.casual

    const platformLabel: Record<string, string> = {
      tiktok: 'TikTok',
      instagram: 'Instagram',
      facebook: 'Facebook',
      youtube: 'YouTube',
      shopee_live: 'Shopee Live',
    }

    const systemPrompt = `You are a professional Malaysian Shopee affiliate content creator. You create viral, engaging content that drives conversions while feeling authentic and relatable to Malaysian audiences.

${contentTypePrompt}

${languageInstruction}

${toneInstruction}

Platform: ${platformLabel[platform as string] || 'general social media'}
Product/Niche: ${product}
${niche ? `Category: ${niche}` : ''}

IMPORTANT RULES:
- Always include #ad or #promosi disclosure
- Be authentic, not overly salesy
- Use Malaysian cultural references when appropriate
- Make the CTA clear and actionable
- Keep the content optimized for the specified platform
- For captions: keep under 300 words
- For scripts: keep under 200 words
- For hashtags: generate 15-25 hashtags
- For live scripts: keep under 500 words
- For reviews: keep under 250 words
- For comparisons: keep under 350 words

Return ONLY the content, no meta-commentary or explanations.`

    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${type} for "${product}"${niche ? ` in the ${niche} niche` : ''} for ${platformLabel[platform as string] || 'social media'}. Language: ${language || 'manglish'}. Tone: ${tone || 'casual'}.` },
      ],
    })

    const generatedContent = completion.choices?.[0]?.message?.content || ''

    if (!generatedContent) {
      throw ApiError.internal('Failed to generate content. Please try again.')
    }

    return NextResponse.json({
      content: generatedContent,
      type,
      platform: platform || 'tiktok',
      language: language || 'manglish',
      tone: tone || 'casual',
      product,
      niche: niche || null,
    })
  } catch (error) {
    return handleError(error)
  }
}
