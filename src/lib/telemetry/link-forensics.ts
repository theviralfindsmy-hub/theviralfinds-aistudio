/**
 * Link Forensics & Telemetry Engine: Affiliate Redirect Audit & Network Forensics
 * 
 * Inspects multi-hop HTTP redirects (301, 302, 303, 307, 308) for affiliate shortlinks
 * (shp.ee, vt.tiktok.com, s.lazada, etc.), audits sub-affiliate parameters (sub_id, af_sub),
 * detects commission leakage/stripping, verifies destination domains and protocols,
 * and generates tamper-evident SHA-256 evidence records.
 */

import { createHash } from 'crypto'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ForensicPlatform = 'shopee' | 'tiktok' | 'lazada' | 'unknown'
export type CommissionLeakageRisk = 'none' | 'low' | 'medium' | 'high' | 'critical'

export interface RedirectHop {
  hopIndex: number
  fromUrl: string
  toUrl: string
  statusCode: number
  latencyMs: number
  timestamp: string
}

export interface AffiliateParameterAudit {
  platform: ForensicPlatform
  detectedSubId?: string
  detectedAffiliateId?: string
  campaignId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  rawQueryParams: Record<string, string>
  isCommissionProtected: boolean
  leakageRisk: CommissionLeakageRisk
  leakageReasons: string[]
}

export interface SecurityCheckResult {
  isHttpsOnly: boolean
  noMaliciousQueryMutation: boolean
  destinationMatchesTargetDomain: boolean
  isValidProtocol: boolean
}

export interface LinkForensicEvidence {
  evidenceId: string
  timestamp: string
  originalUrl: string
  resolvedUrl: string
  totalHops: number
  totalLatencyMs: number
  isHealthy: boolean
  redirectChain: RedirectHop[]
  parameterAudit: AffiliateParameterAudit
  securityChecks: SecurityCheckResult
  signatureHash: string
}

export type FetchLike = (input: RequestInfo | URL | string, init?: RequestInit) => Promise<Response>

export interface ResolveRedirectOptions {
  maxHops?: number
  expectedSubId?: string
  timeoutMs?: number
  fetchFn?: FetchLike
}

// ============================================================================
// Constants & Lookups
// ============================================================================

export const SHORTLINK_HOSTS = new Set([
  'shp.ee',
  'shope.ee',
  'vt.tiktok.com',
  'vm.tiktok.com',
  's.lazada.com.my',
  's.lazada.sg',
  'c.lazada.com.my',
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'is.gd',
  'rebrand.ly',
])

const MALICIOUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /data:text\/html/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /document\.cookie/i,
  /UNION\s+SELECT/i,
  /DROP\s+TABLE/i,
  /malicious_token/i,
  /evil_param/i,
]

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Checks if a given hostname belongs to a known shortlink provider.
 */
export function isShortlinkUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr)
    return SHORTLINK_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Detects affiliate platform from URL host and structure.
 */
