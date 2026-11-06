import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { db } from '@/lib/db'
import type { AbTestResult, ContentVariant, ListResponse, TrackResponse } from '@/lib/abtesting/types'

// ─── POST validation ───────────────────────────────────────────────────────

const trackSchema = z.object({
  variantId: z.string().min(1, 'variantId is required'),
  actualClicks: z.number().int().min(0, 'actualClicks must be >= 0'),
  actualConversions: z.number().int().min(0, 'actualConversions must be >= 0'),
})

/**
 * POST /api/abtesting/track
 *
 * Track A/B test click/conversion, update DB.
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const { variantId, actualClicks, actualConversions } = await trackSchema.parseAsync(
      await request.json()
    )

    // Find the AbTest containing this variant
    const allTests = await db.abTest.findMany()
    let foundTest: Awaited<ReturnType<typeof db.abTest.findMany>>[number] | null = null
    let foundVariantIndex = -1
    let foundVariants: ContentVariant[] = []

    for (const test of allTests) {
      const variants = JSON.parse(test.variants) as ContentVariant[]
      const vIndex = variants.findIndex((v) => v.id === variantId)
      if (vIndex >= 0) {
        foundTest = test
        foundVariantIndex = vIndex
        foundVariants = variants
        break
      }
    }

    if (!foundTest) {
      throw ApiError.notFound(`Variant ${variantId} not found. Generate a test first.`)
    }

    const ctr = actualClicks > 0 ? (actualConversions / actualClicks) * 100 : 0

    // Update the variant with actual performance
    const updatedVariant: ContentVariant = {
      ...foundVariants[foundVariantIndex],
      actual: {
        clicks: actualClicks,
        conversions: actualConversions,
        ctr: Math.round(ctr * 10) / 10,
        loggedAt: new Date().toISOString(),
      },
    }

    const updatedVariants = [...foundVariants]
    updatedVariants[foundVariantIndex] = updatedVariant

    // Determine the winner: variant with the highest CTR
    let winnerId: string | null = null
    let bestCtr = -1
    let winnerIndex: number | null = null
    for (let i = 0; i < updatedVariants.length; i++) {
      const v = updatedVariants[i]
      if (v.actual && v.actual.ctr > bestCtr) {
        bestCtr = v.actual.ctr
        winnerId = v.id
        winnerIndex = i
      }
    }

    const updatedVariantsWithWinner = updatedVariants.map((v) => ({
      ...v,
      isWinner: v.id === winnerId,
    }))

    // Update the DB record
    await db.abTest.update({
      where: { id: foundTest.id },
      data: {
        variants: JSON.stringify(updatedVariantsWithWinner),
        winnerIndex,
        status: 'completed',
      },
    })

    const updatedTest: AbTestResult = {
      id: foundTest.id,
      product: '',
      platform: 'shopee',
      niche: 'Beauty',
      tone: null,
      variants: updatedVariantsWithWinner,
      winnerVariantId: winnerId,
      createdAt: foundTest.createdAt.toISOString(),
      source: 'db',
    }

    const response: TrackResponse = {
      variant: updatedVariantsWithWinner[foundVariantIndex],
      test: updatedTest,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}

// ─── GET handler — list all A/B tests ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')

    let tests = await db.abTest.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const mappedTests: AbTestResult[] = tests.map((test) => {
      const variants = JSON.parse(test.variants) as ContentVariant[]
      return {
        id: test.id,
        product: test.name.replace('A/B Test: ', ''),
        platform: 'shopee',
        niche: 'Beauty',
        tone: null,
        variants,
        winnerVariantId: test.winnerIndex !== null ? variants[test.winnerIndex]?.id ?? null : null,
        createdAt: test.createdAt.toISOString(),
        source: 'db' as const,
      }
    })

    // Filter by product name if specified
    let filtered = mappedTests
    if (productId) {
      filtered = mappedTests.filter(
        (t) => t.id === productId || t.product.toLowerCase().includes(productId.toLowerCase())
      )
    }

    const response: ListResponse = {
      tests: filtered,
      total: filtered.length,
    }
    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}
