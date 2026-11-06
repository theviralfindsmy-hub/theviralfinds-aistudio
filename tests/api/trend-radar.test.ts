/**
 * tests/api/trend-radar.test.ts
 * 
 * Comprehensive Automated Bun Test Suite for Milestone 4:
 * Multi-Platform Trend Radar Engine (Data Models, Dynamic Virality Scoring, and API Route).
 */

import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import { GET, OPTIONS } from '@/app/api/trends/radar/route'
import {
  TrendRadarFeedItemSchema,
  TrendRadarQueryParamsSchema,
  TrendRadarApiResponseSchema,
  RADAR_PLATFORMS,
  type TrendRadarFeedItem,
  type RadarPlatform,
} from '@/types/trend-radar'
import { scoreProductVirality } from '@/lib/typesafe-ai/primitives'

describe('M4: Trend Radar Typed Data Models & Zod Schemas', () => {
  it('validates supported platforms: tiktok, xhs, twitter, shorts', () => {
    expect(RADAR_PLATFORMS).toEqual(['tiktok', 'xhs', 'twitter', 'shorts'])
  })

  it('validates a complete TikTok feed item schema adherence', () => {
    const rawTikTokItem = {
      id: 'tt-test-01',
      platform: 'tiktok',
      creator: {
        username: 'Aiman Tech',
        handle: 'aimantech',
        followerCount: '250K',
        verified: true,
      },
      postUrl: 'https://www.tiktok.com/@aimantech/video/1234567890',
      title: 'Stand Laptop Aluminium Padu!',
      hookText: 'Stop beli stand plastik mudah patah!',
      summary: 'Review penuh stand laptop aluminium tahan lasak untuk student dan remote worker.',
      productRecommendation: {
        name: 'Ergonomic Aluminum Laptop Stand',
        shopeeUrl: 'https://shopee.com.my/product/123/456',
        category: 'Electronics',
        estimatedPrice: 25.0,
        originalPrice: 49.0,
        commissionRate: 12.0,
        soldCount: 12000,
        rating: 4.9,
        viralityScore: 88,
        viralityTier: 'SUPER_VIRAL',
      },
      metrics: {
        views: 500000,
        likes: 45000,
        shares: 12000,
        comments: 2100,
        growthVelocity: 'SURGING',
      },
      tags: ['racunshopee', 'laptopstand'],
      language: 'ms',
    }

    const parsed = TrendRadarFeedItemSchema.parse(rawTikTokItem)
    expect(parsed.id).toBe('tt-test-01')
    expect(parsed.platform).toBe('tiktok')
    expect(parsed.language).toBe('ms')
    expect(parsed.productRecommendation?.viralityScore).toBe(88)
    expect(parsed.productRecommendation?.viralityTier).toBe('SUPER_VIRAL')
  })

  it('validates a Xiaohongshu (XHS) bilingual feed item schema adherence', () => {
    const rawXhsItem = {
      id: 'xhs-test-01',
      platform: 'xhs',
      creator: {
        username: 'Chloe in KL',
        handle: 'chloe_kl',
        followerCount: '180K',
      },
      postUrl: 'https://www.xiaohongshu.com/discovery/item/987654321',
      title: '打工人每天喝足2L水神器！磨砂渐变高颜值大容量水壶',
      hookText: '每次上班总是忘记喝水？Shopee RM16 入手的神仙水杯！',
      summary: '带吸管与时间刻度提示，磨砂手感高级且防漏。附真实入手链接。',
      productRecommendation: {
        name: '2L Gradient Motivational Water Bottle',
        shopeeUrl: 'https://shopee.com.my/product/345/678',
        category: 'Home & Living',
        estimatedPrice: 16.8,
        commissionRate: 10.0,
        viralityScore: 84,
        viralityTier: 'SUPER_VIRAL',
      },
      metrics: {
        views: 220000,
        likes: 18000,
        shares: 6200,
        comments: 850,
        growthVelocity: 'SURGING',
      },
      tags: ['小红书好物推荐', '马来西亚生活'],
      language: 'zh',
    }

    const parsed = TrendRadarFeedItemSchema.parse(rawXhsItem)
    expect(parsed.platform).toBe('xhs')
    expect(parsed.language).toBe('zh')
  })

  it('rejects unsupported platforms (e.g. instagram or facebook)', () => {
    const invalidPlatformItem = {
      id: 'invalid-01',
      platform: 'instagram', // Invalid for TrendRadar
      creator: { username: 'test', handle: 'test', followerCount: '10K' },
      postUrl: 'https://instagram.com/p/123',
      title: 'Test',
      hookText: 'Test hook',
      summary: 'Test summary',
      metrics: { views: 100, likes: 10, shares: 1, comments: 0, growthVelocity: 'STABLE' },
      tags: [],
      language: 'en',
    }

    expect(() => TrendRadarFeedItemSchema.parse(invalidPlatformItem)).toThrow()
  })

  it('rejects invalid or negative metrics values', () => {
    const negativeViewsItem = {
      id: 'invalid-views',
      platform: 'tiktok',
      creator: { username: 'test', handle: 'test', followerCount: '10K' },
      postUrl: 'https://tiktok.com/@test/video/1',
      title: 'Test',
      hookText: 'Test hook',
      summary: 'Test summary',
      metrics: { views: -50, likes: 10, shares: 1, comments: 0, growthVelocity: 'STABLE' },
      tags: [],
      language: 'ms',
    }

    expect(() => TrendRadarFeedItemSchema.parse(negativeViewsItem)).toThrow()
  })
})

