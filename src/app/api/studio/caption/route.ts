import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { validateBody, studioCaptionSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

const SYSTEM_PROMPT = `You are a professional subtitle/caption generator for short-form video content. You create perfectly timed captions that are optimized for social media videos (TikTok, Reels, Shorts).

Rules:
1. Split text into short, readable chunks (max 6-8 words per caption line)
2. Time each caption precisely based on speaking speed
3. Average speaking speed for Malaysian content: ~130 words per minute (~2.2 words/second)
4. Each caption should display for at least 0.5 seconds and at most 3 seconds
5. Break at natural speaking pauses (commas, periods, after key phrases)
6. Keep captions punchy - remove filler words if needed for readability

OUTPUT FORMAT - Return a JSON array of caption objects:
[
  {
    "index": 1,
    "startTime": 0.0,
    "endTime": 2.5,
    "text": "Short caption text here"
  }
]

Return ONLY the JSON array, no markdown code fences.`

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { script, duration } = await validateBody(request, studioCaptionSchema)

    const totalDuration = duration || 60

    // Extract dialogue text from script if it's a structured script object
    let dialogueText = ''
    if (typeof script === 'string') {
      dialogueText = script
    } else if (script.scenes && Array.isArray(script.scenes)) {
      dialogueText = script.scenes
        .map((scene: Record<string, unknown>) => scene.dialogue || '')
        .filter(Boolean)
        .join(' ')
    } else {
      dialogueText = String(script)
    }

    if (!dialogueText.trim()) {
      throw ApiError.badRequest('No dialogue text found in script')
    }

    const userPrompt = `Generate timed captions for a ${totalDuration}-second video.

Dialogue/Script text:
${dialogueText}

Total video duration: ${totalDuration} seconds
Speaking speed: ~130 words per minute (Malaysian casual style)

Create perfectly timed captions. Make sure:
- First caption starts at 0.0
- Last caption ends at or before ${totalDuration}.0
- Each line is short enough to read quickly (6-8 words max)
- Captions flow naturally with the dialogue

Return ONLY the JSON array.`

    let captions: Array<Record<string, unknown>>

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

      try {
        // Strip markdown code fences if present
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        captions = JSON.parse(jsonStr)
      } catch {
        // If JSON parsing fails, generate captions algorithmically
        captions = generateAlgorithmicCaptions(dialogueText, totalDuration)
      }
    } catch (aiError) {
      console.error('AI caption generation error:', aiError)
      captions = generateAlgorithmicCaptions(dialogueText, totalDuration)
    }

    // Generate SRT format
    const srt = generateSRT(captions)

    return NextResponse.json({
      success: true,
      captions,
      srt,
      meta: {
        totalDuration,
        captionCount: captions.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

function generateAlgorithmicCaptions(text: string, totalDuration: number): Array<Record<string, unknown>> {
  const captions: Array<Record<string, unknown>> = []
  const words = text.split(/\s+/).filter(Boolean)

  if (words.length === 0) return captions

  // Group words into chunks of 6-8 words
  const chunks: string[] = []
  let currentChunk: string[] = []

  for (const word of words) {
    currentChunk.push(word)
    if (currentChunk.length >= 7) {
      chunks.push(currentChunk.join(' '))
      currentChunk = []
    }
    // Also break at natural pauses
    if (currentChunk.length >= 4 && (word.endsWith(',') || word.endsWith('.') || word.endsWith('!') || word.endsWith('?'))) {
      chunks.push(currentChunk.join(' '))
      currentChunk = []
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  // Calculate timing
  const wordsPerSecond = 130 / 60 // ~2.17 words per second
  const totalWords = words.length
  const totalSpokenTime = totalWords / wordsPerSecond
  const scaleFactor = totalSpokenTime > totalDuration ? totalDuration / totalSpokenTime : 1

  let currentTime = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunkWords = chunks[i].split(/\s+/).length
    const chunkDuration = (chunkWords / wordsPerSecond) * scaleFactor
    const startTime = Math.round(currentTime * 10) / 10
    const endTime = Math.round((currentTime + chunkDuration) * 10) / 10

    captions.push({
      index: i + 1,
      startTime,
      endTime: endTime > totalDuration ? totalDuration : endTime,
      text: chunks[i],
    })

    currentTime += chunkDuration
  }

  // Ensure last caption ends at total duration
  if (captions.length > 0) {
    const lastCaption = captions[captions.length - 1]
    lastCaption.endTime = totalDuration
  }

  return captions
}

function generateSRT(captions: Array<Record<string, unknown>>): string {
  return captions.map((caption, index) => {
    const startTime = formatSRTTime(caption.startTime as number)
    const endTime = formatSRTTime(caption.endTime as number)
    return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`
  }).join('\n')
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.round((seconds % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}
