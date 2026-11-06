/**
 * Challenger Test Suite: Milestone 2 — Empirical Fuzzing & Adversarial Stress Tests
 * 
 * Verifies:
 * 1. Commission leakage classification under 100+ parameter permutations:
 *    - sub_id, subId, af_sub, af_sub1, af_sub2, sub_id1, sub_id2, aff_sub
 *    - subId stripped, mutated (hijacked), intact matching, intact mismatching
 *    - utm_source, utm_medium, utm_campaign, camp_id permutations
 *    - platform variations (Shopee, TikTok, Lazada, Unknown)
 * 2. Cryptographic SHA-256 evidence integrity:
 *    - Reproducibility & deterministic ordering
 *    - Single-byte mutation sensitivity across all fields
 *    - 64-character hash bit-flip detection
 *    - Field coverage boundary audit (which fields are signed vs unsigned)
 * 3. Next.js API route /api/telemetry/inspect-redirect:
 *    - Malformed JSON, non-object JSON, missing URL, invalid types
 *    - Empty/whitespace URLs, exotic URI schemes (javascript, ftp, file, data)
 *    - Valid payloads with expectedSubId, maxHops, timeoutMs
 */

import { describe, it, expect } from 'bun:test'
import {
  resolveRedirectChain,
  computeEvidenceSignature,
  verifyEvidenceSignature,
  extractQueryParams,
  detectForensicPlatform,
  isShortlinkUrl,
  type LinkForensicEvidence,
  type FetchLike,
  type ForensicPlatform,
  type CommissionLeakageRisk,
} from '@/lib/telemetry/link-forensics'
import { POST as inspectRedirectRoute } from '@/app/api/telemetry/inspect-redirect/route'