export function detectForensicPlatform(urlStr: string): ForensicPlatform {
  try {
    const parsed = new URL(urlStr)
    const host = parsed.hostname.toLowerCase()

    if (
      host === 'shp.ee' ||
      host === 'shope.ee' ||
      host.includes('shopee.com') ||
      host.includes('shopee.co') ||
      host.includes('shopee.ph') ||
      host.includes('shopee.sg') ||
      host.includes('shopee.vn') ||
      host.includes('shopee.th')
    ) {
      return 'shopee'
    }

    if (
      host === 'vt.tiktok.com' ||
      host === 'vm.tiktok.com' ||
      host.includes('tiktok.com') ||
      host.includes('byteoversea.com')
    ) {
      return 'tiktok'
    }

    if (
      host.includes('lazada.com') ||
      host.includes('lazada.co') ||
      host.includes('lazada.sg') ||
      host.includes('slazada') ||
      host.startsWith('s.lazada') ||
      host.startsWith('c.lazada')
    ) {
      return 'lazada'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Parses all search query parameters into a flat Record.
 */
export function extractQueryParams(urlStr: string): Record<string, string> {
  try {
    const parsed = new URL(urlStr)
    const result: Record<string, string> = {}
    parsed.searchParams.forEach((value, key) => {
      result[key] = value
    })
    return result
  } catch {
    return {}
  }
}

/**
 * Checks whether query parameters contain malicious script or injection payloads.
 */
export function checkMaliciousQueryParameters(params: Record<string, string>): boolean {
  for (const [key, val] of Object.entries(params)) {
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(key) || pattern.test(val)) {
        return false // Found malicious content
      }
    }
  }
  return true // Clean
}

/**
 * Verifies if destination URL matches the expected domain for detected platform.
 */
export function verifyDestinationDomain(platform: ForensicPlatform, destinationUrl: string): boolean {
  if (platform === 'unknown') return true
  try {
    const parsed = new URL(destinationUrl)
    const host = parsed.hostname.toLowerCase()

    if (platform === 'shopee') {
      return host.includes('shopee.com') || host.includes('shopee.sg') || host.includes('shopee.co')
    }
    if (platform === 'tiktok') {
      return host.includes('tiktok.com')
    }
    if (platform === 'lazada') {
      return host.includes('lazada.com') || host.includes('lazada.sg') || host.includes('lazada.co')
    }
    return true
  } catch {
    return false
  }
}

/**
 * Generates canonical tamper-evident SHA-256 evidence signature.
 */
export function computeEvidenceSignature(payload: {
  originalUrl: string
  resolvedUrl: string
  totalHops: number
  hops: Array<{ hopIndex: number; fromUrl: string; toUrl: string; statusCode: number }>
  parameters: Record<string, string>
  platform: ForensicPlatform
  leakageRisk: CommissionLeakageRisk
  isHealthy: boolean
}): string {
  // Sort parameters deterministically for reproducible hashing
  const sortedParams = Object.keys(payload.parameters)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload.parameters[key]
      return acc
    }, {} as Record<string, string>)

  const canonical = JSON.stringify({
    originalUrl: payload.originalUrl,
    resolvedUrl: payload.resolvedUrl,
    totalHops: payload.totalHops,
    hops: payload.hops,
    parameters: sortedParams,
    platform: payload.platform,
    leakageRisk: payload.leakageRisk,
    isHealthy: payload.isHealthy,
  })

  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Verifies the tamper-evident signature of a LinkForensicEvidence record.
 */
export function verifyEvidenceSignature(evidence: LinkForensicEvidence): boolean {
  const recomputed = computeEvidenceSignature({
    originalUrl: evidence.originalUrl,
    resolvedUrl: evidence.resolvedUrl,
    totalHops: evidence.totalHops,
    hops: evidence.redirectChain.map(h => ({
      hopIndex: h.hopIndex,
      fromUrl: h.fromUrl,
      toUrl: h.toUrl,
      statusCode: h.statusCode,
    })),
    parameters: evidence.parameterAudit.rawQueryParams,
    platform: evidence.parameterAudit.platform,
    leakageRisk: evidence.parameterAudit.leakageRisk,
    isHealthy: evidence.isHealthy,
  })

  return recomputed === evidence.signatureHash
}

// ============================================================================
// Core Redirect Resolution & Forensics Engine
// ============================================================================

/**
 * Resolves an affiliate redirect chain, inspecting each HTTP hop manually,
 * auditing sub-affiliate parameters for commission leakage, and signing
 * the forensic evidence with SHA-256.
 */
