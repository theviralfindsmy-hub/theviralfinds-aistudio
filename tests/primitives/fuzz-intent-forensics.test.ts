/**
 * Empirical Adversarial Fuzzing Test Suite
 * Target: routeAffiliateIntent & extractAndVerifyLink
 * 
 * Verifies:
 * 1. routeAffiliateIntent:
 *    - Ambiguous queries, multiple intents, fallback behavior
 *    - Casing permutations (UPPER, mixed, camelCase)
 *    - Punctuation, symbols, emojis, and prompt injection strings
 *    - Typo resilience and graceful degradation
 *    - SubId and platform entity extraction accuracy
 * 
 * 2. extractAndVerifyLink:
 *    - Multi-platform URLs (Shopee, TikTok, Lazada, unsupported)
 *    - Malformed protocols (javascript:, file:, data:, invalid schemes)
 *    - Bloat parameter stripping (sp_atk, fbclid, gclid, etc.)
 *    - SubId injection & security validation
 *    - Query parameter permutations
 * 
 * 3. Cryptographic Evidence Hashing:
 *    - Determinism across different system timestamps
 *    - Uniqueness across 1,000 synthesized URLs (zero collisions)
 *    - Canonical param sorting verification
 */

import { describe, it, expect } from 'bun:test'
import { createHash } from 'crypto'
import {
  routeAffiliateIntent,
  extractAndVerifyLink,
} from '@/lib/typesafe-ai/primitives'
import {
  AffiliateIntentRouteSchema,
  VerifiedAffiliateLinkResultSchema,
} from '@/lib/typesafe-ai/schemas'

