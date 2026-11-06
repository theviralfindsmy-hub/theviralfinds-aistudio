import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { validateBody, studioTtsSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }
    const { text, voice, speed } = await validateBody(request, studioTtsSchema)

    // Truncate text if too long (TTS models have limits)
    const truncatedText = text.length > 2000 ? text.slice(0, 2000) + '...' : text

    try {
      const zai = await ZAI.create()
      const ttsResult = await zai.audio.tts.create({
        input: truncatedText,
        voice: voice || 'alloy',
        speed: speed || 1.0,
        response_format: 'mp3',
      })

      // The TTS result may return audio data in different formats
      // Handle both base64 and URL responses
      if (ttsResult) {
        // Check if result has audio content
        const audioData = ttsResult.audio || ttsResult.data || ttsResult
        const contentType = ttsResult.content_type || 'audio/mpeg'

        // If it's a buffer or base64 string
        if (typeof audioData === 'string') {
          return NextResponse.json({
            success: true,
            audio: audioData,
            format: 'base64',
            contentType,
            duration: estimateDuration(truncatedText, speed || 1.0),
          })
        }

        // If it's a URL
        if (ttsResult.url) {
          return NextResponse.json({
            success: true,
            audioUrl: ttsResult.url,
            format: 'url',
            contentType,
            duration: estimateDuration(truncatedText, speed || 1.0),
          })
        }

        // If result itself is the audio buffer
        if (Buffer.isBuffer(audioData)) {
          const base64Audio = audioData.toString('base64')
          return NextResponse.json({
            success: true,
            audio: base64Audio,
            format: 'base64',
            contentType,
            duration: estimateDuration(truncatedText, speed || 1.0),
          })
        }

        // Fallback: return whatever we got
        return NextResponse.json({
          success: true,
          audio: JSON.stringify(ttsResult),
          format: 'raw',
          contentType,
          duration: estimateDuration(truncatedText, speed || 1.0),
        })
      }
    } catch (ttsError) {
      console.error('TTS API error:', ttsError)
      // Fall through to mock response
    }

    // Mock TTS response when SDK TTS is not available
    return NextResponse.json({
      success: true,
      audio: null,
      format: 'mock',
      message: 'TTS generation is coming soon. The voiceover feature is currently in development.',
      mockAudio: true,
      text: truncatedText,
      voice: voice || 'alloy',
      speed: speed || 1.0,
      duration: estimateDuration(truncatedText, speed || 1.0),
      estimatedFileSize: `${Math.round(truncatedText.length * 0.5)}KB`,
    })
  } catch (error) {
    return handleError(error)
  }
}

function estimateDuration(text: string, speed: number): number {
  // Average reading speed is about 150 words per minute
  // For Malaysian casual speech, slightly slower at ~130 words per minute
  const wordsPerMinute = 130 / speed
  const wordCount = text.split(/\s+/).length
  const durationSeconds = (wordCount / wordsPerMinute) * 60
  return Math.round(durationSeconds * 10) / 10
}