export async function resolveRedirectChain(
  initialUrl: string,
  options: ResolveRedirectOptions = {}
): Promise<LinkForensicEvidence> {
  const {
    maxHops = 10,
    expectedSubId,
    timeoutMs = 8000,
    fetchFn = globalThis.fetch,
  } = options

  const startTime = Date.now()
  const hops: RedirectHop[] = []
  let currentUrl = initialUrl.trim()
  let isHealthy = true
  const initialParams = extractQueryParams(initialUrl)
  let loopDetected = false
  let hopsExceeded = false
  let timedOut = false
  let networkErrorMessage: string | undefined

  // Protocol validation on initial URL
  let parsedInitial: URL | undefined
  try {
    parsedInitial = new URL(currentUrl)
  } catch {
    // Malformed initial URL
    isHealthy = false
  }

  const isValidInitialProtocol = Boolean(
    parsedInitial && (parsedInitial.protocol === 'http:' || parsedInitial.protocol === 'https:')
  )

  if (!isValidInitialProtocol) {
    isHealthy = false
  }

  // Only attempt HTTP traversal if the initial URL is valid
  if (isHealthy && parsedInitial) {
    for (let i = 0; i < maxHops; i++) {
      const hopStart = Date.now()
      const controller = new AbortController()
      const timer = setTimeout(() => {
        controller.abort()
      }, timeoutMs)

      try {
        const response = await fetchFn(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Shopee/3.15.0 TikTok/32.0.0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })

        clearTimeout(timer)
        const hopLatency = Date.now() - hopStart
        const statusCode = response.status
        const location = response.headers.get('location')

        const isRedirectCode = [301, 302, 303, 307, 308].includes(statusCode)

        if (isRedirectCode && location) {
          // Resolve relative redirect locations against current URL
          let nextUrl: string
          try {
            nextUrl = new URL(location, currentUrl).toString()
          } catch {
            nextUrl = location
          }

          // Loop detection
          if (nextUrl === currentUrl || hops.some(h => h.fromUrl === currentUrl && h.toUrl === nextUrl)) {
            loopDetected = true
            isHealthy = false
            hops.push({
              hopIndex: i + 1,
              fromUrl: currentUrl,
              toUrl: nextUrl,
              statusCode,
              latencyMs: hopLatency,
              timestamp: new Date().toISOString(),
            })
            currentUrl = nextUrl
            break
          }

          hops.push({
            hopIndex: i + 1,
            fromUrl: currentUrl,
            toUrl: nextUrl,
            statusCode,
            latencyMs: hopLatency,
            timestamp: new Date().toISOString(),
          })

          currentUrl = nextUrl

          // If reached maximum hops without resolving to a final 2xx/content page
          if (i === maxHops - 1) {
            hopsExceeded = true
            isHealthy = false
          }
        } else {
          // Terminal destination reached (non-redirect response code, e.g. 200)
          break
        }
      } catch (err: any) {
        clearTimeout(timer)
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          timedOut = true
          networkErrorMessage = `Request timed out after ${timeoutMs}ms`
        } else {
          networkErrorMessage = err?.message || 'Network request failed'
        }
        isHealthy = false
        break
      }
    }
  }

  // ============================================================================
  // Parameter Extraction & Commission Leakage Audit
  // ============================================================================

  const finalParams = extractQueryParams(currentUrl)

  // Identify sub-affiliate parameters
  const detectedSubId =
    finalParams.sub_id ||
    finalParams.subId ||
    finalParams.af_sub ||
    finalParams.af_sub1 ||
    finalParams.af_sub2 ||
    finalParams.sub_id1 ||
    finalParams.sub_id2

  const detectedAffiliateId =
    finalParams.af_id ||
    finalParams.aff_trace_key ||
    finalParams.affiliate_id ||
    finalParams.af_id1

  const campaignId =
    finalParams.campaign_id ||
    finalParams.campaignId ||
    finalParams.camp_id

  const utmSource = finalParams.utm_source
  const utmMedium = finalParams.utm_medium
  const utmCampaign = finalParams.utm_campaign

  // Platform detection across the journey (either from initial shortlink or terminal destination)
  const initialPlatform = detectForensicPlatform(initialUrl)
  const finalPlatform = detectForensicPlatform(currentUrl)
  const platform: ForensicPlatform =
    finalPlatform !== 'unknown' ? finalPlatform : initialPlatform

  // Commission Leakage Assessment
  const leakageReasons: string[] = []
  let leakageRisk: CommissionLeakageRisk = 'none'

  if (loopDetected) {
    leakageReasons.push('Infinite redirect loop detected during URL resolution')
    leakageRisk = 'critical'
  }

  if (hopsExceeded) {
    leakageReasons.push(`Maximum redirect hops (${maxHops}) exceeded before reaching terminal destination`)
    leakageRisk = 'critical'
  }

  if (timedOut) {
    leakageReasons.push(`Redirect resolution timed out after ${timeoutMs}ms`)
    leakageRisk = 'critical'
  }

  if (networkErrorMessage && !timedOut) {
    leakageReasons.push(`Network error encountered: ${networkErrorMessage}`)
    leakageRisk = 'critical'
  }

  // Sub-affiliate ID matching against expectedSubId
  if (expectedSubId) {
    if (!detectedSubId) {
      leakageReasons.push(`Missing sub-affiliate tag: expected "${expectedSubId}" but none detected in terminal destination`)
      leakageRisk = 'critical'
    } else if (detectedSubId !== expectedSubId) {
      leakageReasons.push(`Sub-affiliate tag mismatch: expected "${expectedSubId}", found "${detectedSubId}" (potential commission diversion or hijack)`)
      if (leakageRisk !== 'critical') {
        leakageRisk = 'high'
      }
    }
  } else {
    // No expectedSubId supplied: evaluate platform-specific baseline
    if (!detectedSubId) {
      if (platform !== 'unknown') {
        leakageReasons.push(`No sub-affiliate parameter detected on ${platform} affiliate link (commissions attributed to generic pool)`)
        if (leakageRisk !== 'critical') {
          leakageRisk = 'high'
        }
      } else {
        leakageReasons.push('No sub-affiliate parameter detected')
        if (leakageRisk === 'none') {
          leakageRisk = 'low'
        }
      }
    }
  }

  // Intermediate parameter stripping check: was subId present on initial URL but lost after hops?
  const initialSubId =
    initialParams.sub_id ||
    initialParams.subId ||
    initialParams.af_sub ||
    initialParams.af_sub1
  if (initialSubId && !detectedSubId) {
    const stripMsg = `Sub-affiliate tag "${initialSubId}" was stripped during redirect hops`
    if (!leakageReasons.includes(stripMsg)) {
      leakageReasons.push(stripMsg)
    }
    leakageRisk = 'critical'
  }

  // ============================================================================
  // Security Checks
  // ============================================================================

  // Protocol check across all hops
  const allUrls = [initialUrl, ...hops.map(h => h.toUrl), currentUrl]
  const isValidProtocol = allUrls.every(u => {
    try {
      const p = new URL(u).protocol
      return p === 'http:' || p === 'https:'
    } catch {
      return false
    }
  })

  const isHttpsOnly = allUrls.every(u => {
    try {
      return new URL(u).protocol === 'https:'
    } catch {
      return false
    }
  })

  if (!isHttpsOnly && isValidProtocol) {
    leakageReasons.push('Insecure HTTP hop detected in redirect chain (insecure transit allows parameter injection)')
    if (leakageRisk === 'none') {
      leakageRisk = 'medium'
    }
  }

  const noMaliciousQueryMutation = checkMaliciousQueryParameters(finalParams)
  if (!noMaliciousQueryMutation) {
    leakageReasons.push('Potentially malicious query parameters or script injection detected in URL')
    leakageRisk = 'critical'
    isHealthy = false
  }

  const destinationMatchesTargetDomain = verifyDestinationDomain(platform, currentUrl)
  if (!destinationMatchesTargetDomain && platform !== 'unknown') {
    leakageReasons.push(`Destination domain does not match expected domain for platform "${platform}"`)
    if (leakageRisk !== 'critical') {
      leakageRisk = 'high'
    }
    isHealthy = false
  }

  const isCommissionProtected = leakageRisk === 'none'

  // ============================================================================
  // Canonical Evidence Signature (SHA-256)
  // ============================================================================

  const signatureHash = computeEvidenceSignature({
    originalUrl: initialUrl,
    resolvedUrl: currentUrl,
    totalHops: hops.length,
    hops: hops.map(h => ({
      hopIndex: h.hopIndex,
      fromUrl: h.fromUrl,
      toUrl: h.toUrl,
      statusCode: h.statusCode,
    })),
    parameters: finalParams,
    platform,
    leakageRisk,
    isHealthy,
  })

  const evidenceId = `ev_${Date.now()}_${createHash('sha256')
    .update(initialUrl + currentUrl + signatureHash)
    .digest('hex')
    .substring(0, 8)}`

  return {
    evidenceId,
    timestamp: new Date().toISOString(),
    originalUrl: initialUrl,
    resolvedUrl: currentUrl,
    totalHops: hops.length,
    totalLatencyMs: Date.now() - startTime,
    isHealthy,
    redirectChain: hops,
    parameterAudit: {
      platform,
      detectedSubId,
      detectedAffiliateId,
      campaignId,
      utmSource,
      utmMedium,
      utmCampaign,
      rawQueryParams: finalParams,
      isCommissionProtected,
      leakageRisk,
      leakageReasons,
    },
    securityChecks: {
      isHttpsOnly,
      noMaliciousQueryMutation,
      destinationMatchesTargetDomain,
      isValidProtocol,
    },
    signatureHash,
  }
}
