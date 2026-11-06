/**
 * Empirical Stress Test Harness: Milestone 2 Redirect Engine
 * 
 * Conducts adversarial stress-testing on:
 * 1. Multi-hop redirect chains across 1-hop, 3-hop, 5-hop, and 10-hop lengths.
 * 2. Max hops limit enforcement across varied thresholds (1, 3, 5, 10).
 * 3. Circular redirect loop detection (A -> A, A -> B -> A, A -> B -> C -> A, and query mutations).
 * 4. Relative Location header edge cases (root-relative, directory-relative, parent-relative, protocol-relative, query-only, malformed).
 * 5. Timeout and abort signal handling across first and intermediate hops.
 * 6. High-concurrency stress harness (50 parallel redirect chains).
 */

import { describe, it, expect } from 'bun:test'
import {
  resolveRedirectChain,
  verifyEvidenceSignature,
  type FetchLike,
  type RedirectHop,
} from '@/lib/telemetry/link-forensics'

describe('Challenger M2: Multi-Hop Redirect Simulation (1, 3, 5, 10 hops)', () => {
  it('correctly resolves a 1-hop redirect chain', async () => {
    const url0 = 'https://shp.ee/hop1'
    const url1 = 'https://shopee.com.my/product/123?sub_id=aff_1hop'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === url0) {
        return new Response(null, { status: 301, headers: { Location: url1 } })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(url0, {
      expectedSubId: 'aff_1hop',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.resolvedUrl).toBe(url1)
    expect(evidence.redirectChain).toHaveLength(1)
    expect(evidence.redirectChain[0].hopIndex).toBe(1)
    expect(evidence.redirectChain[0].fromUrl).toBe(url0)
    expect(evidence.redirectChain[0].toUrl).toBe(url1)
    expect(evidence.redirectChain[0].statusCode).toBe(301)
    expect(evidence.parameterAudit.detectedSubId).toBe('aff_1hop')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('correctly resolves a 3-hop redirect chain (301 -> 302 -> 307 -> 200)', async () => {
    const urls = [
      'https://shp.ee/hop3_start',
      'https://tracking.shopee.com/redirect?id=1',
      'https://affiliate.shopee.com.my/bridge?token=xyz',
      'https://shopee.com.my/product/789?sub_id=aff_3hop&utm_source=tiktok',
    ]

    const statusCodes = [301, 302, 307]

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      for (let i = 0; i < statusCodes.length; i++) {
        if (u === urls[i]) {
          return new Response(null, {
            status: statusCodes[i],
            headers: { Location: urls[i + 1] },
          })
        }
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(urls[0], {
      expectedSubId: 'aff_3hop',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(3)
    expect(evidence.resolvedUrl).toBe(urls[3])
    expect(evidence.redirectChain).toHaveLength(3)

    for (let i = 0; i < 3; i++) {
      expect(evidence.redirectChain[i].hopIndex).toBe(i + 1)
      expect(evidence.redirectChain[i].fromUrl).toBe(urls[i])
      expect(evidence.redirectChain[i].toUrl).toBe(urls[i + 1])
      expect(evidence.redirectChain[i].statusCode).toBe(statusCodes[i])
    }

    expect(evidence.parameterAudit.detectedSubId).toBe('aff_3hop')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('correctly resolves a 5-hop redirect chain with mixed status codes (301, 302, 303, 307, 308)', async () => {
    const urls = [
      'https://vt.tiktok.com/hop5_start/',
      'https://v.tiktok.com/bridge1',
      'https://analytics.tiktok.com/click?c=1',
      'https://api.tiktok.com/affiliate/router',
      'https://shop.tiktok.com/landing?subId=aff_5hop',
      'https://shop.tiktok.com/view/product/999999?subId=aff_5hop&utm_medium=video',
    ]
    const codes = [301, 302, 303, 307, 308]

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      for (let i = 0; i < codes.length; i++) {
        if (u === urls[i]) {
          return new Response(null, {
            status: codes[i],
            headers: { Location: urls[i + 1] },
          })
        }
      }
      return new Response('TikTok Terminal', { status: 200 })
    }

    const evidence = await resolveRedirectChain(urls[0], {
      expectedSubId: 'aff_5hop',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(5)
    expect(evidence.resolvedUrl).toBe(urls[5])
    expect(evidence.redirectChain).toHaveLength(5)
    expect(evidence.parameterAudit.platform).toBe('tiktok')
    expect(evidence.parameterAudit.detectedSubId).toBe('aff_5hop')
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('correctly resolves a 10-hop redirect chain when maxHops is configured to accommodate it', async () => {
    // 10 redirects from step 0 to step 10, then step 10 returns 200
    const chainLength = 10
    const urls: string[] = []
    for (let i = 0; i <= chainLength; i++) {
      urls.push(`https://shopee.com.my/chain_step_${i}${i === chainLength ? '?sub_id=aff_10hop' : ''}`)
    }

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      const match = u.match(/chain_step_(\d+)/)
      if (match) {
        const step = parseInt(match[1], 10)
        if (step < chainLength) {
          return new Response(null, {
            status: 302,
            headers: { Location: urls[step + 1] },
          })
        }
      }
      return new Response('Terminal Shopee Page', { status: 200 })
    }

    // Set maxHops to 15 to allow all 10 hops + final terminal check
    const evidence = await resolveRedirectChain(urls[0], {
      maxHops: 15,
      expectedSubId: 'aff_10hop',
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(true)
    expect(evidence.totalHops).toBe(10)
    expect(evidence.resolvedUrl).toBe(urls[10])
    expect(evidence.redirectChain).toHaveLength(10)
    expect(evidence.parameterAudit.detectedSubId).toBe('aff_10hop')
    expect(evidence.parameterAudit.isCommissionProtected).toBe(true)
    expect(evidence.parameterAudit.leakageRisk).toBe('none')
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })
})

describe('Challenger M2: Max Hops Limit Enforcement', () => {
  it('enforces maxHops = 1 strictly and halts gracefully without hanging', async () => {
    const url0 = 'https://shp.ee/hop0'
    const url1 = 'https://shp.ee/hop1'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      return new Response(null, { status: 302, headers: { Location: url1 } })
    }

    const evidence = await resolveRedirectChain(url0, {
      maxHops: 1,
      fetchFn: mockFetch,
    })

    expect(evidence.totalHops).toBe(1)
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons).toContain('Maximum redirect hops (1) exceeded before reaching terminal destination')
  })

  it('enforces default maxHops = 10 on a 15-hop infinite chain', async () => {
    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      const match = u.match(/inf_step_(\d+)/)
      const step = match ? parseInt(match[1], 10) : 0
      return new Response(null, {
        status: 302,
        headers: { Location: `https://tracking.com/inf_step_${step + 1}` },
      })
    }

    const evidence = await resolveRedirectChain('https://tracking.com/inf_step_0', {
      fetchFn: mockFetch,
    })

    expect(evidence.totalHops).toBe(10)
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Maximum redirect hops (10) exceeded'))).toBe(true)
    expect(evidence.redirectChain).toHaveLength(10)
  })

  it('handles maxHops = 0 edge case without crashing', async () => {
    const mockFetch: FetchLike = async () => new Response('OK', { status: 200 })

    const evidence = await resolveRedirectChain('https://shopee.com.my/item', {
      maxHops: 0,
      fetchFn: mockFetch,
    })

    expect(evidence.totalHops).toBe(0)
    expect(evidence.redirectChain).toHaveLength(0)
    expect(evidence.resolvedUrl).toBe('https://shopee.com.my/item')
  })
})

describe('Challenger M2: Circular Redirect Loop Detection', () => {
  it('detects immediate self-redirect (A -> A) and does not hang', async () => {
    const selfUrl = 'https://shopee.com.my/broken-redirect'

    const mockFetch: FetchLike = async () => {
      return new Response(null, {
        status: 302,
        headers: { Location: selfUrl },
      })
    }

    const evidence = await resolveRedirectChain(selfUrl, {
      maxHops: 10,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons).toContain('Infinite redirect loop detected during URL resolution')
    expect(verifyEvidenceSignature(evidence)).toBe(true)
  })

  it('detects 2-hop circular redirect loop (A -> B -> A) and halts cleanly', async () => {
    const urlA = 'https://merchant.com/loop_a'
    const urlB = 'https://merchant.com/loop_b'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === urlA) {
        return new Response(null, { status: 302, headers: { Location: urlB } })
      }
      if (u === urlB) {
        return new Response(null, { status: 302, headers: { Location: urlA } })
      }
      return new Response('404', { status: 404 })
    }

    const evidence = await resolveRedirectChain(urlA, {
      maxHops: 10,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons).toContain('Infinite redirect loop detected during URL resolution')
    // Loop A -> B -> A -> B is halted on 3rd hop when A -> B is re-encountered
    expect(evidence.totalHops).toBe(3)
    expect(evidence.redirectChain[0].fromUrl).toBe(urlA)
    expect(evidence.redirectChain[0].toUrl).toBe(urlB)
    expect(evidence.redirectChain[1].fromUrl).toBe(urlB)
    expect(evidence.redirectChain[1].toUrl).toBe(urlA)
    expect(evidence.redirectChain[2].fromUrl).toBe(urlA)
    expect(evidence.redirectChain[2].toUrl).toBe(urlB)
  })

  it('detects 3-hop circular redirect loop (A -> B -> C -> A) and halts cleanly', async () => {
    const urlA = 'https://node.com/circle_a'
    const urlB = 'https://node.com/circle_b'
    const urlC = 'https://node.com/circle_c'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === urlA) return new Response(null, { status: 301, headers: { Location: urlB } })
      if (u === urlB) return new Response(null, { status: 302, headers: { Location: urlC } })
      if (u === urlC) return new Response(null, { status: 307, headers: { Location: urlA } })
      return new Response('404', { status: 404 })
    }

    const evidence = await resolveRedirectChain(urlA, {
      maxHops: 10,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons).toContain('Infinite redirect loop detected during URL resolution')
    expect(evidence.totalHops).toBe(4) // A->B, B->C, C->A, A->B
  })

  it('detects circular loop caused by relative redirect back to current path', async () => {
    const url = 'https://shopee.com.my/checkout/retry'

    const mockFetch: FetchLike = async () => {
      // Relative location pointing back to itself
      return new Response(null, {
        status: 302,
        headers: { Location: '/checkout/retry' },
      })
    }

    const evidence = await resolveRedirectChain(url, { fetchFn: mockFetch })
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.parameterAudit.leakageReasons).toContain('Infinite redirect loop detected during URL resolution')
  })
})

describe('Challenger M2: Relative Location Headers & Edge Cases', () => {
  it('resolves root-relative Location headers (/product/123)', async () => {
    const initialUrl = 'https://shopee.com.my/deeplink/promo'
    const expected = 'https://shopee.com.my/product/123?sub_id=tvf_root'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/product/123?sub_id=tvf_root' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(expected)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_root')
    expect(evidence.isHealthy).toBe(true)
  })

  it('resolves directory-relative Location headers without leading slash', async () => {
    const initialUrl = 'https://shopee.com.my/category/fashion/'
    const expected = 'https://shopee.com.my/category/fashion/item-99?sub_id=tvf_dir'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 301,
          headers: { Location: 'item-99?sub_id=tvf_dir' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(expected)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_dir')
  })

  it('resolves parent-relative Location headers (../item-88)', async () => {
    const initialUrl = 'https://shopee.com.my/category/fashion/subcat/'
    const expected = 'https://shopee.com.my/category/fashion/item-88?sub_id=tvf_parent'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: '../item-88?sub_id=tvf_parent' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(expected)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_parent')
  })

  it('resolves protocol-relative Location headers (//otherdomain.com/path)', async () => {
    const initialUrl = 'https://shp.ee/proto'
    const expected = 'https://shopee.com.my/direct?sub_id=tvf_proto'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { Location: '//shopee.com.my/direct?sub_id=tvf_proto' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(expected)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_proto')
  })

  it('resolves query-only Location headers (?sub_id=updated)', async () => {
    const initialUrl = 'https://shopee.com.my/product/100'
    const expected = 'https://shopee.com.my/product/100?sub_id=tvf_query_only'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 307,
          headers: { Location: '?sub_id=tvf_query_only' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.resolvedUrl).toBe(expected)
    expect(evidence.parameterAudit.detectedSubId).toBe('tvf_query_only')
  })

  it('handles malformed Location header gracefully without throwing', async () => {
    const initialUrl = 'https://shopee.com.my/start'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, {
          status: 302,
          // Malformed invalid URI with illegal brackets
          headers: { Location: 'http://[::1:illegal-uri' },
        })
      }
      return new Response('OK', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.isHealthy).toBe(false)
    expect(evidence.securityChecks.destinationMatchesTargetDomain).toBe(false)
    expect(evidence.securityChecks.isValidProtocol).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('high')
    expect(evidence.parameterAudit.leakageReasons.some(r => r.includes('Destination domain does not match'))).toBe(true)
  })

  it('detects invalid protocol on non-initial hop and verifies security check reporting', async () => {
    const initialUrl = 'https://unknown-redirector.com/link'
    const ftpUrl = 'ftp://files.example.com/download.zip'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === initialUrl) {
        return new Response(null, { status: 302, headers: { Location: ftpUrl } })
      }
      return new Response('FTP File Content', { status: 200 })
    }

    const evidence = await resolveRedirectChain(initialUrl, { fetchFn: mockFetch })
    expect(evidence.securityChecks.isValidProtocol).toBe(false)
    expect(evidence.securityChecks.isHttpsOnly).toBe(false)
    expect(evidence.totalHops).toBe(1)
  })
})

describe('Challenger M2: Timeout & Abort Handling', () => {
  it('aborts when initial hop exceeds timeoutMs', async () => {
    const mockFetch: FetchLike = async () => {
      const err = new Error('The operation was aborted')
      err.name = 'AbortError'
      throw err
    }

    const evidence = await resolveRedirectChain('https://hanging-gateway.com/test', {
      timeoutMs: 100,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
    expect(evidence.parameterAudit.leakageReasons).toContain('Redirect resolution timed out after 100ms')
  })

  it('captures intermediate hops before timeout occurs on subsequent hop', async () => {
    const url0 = 'https://shp.ee/hop0'
    const url1 = 'https://shopee.com.my/hop1'

    const mockFetch: FetchLike = async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u === url0) {
        // Fast hop 1
        return new Response(null, { status: 301, headers: { Location: url1 } })
      }
      // Timeout on hop 2
      const err = new Error('The operation was aborted')
      err.name = 'AbortError'
      throw err
    }

    const evidence = await resolveRedirectChain(url0, {
      timeoutMs: 200,
      fetchFn: mockFetch,
    })

    expect(evidence.isHealthy).toBe(false)
    expect(evidence.totalHops).toBe(1)
    expect(evidence.redirectChain).toHaveLength(1)
    expect(evidence.redirectChain[0].fromUrl).toBe(url0)
    expect(evidence.redirectChain[0].toUrl).toBe(url1)
    expect(evidence.parameterAudit.leakageReasons).toContain('Redirect resolution timed out after 200ms')
    expect(evidence.parameterAudit.leakageRisk).toBe('critical')
  })
})

describe('Challenger M2: Concurrency & Determinism Stress Harness', () => {
  it('executes 50 simultaneous redirect resolutions deterministically without state corruption', async () => {
    const tasks = Array.from({ length: 50 }, (_, i) => {
      const initial = `https://shp.ee/concurrent_${i}`
      const target = `https://shopee.com.my/item_${i}?sub_id=concurrent_sub_${i}`

      const mockFetch: FetchLike = async (url) => {
        const u = typeof url === 'string' ? url : url.toString()
        if (u === initial) {
          return new Response(null, { status: 301, headers: { Location: target } })
        }
        return new Response('OK', { status: 200 })
      }

      return resolveRedirectChain(initial, {
        expectedSubId: `concurrent_sub_${i}`,
        fetchFn: mockFetch,
      })
    })

    const results = await Promise.all(tasks)

    expect(results).toHaveLength(50)
    for (let i = 0; i < 50; i++) {
      const ev = results[i]
      expect(ev.isHealthy).toBe(true)
      expect(ev.totalHops).toBe(1)
      expect(ev.parameterAudit.detectedSubId).toBe(`concurrent_sub_${i}`)
      expect(ev.parameterAudit.isCommissionProtected).toBe(true)
      expect(ev.parameterAudit.leakageRisk).toBe('none')
      expect(verifyEvidenceSignature(ev)).toBe(true)
    }
  })
})
