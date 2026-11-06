import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { validateBody, studioScriptSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  before_after: `Before/After format: Show the "before" state (problem/pain), then reveal the "after" state (transformation). Great for beauty, skincare, home improvement products. Include dramatic reveal moment.`,
  unboxing: `Unboxing format: Build excitement from opening the package, show each item being revealed, share genuine first impressions. Great for gadgets, fashion, subscription boxes.`,
  demo: `Product Demo format: Show the product in action, demonstrate key features step by step, highlight results in real-time. Great for electronics, tools, kitchen gadgets.`,
  price_reveal: `Price Reveal format: Build suspense about the product value, show premium features first, then reveal the surprisingly affordable price. Great for deals, sales, budget finds.`,
  comparison: `Comparison format: Compare the product with a competitor or previous version, highlight advantages clearly, show side-by-side results. Great for tech, beauty, any category with clear alternatives.`,
  problem_solution: `Problem-Solution format: Start with a relatable problem, introduce the product as the solution, show it working to solve the problem. Great for home, health, lifestyle products.`,
  testimonial: `Testimonial format: Share a personal experience story, include specific benefits and results, make it feel authentic and relatable. Great for beauty, health, fashion products.`,
  top5: `Top 5 List format: Countdown from 5 to 1, briefly showcase each item, build anticipation for the #1 pick. Great for any category, especially curated collections.`,
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: `Write the script in standard English with a casual, friendly Malaysian tone. Use some Malaysian slang naturally (like "lah", "meh", "walao") for local flavor but keep it mostly English.`,
  bm: `Write the script in Bahasa Melayu (BM) with a casual, friendly tone suitable for social media. Mix in some English loan words naturally as Malaysians do in everyday speech.`,
  manglish: `Write the script in Manglish (Malaysian English) - a natural mix of English, Malay, and Chinese expressions. Use classic Manglish patterns like "walao eh", "confirm nice one", "very the good lah", "can or not", "steady pom pi pi". Make it feel like how a real Malaysian would talk to their friend.`,
}

