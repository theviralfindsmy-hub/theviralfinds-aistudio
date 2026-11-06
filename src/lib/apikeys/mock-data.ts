/**
 * API as a Service — Mock Data
 *
 * Fasa 4.5 (CHECKLIST Section 4.5).
 *
 * In-memory store of:
 *   - 5 mock API keys with different permissions / rate limits / usage
 *   - 30-day usage timeseries (deterministic seed so the dashboard looks
 *     consistent across reloads within a single dev-server lifetime)
 *   - Per-endpoint & per-key aggregated breakdowns
 *
 * All currency values are in Malaysian Ringgit (RM).
 * All timestamps are ISO-8601.
 */

import type {
  ApiKey,
  ApiKeyUsagePoint,
  EndpointUsageRow,
  KeyUsageRow,
  RateLimitTier,
  UsageAnalytics,
} from './types'

/** Number of days covered by the usage window. */
export const USAGE_WINDOW_DAYS = 30

/** ─── Helpers ────────────────────────────────────────────────────────── */

/**
 * Tiny seeded PRNG (mulberry32) — keeps the mock usage deterministic so the
 * charts don't dance around on every refresh. Seeded by keyId + day index.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mask a full key string into the `tvf_••••••••3f2a` preview format. */
export function maskKey(fullKey: string): string {
  // Keep first 14 chars (prefix `tvf_xxx_xxxxxxxxxx`) + last 4 chars.
  if (fullKey.length < 18) return fullKey
  const head = fullKey.slice(0, 14)
  const tail = fullKey.slice(-4)
  return `${head}••••••••${tail}`
}

/** Build a 14-char prefix from a full key (used for lookup). */
export function keyPrefix(fullKey: string): string {
  return fullKey.slice(0, 14)
}

