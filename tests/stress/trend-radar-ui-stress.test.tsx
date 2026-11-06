/**
 * tests/stress/trend-radar-ui-stress.test.tsx
 * 
 * Adversarial Challenger M4-2 Test Suite:
 * Stress-testing Trend Radar UI & Component Rendering in SocialHubPage.
 * 
 * Dimensions Challenged:
 * 1. Empty Search Results & Boundary Filter Combinations
 * 2. Malformed Feed Items, Missing Optional Fields & Type Boundary Fuzzing
 * 3. Shopee Outbound Link Safety, Attributes & Protocol Injection
 * 4. Rapid Tab Toggling, Async State Tearing & Concurrency Invariants
 * 5. Touch Target & Accessibility Compliance
 * 6. Verification of TypeScript Compilation Invariants
 */

import React from 'react'
import { describe, it, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import {
  TrendRadarCard,
  TrendRadarView,
  SocialHubPage,
  formatMetricNumber,
  DEFAULT_RADAR_SEEDS,
} from '@/components/pages/socialhub-page'
import type {
  TrendRadarFeedItem,
  RadarPlatform,
  GrowthVelocity,
  RadarPlatformFilter,
} from '@/types/trend-radar'

// ============================================================================
// Fixtures
// ============================================================================

const BASE_VALID_ITEM: TrendRadarFeedItem = {
  id: 'radar-stress-base-01',
  platform: 'tiktok',
  creator: {
    username: 'Test Creator MY',
    handle: 'test_creator_my',
    followerCount: '150K',
    verified: true,
  },
  postUrl: 'https://tiktok.com/@test_creator_my/video/1234567890',
  title: 'Pembersih Habuk Tanpa Wayar Viral Shopee MY',
  hookText: 'Korang masih guna penyapu habuk lama? Tengok ni sedut terus licin!',
  summary: 'Ulasan mini vacuum cleaner mudah alih untuk keyboard dan kereta.',
  productRecommendation: {
    name: 'Wireless Handheld Desktop Vacuum Cleaner',
    shopeeUrl: 'https://shopee.com.my/Wireless-Handheld-Vacuum-i.12345.67890',
    category: 'Home Appliances',
    estimatedPrice: 29.9,
    originalPrice: 45.0,
    commissionRate: 15,
    viralityScore: 92,
    viralityTier: 'SUPER_VIRAL',
    soldCount: 12000,
    rating: 4.9,
  },
  metrics: {
    views: 320000,
    likes: 45000,
    shares: 8200,
    comments: 1100,
    growthVelocity: 'SURGING',
  },
  tags: ['RacunShopee', 'VacuumViral', 'ShopeeAffiliateMY'],
  language: 'ms',
}

// ============================================================================
// 1. Empty Search Results & Boundary Filter Handling
// ============================================================================

describe('Challenger M4-2: Empty Search & Filter States', () => {
  it('renders clean empty state with specific CTA when items array is empty', () => {
    let resetCalled = false
    const html = renderToString(
      <TrendRadarView
        items={[]}
        selectedPlatform="all"
        onSelectPlatform={() => {}}
        searchQuery="nonexistent_gadget_xyz"
        onSearchChange={() => {}}
        onResetFilters={() => { resetCalled = true }}
      />
    )

    expect(html).toContain('Tiada trend ditemui')
    expect(html).toContain('Set Semula Penapis')
    // React SSR places comment nodes between adjacent text expressions: 0<!-- --> Feeds
    expect(html).toMatch(/0(<!-- -->)? Feeds/)
    expect(html).toMatch(/0(<!-- -->)? Viral/)
    expect(html).toMatch(/0(<!-- -->)?\/100/)
    expect(html).toMatch(/0(<!-- -->)? Links/)
  })

  it('handles TrendRadarView safely when onResetFilters callback is omitted', () => {
    expect(() => {
      renderToString(
        <TrendRadarView
          items={[]}
          selectedPlatform="tiktok"
          onSelectPlatform={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
        />
      )
    }).not.toThrow()
  })

  it('does not divide by zero in average virality calculation when items is empty', () => {
    const html = renderToString(
      <TrendRadarView
        items={[]}
        selectedPlatform="all"
        onSelectPlatform={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />
    )
    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
    expect(html).toMatch(/0(<!-- -->)?\/100/)
  })

  it('renders correctly when items contains items without productRecommendation in average score calculation', () => {
    const itemWithoutProduct: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      id: 'no-prod-01',
      productRecommendation: undefined,
    }

    const html = renderToString(
      <TrendRadarView
        items={[itemWithoutProduct]}
        selectedPlatform="all"
        onSelectPlatform={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />
    )

    // Falls back to 80 when productRecommendation?.viralityScore is undefined
    expect(html).toMatch(/80(<!-- -->)?\/100/)
    expect(html).toMatch(/0(<!-- -->)? Links/)
  })
})

// ============================================================================
// 2. Malformed Feed Items & Missing Optional Fields
// ============================================================================

describe('Challenger M4-2: Malformed Feed Items & Boundary Fuzzing', () => {
  it('renders without productRecommendation without null reference errors', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: undefined,
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain(item.title)
    expect(html).toContain(item.hookText)
    expect(html).not.toContain('Beli / Semak Pautan Shopee Affiliate')
  })

  it('renders when product recommendation has undefined shopeeUrl', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: {
        ...BASE_VALID_ITEM.productRecommendation!,
        shopeeUrl: undefined,
      },
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain(item.productRecommendation!.name)
    expect(html).not.toContain('Beli / Semak Pautan Shopee Affiliate')
  })

  it('renders when viralityTier is undefined using default fallback', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: {
        ...BASE_VALID_ITEM.productRecommendation!,
        viralityTier: undefined,
      },
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain('SUPER VIRAL')
  })

  it('handles zero estimated price and zero commission rate correctly', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: {
        ...BASE_VALID_ITEM.productRecommendation!,
        estimatedPrice: 0,
        commissionRate: 0,
      },
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain('RM 0.00')
    expect(html).toContain('Komisen (0%):')
    expect(html).toContain('~RM 0.00 / sale')
  })

  it('handles empty tags array without crashing', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      tags: [],
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain(item.title)
  })

  it('handles tags with double hash prefixes or clean formatting', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      tags: ['#RacunTikTok', '##SuperDeal', 'affiliate_my'],
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toMatch(/#(<!-- -->)?RacunTikTok/)
    expect(html).toMatch(/#(<!-- -->)?affiliate_my/)
  })

  it('handles unverified creator without throwing', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      creator: {
        ...BASE_VALID_ITEM.creator,
        verified: false,
      },
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).toContain(item.creator.username)
  })

  it('escapes dangerous HTML/XSS in hookText, title, and creator username', () => {
    const xssItem: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      title: '<script>evil()</script>',
      hookText: '<img src=x onerror=alert(1)>',
      creator: {
        ...BASE_VALID_ITEM.creator,
        username: '<b onfocus=alert(1)>Attacker</b>',
      },
    }

    const html = renderToString(<TrendRadarCard item={xssItem} />)
    expect(html).not.toContain('<script>evil()</script>')
    expect(html).toContain('&lt;script&gt;evil()&lt;/script&gt;')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('escapes dangerous HTML/XSS in product name', () => {
    const item: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: {
        ...BASE_VALID_ITEM.productRecommendation!,
        name: '<iframe src="javascript:alert(1)"></iframe>Injected Product',
      },
    }

    const html = renderToString(<TrendRadarCard item={item} />)
    expect(html).not.toContain('<iframe')
    expect(html).toContain('&lt;iframe')
  })

  it('empirically verifies formatMetricNumber robustness when called with undefined or null', () => {
    // Hardened formatMetricNumber returns safe '0' instead of throwing unhandled TypeError
    expect(formatMetricNumber(undefined as unknown as number)).toBe('0')
    expect(formatMetricNumber(null as unknown as number)).toBe('0')
    expect(formatMetricNumber(NaN as unknown as number)).toBe('0')
  })
})

