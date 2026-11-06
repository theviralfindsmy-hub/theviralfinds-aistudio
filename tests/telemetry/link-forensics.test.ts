/**
 * Test Suite: Affiliate Link Telemetry & Network Forensics Engine
 * 
 * Verifies:
 * 1. Multi-hop redirect resolution (301, 302, 307, 308) for shortlinks (shp.ee, vt.tiktok.com, s.lazada).
 * 2. Commission leakage detection (stripped parameters, subId mismatches against expectedSubId).
 * 3. Security checks (HTTPS-only validation, domain verification, malicious query injection, protocol validation).
 * 4. Maximum hops exceeded & loop protection.
 * 5. Timeout & network error recovery.
 * 6. Cryptographic SHA-256 evidence signature reproducibility and tamper detection.
 * 7. POST /api/telemetry/inspect-redirect App Router route handler.
 */

import { describe, it, expect } from 'bun:test'
import {
  resolveRedirectChain,
  isShortlinkUrl,
  detectForensicPlatform,
  extractQueryParams,
  computeEvidenceSignature,
  verifyEvidenceSignature,
  type LinkForensicEvidence,
  type FetchLike,
} from '@/lib/telemetry/link-forensics'
import { POST as inspectRedirectRoute } from '@/app/api/telemetry/inspect-redirect/route'

describe('Affiliate Link Telemetry: Platform & Shortlink Detection', () => {
  it('identifies known shortlink hosts correctly', () => {
    expect(isShortlinkUrl('https://shp.ee/m9x8y7z')).toBe(true)
    expect(isShortlinkUrl('https://shope.ee/test')).toBe(true)
    expect(isShortlinkUrl('https://vt.tiktok.com/ZS2xyz1/')).toBe(true)
    expect(isShortlinkUrl('https://vm.tiktok.com/ZS999/')).toBe(true)
    expect(isShortlinkUrl('https://s.lazada.com.my/s.random')).toBe(true)
    expect(isShortlinkUrl('https://bit.ly/3xyz')).toBe(true)
    expect(isShortlinkUrl('https://tinyurl.com/abc')).toBe(true)
    // Non-shortlinks
    expect(isShortlinkUrl('https://shopee.com.my/Product-i.1.2')).toBe(false)
    expect(isShortlinkUrl('https://www.tiktok.com/@creator')).toBe(false)
    expect(isShortlinkUrl('https://google.com')).toBe(false)
    expect(isShortlinkUrl('invalid-url')).toBe(false)
  })

  it('detects affiliate platforms accurately from URLs', () => {
    expect(detectForensicPlatform('https://shp.ee/abc')).toBe('shopee')
    expect(detectForensicPlatform('https://shopee.com.my/item-i.100.200')).toBe('shopee')
    expect(detectForensicPlatform('https://shopee.sg/product')).toBe('shopee')
    expect(detectForensicPlatform('https://vt.tiktok.com/ZS123/')).toBe('tiktok')
    expect(detectForensicPlatform('https://shop.tiktok.com/view/product/123')).toBe('tiktok')
    expect(detectForensicPlatform('https://s.lazada.com.my/s.abc')).toBe('lazada')
    expect(detectForensicPlatform('https://www.lazada.com.my/products/item.html')).toBe('lazada')
    expect(detectForensicPlatform('https://amazon.com/dp/B000')).toBe('unknown')
  })

  it('extracts query parameters accurately', () => {
    const params = extractQueryParams('https://shopee.com.my/item?sub_id=tvf_1&utm_source=fb&amount=45')
    expect(params.sub_id).toBe('tvf_1')
    expect(params.utm_source).toBe('fb')
    expect(params.amount).toBe('45')
  })
})

