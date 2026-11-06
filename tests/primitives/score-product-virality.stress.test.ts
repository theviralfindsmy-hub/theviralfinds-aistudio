/**
 * Empirical Stress Harness: scoreProductVirality
 * 
 * Conducts exhaustive empirical stress-testing for Milestone 1:
 * 1. Determinism across 1,000 identical runs & 1,000 randomized dual runs.
 * 2. Strict score boundedness [0, 100] across boundary edges & 5,000 fuzz vectors.
 * 3. Monotonicity testing with respect to ratings and sales (soldCount).
 * 4. Tier distribution & invariant validation.
 */

import { describe, it, expect } from 'bun:test'
import { scoreProductVirality } from '@/lib/typesafe-ai/primitives'
import {
  type ScoreProductViralityInput,
  ScoreProductViralityInputSchema,
  ProductViralityScoreSchema,
} from '@/lib/typesafe-ai/schemas'

// Simple linear congruential generator for reproducible pseudo-random fuzzing
function createPrng(seed = 123456789) {
  let s = seed
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

describe('Empirical Stress: scoreProductVirality Determinism (1,000+ Runs)', () => {
  it('guarantees identical output across 1,000 consecutive runs of the exact same input', () => {
    const input: ScoreProductViralityInput = {
      title: 'Skintific 5X Ceramide Barrier Moisturizer Gel Viral TikTok Racun',
      price: 36.90,
      originalPrice: 55.00,
      commissionRate: 14.5,
      soldCount: 15400,
      rating: 4.9,
      category: 'Health & Beauty',
      trendKeywords: ['skintific', 'viral', 'moisturizer'],
    }

    const baseline = scoreProductVirality(input)
    const baselineJson = JSON.stringify(baseline)

    for (let i = 0; i < 1000; i++) {
      const run = scoreProductVirality(input)
      expect(run.viralityScore).toBe(baseline.viralityScore)
      expect(run.tier).toBe(baseline.tier)
      expect(run.priceImpulseScore).toBe(baseline.priceImpulseScore)
      expect(run.commissionRoiScore).toBe(baseline.commissionRoiScore)
      expect(run.socialProofScore).toBe(baseline.socialProofScore)
      expect(run.trendAlignmentScore).toBe(baseline.trendAlignmentScore)
      expect(JSON.stringify(run)).toBe(baselineJson)
    }
  })

  it('guarantees identical dual-run outputs across 1,000 distinct randomized valid inputs', () => {
    const prng = createPrng(42)
    const categories = ['Beauty', 'Electronics', 'Fashion', 'Home & Living', 'Food', 'Toys']
    const keywordsPool = ['viral', 'racun', 'padu', 'murah', 'mantap', 'wireless', 'original']

    for (let i = 0; i < 1000; i++) {
      const price = Math.round(prng() * 300 * 100) / 100
      const hasDiscount = prng() > 0.5
      const originalPrice = hasDiscount ? Math.round((price + prng() * 100) * 100) / 100 : undefined
      const commissionRate = Math.round(prng() * 50 * 10) / 10
      const soldCount = Math.floor(prng() * 50000)
      const rating = Math.round(prng() * 5 * 10) / 10
      const category = categories[Math.floor(prng() * categories.length)]
      const selectedKeywords = keywordsPool.filter(() => prng() > 0.6)

      const input: ScoreProductViralityInput = {
        title: `Test Product Item ${i} ${keywordsPool[i % keywordsPool.length]}`,
        price,
        originalPrice,
        commissionRate,
        soldCount,
        rating,
        category,
        trendKeywords: selectedKeywords,
      }

      const runA = scoreProductVirality(input)
      const runB = scoreProductVirality(input)

      expect(runA.viralityScore).toBe(runB.viralityScore)
      expect(runA.tier).toBe(runB.tier)
      expect(runA.priceImpulseScore).toBe(runB.priceImpulseScore)
      expect(runA.commissionRoiScore).toBe(runB.commissionRoiScore)
      expect(runA.socialProofScore).toBe(runB.socialProofScore)
      expect(runA.trendAlignmentScore).toBe(runB.trendAlignmentScore)
      expect(runA.verdict).toBe(runB.verdict)
      expect(runA.suggestedAngles).toEqual(runB.suggestedAngles)
      expect(runA.deterministicBreakdown).toEqual(runB.deterministicBreakdown)
    }
  })
})

describe('Empirical Stress: Score Boundedness [0, 100] across Boundary & 5,000 Fuzz Vectors', () => {
  it('strictly adheres to [0, 100] across explicit critical boundary edge inputs', () => {
    const boundaryCases: ScoreProductViralityInput[] = [
      // Minimum extreme
      {
        title: 'Min Zero Product',
        price: 0,
        originalPrice: 0,
        commissionRate: 0,
        soldCount: 0,
        rating: 0,
        category: 'A',
        trendKeywords: [],
      },
      // Maximum extreme
      {
        title: 'Max Viral Product',
        price: 0.01,
        originalPrice: 10000,
        commissionRate: 100,
        soldCount: 10000000,
        rating: 5,
        category: 'Health & Beauty',
        trendKeywords: ['viral', 'tiktok', 'racun', 'trending', 'mantap', 'murah', 'cantik'],
      },
      // Step boundary at RM 45
      {
        title: 'Boundary 45 exact',
        price: 45.0,
        commissionRate: 10,
        soldCount: 500,
        rating: 4.5,
        category: 'Gadgets',
      },
      {
        title: 'Boundary 45.001',
        price: 45.001,
        commissionRate: 10,
        soldCount: 500,
        rating: 4.5,
        category: 'Gadgets',
      },
      // Step boundary at RM 150
      {
        title: 'Boundary 150 exact',
        price: 150.0,
        commissionRate: 5,
        soldCount: 100,
        rating: 4.0,
        category: 'Gadgets',
      },
      // Ultra expensive product
      {
        title: 'Luxury Super Car Model',
        price: 999999.99,
        commissionRate: 1,
        soldCount: 2,
        rating: 5.0,
        category: 'Automotive',
      },
      // Commission payout thresholds (RM5 and RM10 thresholds)
      {
        title: 'RM 10 price with 50% commission = RM 5 payout bonus tier',
        price: 10,
        commissionRate: 50,
        soldCount: 100,
        rating: 4.0,
        category: 'Misc',
      },
      {
        title: 'RM 20 price with 50% commission = RM 10 payout bonus tier',
        price: 20,
        commissionRate: 50,
        soldCount: 100,
        rating: 4.0,
        category: 'Misc',
      },
      // Sold count saturation thresholds (0, 50, 500, 2000, 10000)
      ...([0, 49, 50, 51, 499, 500, 501, 1999, 2000, 2001, 9999, 10000, 10001, 500000].map(sold => ({
        title: `SoldCount Step ${sold}`,
        price: 25.0,
        commissionRate: 8,
        soldCount: sold,
        rating: 4.5,
        category: 'General',
      }))),
    ]

    for (const testCase of boundaryCases) {
      const result = scoreProductVirality(testCase)
      expect(result.viralityScore).toBeGreaterThanOrEqual(0)
      expect(result.viralityScore).toBeLessThanOrEqual(100)
      expect(Number.isInteger(result.viralityScore)).toBe(true)
      expect(result.priceImpulseScore).toBeGreaterThanOrEqual(0)
      expect(result.priceImpulseScore).toBeLessThanOrEqual(100)
      expect(result.commissionRoiScore).toBeGreaterThanOrEqual(0)
      expect(result.commissionRoiScore).toBeLessThanOrEqual(100)
      expect(result.socialProofScore).toBeGreaterThanOrEqual(0)
      expect(result.socialProofScore).toBeLessThanOrEqual(100)
      expect(result.trendAlignmentScore).toBeGreaterThanOrEqual(0)
      expect(result.trendAlignmentScore).toBeLessThanOrEqual(100)
      expect(['LOW', 'RISING', 'HIGH', 'SUPER_VIRAL']).toContain(result.tier)
    }
  })

  it('guarantees 100% boundedness across 5,000 wide-spectrum fuzz inputs', () => {
    const prng = createPrng(9999)
    const tierCounts: Record<string, number> = { LOW: 0, RISING: 0, HIGH: 0, SUPER_VIRAL: 0 }

    for (let i = 0; i < 5000; i++) {
      const price = Math.round(prng() * 5000 * 100) / 100
      const hasDiscount = prng() > 0.3
      const originalPrice = hasDiscount ? Math.round((price + prng() * 500) * 100) / 100 : undefined
      const commissionRate = Math.round(prng() * 100 * 10) / 10
      const soldCount = Math.floor(prng() * 1000000)
      const rating = Math.round(prng() * 5 * 100) / 100

      const input: ScoreProductViralityInput = {
        title: `Fuzz Item #${i}`,
        price,
        originalPrice,
        commissionRate,
        soldCount,
        rating,
        category: 'FuzzCategory',
        trendKeywords: prng() > 0.5 ? ['viral', 'racun'] : [],
      }

      const res = scoreProductVirality(input)

      // Strict boundedness checks
      expect(res.viralityScore).toBeGreaterThanOrEqual(0)
      expect(res.viralityScore).toBeLessThanOrEqual(100)
      expect(Number.isInteger(res.viralityScore)).toBe(true)
      expect(Number.isNaN(res.viralityScore)).toBe(false)
      expect(Number.isFinite(res.viralityScore)).toBe(true)

      expect(res.priceImpulseScore).toBeGreaterThanOrEqual(0)
      expect(res.priceImpulseScore).toBeLessThanOrEqual(100)

      expect(res.commissionRoiScore).toBeGreaterThanOrEqual(0)
      expect(res.commissionRoiScore).toBeLessThanOrEqual(100)

      expect(res.socialProofScore).toBeGreaterThanOrEqual(0)
      expect(res.socialProofScore).toBeLessThanOrEqual(100)

      expect(res.trendAlignmentScore).toBeGreaterThanOrEqual(0)
      expect(res.trendAlignmentScore).toBeLessThanOrEqual(100)

      // Strict tier correspondence
      if (res.viralityScore >= 80) {
        expect(res.tier).toBe('SUPER_VIRAL')
      } else if (res.viralityScore >= 65) {
        expect(res.tier).toBe('HIGH')
      } else if (res.viralityScore >= 45) {
        expect(res.tier).toBe('RISING')
      } else {
        expect(res.tier).toBe('LOW')
      }

      tierCounts[res.tier]++
    }

    // Verify all tiers are represented across 5,000 random inputs
    expect(tierCounts.LOW).toBeGreaterThan(0)
    expect(tierCounts.RISING).toBeGreaterThan(0)
    expect(tierCounts.HIGH).toBeGreaterThan(0)
    expect(tierCounts.SUPER_VIRAL).toBeGreaterThan(0)
  })
})

describe('Empirical Stress: Monotonicity with respect to Ratings and Sales', () => {
  it('proves rating monotonicity across fine-grained rating steps (0.0 to 5.0)', () => {
    // For any fixed product, rating increase must NEVER decrease socialProofScore or viralityScore
    const baseInput: ScoreProductViralityInput = {
      title: 'Monotonicity Test Base Item',
      price: 29.90,
      originalPrice: 49.90,
      commissionRate: 10.0,
      soldCount: 1500,
      rating: 0,
      category: 'Health & Beauty',
      trendKeywords: ['viral'],
    }

    let previousSocialProof = -1
    let previousVirality = -1

    for (let r = 0; r <= 50; r++) {
      const currentRating = r / 10
      const res = scoreProductVirality({ ...baseInput, rating: currentRating })

      expect(res.socialProofScore).toBeGreaterThanOrEqual(previousSocialProof)
      expect(res.viralityScore).toBeGreaterThanOrEqual(previousVirality)

      previousSocialProof = res.socialProofScore
      previousVirality = res.viralityScore
    }
  })

  it('proves sales count (soldCount) monotonicity across all saturation segments', () => {
    // Segments: [0, 50), [50, 500), [500, 2000), [2000, 10000), [10000, infinity)
    const baseInput: ScoreProductViralityInput = {
      title: 'Monotonicity Sales Test Item',
      price: 35.00,
      commissionRate: 12.0,
      soldCount: 0,
      rating: 4.8,
      category: 'Electronics',
      trendKeywords: ['padu'],
    }

    const testCounts = [
      0, 1, 5, 10, 25, 49, 50, 51, 75, 100, 250, 499, 500, 501, 750, 1000,
      1500, 1999, 2000, 2001, 3000, 5000, 8000, 9999, 10000, 10001, 25000, 100000,
    ]

    let previousSocialProof = -1
    let previousVirality = -1

    for (const sold of testCounts) {
      const res = scoreProductVirality({ ...baseInput, soldCount: sold })

      expect(res.socialProofScore).toBeGreaterThanOrEqual(previousSocialProof)
      expect(res.viralityScore).toBeGreaterThanOrEqual(previousVirality)

      previousSocialProof = res.socialProofScore
      previousVirality = res.viralityScore
    }
  })

  it('proves monotonic non-decrease across 1,000 randomized pair perturbations of rating', () => {
    const prng = createPrng(777)

    for (let i = 0; i < 1000; i++) {
      const price = Math.round((10 + prng() * 100) * 100) / 100
      const commissionRate = Math.round(prng() * 30 * 10) / 10
      const soldCount = Math.floor(prng() * 20000)
      const baseRating = Math.round(prng() * 4 * 10) / 10 // between 0.0 and 4.0
      const deltaRating = Math.round((0.1 + prng() * (5 - baseRating)) * 10) / 10
      const higherRating = Math.min(5, baseRating + deltaRating)

      const baseInput: ScoreProductViralityInput = {
        title: `Rating Pair Item ${i}`,
        price,
        commissionRate,
        soldCount,
        rating: baseRating,
        category: 'Fashion',
      }

      const lowerResult = scoreProductVirality(baseInput)
      const higherResult = scoreProductVirality({ ...baseInput, rating: higherRating })

      expect(higherResult.socialProofScore).toBeGreaterThanOrEqual(lowerResult.socialProofScore)
      expect(higherResult.viralityScore).toBeGreaterThanOrEqual(lowerResult.viralityScore)
    }
  })

  it('proves monotonic non-decrease across 1,000 randomized pair perturbations of sales', () => {
    const prng = createPrng(888)

    for (let i = 0; i < 1000; i++) {
      const price = Math.round((5 + prng() * 80) * 100) / 100
      const commissionRate = Math.round(prng() * 25 * 10) / 10
      const rating = Math.round(prng() * 5 * 10) / 10
      const baseSoldCount = Math.floor(prng() * 8000)
      const deltaSoldCount = Math.floor(1 + prng() * 5000)
      const higherSoldCount = baseSoldCount + deltaSoldCount

      const baseInput: ScoreProductViralityInput = {
        title: `Sales Pair Item ${i}`,
        price,
        commissionRate,
        soldCount: baseSoldCount,
        rating,
        category: 'Home & Living',
      }

      const lowerResult = scoreProductVirality(baseInput)
      const higherResult = scoreProductVirality({ ...baseInput, soldCount: higherSoldCount })

      expect(higherResult.socialProofScore).toBeGreaterThanOrEqual(lowerResult.socialProofScore)
      expect(higherResult.viralityScore).toBeGreaterThanOrEqual(lowerResult.viralityScore)
    }
  })

  it('proves joint monotonicity: higher rating AND higher sales never decreases virality', () => {
    const prng = createPrng(555)

    for (let i = 0; i < 500; i++) {
      const price = Math.round((15 + prng() * 60) * 100) / 100
      const commissionRate = Math.round(prng() * 20 * 10) / 10

      const r1 = Math.round(prng() * 3 * 10) / 10
      const r2 = Math.min(5, Math.round((r1 + 0.5 + prng() * 1.5) * 10) / 10)

      const s1 = Math.floor(prng() * 3000)
      const s2 = s1 + Math.floor(500 + prng() * 5000)

      const p1 = scoreProductVirality({
        title: `Joint Item ${i}`,
        price,
        commissionRate,
        rating: r1,
        soldCount: s1,
        category: 'General',
      })

      const p2 = scoreProductVirality({
        title: `Joint Item ${i}`,
        price,
        commissionRate,
        rating: r2,
        soldCount: s2,
        category: 'General',
      })

      expect(p2.socialProofScore).toBeGreaterThanOrEqual(p1.socialProofScore)
      expect(p2.viralityScore).toBeGreaterThanOrEqual(p1.viralityScore)
    }
  })
})