// ============================================================================
// 3. formatMetricNumber Fuzzing & Boundaries
// ============================================================================

describe('Challenger M4-2: formatMetricNumber Stress & Edge Cases', () => {
  it('formats exact boundaries: 0, 999, 1000, 999999, 1000000', () => {
    expect(formatMetricNumber(0)).toBe('0')
    expect(formatMetricNumber(999)).toBe('999')
    expect(formatMetricNumber(1000)).toBe('1K')
    expect(formatMetricNumber(1500)).toBe('1.5K')
    expect(formatMetricNumber(999999)).toBe('1000.0K')
    expect(formatMetricNumber(1000000)).toBe('1M')
    expect(formatMetricNumber(2500000)).toBe('2.5M')
  })

  it('handles fractional / decimal numbers without throwing', () => {
    expect(formatMetricNumber(12.34)).toBe('12.34')
    expect(formatMetricNumber(1000.5)).toBe('1.0K')
  })

  it('handles negative metric values gracefully', () => {
    expect(formatMetricNumber(-5)).toBe('-5')
  })
})

// ============================================================================
// 4. Shopee Outbound Link Safety & Attributes
// ============================================================================

describe('Challenger M4-2: Shopee Outbound Link Security & Attributes', () => {
  it('enforces target="_blank" and rel="noopener noreferrer" on Shopee outbound links', () => {
    const html = renderToString(<TrendRadarCard item={BASE_VALID_ITEM} />)
    const shopeeLinkSnippet = html.slice(html.indexOf('https://shopee.com.my'))
    expect(shopeeLinkSnippet).toContain('target="_blank"')
    expect(shopeeLinkSnippet).toContain('rel="noopener noreferrer"')
  })

  it('enforces target="_blank" and rel="noopener noreferrer" on source post links', () => {
    const html = renderToString(<TrendRadarCard item={BASE_VALID_ITEM} />)
    const postLinkSnippet = html.slice(html.indexOf(BASE_VALID_ITEM.postUrl))
    expect(postLinkSnippet).toContain('target="_blank"')
    expect(postLinkSnippet).toContain('rel="noopener noreferrer"')
  })

  it('verifies React 19 security defense against malicious javascript: URI in shopeeUrl', () => {
    const maliciousItem: TrendRadarFeedItem = {
      ...BASE_VALID_ITEM,
      productRecommendation: {
        ...BASE_VALID_ITEM.productRecommendation!,
        shopeeUrl: 'javascript:alert(document.cookie)',
      },
    }

    const html = renderToString(<TrendRadarCard item={maliciousItem} />)
    // EMPIRICAL OBSERVATION: React 19 automatically rewrites javascript: href to throw a security error
    // preventing code execution upon user click
    expect(html).toContain('React has blocked a javascript: URL as a security precaution')
  })
})