describe('Affiliate Link Telemetry: Redirect Resolution Engine', () => {
  it('resolves multi-hop Shopee shortlink (shp.ee) to terminal destination with preserved subId', async () => {
    const initialUrl = 'https://shp.ee/sample123'
    const hop1Url = 'https://shopee.com.my/universal-link/product/998877?sub_id=tvf_raya_01'
    const finalUrl = 'https://shopee.com.my/Skintific-Moisturizer-i.100200.300400?sub_id=tvf_raya_01&utm_source=tiktok&utm_campaign=summer_sale'

    // Mock fetchFn simulating 301 -> 302 -> 200
    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response('Redirecting', {
          status: 301,
          headers: { Location: hop1Url },
        })
      }
      if (u === hop1Url) {
        return new Response('Redirecting', {
          status: 302,
          headers: { Location: finalUrl },
        })
      }
      if (u === finalUrl) {
        return new Response('<html>Shopee Product Page</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })
      }
      return new Response('Not Found', { status: 404 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'tvf_raya_01',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(2)
    expect(evidence.redirectChain.length).toBe(2)
    expect(evidence.redirectChain[0].fromUrl).toBe(initialUrl)
    expect(evidence.redirectChain[0].toUrl).toBe(hop1Url)
    expect(evidence.redirectChain[0].statusCode).toBe(301)
    expect(evidence.redirectChain[1].fromUrl).toBe(hop1Url)
    expect(evidence.redirectChain[1].toUrl).toBe(finalUrl)
    expect(evidence.redirectChain[1].statusCode).toBe(302)
    expect(evidence.resolvedUrl).toBe(finalUrl)

    // Parameter audit
    expect(evidence.parameterAudit.platform).toBe('shopee')
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_raya_01')
    expect(evidence.parameterAudit.utmSource).toBe('tiktok')
    expect(evidence.parameterAudit.utmCampaign).toBe('summer_sale')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(evidence.parameterAudit.leakageReasons).toHaveLength(0)

    // Security checks
    expect(evidence.securityChecks.isHttpsOnly).toBe(true)
    expect(evidence.securityChecks.isValidProtocol).toBe(true)
    expect(evidence.securityChecks.destinationMatchesTargetDomain).toBe(true)
    expect(evidence.securityChecks.noMaliciousQueryMutation).toBe(true)

    // SHA-256 evidence integrity
    expect(evidence.signatureHash).toMatch(/^[a-f0-9]{64}$/)
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('resolves TikTok shortlink (vt.tiktok.com) and verifies destination product and subId', async () => {
    const initialUrl = 'https://vt.tiktok.com/ZS999abc/'
    const finalUrl = 'https://shop.tiktok.com/view/product/1729384910?subId=aff_tiktok_my&utm_campaign=viral_sale'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: finalUrl },
        })
      }
      return new Response('TikTok Shop', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'aff_tiktok_my',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.parameterAudit.platform).toBe('tiktok')
    expect(evidence.parameterAudit.detectedSubId).toBe('aff_tiktok_my')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(evidence.securityChecks.destinationMatchesTargetDomain).toBe(true)
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('resolves relative redirect Location headers correctly', async () => {
    const initialUrl = 'https://shopee.com.my/short/123'
    const finalUrl = 'https://shopee.com.my/product/item-456?sub_id=tvf_sub'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        // Relative location header
        return new Response(null, {
          status: 307,
          headers: { Location: '/product/item-456?sub_id=tvf_sub' },
        })
      }
      return new Response('Shopee', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(finalUrl)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_sub')
  })
})

describe('Affiliate Link Telemetry: Commission Leakage Detection', () => {
  it('flags CRITICAL leakage when sub-affiliate parameter is stripped during redirect hops', async () => {
    // Initial link had sub_id, but the merchant/network redirect dropped it
    const initialUrl = 'https://shp.ee/strip_test?sub_id=my_original_sub'
    const strippedDestination = 'https://shopee.com.my/Product-i.111.222?utm_source=facebook'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: strippedDestination },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'my_original_sub',
      fetchFn: mockFetch,
    })

    expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('stripped during redirect hops'))).toBe(true)
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Missing sub-affiliate tag'))).toBe(true)
  })

  it('flags HIGH leakage when sub-affiliate tag mismatches expectedSubId (commission diversion / hijack)', async () => {
    const initialUrl = 'https://shp.ee/hijack_test'
    // The redirect points to someone else's sub_id tag
    const hijackedDestination = 'https://shopee.com.my/Product-i.111.222?sub_id=attacker_affiliate_id'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: hijackedDestination },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'my_honest_affiliate_tag',
      fetchFn: mockFetch,
    })

    expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('high')
    expect(evidence.parameterAudit.detectedSubId).toBe('attacker_affiliate_id')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Sub-affiliate tag mismatch'))).toBe(true)
  })

  it('flags HIGH leakage when platform URL has no subId even without expectedSubId supplied', async () => {
    const initialUrl = 'https://shp.ee/untracked'
    const cleanNoTagDestination = 'https://shopee.com.my/Product-i.111.222'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 301,
          headers: { Location: cleanNoTagDestination },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.parameterAudit.isCommissionProtected).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('high')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('generic pool'))).toBe(true)
  })
})

