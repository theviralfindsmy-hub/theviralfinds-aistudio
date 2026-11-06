/**
 * API as a Service — Type Definitions
 *
 * Fasa 4.5 (CHECKLIST Section 4.5).
 *
 * Enterprise-tier users can mint API keys to access platform data
 * (products, links, earnings, analytics, content, trends, alerts)
 * programmatically. Each key is scoped by permission flags and a
 * tiered daily rate limit (100 / 1,000 / 10,000 req/day).
 *
 * All currency values are in Malaysian Ringgit (RM).
 * All timestamps are ISO-8601 strings.
 */

/** Source-of-truth flag for every API response. */
export type ApiDataSource = 'mock' | 'db'

/** HTTP methods supported by the playground & endpoint catalog. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Permission scopes for an API key.
 * Format is `<resource>:<action>` to keep it OWASP-friendly.
 */
export type ApiKeyPermission =
  | 'products:read'
  | 'products:write'
  | 'links:read'
  | 'links:write'
  | 'earnings:read'
  | 'analytics:read'
  | 'audience:read'
  | 'content:write'
  | 'trends:read'
  | 'alerts:write'
  | 'alerts:read'

/** All available permissions — used by the "Generate Key" dialog. */
export const ALL_PERMISSIONS: ApiKeyPermission[] = [
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
]

/** Tiered daily rate limit. Maps to the ApiKey.rateLimit field. */
export type RateLimitTier = 100 | 1000 | 10000

/** Key lifecycle state. */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired'

/** A single API key record (server-side view; never exposes the raw secret). */
export interface ApiKey {
  /** Stable id (e.g. "key-001"). */
  id: string
  /** Human label, e.g. "Production App". */
  name: string
  /**
   * Masked key preview, e.g. `tvf_prod_a3f2k8m9x2••••3f2a`.
   * The full secret is only returned ONCE at generation time.
   */
  maskedKey: string
  /** Prefix used for lookup indexing (e.g. "tvf_prod_a3f2k8m9x2"). */
  prefix: string
  /** Permission scopes attached to this key. */
  permissions: ApiKeyPermission[]
  /** Daily request cap. */
  rateLimit: RateLimitTier
  /** Lifecycle state. */
  status: ApiKeyStatus
  /** ISO date the key was created. */
  createdAt: string
  /** ISO date of last successful call, or null if never used. */
  lastUsedAt: string | null
  /** Optional expiry; null = no expiry. */
  expiresAt: string | null
}

/**
 * Returned exactly once when a new key is minted.
 * Includes the raw secret for the user to copy.
 */
export interface NewApiKey extends ApiKey {
  /** The full unmasked secret. Shown ONCE; user must save it. */
  plaintextKey: string
}

/** A single API call record, aggregated into daily buckets. */
export interface ApiKeyUsagePoint {
  /** ISO date (yyyy-mm-dd) or hour bucket label. */
  date: string
  /** Total calls in this bucket. */
  calls: number
  /** Number of error responses (4xx/5xx). */
  errors: number
  /** Average response latency in milliseconds. */
  avgLatencyMs: number
}

/** Per-endpoint breakdown row. */
export interface EndpointUsageRow {
  endpoint: string
  method: HttpMethod
  calls: number
  errors: number
  avgLatencyMs: number
}

/** Per-key breakdown row. */
export interface KeyUsageRow {
  keyId: string
  keyName: string
  calls: number
  errors: number
  errorRate: number
  avgLatencyMs: number
}

/** Aggregated usage analytics returned by GET /api/apikeys/usage. */
export interface UsageAnalytics {
  /** 30-day time series (one point per day). */
  timeseries: ApiKeyUsagePoint[]
  /** Per-endpoint aggregated rows (top N). */
  byEndpoint: EndpointUsageRow[]
  /** Per-key aggregated rows. */
  byKey: KeyUsageRow[]
  /** Total successful calls across all keys in the window. */
  totalCalls: number
  /** Total error responses. */
  totalErrors: number
  /** Aggregate error rate (errors / total, 0-1). */
  errorRate: number
  /** Aggregate average latency in ms. */
  avgLatencyMs: number
  /** Daily error-rate trend for the LineChart. */
  errorTrend: { date: string; errorRate: number }[]
  /** Latency distribution buckets (0-50, 50-100, ... ms). */
  latencyDistribution: { bucket: string; calls: number }[]
}

/** ─── Endpoint documentation catalog ──────────────────────────────────── */

export type EndpointCategory =
  | 'Products'
  | 'Links'
  | 'Earnings'
  | 'Analytics'
  | 'Content'
  | 'Trends'
  | 'Alerts'
  | 'Auth'

/** A single documented parameter on an endpoint. */
export interface EndpointParam {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  /** Example value used in the curl/JSON snippets. */
  example?: string | number | boolean | string[]
  /** Marks this as a path param (:id style) vs query / body param. */
  location: 'path' | 'query' | 'body' | 'header'
}

/** One possible error response on an endpoint. */
export interface ErrorResponseExample {
  status: number
  code: string
  message: string
}

/** Full documentation for one endpoint. */
export interface ApiEndpoint {
  id: string
  method: HttpMethod
  path: string
  category: EndpointCategory
  title: string
  description: string
  params: EndpointParam[]
  /** Required permission scope(s) — at least one must be present on the key. */
  requiredPermissions: ApiKeyPermission[]
  /** Per-key daily quota consumed by a single call (default 1). */
  rateLimitCost: number
  /** Example 200 response body (JSON object). */
  responseExample: Record<string, unknown>
  /** Example error responses. */
  errors: ErrorResponseExample[]
  /** Optional tags used by the search box. */
  tags?: string[]
}

/** ─── Playground request/response shapes ─────────────────────────────── */

export interface PlaygroundRequestParam {
  key: string
  value: string
}

export interface PlaygroundRequest {
  method: HttpMethod
  endpoint: string
  params: PlaygroundRequestParam[]
  /** Optional JSON body string for POST/PUT/PATCH. */
  body?: string
  /** API key id used for auth (server maps to masked key). */
  keyId?: string
}

export interface PlaygroundResponse {
  status: number
  statusText: string
  latencyMs: number
  body: unknown
  headers: Record<string, string>
  /** The endpoint doc matched, if any (for UI display). */
  matchedEndpoint?: ApiEndpoint
  source: ApiDataSource
}

/** ─── API request/response wrappers ──────────────────────────────────── */

export interface ApiKeysListResponse {
  keys: ApiKey[]
  source: ApiDataSource
}

export interface ApiKeyResponse {
  key: ApiKey
  source: ApiDataSource
}

export interface NewApiKeyResponse {
  key: NewApiKey
  source: ApiDataSource
}

export interface GenerateApiKeyRequest {
  name: string
  permissions: ApiKeyPermission[]
  rateLimit: RateLimitTier
  expiresInDays?: number
}

export interface UpdateApiKeyRequest {
  name?: string
  permissions?: ApiKeyPermission[]
  rateLimit?: RateLimitTier
}

export interface UsageAnalyticsResponse {
  analytics: UsageAnalytics
  source: ApiDataSource
}