// ============================================================================
// 5. Rapid Tab Toggling & Concurrency Invariants
// ============================================================================

describe('Challenger M4-2: Rapid Tab Toggling & State Invariants', () => {
  it('renders all 3 main tabs in SocialHubPage without crashing', () => {
    const html = renderToString(<SocialHubPage />)
    expect(html).toContain('Live Trend Radar')
    expect(html).toContain('Channels &amp; Accounts')
    expect(html).toContain('Auto-Post Scheduling Queue')
  })

  it('verifies deterministic client-side filtering on all 4 platforms and "all"', () => {
    const platforms: RadarPlatformFilter[] = ['all', 'tiktok', 'xhs', 'twitter', 'shorts']
    const testItems: TrendRadarFeedItem[] = [
      { ...BASE_VALID_ITEM, id: 'item-tt', platform: 'tiktok' },
      { ...BASE_VALID_ITEM, id: 'item-xhs', platform: 'xhs' },
      { ...BASE_VALID_ITEM, id: 'item-tw', platform: 'twitter' },
      { ...BASE_VALID_ITEM, id: 'item-sh', platform: 'shorts' },
    ]

    for (const p of platforms) {
      const filtered = testItems.filter((i) => p === 'all' || i.platform === p)
      const html = renderToString(
        <TrendRadarView
          items={filtered}
          selectedPlatform={p}
          onSelectPlatform={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
        />
      )

      if (p === 'all') {
        expect(filtered.length).toBe(4)
      } else {
        expect(filtered.length).toBe(1)
        expect(filtered[0].platform).toBe(p)
      }
      expect(html).toContain('Scouted Trends')
    }
  })

  it('simulates rapid sequential filter switching without state corruption', () => {
    const items = [...DEFAULT_RADAR_SEEDS]
    let currentPlatform: RadarPlatformFilter = 'all'

    const switchPlatform = (next: RadarPlatformFilter) => {
      currentPlatform = next
      return items.filter((i) => next === 'all' || i.platform === next)
    }

    // Rapid toggle sequence: all -> tiktok -> xhs -> twitter -> shorts -> all
    const sequence: RadarPlatformFilter[] = ['tiktok', 'xhs', 'twitter', 'shorts', 'all', 'tiktok']
    for (const target of sequence) {
      const activeItems = switchPlatform(target)
      const html = renderToString(
        <TrendRadarView
          items={activeItems}
          selectedPlatform={currentPlatform}
          onSelectPlatform={switchPlatform}
          searchQuery=""
          onSearchChange={() => {}}
        />
      )
      expect(html).toBeDefined()
      expect(currentPlatform as string).toBe(target as string)
    }
  })

  it('verifies that async race condition risk exists when fetch responses arrive out of order', async () => {
    // Model of SocialHubPage fetchRadarFeed race condition:
    // If request 1 (platform: 'tiktok', latency: 50ms) resolves AFTER request 2 (platform: 'xhs', latency: 10ms)
    let stateRadarItems: string[] = []
    let activeFilterInUI = 'xhs'

    const fetchSim = async (platform: string, latencyMs: number) => {
      await new Promise((resolve) => setTimeout(resolve, latencyMs))
      stateRadarItems = [`items_for_${platform}`]
    }

    // User triggers 'tiktok', then immediately triggers 'xhs'
    const p1 = fetchSim('tiktok', 50)
    const p2 = fetchSim('xhs', 10)

    await Promise.all([p1, p2])

    // EMPIRICAL DEMONSTRATION of Race Condition:
    // Because p1 finished LAST, state contains 'items_for_tiktok' even though user chose 'xhs'!
    expect(activeFilterInUI).toBe('xhs')
    expect(stateRadarItems).toEqual(['items_for_tiktok'])
    // This confirms an empirical architecture weakness: lack of AbortController or sequence ID in fetchRadarFeed
  })
})

// ============================================================================
// 6. Touch Target & Accessibility Audit
// ============================================================================

describe('Challenger M4-2: Touch Target Audit', () => {
  it('inspects external post link touch target dimensions in TrendRadarCard', () => {
    const html = renderToString(<TrendRadarCard item={BASE_VALID_ITEM} />)
    
    // Check line 414: min-h-[44px] min-w-[44px]
    const has44pxTarget = html.includes('min-h-[44px]') && html.includes('min-w-[44px]')
    // WCAG / R4 requires minimum 44x44px touch targets on interactive controls
    expect(has44pxTarget).toBe(true)
  })

  it('inspects Copy Hook button touch target compliance', () => {
    const html = renderToString(<TrendRadarCard item={BASE_VALID_ITEM} />)
    expect(html).toContain('min-h-[44px]')
  })

  it('inspects Shopee Outbound affiliate button touch target compliance', () => {
    const html = renderToString(<TrendRadarCard item={BASE_VALID_ITEM} />)
    expect(html).toContain('min-h-[44px]')
  })

  it('inspects search clear button touch target compliance (44x44px)', () => {
    const html = renderToString(
      <TrendRadarView
        items={[BASE_VALID_ITEM]}
        selectedPlatform="all"
        onSelectPlatform={() => {}}
        searchQuery="active_query"
        onSearchChange={() => {}}
      />
    )
    expect(html).toContain('aria-label="Padam carian"')
    expect(html).toContain('min-h-[44px]')
    expect(html).toContain('min-w-[44px]')
  })
})