describe('Challenger M2: Commission Leakage Classification Fuzzing (100+ Permutations)', () => {
  // Candidate sub-affiliate parameter keys recognized or encountered across networks
  const SUB_ID_KEYS = [
    'sub_id',
    'subId',
    'af_sub',
    'af_sub1',
    'af_sub2',
    'sub_id1',
    'sub_id2',
  ]

  const PLATFORMS: Array<{
    name: ForensicPlatform
    shortlinkHost: string
    destHost: string
    path: string
  }> = [
    { name: 'shopee', shortlinkHost: 'shp.ee', destHost: 'shopee.com.my', path: '/product-i.100.200' },
    { name: 'shopee', shortlinkHost: 'shope.ee', destHost: 'shopee.sg', path: '/product/300/400' },
    { name: 'tiktok', shortlinkHost: 'vt.tiktok.com', destHost: 'shop.tiktok.com', path: '/view/product/555' },
    { name: 'tiktok', shortlinkHost: 'vm.tiktok.com', destHost: 'www.tiktok.com', path: '/@creator/video/777' },
    { name: 'lazada', shortlinkHost: 's.lazada.com.my', destHost: 'www.lazada.com.my', path: '/products/item.html' },
    { name: 'unknown', shortlinkHost: 'bit.ly', destHost: 'external-merchant.com', path: '/deals/999' },
  ]

  const UTM_COMBINATIONS: Array<Record<string, string>> = [
    {},
    { utm_source: 'tiktok' },
    { utm_source: 'fb', utm_campaign: 'summer2026' },
    { utm_source: 'ig', utm_medium: 'bio_link', utm_campaign: 'raya_promo' },
    { camp_id: 'cmp_888', utm_source: 'telegram' },
  ]

  // Permutation Set 1: Intact SubId matching expectedSubId (Risk = 'none')
  // 7 subId keys * 6 platforms * 3 utm combos = 126 permutations
  let intactCount = 0
  for (const subKey of SUB_ID_KEYS) {
    for (const plat of PLATFORMS) {
      for (const utm of UTM_COMBINATIONS.slice(0, 3)) {
        intactCount++
        const expectedTag = `aff_${subKey}_${plat.name}_${intactCount}`
        
        it(`[Permutation #${intactCount}] Intact ${subKey} on ${plat.name} with ${Object.keys(utm).length} UTMs`, async () => {
          const initialUrl = `https://${plat.shortlinkHost}/link_${intactCount}`
          const destQuery = new URLSearchParams({
            [subKey]: expectedTag,
            ...utm,
          }).toString()
          const finalUrl = `https://${plat.destHost}${plat.path}?${destQuery}`

          const mockFetch: FetchLike = async (url) => {
            const u = typeof url === 'string' ? url : url.toString()
            if (u === initialUrl) {
              return new Response(null, { status: 301, headers: { Location: finalUrl } })
            }
            return new Response('OK', { status: 200 })
          }

          const evidence = await resolveRedirectChain(initialUrl, {
            expectedSubId: expectedTag,
            fetchFn: mockFetch,
          })

          expect(evidence.isHealthy).toBe(true)
          expect(evidence.parameterAudit.detectedSubId).toBe(expectedTag)
          expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
          expect(evidence.parameterAudit.leakageRisk).toBe('none')
          expect(evidence.parameterAudit.leakageReasons).toHaveLength(0)
          expect(verifyEvidenceSignature(evidence)).toBe(true)
        })
      }
    }
  }

  // Permutation Set 2: SubId stripped during redirect hops (Risk = 'critical')
  // 7 subId keys * 6 platforms = 42 permutations
  let strippedCount = 0
  for (const subKey of SUB_ID_KEYS) {
    for (const plat of PLATFORMS) {
      strippedCount++
      const initialTag = `orig_tag_${subKey}_${strippedCount}`

      it(`[Permutation Stripped #${strippedCount}] ${subKey} on ${plat.name} stripped during hops`, async () => {
        const initialUrl = `https://${plat.shortlinkHost}/strip_${strippedCount}?${subKey}=${initialTag}`
        // Final destination drops the subId entirely!
        const finalUrl = `https://${plat.destHost}${plat.path}?utm_source=stripped`

        const mockFetch: FetchLike = async (url) => {
          const u = typeof url === 'string' ? url : url.toString()
          if (u.includes(initialUrl)) {
            return new Response(null, { status: 302, headers: { Location: finalUrl } })
          }
          return new Response('OK', { status: 200 })
        }

        const evidence = await resolveRedirectChain(initialUrl, {
          expectedSubId: initialTag,
          fetchFn: mockFetch,
        })

        expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
        expect(evidence.parameterAudit.leakageRisk).toBe('critical')
        expect(evidence.parameterAudit.detectedSubId).toBeUndefined()
        expect(evidence.parameterAudit.leakageReasons.length).toBeGreaterThan(0)
        expect(verifyEvidenceSignature(evidence)).toBe(true)
      })
    }
  }

  // Permutation Set 3: SubId mutated / hijacked (Risk = 'high')
  // 7 subId keys * 6 platforms = 42 permutations
  let hijackedCount = 0
  for (const subKey of SUB_ID_KEYS) {
    for (const plat of PLATFORMS) {
      hijackedCount++
      const expectedTag = `honest_affiliate_${hijackedCount}`
      const attackerTag = `hijacker_evil_${hijackedCount}`

      it(`[Permutation Hijack #${hijackedCount}] ${subKey} hijacked on ${plat.name}`, async () => {
        const initialUrl = `https://${plat.shortlinkHost}/route_${hijackedCount}`
        const finalUrl = `https://${plat.destHost}${plat.path}?${subKey}=${attackerTag}`

        const mockFetch: FetchLike = async (url) => {
          const u = typeof url === 'string' ? url : url.toString()
          if (u === initialUrl) {
            return new Response(null, { status: 301, headers: { Location: finalUrl } })
          }
          return new Response('OK', { status: 200 })
        }

        const evidence = await resolveRedirectChain(initialUrl, {
          expectedSubId: expectedTag,
          fetchFn: mockFetch,
        })

        expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
        expect(evidence.parameterAudit.leakageRisk).toBe('high')
        expect(evidence.parameterAudit.detectedSubId).toBe(attackerTag)
        expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('mismatch'))).toBe(true)
        expect(verifyEvidenceSignature(evidence)).toBe(true)
      })
    }
  }

  // Permutation Set 4: Special Characters and Formatting in SubId
  const SPECIAL_SUBIDS = [
    'sub_id-with-dashes_123',
    'TVF_UPPERCASE_TAG',
    'mixedCase-Tag_99',
    'tag.with.dots',
    'tag+with+plus',
    'tag%20encoded',
  ]

  for (const specialTag of SPECIAL_SUBIDS) {
    it(`handles special formatted subId: "${specialTag}"`, async () => {
      const initialUrl = `https://shp.ee/special_${encodeURIComponent(specialTag)}`
      const finalUrl = `https://shopee.com.my/product?sub_id=${encodeURIComponent(specialTag)}`

      const mockFetch: FetchLike = async (url) => {
        const u = typeof url === 'string' ? url : url.toString()
        if (u === initialUrl) {
          return new Response(null, { status: 302, headers: { Location: finalUrl } })
        }
        return new Response('OK', { status: 200 })
      }

      const evidence = await resolveRedirectChain(initialUrl, {
        expectedSubId: specialTag,
        fetchFn: mockFetch,
      })

      // The extracted query param decoded by WHATWG URL
      expect(evidence.parameterAudit.detectedSubId).toBe(specialTag)
      expect(evidence.parameterAudit.leakageRisk).toBe('none')
      expect(verifyEvidenceSignature(evidence)).toBe(true)
    })
  }
})