/** Return an ISO date string for "n days ago" at MYT (UTC+8 fixed). */
function daysAgoIso(n: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

/** Return a yyyy-mm-dd label for "n days ago". */
function daysAgoLabel(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Format a Date as yyyy-mm-dd. */
function toDayLabel(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Generate the full plaintext secret for a key (deterministic). */
function generatePlaintext(env: string, body: string): string {
  // 16 random hex chars seeded from env + body — stable per key.
  const seed = hashString(env + body)
  const rand = mulberry32(seed)
  let hex = ''
  for (let i = 0; i < 16; i++) {
    hex += Math.floor(rand() * 16).toString(16)
  }
  return `tvf_${env}_${body}${hex}`
}

/** ─── API Key definitions ────────────────────────────────────────────── */

interface KeySpec {
  id: string
  name: string
  env: string
  body: string
  permissions: ApiKey['permissions']
  rateLimit: RateLimitTier
  status: ApiKey['status']
  createdDaysAgo: number
  lastUsedHoursAgo: number | null
  /** Average daily call volume — drives the 30d timeseries. */
  avgDailyCalls: number
  /** Error rate baseline (0-1). */
  errorRate: number
  /** Average latency baseline (ms). */
  avgLatencyMs: number
}

const KEY_SPECS: KeySpec[] = [
  {
    id: 'key-001',
    name: 'Production App',
    env: 'prod',
    body: 'a3f2k8m9x2',
    permissions: [
      'products:read',
      'products:write',
      'links:read',
      'links:write',
      'earnings:read',
      'analytics:read',
      'audience:read',
      'content:write',
      'trends:read',
      'alerts:write',
      'alerts:read',
    ],
    rateLimit: 10000,
    status: 'active',
    createdDaysAgo: 180,
    lastUsedHoursAgo: 0.2,
    avgDailyCalls: 4753,
    errorRate: 0.002,
    avgLatencyMs: 142,
  },
  {
    id: 'key-002',
    name: 'Analytics Dashboard',
    env: 'ana',
    body: 'b7c3d1e8f5',
    permissions: ['products:read', 'earnings:read', 'analytics:read', 'audience:read', 'trends:read'],
    rateLimit: 1000,
    status: 'active',
    createdDaysAgo: 92,
    lastUsedHoursAgo: 1.4,
    avgDailyCalls: 948,
    errorRate: 0.001,
    avgLatencyMs: 118,
  },
  {
    id: 'key-003',
    name: 'Mobile App Backend',
    env: 'mob',
    body: 'h2i9j4k7l3',
    permissions: ['products:read', 'links:read', 'links:write'],
    rateLimit: 10000,
    status: 'active',
    createdDaysAgo: 60,
    lastUsedHoursAgo: 0.5,
    avgDailyCalls: 2977,
    errorRate: 0.0035,
    avgLatencyMs: 165,
  },
  {
    id: 'key-004',
    name: 'Testing Key',
    env: 'test',
    body: 'z1y2x3w4v5',
    permissions: [
      'products:read',
      'products:write',
      'links:read',
      'links:write',
      'earnings:read',
      'analytics:read',
      'audience:read',
      'content:write',
      'trends:read',
      'alerts:write',
      'alerts:read',
    ],
    rateLimit: 100,
    status: 'active',
    createdDaysAgo: 14,
    lastUsedHoursAgo: 18,
    avgDailyCalls: 41,
    errorRate: 0.012,
    avgLatencyMs: 198,
  },
  {
    id: 'key-005',
    name: 'Legacy Webhook (Revoked)',
    env: 'whk',
    body: 'q5w6e7r8t9',
    permissions: ['links:read', 'earnings:read'],
    rateLimit: 100,
    status: 'revoked',
    createdDaysAgo: 365,
    lastUsedHoursAgo: null,
    avgDailyCalls: 0,
    errorRate: 0,
    avgLatencyMs: 0,
  },
]

/** Build the public ApiKey records (with maskedKey, never the raw secret). */
export const MOCK_API_KEYS: ApiKey[] = KEY_SPECS.map((spec) => {
  const plaintext = generatePlaintext(spec.env, spec.body)
  return {
    id: spec.id,
    name: spec.name,
    maskedKey: maskKey(plaintext),
    prefix: keyPrefix(plaintext),
    permissions: spec.permissions,
    rateLimit: spec.rateLimit,
    status: spec.status,
    createdAt: daysAgoIso(spec.createdDaysAgo, 9),
    lastUsedAt: spec.lastUsedHoursAgo === null ? null : daysAgoIso(0, new Date().getHours() - Math.floor(spec.lastUsedHoursAgo)),
    expiresAt: null,
  }
})

/** Internal map of keyId → full plaintext (for one-time display only). */
export const KEY_PLAINTEXT_MAP: Record<string, string> = Object.fromEntries(
  KEY_SPECS.map((spec) => [spec.id, generatePlaintext(spec.env, spec.body)]),
)

/** ─── Usage timeseries ───────────────────────────────────────────────── */

/**
 * Pre-computed 30-day timeseries for each key. Deterministic per
 * (keyId, dayIndex) — the same key always renders the same chart.
 *
 * Shape: Record<keyId, ApiKeyUsagePoint[]>
 */
export const MOCK_USAGE_TIMESERIES: Record<string, ApiKeyUsagePoint[]> =
  Object.fromEntries(
    KEY_SPECS.map((spec) => {
      const seed = hashString(spec.id)
      const rand = mulberry32(seed)
      const points: ApiKeyUsagePoint[] = []
      for (let i = USAGE_WINDOW_DAYS - 1; i >= 0; i--) {
        const label = daysAgoLabel(i)
        // Weekly seasonality: weekend dip for analytics keys, weekend peak for prod.
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dow = d.getDay()
        const weekendFactor =
          spec.env === 'ana' ? (dow === 0 || dow === 6 ? 0.6 : 1) : 1 + (dow === 0 || dow === 6 ? 0.15 : 0)
        // ±25% daily noise.
        const noise = 0.75 + rand() * 0.5
        // Slow upward drift over the month.
        const trend = 1 + (USAGE_WINDOW_DAYS - i) / USAGE_WINDOW_DAYS * 0.15
        const calls = Math.round(spec.avgDailyCalls * weekendFactor * noise * trend)
        const errors = Math.round(calls * spec.errorRate * (0.5 + rand()))
        const avgLatencyMs = Math.round(
          spec.avgLatencyMs * (0.85 + rand() * 0.3),
        )
        points.push({ date: label, calls, errors, avgLatencyMs })
      }
      return [spec.id, points]
    }),
  )

/** ─── Per-endpoint breakdown ────────────────────────────────────────── */

/** Endpoint ids that contribute to usage (matches endpoints.ts catalog). */
const ENDPOINT_USAGE_SEED: { id: string; weight: number; latencyMs: number; errorRate: number }[] = [
  { id: 'products-list', weight: 0.32, latencyMs: 110, errorRate: 0.002 },
  { id: 'products-get', weight: 0.18, latencyMs: 95, errorRate: 0.001 },
  { id: 'products-search', weight: 0.08, latencyMs: 220, errorRate: 0.004 },
  { id: 'links-create', weight: 0.10, latencyMs: 280, errorRate: 0.006 },
  { id: 'links-list', weight: 0.06, latencyMs: 130, errorRate: 0.001 },
  { id: 'links-delete', weight: 0.01, latencyMs: 120, errorRate: 0.001 },
  { id: 'earnings-get', weight: 0.05, latencyMs: 180, errorRate: 0.002 },
  { id: 'analytics-get', weight: 0.07, latencyMs: 240, errorRate: 0.003 },
  { id: 'audience-get', weight: 0.02, latencyMs: 520, errorRate: 0.012 },
  { id: 'content-generate', weight: 0.03, latencyMs: 1850, errorRate: 0.018 },
  { id: 'trends-get', weight: 0.04, latencyMs: 320, errorRate: 0.005 },
  { id: 'trends-competitor', weight: 0.02, latencyMs: 640, errorRate: 0.008 },
  { id: 'alerts-preferences', weight: 0.005, latencyMs: 90, errorRate: 0.0 },
  { id: 'alerts-feed', weight: 0.015, latencyMs: 160, errorRate: 0.002 },
]

/** Total calls across all keys in the 30-day window. */
const TOTAL_CALLS_30D = KEY_SPECS.reduce((sum, spec) => {
  const ts = MOCK_USAGE_TIMESERIES[spec.id] ?? []
  return sum + ts.reduce((s, p) => s + p.calls, 0)
}, 0)

/** Total errors across all keys. */
const TOTAL_ERRORS_30D = KEY_SPECS.reduce((sum, spec) => {
  const ts = MOCK_USAGE_TIMESERIES[spec.id] ?? []
  return sum + ts.reduce((s, p) => s + p.errors, 0)
}, 0)

/** Per-endpoint aggregated rows. */
export const MOCK_USAGE_BY_ENDPOINT: EndpointUsageRow[] = ENDPOINT_USAGE_SEED.map(
  (seed) => {
    const calls = Math.round(TOTAL_CALLS_30D * seed.weight)
    const errors = Math.round(calls * seed.errorRate)
    return {
      endpoint: endpointPathById(seed.id),
      method: endpointMethodById(seed.id),
      calls,
      errors,
      avgLatencyMs: seed.latencyMs,
    }
  },
).sort((a, b) => b.calls - a.calls)

/** Per-key aggregated rows. */
export const MOCK_USAGE_BY_KEY: KeyUsageRow[] = KEY_SPECS.map((spec) => {
  const ts = MOCK_USAGE_TIMESERIES[spec.id] ?? []
  const calls = ts.reduce((s, p) => s + p.calls, 0)
  const errors = ts.reduce((s, p) => s + p.errors, 0)
  const lat = ts.length
    ? Math.round(ts.reduce((s, p) => s + p.avgLatencyMs, 0) / ts.length)
    : 0
  return {
    keyId: spec.id,
    keyName: spec.name,
    calls,
    errors,
    errorRate: calls > 0 ? errors / calls : 0,
    avgLatencyMs: lat,
  }
})

/** Aggregate error-rate trend (one point per day, blended across keys). */
export const MOCK_ERROR_TREND: { date: string; errorRate: number }[] =
  Array.from({ length: USAGE_WINDOW_DAYS }, (_, idx) => {
    const i = USAGE_WINDOW_DAYS - 1 - idx
    const label = daysAgoLabel(i)
    let totalCalls = 0
    let totalErrors = 0
    for (const spec of KEY_SPECS) {
      const p = MOCK_USAGE_TIMESERIES[spec.id]?.[idx]
      if (p) {
        totalCalls += p.calls
        totalErrors += p.errors
      }
    }
    return {
      date: label,
      errorRate: totalCalls > 0 ? totalErrors / totalCalls : 0,
    }
  })

/** Latency distribution buckets across all calls. */
export const MOCK_LATENCY_DISTRIBUTION: { bucket: string; calls: number }[] = [
  { bucket: '<50ms', calls: Math.round(TOTAL_CALLS_30D * 0.18) },
  { bucket: '50-100ms', calls: Math.round(TOTAL_CALLS_30D * 0.32) },
  { bucket: '100-200ms', calls: Math.round(TOTAL_CALLS_30D * 0.28) },
  { bucket: '200-500ms', calls: Math.round(TOTAL_CALLS_30D * 0.14) },
  { bucket: '500ms-1s', calls: Math.round(TOTAL_CALLS_30D * 0.06) },
  { bucket: '>1s', calls: Math.round(TOTAL_CALLS_30D * 0.02) },
]

/** Aggregate average latency. */
const AGG_AVG_LATENCY = (() => {
  let totalCalls = 0
  let weightedLatency = 0
  for (const row of MOCK_USAGE_BY_ENDPOINT) {
    totalCalls += row.calls
    weightedLatency += row.calls * row.avgLatencyMs
  }
  return totalCalls > 0 ? Math.round(weightedLatency / totalCalls) : 0
})()

/** Combined daily series (sum across all keys) for the AreaChart. */
const COMBINED_TIMESERIES: ApiKeyUsagePoint[] = (() => {
  const out: ApiKeyUsagePoint[] = []
  for (let i = 0; i < USAGE_WINDOW_DAYS; i++) {
    const label = MOCK_USAGE_TIMESERIES[KEY_SPECS[0].id]?.[i]?.date ?? daysAgoLabel(USAGE_WINDOW_DAYS - 1 - i)
    let calls = 0
    let errors = 0
    let latSum = 0
    let latCount = 0
    for (const spec of KEY_SPECS) {
      const p = MOCK_USAGE_TIMESERIES[spec.id]?.[i]
      if (p) {
        calls += p.calls
        errors += p.errors
        latSum += p.avgLatencyMs * p.calls
        latCount += p.calls
      }
    }
    out.push({
      date: label,
      calls,
      errors,
      avgLatencyMs: latCount > 0 ? Math.round(latSum / latCount) : 0,
    })
  }
  return out
})()

/** Final aggregated analytics object returned by GET /api/apikeys/usage. */
export const MOCK_USAGE_ANALYTICS: UsageAnalytics = {
  timeseries: COMBINED_TIMESERIES,
  byEndpoint: MOCK_USAGE_BY_ENDPOINT,
  byKey: MOCK_USAGE_BY_KEY,
  totalCalls: TOTAL_CALLS_30D,
  totalErrors: TOTAL_ERRORS_30D,
  errorRate: TOTAL_CALLS_30D > 0 ? TOTAL_ERRORS_30D / TOTAL_CALLS_30D : 0,
  avgLatencyMs: AGG_AVG_LATENCY,
  errorTrend: MOCK_ERROR_TREND,
  latencyDistribution: MOCK_LATENCY_DISTRIBUTION,
}

// ─── Internal helpers (kept at bottom to keep public surface clean) ─────

import { API_ENDPOINTS } from './endpoints'

function endpointPathById(id: string): string {
  return API_ENDPOINTS.find((e) => e.id === id)?.path ?? `/${id}`
}

function endpointMethodById(
  id: string,
): EndpointUsageRow['method'] {
  return API_ENDPOINTS.find((e) => e.id === id)?.method ?? 'GET'
}

/** Convenience: today's day label. */
export function todayLabel(): string {
  return toDayLabel(new Date())
}