describe('Adversarial Fuzzing: routeAffiliateIntent', () => {
  it('handles mixed casing and uppercase permutations identically', () => {
    const promptLower = 'tolong cari produk viral skincare kat tiktok fyp'
    const promptUpper = 'TOLONG CARI PRODUK VIRAL SKINCARE KAT TIKTOK FYP'
    const promptMixed = 'ToLoNg CaRi PrOdUk ViRaL sKiNcArE kAt TiKtOk FyP'

    const resLower = routeAffiliateIntent({ input: promptLower })
    const resUpper = routeAffiliateIntent({ input: promptUpper })
    const resMixed = routeAffiliateIntent({ input: promptMixed })

    expect(resLower.intent).toBe('PRODUCT_SCOUTING')
    expect(resUpper.intent).toBe('PRODUCT_SCOUTING')
    expect(resMixed.intent).toBe('PRODUCT_SCOUTING')

    expect(resUpper.extractedEntities.platformTarget).toBe('tiktok')
    expect(resMixed.extractedEntities.platformTarget).toBe('tiktok')
  })

  it('handles heavy punctuation, symbols, and emojis gracefully', () => {
    const weirdPrompts = [
      '🔥🚀 [VIRAL] Tolong cari produk trending kat Shopee/TikTok sekarang!!! 💥💯',
      '--kira--komisen--harga:RM50--commission:10%--',
      '<<< Buat hook racun video TikTok >>> ???',
      'SELECT * FROM products WHERE viral = 1; -- broadcast post',
      '<script>alert("hack")</script> semak pautan https://shp.ee/test1234',
    ]

    for (const prompt of weirdPrompts) {
      const res = routeAffiliateIntent({ input: prompt })
      // Must not crash and must strictly adhere to Zod schema
      expect(() => AffiliateIntentRouteSchema.parse(res)).not.toThrow()
      expect(typeof res.confidence).toBe('number')
      expect(res.confidence).toBeGreaterThanOrEqual(0)
      expect(res.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('evaluates priority resolution in multi-intent ambiguous queries', () => {
    // Case 1: Prompt contains both commission calculation and broadcast
    const ambiguous1 = routeAffiliateIntent({
      input: 'Kira komisen untuk produk ni dan terus broadcast ke semua platform',
    })
    // COMMISSION_CALCULATION is evaluated before BROADCAST_PUBLISH in the rule chain
    expect(ambiguous1.intent).toBe('COMMISSION_CALCULATION')
    expect(ambiguous1.targetPage).toBe('calculator')

    // Case 2: Prompt contains an embedded URL alongside hook creation request
    const ambiguous2 = routeAffiliateIntent({
      input: 'Buat video hook racun untuk pautan https://shp.ee/sample999',
    })
    // URL detection takes precedence (LINK_CLEANUP_VERIFICATION) to verify/sanitize first
    expect(ambiguous2.intent).toBe('LINK_CLEANUP_VERIFICATION')
    expect(ambiguous2.extractedEntities.url).toBe('https://shp.ee/sample999')
  })

  it('degrades gracefully to GENERAL_ASSISTANCE on unrecognizable typos or slang', () => {
    const typoPrompts = [
      'helo brader apa cerita harini',
      'xyzqwerty random nonsense string without intent',
      'nak tanyo sket sal bab mende alah tu',
    ]

    for (const prompt of typoPrompts) {
      const res = routeAffiliateIntent({ input: prompt })
      expect(res.intent).toBe('GENERAL_ASSISTANCE')
      expect(res.requiresHumanConfirmation).toBe(false)
      expect(res.confidence).toBeLessThanOrEqual(0.70)
    }
  })

  it('accurately extracts platform entities across varied keyword formats', () => {
    const testCases: Array<{ input: string; expectedPlatform: 'tiktok' | 'xhs' | 'twitter' | 'shorts' | 'all' | undefined }> = [
      { input: 'Cari produk trending di TikTok fyp', expectedPlatform: 'tiktok' },
      { input: 'Tengok produk meletup kat Xiaohongshu redbook', expectedPlatform: 'xhs' },
      { input: 'Viral post kat twitter tweet harini', expectedPlatform: 'twitter' },
      { input: 'Cari audio viral untuk youtube shorts', expectedPlatform: 'shorts' },
      { input: 'Blast offer ni ke semua platform', expectedPlatform: 'all' },
      { input: 'Cari barang murah tanpa platform spesifik', expectedPlatform: undefined },
    ]

    for (const tc of testCases) {
      const res = routeAffiliateIntent({ input: tc.input })
      expect(res.extractedEntities.platformTarget).toBe(tc.expectedPlatform)
    }
  })

  it('robustly extracts subId across various delimiter formats', () => {
    const subIdCases = [
      { input: 'Semak link https://shp.ee/123 subId=tvf_raya_01', expected: 'tvf_raya_01' },
      { input: 'Semak link https://shp.ee/123 sub_id: promo-black-friday', expected: 'promo-black-friday' },
      { input: 'Semak link https://shp.ee/123 af_sub = affil_lead_999', expected: 'affil_lead_999' },
      { input: 'Semak link https://shp.ee/123 subId=CAMPAIGN_2026', expected: 'CAMPAIGN_2026' },
    ]

    for (const tc of subIdCases) {
      const res = routeAffiliateIntent({ input: tc.input })
      expect(res.extractedEntities.subId).toBe(tc.expected)
    }
  })

  it('handles extremely long inputs (10,000 characters) without hanging or crashing', () => {
    const longString = 'tolong cari produk viral '.repeat(400) // ~10,000 chars
    const start = performance.now()
    const res = routeAffiliateIntent({ input: longString })
    const durationMs = performance.now() - start

    expect(res.intent).toBe('PRODUCT_SCOUTING')
    expect(durationMs).toBeLessThan(100) // Must execute well under 100ms
  })
})

describe('Adversarial Fuzzing: extractAndVerifyLink', () => {
  it('correctly parses varied regional Shopee domains and formats', () => {
    const domains = [
      'https://shopee.com.my/Product-Title-i.12345.67890?sub_id=my1',
      'https://shopee.sg/Product-Title-i.54321.98765?subId=sg1',
      'https://shopee.co.id/Product-Title-i.11111.22222?af_sub1=id1',
      'https://shopee.ph/Product-Title-i.33333.44444?sub_id=ph1',
      'https://shopee.com.my/product/999/888?sub_id=alt_format',
      'https://shopee.com.my/universal-item?itemid=777&shopid=666&sub_id=query_fallback',
    ]

    for (const url of domains) {
      const res = extractAndVerifyLink({ rawUrl: url })
      expect(res.isValid).toBe(true)
      expect(res.platform).toBe('shopee')
      expect(res.isShortlink).toBe(false)
      expect(res.shopId).toBeDefined()
      expect(res.productId).toBeDefined()
      expect(res.tamperProofEvidence.status).toBe('verified')
    }
  })

  it('identifies and classifies all supported shortlink hosts', () => {
    const shortlinks = [
      { url: 'https://shp.ee/abc1234', expectedPlatform: 'shopee' },
      { url: 'https://shope.ee/def5678', expectedPlatform: 'shopee' },
      { url: 'https://vt.tiktok.com/ZS2xY7z/', expectedPlatform: 'tiktok' },
      { url: 'https://vm.tiktok.com/ZM8rT9q/', expectedPlatform: 'tiktok' },
      { url: 'https://s.lazada.com.my/s.mK9p', expectedPlatform: 'lazada' },
      { url: 'https://c.lazada.com.my/t/c.YbZ1', expectedPlatform: 'lazada' },
      { url: 'https://bit.ly/3xSample', expectedPlatform: 'unknown' },
      { url: 'https://tinyurl.com/tvf-deal', expectedPlatform: 'unknown' },
    ]

    for (const item of shortlinks) {
      const res = extractAndVerifyLink({ rawUrl: item.url })
      expect(res.isValid).toBe(true)
      expect(res.isShortlink).toBe(true)
      expect(res.platform).toBe(item.expectedPlatform as any)
      expect(res.warnings.some(w => w.includes('Shortlink detected'))).toBe(true)
    }
  })

  it('thoroughly strips ad tracking bloat parameters while preserving affiliate parameters', () => {
    const bloatedUrl = 'https://shopee.com.my/Product-i.100.200?' +
      'sp_atk=8349283-492&' +
      'xptdk=938210&' +
      'smtt=0.0.9&' +
      'fbclid=IwAR2938479238472394&' +
      'gclid=Cj0KCQjwmICoBhC9ARIsAKvdFL5&' +
      '_ga=GA1.2.983742938.1690000000&' +
      'source=facebook_ad&' +
      'click_id=clk_83921&' +
      'tracking_id=tr_99182&' +
      'sub_id=tvf_clean_test&' +
      'utm_source=instagram'

    const res = extractAndVerifyLink({ rawUrl: bloatedUrl })
    expect(res.isValid).toBe(true)

    // Verify bloat parameters are absent from cleanUrl
    expect(res.cleanUrl).not.toContain('sp_atk')
    expect(res.cleanUrl).not.toContain('fbclid')
    expect(res.cleanUrl).not.toContain('gclid')
    expect(res.cleanUrl).not.toContain('smtt')
    expect(res.cleanUrl).not.toContain('click_id')

    // Verify affiliate parameters are preserved
    expect(res.affiliateParamsDetected.sub_id).toBe('tvf_clean_test')
    expect(res.affiliateParamsDetected.utm_source).toBe('instagram')
    expect(res.cleanUrl).toContain('sub_id=tvf_clean_test')
    expect(res.cleanUrl).toContain('utm_source=instagram')
  })

  it('sanitizes and safely encapsulates subId injection payloads without URL corruption', () => {
    const maliciousSubIds = [
      'sub" onclick="alert(1)"',
      'sub&admin=true&secret=revealed',
      'sub#fragment-injection',
      'sub?param=value',
      "sub'; DROP TABLE affiliate_links; --",
      'sub\x00nullbyte',
    ]

    for (const subId of maliciousSubIds) {
      const res = extractAndVerifyLink({
        rawUrl: 'https://shopee.com.my/Product-i.100.200',
        subAffiliateParams: { subId },
      })

      expect(res.isValid).toBe(true)
      // The cleanUrl must be a valid, parseable URL
      expect(() => new URL(res.cleanUrl)).not.toThrow()
      const parsedClean = new URL(res.cleanUrl)

      // Query param must be properly encoded and not break URL parameter structure
      expect(parsedClean.searchParams.get('subId')).toBe(subId)
      // Confirm the malicious token did not inject unintended parameters like 'admin'
      expect(parsedClean.searchParams.get('admin')).toBeNull()
      expect(parsedClean.searchParams.get('secret')).toBeNull()
    }
  })

  it('handles non-HTTP schemes and malformed URIs safely', () => {
    const invalidInputs = [
      'not-a-valid-url-at-all',
      'http://',
      'https://',
      '://missing-protocol',
      'ht!tp://weird.com',
      '', // Handled by Zod min(1)
    ]

    for (const raw of invalidInputs) {
      if (raw === '') {
        expect(() => extractAndVerifyLink({ rawUrl: raw })).toThrow()
      } else {
        const res = extractAndVerifyLink({ rawUrl: raw })
        expect(res.isValid).toBe(false)
        expect(res.tamperProofEvidence.status).toBe('malformed')
        expect(res.tamperProofEvidence.inputHash).toMatch(/^[a-f0-9]{64}$/)
      }
    }
  })

  it('observes behavior on exotic URI schemes (javascript:, file:, data:)', () => {
    // WHATWG URL parses javascript: and file: as valid URLs with empty hostnames
    const exoticCases = [
      'javascript:alert(document.cookie)',
      'file:///etc/shadow',
      'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
    ]

    for (const raw of exoticCases) {
      const res = extractAndVerifyLink({ rawUrl: raw })
      // Even if WHATWG parses the URI object, platform must be 'unknown'
      expect(res.platform).toBe('unknown')
      expect(res.isShortlink).toBe(false)
      // Since no subId is detected, evidenceStatus must be untracked
      expect(res.tamperProofEvidence.status).toBe('untracked')
    }
  })
})

describe('Adversarial Stress: Cryptographic SHA-256 Evidence Integrity', () => {
  it('guarantees deterministic, reproducible inputHash across execution delay', async () => {
    const rawUrl = 'https://shopee.com.my/item-i.12345.67890?sub_id=campaign_alpha&utm_source=tiktok'

    const run1 = extractAndVerifyLink({ rawUrl })
    // Sleep briefly to ensure timestamps differ
    await new Promise(resolve => setTimeout(resolve, 20))
    const run2 = extractAndVerifyLink({ rawUrl })

    // verifiedAt timestamps must be different or equal, but inputHash MUST be identical
    expect(run1.tamperProofEvidence.inputHash).toBe(run2.tamperProofEvidence.inputHash)
    expect(run1.cleanUrl).toBe(run2.cleanUrl)
  })

  it('produces distinct SHA-256 hashes for subtle single-character URL variations (Avalanche Effect)', () => {
    const base = 'https://shopee.com.my/item-i.12345.67890?sub_id=campaign_alpha'
    const variant1 = 'https://shopee.com.my/item-i.12345.67891?sub_id=campaign_alpha' // product ID +1
    const variant2 = 'https://shopee.com.my/item-i.12345.67890?sub_id=campaign_alphb' // sub_id +1
    const variant3 = 'https://shopee.sg/item-i.12345.67890?sub_id=campaign_alpha' // domain .sg

    const hBase = extractAndVerifyLink({ rawUrl: base }).tamperProofEvidence.inputHash
    const h1 = extractAndVerifyLink({ rawUrl: variant1 }).tamperProofEvidence.inputHash
    const h2 = extractAndVerifyLink({ rawUrl: variant2 }).tamperProofEvidence.inputHash
    const h3 = extractAndVerifyLink({ rawUrl: variant3 }).tamperProofEvidence.inputHash

    expect(hBase).not.toBe(h1)
    expect(hBase).not.toBe(h2)
    expect(hBase).not.toBe(h3)
    expect(h1).not.toBe(h2)
  })

  it('guarantees 1,000 distinct synthesized inputs generate 1,000 unique SHA-256 hashes (Zero Collision Fuzz)', () => {
    const hashes = new Set<string>()
    const count = 1000

    for (let i = 0; i < count; i++) {
      const url = `https://shopee.com.my/product-fuzz-${i}-i.${1000 + i}.${50000 + i}?sub_id=fuzz_batch_${i}&af_sub1=worker_${i % 10}`
      const result = extractAndVerifyLink({ rawUrl: url })
      const hash = result.tamperProofEvidence.inputHash

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      hashes.add(hash)
    }

    // All 1,000 generated hashes must be completely unique
    expect(hashes.size).toBe(count)
  })

  it('independently verifies SHA-256 calculation matches canonical JSON specification', () => {
    const rawUrl = 'https://shopee.com.my/Test-Item-i.555.777?sub_id=my_sub&utm_source=fb'
    const result = extractAndVerifyLink({ rawUrl })

    // Reconstruct canonical payload manually
    const manualCanonical = JSON.stringify({
      originalUrl: rawUrl,
      cleanUrl: result.cleanUrl,
      platform: 'shopee',
      productId: '777',
      shopId: '555',
      params: {
        sub_id: 'my_sub',
        utm_source: 'fb',
      },
    })

    const expectedHash = createHash('sha256').update(manualCanonical).digest('hex')
    expect(result.tamperProofEvidence.inputHash).toBe(expectedHash)
  })
})