describe('Affiliate Link Telemetry: Security & Domain Auditing', () => {
  it('flags MEDIUM leakage and fails isHttpsOnly when an intermediate hop downgrades to HTTP', async () => {
    const initialUrl = 'https://shp.ee/secure_start'
    const insecureHop = 'http://intermediate-tracker.net/hop?sub_id=tvf_01'
    const secureFinal = 'https://shopee.com.my/product?sub_id=tvf_01'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, { status: 301, headers: { Location: insecureHop } })
      }
      if (u === insecureHop) {
        return new Response(null, { status: 302, headers: { Location: secureFinal } })
      }
      return new Response('Shopee', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'tvf_01',
      fetchFn: mockFetch,
    })

    expect(evidence.securityChecks.isHttpsOnly).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('medium')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Insecure HTTP hop'))).toBe(true)
  })

  it('detects malicious script and SQL injection queries in the destination URL', async () => {
    const initialUrl = 'https://shp.ee/xss_link'
    const maliciousDestination = 'https://shopee.com.my/item?sub_id=tvf_01&q=<script>alert(document.cookie)</script>'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: maliciousDestination },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, {
      expectedSubId: 'tvf_01',
      fetchFn: mockFetch,
    })

    expect(evidence.securityChecks.noMaliciousQueryMutation).toBe(false)
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('malicious query'))).toBe(true)
  })

  it('detects destination domain mismatches against platform expectations (e.g. phishing redirection)', async () => {
    const initialUrl = 'https://shp.ee/phishing'
    // Claims to be Shopee shortlink, but redirects to an external credential harvester
    const fakeDestination = 'https://shopee-login-verify.free-hosting.org/login'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: fakeDestination },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })

    expect(evidence.parameterAudit.platform).toBe('shopee')
    expect(evidence.securityChecks.destinationMatchesTargetDomain).toBe(false)
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Destination domain does not match'))).toBe(true)
  })

  it('handles invalid protocols safely', async () => {
    const evidence = await resolveRedirectChain('ftp://files.example.com/item.zip')
    expect(evidence.securityChecks.isValidProtocol).toBe(false)
    expect(evidence.isHealthy).toBe(false)
  })
})

describe('Affiliate Link Telemetry: Loop & Hops Limit Protection', () => {
  it('detects infinite redirect loops without hanging', async () => {
    const urlA = 'https://shop.com/loopA'
    const urlB = 'https://shop.com/loopB'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === urlA) {
        return new Response(null, { status: 302, headers: { Location: urlB } })
      }
      return new Response(null, { status: 302, headers: { Location: urlA } })
    }

    const evidence = await resolveRedirectChain(urlA, { maxHops: 10, fetchFn: mockFetch })
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Infinite redirect loop'))).toBe(true)
    expect(evidence.totalHops).toBeLessThanOrEqual(3)
  })

  it('enforces maximum hops constraint and halts gracefully', async () => {
    // Generate an infinite sequence of distinct URLs: /step1, /step2, /step3...
    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      const match = u.match(/step(\d+)/)
      const step = match ? parseInt(match[1], 10) : 0
      return new Response(null, {
        status: 302,
        headers: { Location: `https://hop-domain.com/step${step + 1}` },
      })
    }

    const evidence = await resolveRedirectChain('https://hop-domain.com/step0', {
      maxHops: 4,
      fetchFn: mockFetch,
    })

    expect(evidence.totalHops).toBe(4)
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Maximum redirect hops (4) exceeded'))).toBe(true)
  })

  it('handles network timeouts gracefully', async () => {
    // Mock fetch that throws AbortError
    const mockFetch: FetchLike = async () => {
      const err = new Error('The operation was aborted')
      err.name = 'AbortError'
      throw err
    }

    const evidence = await resolveRedirectChain('https://slow-site.com/redirect', {
      timeoutMs: 50,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('timed out'))).toBe(true)
  })
})