const SYSTEM_PROMPT = `You are a professional video script writer specializing in Malaysian Shopee affiliate marketing content. You create engaging, conversion-optimized short video scripts for TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL RULES:
1. Every script MUST include a disclosure: include #ad or #promosi or #shopeeaffiliate somewhere in the script
2. Scripts should feel natural and authentic - like a friend recommending something, not a sales pitch
3. Always include a clear Call-To-Action (CTA) telling viewers to click the link in bio
4. Time each scene precisely for the given duration
5. Include visual/action directions (what to show on camera) AND dialogue/voiceover text
6. Make it sound like how real Malaysians talk on social media

OUTPUT FORMAT - Return a JSON object with this exact structure:
{
  "title": "Catchy title for this script",
  "totalDuration": "duration string like 60s",
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0-5s",
      "label": "Hook",
      "visualNotes": "What to show on camera - be specific about angles, close-ups, transitions",
      "dialogue": "The exact words to say/voiceover text",
      "actionNotes": "Specific actions, gestures, or movements to perform"
    }
  ],
  "hashtags": ["#hashtag1", "#hashtag2", "#ad"],
  "tips": ["Tip for filming this script"]
}

The scene labels should follow this pattern for a typical script:
- Hook (attention-grabbing opener)
- Problem/Context (set up the situation)
- Solution/Reveal (show the product)
- Demo/Proof (prove it works)
- Social Proof (testimonials, stats, comparisons)
- CTA (call to action with link)

Adjust the number of scenes and timing based on the total duration. For 15s scripts, use 3 scenes. For 30s, use 4-5 scenes. For 60s, use 5-7 scenes. For 90s, use 7-9 scenes.`

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { product, template, duration, platform, language } = await validateBody(request, studioScriptSchema)

    const templateDesc = TEMPLATE_DESCRIPTIONS[template] || TEMPLATE_DESCRIPTIONS.demo
    const langInstruction = LANGUAGE_INSTRUCTIONS[language || 'english'] || LANGUAGE_INSTRUCTIONS.english
    const platformNote = platform === 'tiktok' ? 'TikTok (vertical 9:16, trending sounds, hashtags important)' :
      platform === 'instagram' ? 'Instagram Reels (vertical 9:16, aesthetic, shareable)' :
      platform === 'youtube' ? 'YouTube Shorts (vertical 9:16, SEO-friendly title, thumbnails matter)' :
      'Short-form vertical video platform'

    const userPrompt = `Create a ${duration} second video script for a Malaysian Shopee affiliate product.

Product: ${product}
Template Format: ${template} - ${templateDesc}
Platform: ${platformNote}
Language Style: ${langInstruction}

Remember:
- Include #ad or #promosi disclosure
- Make it feel natural and Malaysian
- Include specific visual/action directions
- Time scenes precisely for ${duration} seconds total
- End with a strong CTA to click the affiliate link

Return ONLY the JSON object, no markdown code fences.`

    let scriptResult: Record<string, unknown>

    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      })

      const content = completion.choices?.[0]?.message?.content || ''

      // Try to parse JSON from the response
      try {
        // Strip markdown code fences if present
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        scriptResult = JSON.parse(jsonStr)
      } catch {
        // If JSON parsing fails, create a structured response from the text
        scriptResult = {
          title: `${template} Script - ${product}`,
          totalDuration: `${duration}s`,
          rawScript: content,
          scenes: parseScenesFromText(content, duration),
          hashtags: [`#${template}`, '#shopeeaffiliate', '#ad', '#promosi'],
          tips: ['Speak naturally and authentically', 'Show the product clearly', 'Include your affiliate link in bio'],
        }
      }
    } catch (aiError) {
      console.error('AI script generation error:', aiError)
      scriptResult = generateFallbackScript(product, template, duration, platform || '', language || 'english')
    }

    return NextResponse.json({
      success: true,
      script: scriptResult,
      meta: {
        product,
        template,
        duration,
        platform,
        language: language || 'english',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

function parseScenesFromText(text: string, duration: number): Array<Record<string, unknown>> {
  const scenes: Array<Record<string, unknown>> = []
  const lines = text.split('\n').filter((l: string) => l.trim())

  const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 5 : duration <= 60 ? 6 : 8
  const sceneDuration = Math.floor(duration / sceneCount)

  const labels = ['Hook', 'Problem', 'Solution', 'Demo', 'Social Proof', 'CTA', 'Bonus', 'Closing']

  for (let i = 0; i < sceneCount; i++) {
    const start = i * sceneDuration
    const end = i === sceneCount - 1 ? duration : (i + 1) * sceneDuration
    const relevantLines = lines.slice(i * 2, i * 2 + 2).join(' ')

    scenes.push({
      sceneNumber: i + 1,
      timeRange: `${start}-${end}s`,
      label: labels[i] || `Scene ${i + 1}`,
      visualNotes: `Show ${relevantLines.slice(0, 80) || 'product in action'}`,
      dialogue: relevantLines.slice(0, 150) || 'Voiceover text here',
      actionNotes: 'Perform action as directed',
    })
  }

  return scenes
}

function generateFallbackScript(
  product: string,
  template: string,
  duration: number,
  platform: string,
  language: string
): Record<string, unknown> {
  const isManglish = language === 'manglish'
  const isBM = language === 'bm'

  const templates: Record<string, Record<string, Array<Record<string, unknown>>>> = {
    before_after: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Close-up of problem area, frustrated expression, dramatic lighting',
          dialogue: isManglish ? 'Walao eh, this problem so annoying lah! Every single day also like this...' :
            isBM ? 'Argh, masalah ni sangat menyakitkan hati! Hari-hari kena deal dengan ni...' :
            'Ugh, this problem is SO annoying! I deal with this every single day...',
          actionNotes: 'Show frustrated face, point at the problem area',
        },
        {
          sceneNumber: 2, timeRange: '5-15s', label: 'Problem',
          visualNotes: 'Show the before state clearly, zoom in on the issue',
          dialogue: isManglish ? 'See lah, confirm very the susah. Like this how to go out and meet people?' :
            isBM ? 'Tengok ni, memang sangat menyusahkan. Macam mana nak keluar berjumpa orang?' :
            'Look at this - it\'s honestly embarrassing. How can I go out like this?',
          actionNotes: 'Point at the problem, shake head in disappointment',
        },
        {
          sceneNumber: 3, timeRange: '15-35s', label: 'Reveal',
          visualNotes: 'Dramatic product reveal, unbox or show product with excited expression',
          dialogue: isManglish ? 'But then I found this ${product}! Steady pom pi pi, this one confirm works one!' :
            isBM ? 'Tapi kemudian saya jumpa ${product} ni! Confirm berkesan punya!' :
            'But then I found this ${product}! I was skeptical at first, but wow...',
          actionNotes: 'Hold up product with excitement, show packaging',
        },
        {
          sceneNumber: 4, timeRange: '35-50s', label: 'After',
          visualNotes: 'Show the transformation, side-by-side before/after, glow up moment',
          dialogue: isManglish ? 'After using it, walao eh! The difference very the big lah! Cannot believe my eyes!' :
            isBM ? 'Lepas guna, wow! Beza sangat ketara! Tak percaya mata saya!' :
            'After using it... the difference is INSANE! I can\'t believe my eyes!',
          actionNotes: 'Show before/after split screen, gesture at the transformation',
        },
        {
          sceneNumber: 5, timeRange: '50-55s', label: 'Social Proof',
          visualNotes: 'Show ratings, reviews, number of sold items on screen',
          dialogue: isManglish ? 'More than 10K people already bought! 4.9 stars some more!' :
            isBM ? 'Lebih 10K orang sudah beli! Rating 4.9 bintang lagi!' :
            'Over 10,000 people have bought this! 4.9 star rating!',
          actionNotes: 'Point at phone screen showing reviews',
        },
        {
          sceneNumber: 6, timeRange: '55-60s', label: 'CTA',
          visualNotes: 'Point to link in bio, show product one more time, smile',
          dialogue: isManglish ? 'Click the link in bio lah! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Klik link di bio! #ad #promosi #shopeeaffiliate' :
            'Click the link in my bio to grab yours! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Point down to bio area, smile, wave',
        },
      ],
    },
    unboxing: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Show sealed package, build excitement with dramatic lighting',
          dialogue: isManglish ? 'You all not gonna believe what just arrived lah!' :
            isBM ? 'Korang tak percaya apa yang baru sampai ni!' :
            'You guys are NOT gonna believe what just arrived!',
          actionNotes: 'Hold up sealed package, excited expression',
        },
        {
          sceneNumber: 2, timeRange: '5-15s', label: 'Build Up',
          visualNotes: 'Show package details, feel the weight, tease the contents',
          dialogue: isManglish ? 'This one I order from Shopee, very the excited to open!' :
            isBM ? 'Ni saya order dari Shopee, sangat tak sabar nak buka!' :
            'I ordered this from Shopee and I\'m SO excited to open it!',
          actionNotes: 'Turn package around, show shipping label',
        },
        {
          sceneNumber: 3, timeRange: '15-35s', label: 'Unboxing',
          visualNotes: 'Open package slowly, ASMR-style sounds, reveal product',
          dialogue: isManglish ? 'Okay okay, let\'s see... wah! Confirm nice one!' :
            isBM ? 'Okay jom tengok... wah! Memang cantik!' :
            'Let\'s see what\'s inside... oh WOW! This looks amazing!',
          actionNotes: 'Open box with excitement, peel off wrapping slowly',
        },
        {
          sceneNumber: 4, timeRange: '35-50s', label: 'First Impressions',
          visualNotes: 'Close-up of product details, feel texture, show accessories',
          dialogue: isManglish ? 'The quality very the solid lah! Feel already know this one original one.' :
            isBM ? 'Kualiti dia sangat solid! Rasa dah tahu ni ori punya.' :
            'The quality is SOLID! You can feel it\'s authentic the moment you touch it.',
          actionNotes: 'Examine product closely, show details to camera',
        },
        {
          sceneNumber: 5, timeRange: '50-55s', label: 'Value',
          visualNotes: 'Show price on screen, compare with retail price',
          dialogue: isManglish ? 'Best part? The price very the worth it lah!' :
            isBM ? 'Paling best? Harga dia memang berbaloi!' :
            'Best part? The price is an absolute steal!',
          actionNotes: 'Show price tag or Shopee listing',
        },
        {
          sceneNumber: 6, timeRange: '55-60s', label: 'CTA',
          visualNotes: 'Show link in bio, product one final look',
          dialogue: isManglish ? 'Link in bio, grab yours now! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Link di bio, dapatkan sekarang! #ad #promosi #shopeeaffiliate' :
            'Link in bio - grab yours now! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Point to bio, show product, smile',
        },
      ],
    },
    demo: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Product in action immediately, show the end result first',
          dialogue: isManglish ? 'Wait wait wait, you all see this or not?!' :
            isBM ? 'Tunggu tengok ni! Korang nampak tak?!' :
            'Wait... did you just see that?!',
          actionNotes: 'Show product doing its thing, dramatic reaction',
        },
        {
          sceneNumber: 2, timeRange: '5-15s', label: 'Setup',
          visualNotes: 'Show what you\'re about to demo, set the stage',
          dialogue: isManglish ? 'Let me show you how this ${product} works, confirm blow your mind!' :
            isBM ? 'Jom saya tunjuk macam mana ${product} ni berfungsi!' :
            'Let me show you exactly how this ${product} works!',
          actionNotes: 'Set up the demo area, position the product',
        },
        {
          sceneNumber: 3, timeRange: '15-40s', label: 'Demo',
          visualNotes: 'Step-by-step demonstration, close-ups of key features',
          dialogue: isManglish ? 'First you do like this... then like that... see? Very easy one!' :
            isBM ? 'Pertama buat macam ni... lepas tu macam tu... tengok? Mudah je!' :
            'First you do this... then this... see? It\'s that easy!',
          actionNotes: 'Demonstrate each feature slowly and clearly',
        },
        {
          sceneNumber: 4, timeRange: '40-50s', label: 'Results',
          visualNotes: 'Show the result, zoom in on quality/outcome',
          dialogue: isManglish ? 'Wah lau eh, the result very the power! Like professional like that!' :
            isBM ? 'Wah, hasil dia sangat power! Macam pro je!' :
            'The result is incredible! It looks absolutely professional!',
          actionNotes: 'Show end result proudly, compare with before',
        },
        {
          sceneNumber: 5, timeRange: '50-60s', label: 'CTA',
          visualNotes: 'Hold product, point to link in bio',
          dialogue: isManglish ? 'Want to try? Link in bio lah! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Nak cuba? Link di bio! #ad #promosi #shopeeaffiliate' :
            'Want to try it yourself? Link in my bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Point to bio, smile confidently',
        },
      ],
    },
    price_reveal: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Show product without revealing price, mysterious vibe',
          dialogue: isManglish ? 'Guess how much this one? You all confirm cannot guess lah!' :
            isBM ? 'Teka berapa harga ni? Confirm tak boleh teka punya!' :
            'Guess how much this costs? You will NEVER guess!',
          actionNotes: 'Hold product, playful mysterious expression',
        },
        {
          sceneNumber: 2, timeRange: '5-20s', label: 'Value Build',
          visualNotes: 'Show premium features, high-quality close-ups',
          dialogue: isManglish ? 'Look at the quality, the packaging, the everything... feels like premium brand right?' :
            isBM ? 'Tengok kualiti dia, packaging dia... rasa macam brand premium kan?' :
            'Look at the quality, the packaging, everything about it... feels like a premium brand right?',
          actionNotes: 'Show premium features one by one',
        },
        {
          sceneNumber: 3, timeRange: '20-35s', label: 'Comparison',
          visualNotes: 'Show similar products at higher prices, side by side',
          dialogue: isManglish ? 'Other brands selling this type for RM100+ leh... but this one...' :
            isBM ? 'Brand lain jual macam ni RM100+ tau... tapi yang ni...' :
            'Other brands sell something like this for RM100+... but this one...',
          actionNotes: 'Show price comparisons on phone screen',
        },
        {
          sceneNumber: 4, timeRange: '35-45s', label: 'Reveal',
          visualNotes: 'DRAMATIC price reveal, zoom in on price, shocked reaction',
          dialogue: isManglish ? 'ONLY RMXX.XX!!! Walao eh, confirm steal lah this one!' :
            isBM ? 'HANYA RMXX.XX!!! Memang murah gila!' :
            'ONLY RMXX.XX!!! This is an absolute STEAL!',
          actionNotes: 'Cover price with hand, then reveal dramatically',
        },
        {
          sceneNumber: 5, timeRange: '45-60s', label: 'CTA',
          visualNotes: 'Show link in bio, flash sale countdown if applicable',
          dialogue: isManglish ? 'Quick grab now before sold out! Link in bio! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Cepat grab sebelum habis! Link di bio! #ad #promosi #shopeeaffiliate' :
            'Grab it NOW before it sells out! Link in bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Urgent expression, point to bio, show countdown',
        },
      ],
    },
    comparison: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Two products side by side, versus screen format',
          dialogue: isManglish ? 'Which one better ah? Let\'s find out lah!' :
            isBM ? 'Mana satu lagi bagus? Jom kita tengok!' :
            'Which one is actually better? Let\'s find out!',
          actionNotes: 'Hold one product in each hand, VS gesture',
        },
        {
          sceneNumber: 2, timeRange: '5-20s', label: 'Product A',
          visualNotes: 'Show first product features and performance',
          dialogue: isManglish ? 'This one quite not bad lah, but... something missing leh.' :
            isBM ? 'Yang ni tak lah buruk sangat, tapi... ada yang kurang.' :
            'This one is pretty good, but... something\'s missing.',
          actionNotes: 'Test first product, show pros and cons',
        },
        {
          sceneNumber: 3, timeRange: '20-40s', label: 'Product B',
          visualNotes: 'Show second product features and performance',
          dialogue: isManglish ? 'But THIS one, wah! Everything also better! The quality, the price, the everything!' :
            isBM ? 'Tapi YANG NI, wah! Semua lagi bagus! Kualiti, harga, semua!' :
            'But THIS one... WOW! Everything is better! The quality, the price, everything!',
          actionNotes: 'Test second product with impressed reactions',
        },
        {
          sceneNumber: 4, timeRange: '40-50s', label: 'Verdict',
          visualNotes: 'Side by side comparison chart on screen',
          dialogue: isManglish ? 'Confirm product B the winner lah! Look at the comparison!' :
            isBM ? 'Confirm produk B yang menang! Tengok perbandingan dia!' :
            'Product B is the clear winner! Just look at the comparison!',
          actionNotes: 'Point at comparison chart on screen',
        },
        {
          sceneNumber: 5, timeRange: '50-60s', label: 'CTA',
          visualNotes: 'Show winning product with link in bio',
          dialogue: isManglish ? 'Get the winner at link in bio! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Dapatkan pemenang di link bio! #ad #promosi #shopeeaffiliate' :
            'Get the winner at the link in my bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Hold winning product, point to bio',
        },
      ],
    },
    problem_solution: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Show the problem happening, relatable frustration',
          dialogue: isManglish ? 'This one confirm all Malaysian face one right?!' :
            isBM ? 'Ni confirm semua orang Malaysia pernah kena kan?!' :
            'Every Malaysian has dealt with this right?!',
          actionNotes: 'Show frustrated reaction to the problem',
        },
        {
          sceneNumber: 2, timeRange: '5-15s', label: 'Problem',
          visualNotes: 'Exaggerate the problem, show how annoying it is',
          dialogue: isManglish ? 'Every time like this, very the mafan lah! Cannot tahan already!' :
            isBM ? 'Setiap kali macam ni, sangat menyusahkan! Tak boleh tahan dah!' :
            'This happens every time and it\'s SO frustrating! I can\'t take it anymore!',
          actionNotes: 'Demonstrate the problem clearly, frustrated gestures',
        },
        {
          sceneNumber: 3, timeRange: '15-25s', label: 'Solution',
          visualNotes: 'Product reveal as the answer, hopeful expression',
          dialogue: isManglish ? 'But then I found this ${product}! Problem solved just like that!' :
            isBM ? 'Tapi lepas tu saya jumpa ${product} ni! Masalah selesai!' :
            'Then I found this ${product}! Problem SOLVED!',
          actionNotes: 'Hold up product like a hero, triumphant expression',
        },
        {
          sceneNumber: 4, timeRange: '25-45s', label: 'Proof',
          visualNotes: 'Show the product solving the problem, before/after',
          dialogue: isManglish ? 'See? One two three, done already! So easy even my mak also can use!' :
            isBM ? 'Tengok? Satu dua tiga, siap! Senang sangat mak pun boleh guna!' :
            'See? One two three, done! So easy even my mom can use it!',
          actionNotes: 'Demonstrate the solution step by step',
        },
        {
          sceneNumber: 5, timeRange: '45-55s', label: 'Social Proof',
          visualNotes: 'Show reviews, number sold, ratings',
          dialogue: isManglish ? '10K+ people also think the same! 4.9 stars rating some more!' :
            isBM ? '10K+ orang rasa sama! Rating 4.9 bintang lagi!' :
            '10K+ people agree! 4.9 star rating!',
          actionNotes: 'Scroll through reviews on phone',
        },
        {
          sceneNumber: 6, timeRange: '55-60s', label: 'CTA',
          visualNotes: 'Product showcase with link in bio overlay',
          dialogue: isManglish ? 'Fix your problem today! Link in bio! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Selesaikan masalah anda hari ini! Link di bio! #ad #promosi #shopeeaffiliate' :
            'Fix your problem today! Link in bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Point to bio, confident smile',
        },
      ],
    },
    testimonial: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Honest, sincere face, talking directly to camera',
          dialogue: isManglish ? 'Real talk ah, I don\'t usually do reviews but this one I must share.' :
            isBM ? 'Cakap jujur, saya tak biasa buat review tapi yang ni kena share.' :
            'Real talk - I don\'t usually do reviews but I HAVE to share this.',
          actionNotes: 'Lean in close to camera, sincere expression',
        },
        {
          sceneNumber: 2, timeRange: '5-15s', label: 'Backstory',
          visualNotes: 'Show the struggle, authentic situation',
          dialogue: isManglish ? 'Before this I tried so many products already, all also cannot work properly.' :
            isBM ? 'Sebelum ni saya dah try banyak produk, semua tak jalan.' :
            'Before this I tried SO many products and none of them worked properly.',
          actionNotes: 'Shake head, show previous failed products',
        },
        {
          sceneNumber: 3, timeRange: '15-35s', label: 'Experience',
          visualNotes: 'Show using the product, genuine reactions',
          dialogue: isManglish ? 'But this ${product}, walao eh, after 1 week already can see the difference!' :
            isBM ? 'Tapi ${product} ni, wah, lepas 1 minggu dah nampak beza!' :
            'But this ${product}... wow, after just 1 week I could see the difference!',
          actionNotes: 'Show the product being used, genuine surprise',
        },
        {
          sceneNumber: 4, timeRange: '35-50s', label: 'Results',
          visualNotes: 'Show the actual results, be specific with numbers/changes',
          dialogue: isManglish ? 'My friends all asking what I use, confirm effective one this!' :
            isBM ? 'Kawan-kawan semua tanya saya guna apa, confirm berkesan!' :
            'All my friends are asking what I\'m using - it\'s THAT effective!',
          actionNotes: 'Show results, point to improvements',
        },
        {
          sceneNumber: 5, timeRange: '50-60s', label: 'CTA',
          visualNotes: 'Hold product, honest recommendation face',
          dialogue: isManglish ? 'Highly recommend lah, link in bio! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Sangat recommend, link di bio! #ad #promosi #shopeeaffiliate' :
            'Highly recommend! Link in bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Honest nod, point to bio',
        },
      ],
    },
    top5: {
      scenes: [
        {
          sceneNumber: 1, timeRange: '0-5s', label: 'Hook',
          visualNotes: 'Number 5 graphic, quick product flash',
          dialogue: isManglish ? 'Top 5 best ${product} on Shopee! Number 5 already very good!' :
            isBM ? 'Top 5 ${product} terbaik di Shopee! Nombor 5 pun dah bagus!' :
            'Top 5 best ${product} on Shopee! Number 5 is already amazing!',
          actionNotes: 'Show #5 graphic, flash the product',
        },
        {
          sceneNumber: 2, timeRange: '5-20s', label: '#5 & #4',
          visualNotes: 'Quick cuts between products 5 and 4, key feature callouts',
          dialogue: isManglish ? 'Number 5 quite not bad, number 4 even better! But wait...' :
            isBM ? 'Nombor 5 tak lah buruk, nombor 4 lagi bagus! Tapi tunggu...' :
            'Number 5 is decent, number 4 is even better! But wait...',
          actionNotes: 'Quick showcase of each product',
        },
        {
          sceneNumber: 3, timeRange: '20-40s', label: '#3 & #2',
          visualNotes: 'More detailed look at products 3 and 2, show features',
          dialogue: isManglish ? 'Number 3 very the solid! Number 2 almost win already! But...' :
            isBM ? 'Nombor 3 sangat solid! Nombor 2 hampir menang! Tapi...' :
            'Number 3 is incredible! Number 2 almost takes the crown! But...',
          actionNotes: 'Show features of each, build suspense',
        },
        {
          sceneNumber: 4, timeRange: '40-50s', label: '#1 Reveal',
          visualNotes: 'DRUMROLL effect, dramatic #1 reveal, close-up of the winner',
          dialogue: isManglish ? 'NUMBER ONE is... THIS ONE LAH! Confirm the best one!' :
            isBM ? 'NOMBOR SATU ialah... YANG NI! Confirm paling best!' :
            'NUMBER ONE is... THIS! The absolute BEST!',
          actionNotes: 'Dramatic reveal, hold up product with excitement',
        },
        {
          sceneNumber: 5, timeRange: '50-60s', label: 'CTA',
          visualNotes: 'Show all 5 products, link in bio for the #1',
          dialogue: isManglish ? 'Get the #1 pick at link in bio! #ad #promosi #shopeeaffiliate' :
            isBM ? 'Dapatkan pilihan #1 di link bio! #ad #promosi #shopeeaffiliate' :
            'Get the #1 pick at the link in my bio! #ad #promosi #shopeeaffiliate',
          actionNotes: 'Show top product, point to bio',
        },
      ],
    },
  }

  const templateScenes = templates[template]?.scenes || templates.demo.scenes
  const scenes = templateScenes.map(scene => ({
    ...scene,
    dialogue: (scene.dialogue as string).replace(/\$\{product\}/g, product),
    visualNotes: (scene.visualNotes as string).replace(/\$\{product\}/g, product),
  }))

  return {
    title: `${template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${product}`,
    totalDuration: `${duration}s`,
    scenes,
    hashtags: [`#${template}`, '#shopeeaffiliate', '#ad', '#promosi', `#${product.replace(/\s+/g, '')}`],
    tips: [
      'Speak naturally and authentically - viewers can tell if you\'re being fake',
      'Show the product clearly in good lighting',
      'Include your affiliate link in your bio and mention it in the CTA',
      platform === 'tiktok' ? 'Use trending sounds and hashtags on TikTok' :
      platform === 'reels' ? 'Use aesthetic transitions for Reels' :
      'Use a catchy title with keywords for YouTube Shorts',
    ],
  }
}