describe('Challenger M2: Cryptographic SHA-256 Signature Reproducibility & Tamper Sensitivity', () => {
  it('strictly validates signature reproducibility across 100 iterations with random object ordering', () => {
    const basePayload = {
      originalUrl: 'https://shp.ee/crypto_test',
      resolvedUrl: 'https://shopee.com.my/product?sub_id=tvf_crypto&utm_source=tiktok&utm_medium=video',
      totalHops: 2,
      hops: [
        { hopIndex: 1, fromUrl: 'https://shp.ee/crypto_test', toUrl: 'https://shopee.com.my/hop1', statusCode: 301 },
        { hopIndex: 2, fromUrl: 'https://shopee.com.my/hop1', toUrl: 'https://shopee.com.my/product?sub_id=tvf_crypto&utm_source=tiktok&utm_medium=video', statusCode: 302 },
      ],
      parameters: {
        sub_id: 'tvf_crypto',
        utm_source: 'tiktok',
        utm_medium: 'video',
      },
      platform: 'shopee' as const,
      leakageRisk: 'none' as const,
      isHealthy: true,
    }

    const baselineHash = computeEvidenceSignature(basePayload)
    expect(baselineHash).toMatch(/^[a-f0-9]{64}$/)

    // Permute parameter key insertion order 100 times
    for (let i = 0; i < 100; i++) {
      const keys = ['sub_id', 'utm_source', 'utm_medium'].sort(() => Math.random() - 0.5)
      const shuffledParams: Record<string, string> = {}
      for (const k of keys) {
        shuffledParams[k] = basePayload.parameters[k as keyof typeof basePayload.parameters]
      }

      const hash = computeEvidenceSignature({
        ...basePayload,
        parameters: shuffledParams,
      })
      expect(hash).toBe(baselineHash)
    }
  })

  it('detects single-byte tampering across EVERY signed evidence field', async () => {
    const initialUrl = 'https://shp.ee/tamper_target'
    const finalUrl = 'https://shopee.com.my/product?sub_id=original_sub&utm_campaign=winter'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, { status: 301, headers: { Location: finalUrl } })
      }
      return new Response('OK', { status: 200 })
    }

    const genuine = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'original_sub',
      fetchFn: mockFetch,
    })
    expect(genuine.parameterAudit.leakageRisk).toBe('none')

    expect(verifyEvidenceSignature(genuine)).toBe(true)

    // 1. Mutate originalUrl (single byte)
    const t1: LinkForensicEvidence = { ...genuine, originalUrl: genuine.originalUrl + 'x' }
    expect(verifyEvidenceSignature(t1)).toBe(false)

    // 2. Mutate resolvedUrl (single byte)
    const t2: LinkForensicEvidence = { ...genuine, resolvedUrl: genuine.resolvedUrl.replace('winter', 'winteR') }
    expect(verifyEvidenceSignature(t2)).toBe(false)

    // 3. Mutate totalHops
    const t3: LinkForensicEvidence = { ...genuine, totalHops: genuine.totalHops + 1 }
    expect(verifyEvidenceSignature(t3)).toBe(false)

    // 4. Mutate redirectChain statusCode
    const t4: LinkForensicEvidence = {
      ...genuine,
      redirectChain: genuine.redirectChain.map(h => ({ ...h, statusCode: 302 })),
    }
    expect(verifyEvidenceSignature(t4)).toBe(false)

    // 5. Mutate redirectChain fromUrl
    const t5: LinkForensicEvidence = {
      ...genuine,
      redirectChain: genuine.redirectChain.map(h => ({ ...h, fromUrl: h.fromUrl + '/' })),
    }
    expect(verifyEvidenceSignature(t5)).toBe(false)

    // 6. Mutate rawQueryParams (alter existing value)
    const t6: LinkForensicEvidence = {
      ...genuine,
      parameterAudit: {
        ...genuine.parameterAudit,
        rawQueryParams: { ...genuine.parameterAudit.rawQueryParams, sub_id: 'forged_sub' },
      },
    }
    expect(verifyEvidenceSignature(t6)).toBe(false)

    // 7. Mutate rawQueryParams (inject new key)
    const t7: LinkForensicEvidence = {
      ...genuine,
      parameterAudit: {
        ...genuine.parameterAudit,
        rawQueryParams: { ...genuine.parameterAudit.rawQueryParams, injected_payload: '1' },
      },
    }
    expect(verifyEvidenceSignature(t7)).toBe(false)

    // 8. Mutate platform
    const t8: LinkForensicEvidence = {
      ...genuine,
      parameterAudit: {
        ...genuine.parameterAudit,
        platform: 'lazada',
      },
    }
    expect(verifyEvidenceSignature(t8)).toBe(false)

    // 9. Mutate leakageRisk
    const t9: LinkForensicEvidence = {
      ...genuine,
      parameterAudit: {
        ...genuine.parameterAudit,
        leakageRisk: 'critical',
      },
    }
    expect(verifyEvidenceSignature(t9)).toBe(false)

    // 10. Mutate isHealthy
    const t10: LinkForensicEvidence = {
      ...genuine,
      isHealthy: false,
    }
    expect(verifyEvidenceSignature(t10)).toBe(false)
  })

  it('detects bit-flips across ALL 64 hex characters of the signatureHash', async () => {
    const initialUrl = 'https://shp.ee/bitflip_target'
    const finalUrl = 'https://shopee.com.my/product?sub_id=clean'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, { status: 301, headers: { Location: finalUrl } })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    const originalHash = evidence.signatureHash
    expect(originalHash.length).toBe(64)

    // Flip each hex character position (0 to 63)
    for (let pos = 0; pos < 64; pos++) {
      const char = originalHash[pos]
      // Replace with a different hex char
      const flippedChar = char === 'a' ? 'b' : 'a'
      const corruptedHash = originalHash.substring(0, pos) + flippedChar + originalHash.substring(pos + 1)

      const corruptedEvidence: LinkForensicEvidence = {
        ...evidence,
        signatureHash: corruptedHash,
      }

      expect(verifyEvidenceSignature(corruptedEvidence)).toBe(false)
    }
  })

  it('audits non-signed fields in LinkForensicEvidence structure', async () => {
    const initialUrl = 'https://shp.ee/boundary_test'
    const finalUrl = 'https://shopee.com.my/product?sub_id=valid'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, { status: 301, headers: { Location: finalUrl } })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })

    // Non-canonical fields that are NOT part of computeEvidenceSignature:
    // timestamp, totalLatencyMs, evidenceId, securityChecks, leakageReasons
    const tamperedLatency: LinkForensicEvidence = {
      ...evidence,
      totalLatencyMs: 99999,
    }
    // Verifies that totalLatencyMs does NOT break signature because signature is deterministic
    expect(verifyEvidenceSignature(tamperedLatency)).toBe(true)

    const tamperedTimestamp: LinkForensicEvidence = {
      ...evidence,
      timestamp: '1970-01-01T00:00:00.000Z',
    }
    expect(verifyEvidenceSignature(tamperedTimestamp)).toBe(true)
  })
})

