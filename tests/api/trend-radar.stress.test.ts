/**
 * tests/api/trend-radar.stress.test.ts
 * 
 * Empirical Adversarial Challenger Test Suite for Milestone 4:
 * 1. Query parameter fuzzing (extreme boundaries, invalid enums, negative numbers, SQL/XSS payloads)
 * 2. Mathematical boundary conditions of dynamic virality scores [0, 100]
 * 3. Sorting engine invariants and pagination integrity
 * 4. CORS preflight and response header enforcement
 */

import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import { GET, OPTIONS } from '@/app/api/trends/radar/route'
import {
  TrendRadarApiResponseSchema,
  RADAR_PLATFORMS,
  RADAR_SORT_OPTIONS,
} from '@/types/trend-radar'

describe('Empirical Challenger: Query Parameter Fuzzing & Injection Defense', () => {
  it('rejects unsupported and malicious platform parameters with HTTP 400', async () => {
    const maliciousPlatforms = [
      'instagram',
      'facebook',
      'tiktok; DROP TABLE radar_items;--',
      '<script>alert(1)</script>',
      'TIKTOK',
      'TikTok',
      'tiktok\0',
      'douyin',
      'all; SELECT * FROM users',
      'undefined',
      'null',
      'true',
      '123',
    ]

    for (const badPlatform of maliciousPlatforms) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?platform=${encodeURIComponent(badPlatform)}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Invalid query parameters')
      expect(data.details).toBeDefined()
    }
  })

  it('rejects invalid growth velocity parameters with HTTP 400', async () => {
    const maliciousVelocities = [
      'TURBO',
      'surging',
      'HIGH_VELOCITY',
      '1 OR 1=1',
      '<svg onload=alert()>',
      'NaN',
    ]

    for (const badVelocity of maliciousVelocities) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?velocity=${encodeURIComponent(badVelocity)}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Invalid query parameters')
    }
  })

  it('rejects invalid virality tiers with HTTP 400', async () => {
    const maliciousTiers = [
      'GOD_TIER',
      'low',
      'super_viral',
      'HIGH; DROP TABLE users',
      '0',
    ]

    for (const badTier of maliciousTiers) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?tier=${encodeURIComponent(badTier)}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
    }
  })

  it('rejects invalid languages with HTTP 400', async () => {
    const badLangs = ['id', 'ta', 'es', 'ms-MY', 'zh-CN', 'EN', '1']

    for (const lang of badLangs) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?language=${encodeURIComponent(lang)}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
    }
  })

  it('rejects out-of-bound or non-numeric minScore parameters with HTTP 400', async () => {
    const invalidMinScores = [
      '-1',
      '-100',
      '101',
      '999999',
      'abc',
      'NaN',
      'Infinity',
      '-Infinity',
    ]

    for (const score of invalidMinScores) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?minScore=${score}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
    }
  })

  it('accepts valid boundary minScore values [0, 100]', async () => {
    for (const score of [0, 50, 75, 80, 88, 100]) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?minScore=${score}`)
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      for (const item of data.items) {
        expect(item.productRecommendation.viralityScore).toBeGreaterThanOrEqual(score)
      }
    }
  })

  it('gracefully handles boundary limit parameters by clamping to [1, 100]', async () => {
    // Zero limit -> clamped to 1
    const reqZero = new NextRequest('http://localhost:3000/api/trends/radar?limit=0')
    const resZero = await GET(reqZero)
    expect(resZero.status).toBe(200)
    const dataZero = await resZero.json()
    expect(dataZero.limit).toBe(1)
    expect(dataZero.items.length).toBe(1)

    // Negative limit -> clamped to 1
    const reqNeg = new NextRequest('http://localhost:3000/api/trends/radar?limit=-50')
    const resNeg = await GET(reqNeg)
    expect(resNeg.status).toBe(200)
    const dataNeg = await resNeg.json()
    expect(dataNeg.limit).toBe(1)

    // Huge limit -> clamped to 100
    const reqHuge = new NextRequest('http://localhost:3000/api/trends/radar?limit=5000')
    const resHuge = await GET(reqHuge)
    expect(resHuge.status).toBe(200)
    const dataHuge = await resHuge.json()
    expect(dataHuge.limit).toBe(100)
  })

  it('rejects non-integer limit and page parameters with HTTP 400', async () => {
    const invalidNumbers = ['abc', '1.5', '2.8', 'NaN', 'undefined']

    for (const val of invalidNumbers) {
      const req1 = new NextRequest(`http://localhost:3000/api/trends/radar?limit=${val}`)
      const res1 = await GET(req1)
      expect(res1.status).toBe(400)

      const req2 = new NextRequest(`http://localhost:3000/api/trends/radar?page=${val}`)
      const res2 = await GET(req2)
      expect(res2.status).toBe(400)
    }
  })

  it('gracefully handles boundary page numbers (page <= 0 clamped to 1, huge page returns empty items)', async () => {
    // page=0 -> clamped to 1
    const reqZero = new NextRequest('http://localhost:3000/api/trends/radar?page=0')
    const resZero = await GET(reqZero)
    expect(resZero.status).toBe(200)
    const dataZero = await resZero.json()
    expect(dataZero.page).toBe(1)

    // page=-10 -> clamped to 1
    const reqNeg = new NextRequest('http://localhost:3000/api/trends/radar?page=-10')
    const resNeg = await GET(reqNeg)
    expect(resNeg.status).toBe(200)
    const dataNeg = await resNeg.json()
    expect(dataNeg.page).toBe(1)

    // page=9999 -> returns empty items array with valid meta
    const reqHuge = new NextRequest('http://localhost:3000/api/trends/radar?page=9999')
    const resHuge = await GET(reqHuge)
    expect(resHuge.status).toBe(200)
    const dataHuge = await resHuge.json()
    expect(dataHuge.page).toBe(9999)
    expect(dataHuge.items).toEqual([])
    expect(dataHuge.total).toBeGreaterThan(0)
  })

  it('safely handles extreme search queries (10k chars, special regex chars, unicode) without crashing', async () => {
    // 10,000 char query
    const hugeQuery = 'A'.repeat(10000)
    const reqHuge = new NextRequest(`http://localhost:3000/api/trends/radar?query=${encodeURIComponent(hugeQuery)}`)
    const resHuge = await GET(reqHuge)
    expect(resHuge.status).toBe(200)
    const dataHuge = await resHuge.json()
    expect(dataHuge.items.length).toBe(0)
    expect(dataHuge.total).toBe(0)

    // Regex injection chars
    const regexVectors = ['.*', '([a-z]+)*', '^.*$', '(?=.*)', '[\\]', '\\', '(?!)']
    for (const vec of regexVectors) {
      const req = new NextRequest(`http://localhost:3000/api/trends/radar?query=${encodeURIComponent(vec)}`)
      const res = await GET(req)
      expect(res.status).toBe(200)
    }

    // Both ?query= and ?q= parameter aliases work identically
    const reqQuery = new NextRequest('http://localhost:3000/api/trends/radar?query=laptop')
    const resQuery = await GET(reqQuery)
    const dataQuery = await resQuery.json()

    const reqQ = new NextRequest('http://localhost:3000/api/trends/radar?q=laptop')
    const resQ = await GET(reqQ)
    const dataQ = await resQ.json()

    expect(dataQuery.total).toBe(dataQ.total)
    expect(dataQuery.items.length).toBe(dataQ.items.length)
  })
})