describe('M4: Dynamic Virality Engine Integration', () => {
  it('correctly calculates mathematical virality scores for radar seed products', () => {
    const scoreResult = scoreProductVirality({
      title: 'Ergonomic Folding Aluminum Laptop Stand Heavy Duty',
      price: 24.9,
      originalPrice: 49.0,
      commissionRate: 12.0,
      soldCount: 14200,
      rating: 4.9,
      category: 'Electronics',
      trendKeywords: ['racunshopee', 'gadgetviral'],
    })

    expect(scoreResult.viralityScore).toBeGreaterThanOrEqual(80)
    expect(scoreResult.tier).toBe('SUPER_VIRAL')
    expect(scoreResult.priceImpulseScore).toBeGreaterThan(80)
    expect(scoreResult.commissionRoiScore).toBeGreaterThanOrEqual(100)
    expect(scoreResult.socialProofScore).toBeGreaterThanOrEqual(95)
    expect(scoreResult.suggestedAngles.length).toBeGreaterThan(0)
  })
})

describe('M4: API Route GET /api/trends/radar', () => {
  it('returns status 200 and default multi-platform feed with full metadata', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()

    // Validate response payload against Zod schema
    const parsed = TrendRadarApiResponseSchema.parse(data)
    expect(parsed.total).toBeGreaterThanOrEqual(16)
    expect(parsed.items.length).toBeGreaterThanOrEqual(16)
    expect(parsed.activeFilters.platform).toBe('all')
    expect(parsed.activeFilters.velocity).toBe('all')
    expect(parsed.meta.totalSurging).toBeGreaterThan(0)
    expect(parsed.meta.avgViralityScore).toBeGreaterThan(50)
  })

  it('filters strictly by platform (?platform=tiktok)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?platform=tiktok')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeFilters.platform).toBe('tiktok')
    expect(data.items.length).toBeGreaterThan(0)
    for (const item of data.items) {
      expect(item.platform).toBe('tiktok')
    }
  })

  it('filters strictly by platform (?platform=xhs) and verifies bilingual content', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?platform=xhs')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeFilters.platform).toBe('xhs')
    expect(data.items.length).toBeGreaterThan(0)
    for (const item of data.items) {
      expect(item.platform).toBe('xhs')
      expect(item.language).toBe('zh')
    }
  })

  it('filters strictly by platform (?platform=twitter)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?platform=twitter')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeFilters.platform).toBe('twitter')
    expect(data.items.length).toBeGreaterThan(0)
    for (const item of data.items) {
      expect(item.platform).toBe('twitter')
    }
  })

  it('filters strictly by platform (?platform=shorts)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?platform=shorts')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeFilters.platform).toBe('shorts')
    expect(data.items.length).toBeGreaterThan(0)
    for (const item of data.items) {
      expect(item.platform).toBe('shorts')
    }
  })

  it('filters strictly by growth velocity (?velocity=SURGING)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?velocity=SURGING')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeFilters.velocity).toBe('SURGING')
    for (const item of data.items) {
      expect(item.metrics.growthVelocity).toBe('SURGING')
    }
  })

  it('filters by search query (?query=skintific)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?query=skintific')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items[0].productRecommendation.name).toContain('Skintific')
  })

  it('filters by category (?category=Beauty)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?category=Beauty')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.items.length).toBeGreaterThan(0)
    for (const item of data.items) {
      expect(item.productRecommendation.category).toBe('Beauty')
    }
  })

  it('sorts correctly by views descending (?sortBy=views)', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?sortBy=views')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    for (let i = 0; i < data.items.length - 1; i++) {
      expect(data.items[i].metrics.views).toBeGreaterThanOrEqual(data.items[i + 1].metrics.views)
    }
  })

  it('paginates accurately (?page=1&limit=4 and ?page=2&limit=4)', async () => {
    const req1 = new NextRequest('http://localhost:3000/api/trends/radar?page=1&limit=4')
    const res1 = await GET(req1)
    const data1 = await res1.json()

    expect(data1.page).toBe(1)
    expect(data1.limit).toBe(4)
    expect(data1.items.length).toBe(4)

    const req2 = new NextRequest('http://localhost:3000/api/trends/radar?page=2&limit=4')
    const res2 = await GET(req2)
    const data2 = await res2.json()

    expect(data2.page).toBe(2)
    expect(data2.limit).toBe(4)
    expect(data2.items.length).toBe(4)

    // Ensure page 1 and page 2 items are disjoint
    const p1Ids = new Set(data1.items.map((i: any) => i.id))
    for (const item of data2.items) {
      expect(p1Ids.has(item.id)).toBe(false)
    }
  })

  it('rejects invalid query parameters with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/trends/radar?platform=invalid_platform')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid query parameters')
  })

  it('handles CORS OPTIONS preflight request with HTTP 204', async () => {
    const res = await OPTIONS()
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })
})