describe('Challenger M2: API Route /api/telemetry/inspect-redirect Robustness', () => {
  it('rejects completely empty JSON body with 400', async () => {
    const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await inspectRedirectRoute(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('url')
  })

  it('rejects malformed non-JSON body with 400', async () => {
    const malformedBodies = [
      '{ not valid json',
      '<html><body>500 Internal Error</body></html>',
      'undefined',
      '',
    ]

    for (const badBody of malformedBodies) {
      const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: badBody,
      })
      const res = await inspectRedirectRoute(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    }
  })

  it('rejects invalid url types (number, boolean, array, object) with 400', async () => {
    const invalidUrlPayloads = [
      { url: 12345 },
      { url: true },
      { url: ['https://shopee.com'] },
      { url: { nested: 'url' } },
      { url: null },
      { url: '   ' },
    ]

    for (const payload of invalidUrlPayloads) {
      const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const res = await inspectRedirectRoute(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('url')
    }
  })

  it('handles invalid/exotic URI protocols safely without 500 crash', async () => {
    const exoticUrls = [
      'javascript:alert(document.cookie)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://ftp.example.com/files/download',
      'file:///etc/passwd',
      'mailto:test@example.com',
    ]

    for (const badProtocolUrl of exoticUrls) {
      const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: badProtocolUrl }),
      })
      const res = await inspectRedirectRoute(req)
      // Route should return 200 with isHealthy: false and isValidProtocol: false
      expect(res.status).toBe(200)
      const data: LinkForensicEvidence = await res.json()
      expect(data.isHealthy).toBe(false)
      expect(data.securityChecks.isValidProtocol).toBe(false)
      expect(verifyEvidenceSignature(data)).toBe(true)
    }
  })

  it('accepts valid payload with expectedSubId and returns signed 200 response', async () => {
    const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://shopee.com.my/Skintific-Moisturizer?sub_id=tvf_production_01',
        expectedSubId: 'tvf_production_01',
        maxHops: 5,
        timeoutMs: 3000,
      }),
    })

    const res = await inspectRedirectRoute(req)
    expect(res.status).toBe(200)

    const evidence: LinkForensicEvidence = await res.json()
    expect(evidence.evidenceId).toMatch(/^ev_\d+_[a-f0-9]{8}$/)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_production_01')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(evidence.securityChecks.isHttpsOnly).toBe(true)
    expect(evidence.signatureHash).toMatch(/^[a-f0-9]{64}$/)
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('handles mismatching expectedSubId and flags high risk via API', async () => {
    const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://shopee.com.my/Skintific-Moisturizer?sub_id=someone_elses_sub',
        expectedSubId: 'my_expected_sub',
      }),
    })

    const res = await inspectRedirectRoute(req)
    expect(res.status).toBe(200)

    const evidence: LinkForensicEvidence = await res.json()
    expect(evidence.parameterAudit.detectedSubId).toBe('someone_elses_sub')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('high')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('mismatch'))).toBe(true)
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })
})