describe('Empirical Challenger: Mathematical Boundary Conditions of Virality Scores', () => {
  it('proves all returned feed items have mathematically valid [0, 100] scores and correct tier mappings', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?limit=100')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.items.length).toBeGreaterThan(0)

    for (const item of data.items) {
      const rec = item.productRecommendation
      expect(rec).toBeDefined()
      if (!rec) continue

      // 1. Virality score is bounded in [0, 100] and is an integer
      expect(rec.viralityScore).toBeGreaterThanOrEqual(0)
      expect(rec.viralityScore).toBeLessThanOrEqual(100)
      expect(Number.isInteger(rec.viralityScore)).toBe(true)
      expect(Number.isNaN(rec.viralityScore)).toBe(false)

      // 2. Virality tier correctly maps to mathematical score ranges (primitives.ts specification: >=80: SUPER_VIRAL, >=65: HIGH, >=45: RISING, <45: LOW)
      if (rec.viralityScore >= 80) {
        expect(rec.viralityTier).toBe('SUPER_VIRAL')
      } else if (rec.viralityScore >= 65) {
        expect(rec.viralityTier).toBe('HIGH')
      } else if (rec.viralityScore >= 45) {
        expect(rec.viralityTier).toBe('RISING')
      } else {
        expect(rec.viralityTier).toBe('LOW')
      }

      // 3. Sub-scores are bounded in [0, 100]
      if (rec.priceImpulseScore !== undefined) {
        expect(rec.priceImpulseScore).toBeGreaterThanOrEqual(0)
        expect(rec.priceImpulseScore).toBeLessThanOrEqual(100)
      }
      if (rec.commissionRoiScore !== undefined) {
        expect(rec.commissionRoiScore).toBeGreaterThanOrEqual(0)
        expect(rec.commissionRoiScore).toBeLessThanOrEqual(100)
      }
      if (rec.socialProofScore !== undefined) {
        expect(rec.socialProofScore).toBeGreaterThanOrEqual(0)
        expect(rec.socialProofScore).toBeLessThanOrEqual(100)
      }
      if (rec.trendAlignmentScore !== undefined) {
        expect(rec.trendAlignmentScore).toBeGreaterThanOrEqual(0)
        expect(rec.trendAlignmentScore).toBeLessThanOrEqual(100)
      }
    }
  })

  it('proves virality scores are dynamically calculated and NOT hardcoded uniform constants', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?limit=100')
    const res = await GET(req)
    const data = await res.json()

    const scores = data.items.map((i: any) => i.productRecommendation.viralityScore)
    const uniqueScores = new Set(scores)

    // With 16 diverse products across categories, we must have at least 5 distinct scores
    expect(uniqueScores.size).toBeGreaterThanOrEqual(5)

    // Check tiers diversity: must have at least 2 distinct tiers represented
    const tiers = data.items.map((i: any) => i.productRecommendation.viralityTier)
    const uniqueTiers = new Set(tiers)
    expect(uniqueTiers.size).toBeGreaterThanOrEqual(2)
  })

  it('verifies aggregate metadata metrics mathematical accuracy', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?limit=100')
    const res = await GET(req)
    const data = await res.json()

    // 1. avgViralityScore
    const totalItems = data.total
    const calculatedSum = data.items.reduce((sum: number, i: any) => sum + i.productRecommendation.viralityScore, 0)
    const expectedAvg = Math.round((calculatedSum / totalItems) * 10) / 10
    expect(data.meta.avgViralityScore).toBe(expectedAvg)

    // 2. totalSurging count
    const surgingCount = data.items.filter((i: any) => i.metrics.growthVelocity === 'SURGING').length
    expect(data.meta.totalSurging).toBe(surgingCount)

    // 3. platformDistribution sum equals total
    const distSum = Object.values(data.meta.platformDistribution as Record<string, number>).reduce((a, b) => a + b, 0)
    expect(distSum).toBe(totalItems)
  })
})