describe('Affiliate Link Telemetry: Cryptographic Integrity & Tamper Proofing', () => {
  it('guarantees deterministic, reproducible signatureHash for identical redirect evidence', () => {
    const payload = {
      originalUrl: 'https://shp.ee/deterministic',
      resolvedUrl: 'https://shopee.com.my/item?sub_id=tvf_1&utm_source=fb',
      totalHops: 1,
      hops: [{ hopIndex: 1, fromUrl: 'https://shp.ee/deterministic', toUrl: 'https://shopee.com.my/item?sub_id=tvf_1&utm_source=fb', statusCode: 301 }],
      parameters: { sub_id: 'tvf_1', utm_source: 'fb' },
      platform: 'shopee' as const,
      leakageRisk: 'none' as const,
      isHealthy: true,
    }

    const hash1 = computeEvidenceSignature(payload)
    const hash2 = computeEvidenceSignature({
      ...payload,
      // Pass parameters in reversed insertion order to verify sorted canonicalization
      parameters: { utm_source: 'fb', sub_id: 'tvf_1' },
    })

    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('detects evidence record tampering when verifiedUrl or parameters are forged', async () => {
    const initialUrl = 'https://shp.ee/honest'
    const finalUrl = 'https://shopee.com.my/item?sub_id=honest_sub'

    const mockFetch: FetchLike = async () => {
      return new Response(null, { status: 301, headers: { Location: finalUrl } })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(verifyEvidenceSignature(evidence)).toBe(true)

    // Forged evidence: simulate an attacker tampering with the resolvedUrl
    const tamperedEvidence: LinkForensicEvidence = {
      ...evidence,
      resolvedUrl: 'https://shopee.com.my/item?sub_id=attacker_sub',
    }

    expect(verifyEvidenceSignature(tamperedEvidence)).toBe(false)

    // Forged parameters
    const tamperedParams: LinkForensicEvidence = {
      ...evidence,
      parameterAudit: {
        ...evidence.parameterAudit,
        rawQueryParams: { ...evidence.parameterAudit.rawQueryParams, injected: 'true' },
      },
    }

    expect(verifyEvidenceSignature(tamperedParams)).toBe(false)
  })
})

describe('API Route: POST /api/telemetry/inspect-redirect', () => {
  it('returns 400 when url parameter is missing or invalid', async () => {
    const reqEmpty = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const resEmpty = await inspectRedirectRoute(reqEmpty)
    expect(resEmpty.status).toBe(400)
    const bodyEmpty = await resEmpty.json()
    expect(bodyEmpty.error).toContain('url')

    const reqMalformed = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    })
    const resMalformed = await inspectRedirectRoute(reqMalformed)
    expect(resMalformed.status).toBe(400)
  })

  it('returns 200 with structured LinkForensicEvidence for valid inspection payload', async () => {
    const req = new Request('http://localhost:3000/api/telemetry/inspect-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://shopee.com.my/Skintific-Moisturizer-i.100.200?sub_id=tvf_api_test',
        expectedSubId: 'tvf_api_test',
      }),
    })

    const res = await inspectRedirectRoute(req)
    expect(res.status).toBe(200)

    const evidence: LinkForensicEvidence = await res.json()
    expect(evidence.evidenceId).toMatch(/^ev_\d+_[a-f0-9]{8}$/)
    expect(evidence.parameterAudit.platform).toBe('shopee')
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_api_test')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.securityChecks.isHttpsOnly).toBe(true)
    expect(evidence.signatureHash).toMatch(/^[a-f0-9]{64}$/)
  })
})