describe('Empirical Challenger: Sorting Invariants & Pagination Integrity', () => {
  it('enforces strict monotonicity for sortBy=virality', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?sortBy=virality&limit=100')
    const res = await GET(req)
    const data = await res.json()

    for (let i = 0; i < data.items.length - 1; i++) {
      const cur = data.items[i].productRecommendation.viralityScore
      const next = data.items[i + 1].productRecommendation.viralityScore
      expect(cur).toBeGreaterThanOrEqual(next)
    }
  })

  it('enforces strict monotonicity for sortBy=views', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?sortBy=views&limit=100')
    const res = await GET(req)
    const data = await res.json()

    for (let i = 0; i < data.items.length - 1; i++) {
      expect(data.items[i].metrics.views).toBeGreaterThanOrEqual(data.items[i + 1].metrics.views)
    }
  })

  it('enforces growth velocity ordering for sortBy=growth (SURGING >= HIGH >= STABLE)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?sortBy=growth&limit=100')
    const res = await GET(req)
    const data = await res.json()

    const rank = { SURGING: 3, HIGH: 2, STABLE: 1 }
    for (let i = 0; i < data.items.length - 1; i++) {
      const vCur = rank[data.items[i].metrics.growthVelocity as keyof typeof rank]
      const vNext = rank[data.items[i + 1].metrics.growthVelocity as keyof typeof rank]
      expect(vCur).toBeGreaterThanOrEqual(vNext)
    }
  })

  it('enforces pagination partitioning without duplicate or missing items across consecutive pages', async () => {
    const allReq = new NextRequest('http://localhost:3000/api/trends/radar?limit=100')
    const allRes = await GET(allReq)
    const allData = await allRes.json()
    const totalCount = allData.total

    const pageSize = 3
    const totalPages = Math.ceil(totalCount / pageSize)
    const collectedIds: string[] = []

    for (let page = 1; page <= totalPages; page++) {
      const pReq = new NextRequest(`http://localhost:3000/api/trends/radar?page=${page}&limit=${pageSize}`)
      const pRes = await GET(pReq)
      const pData = await pRes.json()

      expect(pData.page).toBe(page)
      expect(pData.limit).toBe(pageSize)
      expect(pData.items.length).toBeLessThanOrEqual(pageSize)

      for (const item of pData.items) {
        collectedIds.push(item.id)
      }
    }

    // Verify all collected IDs are unique (no cross-page duplicates)
    const uniqueIds = new Set(collectedIds)
    expect(uniqueIds.size).toBe(totalCount)
    expect(collectedIds.length).toBe(totalCount)
  })
})

describe('Empirical Challenger: CORS Compliance & Preflight Auditing', () => {
  it('OPTIONS preflight strictly returns status 204 with required CORS headers', async () => {
    const res = await OPTIONS()
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS')
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })

  it('AUDIT: GET responses must include Access-Control-Allow-Origin header for browser cross-origin requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar')
    const res = await GET(req)
    expect(res.status).toBe(200)

    // An API supporting CORS MUST include Access-Control-Allow-Origin on GET responses as well as OPTIONS preflight
    const allowOrigin = res.headers.get('Access-Control-Allow-Origin')
    // We assert whether this is present or missing
    expect(allowOrigin).toBe('*')
  })
})
