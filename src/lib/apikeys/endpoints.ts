/**
 * API as a Service — Endpoint Catalog
 *
 * Fasa 4.5 (CHECKLIST Section 4.5).
 *
 * Authoritative documentation for every public API endpoint exposed by
 * TheViralFindsMY. Drives:
 *   - the Documentation tab UI (sidebar + detail panel)
 *   - the Playground tab autocomplete
 *   - the playground mock-response generator (matched by method+path)
 *
 * Endpoint paths are prefixed with `/api/v1/` to distinguish them from
 * the internal Next.js routes that power the dashboard UI.
 */

import type { ApiEndpoint, EndpointCategory, HttpMethod } from './types'

/** Stable category ordering used by the Documentation sidebar. */
export const ENDPOINT_CATEGORIES: EndpointCategory[] = [
  'Products',
  'Links',
  'Earnings',
  'Analytics',
  'Content',
  'Trends',
  'Alerts',
  'Auth',
]

/** Category metadata for the Documentation sidebar. */
export const CATEGORY_META: Record<
  EndpointCategory,
  { icon: string; description: string }
> = {
  Products: { icon: '📦', description: 'Search & retrieve product catalog data' },
  Links: { icon: '🔗', description: 'Generate & manage affiliate links' },
  Earnings: { icon: '💰', description: 'Commission & payout reporting' },
  Analytics: { icon: '📊', description: 'Clicks, conversions, audience insights' },
  Content: { icon: '✍️', description: 'AI content generation (HERMES)' },
  Trends: { icon: '🔥', description: 'Trending products, keywords, competitors' },
  Alerts: { icon: '🔔', description: 'Commission XTRA alert bot preferences' },
  Auth: { icon: '🔐', description: 'Key introspection & session info' },
}

/** Method → tailwind badge classes (NO blue/indigo per design rules). */
export const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  POST: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  PATCH: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  DELETE: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

/**
 * The full endpoint catalog. 16 endpoints spanning all 8 categories.
 * Order = sidebar order within a category.
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  // ─── Products ───────────────────────────────────────────────────────
  {
    id: 'products-list',
    method: 'GET',
    path: '/api/v1/products',
    category: 'Products',
    title: 'List products',
    description:
      'Search the Shopee / TikTok / Lazada affiliate product catalog. Returns up to 50 results per page, sorted by commission rate by default.',
    params: [
      { name: 'platform', type: 'string', required: false, location: 'query', description: 'Filter by marketplace (shopee | tiktok | lazada). Omit for all.', example: 'shopee' },
      { name: 'niche', type: 'string', required: false, location: 'query', description: 'Niche filter (beauty | tech | fashion | home | food).', example: 'beauty' },
      { name: 'minCommission', type: 'number', required: false, location: 'query', description: 'Minimum commission rate (%) to include.', example: 10 },
      { name: 'page', type: 'number', required: false, location: 'query', description: '1-indexed page number.', example: 1 },
      { name: 'limit', type: 'number', required: false, location: 'query', description: 'Page size (1-50).', example: 20 },
    ],
    requiredPermissions: ['products:read'],
    rateLimitCost: 1,
    responseExample: {
      data: [
        {
          id: 'shp_8821',
          platform: 'shopee',
          name: 'Garnier Bright Complete Vitamin C Serum 30ml',
          price: 29.90,
          commissionRate: 18,
          monthlySales: 12400,
          rating: 4.8,
          shop: "Garnier Official Store",
        },
      ],
      page: 1,
      limit: 20,
      total: 1245,
    },
    errors: [
      { status: 400, code: 'INVALID_PARAMS', message: 'Query parameter "minCommission" must be a number between 0 and 100.' },
      { status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' },
      { status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Daily quota exceeded. Upgrade your tier or wait until 00:00 MYT.' },
    ],
    tags: ['search', 'catalog', 'affiliate'],
  },
  {
    id: 'products-get',
    method: 'GET',
    path: '/api/v1/products/:id',
    category: 'Products',
    title: 'Get product',
    description:
      'Retrieve a single product by its platform-specific id, including real-time price, stock, and active Commission XTRA boost.',
    params: [
      { name: 'id', type: 'string', required: true, location: 'path', description: 'Product id (e.g. shp_8821).', example: 'shp_8821' },
    ],
    requiredPermissions: ['products:read'],
    rateLimitCost: 1,
    responseExample: {
      id: 'shp_8821',
      platform: 'shopee',
      name: 'Garnier Bright Complete Vitamin C Serum 30ml',
      price: 29.90,
      originalPrice: 39.90,
      commissionRate: 18,
      xtraBoost: 12,
      monthlySales: 12400,
      rating: 4.8,
      ratingCount: 8421,
      shop: 'Garnier Official Store',
      imageUrl: 'https://cf.shopee.my/file/garnier-serum-30ml',
    },
    errors: [
      { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product "shp_invalid" was not found.' },
      { status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' },
    ],
    tags: ['detail', 'xtra'],
  },
  {
    id: 'products-search',
    method: 'GET',
    path: '/api/v1/products/search',
    category: 'Products',
    title: 'Search products',
    description:
      'Full-text keyword search across the product catalog. Supports BM + EN keywords (e.g. "serum muka", "wireless earbuds").',
    params: [
      { name: 'q', type: 'string', required: true, location: 'query', description: 'Search query (2-100 chars).', example: 'serum vitamin c' },
      { name: 'platform', type: 'string', required: false, location: 'query', description: 'Marketplace filter.', example: 'shopee' },
      { name: 'sortBy', type: 'string', required: false, location: 'query', description: 'relevance | commission | price_asc | price_desc | sales.', example: 'commission' },
    ],
    requiredPermissions: ['products:read'],
    rateLimitCost: 1,
    responseExample: {
      query: 'serum vitamin c',
      count: 32,
      results: [
        { id: 'shp_8821', name: 'Garnier Bright Complete Vitamin C Serum 30ml', commissionRate: 18, price: 29.90 },
      ],
    },
    errors: [
      { status: 400, code: 'QUERY_TOO_SHORT', message: 'Search query must be at least 2 characters.' },
    ],
    tags: ['search', 'keyword'],
  },
  // ─── Links ──────────────────────────────────────────────────────────
  {
    id: 'links-create',
    method: 'POST',
    path: '/api/v1/links',
    category: 'Links',
    title: 'Generate affiliate link',
    description:
      'Mint a new affiliate short-link for a given product. The link is tagged with the user\'s Shopee Affiliate ID for commission tracking.',
    params: [
      { name: 'productId', type: 'string', required: true, location: 'body', description: 'Product id from the catalog.', example: 'shp_8821' },
      { name: 'campaign', type: 'string', required: false, location: 'body', description: 'Optional UTM campaign label.', example: 'raya-2025' },
      { name: 'subId', type: 'string', required: false, location: 'body', description: 'Optional sub-id for granular attribution.', example: 'ig-story' },
    ],
    requiredPermissions: ['links:write'],
    rateLimitCost: 2,
    responseExample: {
      linkId: 'lnk_2c9f5e',
      shortUrl: 'https://tvf.my/r/G4n13rS3rum',
     affiliateUrl: 'https://shopee.com.my/product?aff_sub=tvf_8821&utm_source=tvf',
      productId: 'shp_8821',
      campaign: 'raya-2025',
      createdAt: '2025-06-16T09:30:00+08:00',
    },
    errors: [
      { status: 400, code: 'PRODUCT_NOT_FOUND', message: 'Product id "shp_invalid" not found.' },
      { status: 403, code: 'SCOPE_INSUFFICIENT', message: 'API key lacks "links:write" permission.' },
    ],
    tags: ['shortlink', 'utm'],
  },
  {
    id: 'links-list',
    method: 'GET',
    path: '/api/v1/links',
    category: 'Links',
    title: 'List affiliate links',
    description: 'List all affiliate links created by the authenticated key, newest first.',
    params: [
      { name: 'page', type: 'number', required: false, location: 'query', description: 'Page number.', example: 1 },
      { name: 'limit', type: 'number', required: false, location: 'query', description: 'Page size (1-100).', example: 50 },
    ],
    requiredPermissions: ['links:read'],
    rateLimitCost: 1,
    responseExample: {
      data: [
        { linkId: 'lnk_2c9f5e', shortUrl: 'https://tvf.my/r/G4n13rS3rum', clicks: 1240, conversions: 38, earnings: 412.50, createdAt: '2025-06-16T09:30:00+08:00' },
      ],
      total: 87,
    },
    errors: [
      { status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' },
    ],
    tags: ['list'],
  },
  {
    id: 'links-delete',
    method: 'DELETE',
    path: '/api/v1/links/:id',
    category: 'Links',
    title: 'Revoke affiliate link',
    description: 'Permanently revoke an affiliate link. Existing clicks will 404. Earnings already recorded are preserved.',
    params: [
      { name: 'id', type: 'string', required: true, location: 'path', description: 'Link id (e.g. lnk_2c9f5e).', example: 'lnk_2c9f5e' },
    ],
    requiredPermissions: ['links:write'],
    rateLimitCost: 1,
    responseExample: { linkId: 'lnk_2c9f5e', revoked: true, revokedAt: '2025-06-16T10:15:00+08:00' },
    errors: [
      { status: 404, code: 'LINK_NOT_FOUND', message: 'Link "lnk_invalid" was not found.' },
    ],
    tags: ['revoke'],
  },
  // ─── Earnings ───────────────────────────────────────────────────────
  {
    id: 'earnings-get',
    method: 'GET',
    path: '/api/v1/earnings',
    category: 'Earnings',
    title: 'Get earnings',
    description:
      'Unified earnings across Shopee, TikTok Shop, and Lazada. Returns daily series + totals in Malaysian Ringgit.',
    params: [
      { name: 'from', type: 'string', required: false, location: 'query', description: 'Start date (yyyy-mm-dd). Defaults to 30 days ago.', example: '2025-05-16' },
      { name: 'to', type: 'string', required: false, location: 'query', description: 'End date (yyyy-mm-dd). Defaults to today.', example: '2025-06-16' },
      { name: 'platform', type: 'string', required: false, location: 'query', description: 'Platform filter.', example: 'shopee' },
    ],
    requiredPermissions: ['earnings:read'],
    rateLimitCost: 1,
    responseExample: {
      currency: 'MYR',
      total: 8420.55,
      byPlatform: { shopee: 6120.30, tiktok: 1450.25, lazada: 850.00 },
      daily: [
        { date: '2025-06-15', amount: 285.50, orders: 18 },
        { date: '2025-06-14', amount: 312.20, orders: 22 },
      ],
    },
    errors: [
      { status: 400, code: 'INVALID_DATE_RANGE', message: '"from" must be earlier than "to".' },
    ],
    tags: ['commission', 'payout'],
  },
  // ─── Analytics ──────────────────────────────────────────────────────
  {
    id: 'analytics-get',
    method: 'GET',
    path: '/api/v1/analytics',
    category: 'Analytics',
    title: 'Get analytics',
    description:
      'Aggregated click / conversion analytics for the authenticated user, broken down by platform and date.',
    params: [
      { name: 'from', type: 'string', required: false, location: 'query', description: 'Start date.', example: '2025-05-16' },
      { name: 'to', type: 'string', required: false, location: 'query', description: 'End date.', example: '2025-06-16' },
      { name: 'groupBy', type: 'string', required: false, location: 'query', description: 'day | platform | link.', example: 'day' },
    ],
    requiredPermissions: ['analytics:read'],
    rateLimitCost: 1,
    responseExample: {
      clicks: 24580,
      conversions: 612,
      conversionRate: 0.0249,
      earnings: 8420.55,
      epc: 0.342,
      series: [{ date: '2025-06-15', clicks: 820, conversions: 21 }],
    },
    errors: [{ status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' }],
    tags: ['clicks', 'conversions', 'epc'],
  },
  {
    id: 'audience-get',
    method: 'GET',
    path: '/api/v1/audience',
    category: 'Analytics',
    title: 'Get audience analysis',
    description:
      'AI-powered audience persona analysis (HERMES). Returns demographic breakdown, peak engagement hours, and top Malaysian states.',
    params: [
      { name: 'platform', type: 'string', required: false, location: 'query', description: 'Filter by platform.', example: 'tiktok' },
    ],
    requiredPermissions: ['audience:read'],
    rateLimitCost: 2,
    responseExample: {
      primaryPersona: 'Beauty Mama',
      confidence: 0.82,
      gender: { female: 0.71, male: 0.27, other: 0.02 },
      ageBuckets: { '18-24': 0.12, '25-34': 0.41, '35-44': 0.32, '45+': 0.15 },
      topStates: [{ state: 'Selangor', share: 0.28 }, { state: 'Kuala Lumpur', share: 0.19 }, { state: 'Penang', share: 0.12 }],
      peakHours: ['20:00', '21:00', '22:00'],
      priceSensitivity: 3,
    },
    errors: [{ status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Daily quota exceeded.' }],
    tags: ['persona', 'demographics'],
  },
  // ─── Content ────────────────────────────────────────────────────────
  {
    id: 'content-generate',
    method: 'POST',
    path: '/api/v1/content/generate',
    category: 'Content',
    title: 'Generate content',
    description:
      'Generate AI marketing copy (caption + hashtags) for a product using the HERMES LLM. Manglish / BM styles supported.',
    params: [
      { name: 'productId', type: 'string', required: true, location: 'body', description: 'Product id.', example: 'shp_8821' },
      { name: 'platform', type: 'string', required: false, location: 'body', description: 'Target platform (ig | tiktok | shopee).', example: 'tiktok' },
      { name: 'style', type: 'string', required: false, location: 'body', description: 'manglish | bm | formal.', example: 'manglish' },
      { name: 'tone', type: 'string', required: false, location: 'body', description: 'hype | educational | review.', example: 'hype' },
    ],
    requiredPermissions: ['content:write'],
    rateLimitCost: 5,
    responseExample: {
      caption: 'Best gila Garnier Vitamin C Serum ni! Confirm glow up dalam 2 minggu. Kena grab sekarang sebelum sold out! 🔥',
      hashtags: ['#skincare', '#garniermy', '#vitaminc', '#skincareroutine', '#malaysia'],
      cta: 'Tap link in bio untuk best price! 💛',
      modelVersion: 'hermes-2.5',
      generatedAt: '2025-06-16T09:32:14+08:00',
    },
    errors: [
      { status: 400, code: 'PRODUCT_NOT_FOUND', message: 'Product id not found.' },
      { status: 503, code: 'AI_UNAVAILABLE', message: 'HERMES model temporarily unavailable. Retry with backoff.' },
    ],
    tags: ['hermes', 'caption', 'hashtags', 'ai'],
  },
  // ─── Trends ─────────────────────────────────────────────────────────
  {
    id: 'trends-get',
    method: 'GET',
    path: '/api/v1/trends',
    category: 'Trends',
    title: 'Get trends',
    description: 'Trending products and keywords across Malaysian marketplaces in the last 24 hours.',
    params: [
      { name: 'platform', type: 'string', required: false, location: 'query', description: 'Filter by platform.', example: 'shopee' },
      { name: 'niche', type: 'string', required: false, location: 'query', description: 'Niche filter.', example: 'beauty' },
      { name: 'limit', type: 'number', required: false, location: 'query', description: 'Max results (1-100).', example: 20 },
    ],
    requiredPermissions: ['trends:read'],
    rateLimitCost: 2,
    responseExample: {
      window: '24h',
      updatedAt: '2025-06-16T09:00:00+08:00',
      products: [
        { rank: 1, id: 'shp_8821', name: 'Garnier Vitamin C Serum', growthPct: 42, searchVolume: 18400 },
      ],
      keywords: [{ rank: 1, keyword: 'serum vitamin c', growthPct: 35 }],
    },
    errors: [{ status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Daily quota exceeded.' }],
    tags: ['trending', 'keywords'],
  },
  {
    id: 'trends-competitor',
    method: 'GET',
    path: '/api/v1/trends/competitors',
    category: 'Trends',
    title: 'Get competitor trends',
    description: 'Spy on competitor affiliates — top products, posting cadence, and engagement benchmarks.',
    params: [
      { name: 'handle', type: 'string', required: false, location: 'query', description: 'Filter to one competitor handle.', example: '@kakimakeupmy' },
    ],
    requiredPermissions: ['trends:read'],
    rateLimitCost: 3,
    responseExample: {
      competitors: [
        { handle: '@kakimakeupmy', followers: 142000, postsThisWeek: 12, estEarnings: 8200, topProduct: 'shp_8821' },
      ],
    },
    errors: [{ status: 404, code: 'COMPETITOR_NOT_FOUND', message: 'No data for handle "@invalid".' }],
    tags: ['spy', 'competitor'],
  },
  // ─── Alerts ─────────────────────────────────────────────────────────
  {
    id: 'alerts-preferences',
    method: 'POST',
    path: '/api/v1/alerts/preferences',
    category: 'Alerts',
    title: 'Update alert preferences',
    description: 'Update the Commission XTRA Alert Bot preferences (niches, channels, quiet hours).',
    params: [
      { name: 'enabledNiches', type: 'array', required: false, location: 'body', description: 'Array of niche ids to subscribe to.', example: ['beauty', 'tech'] },
      { name: 'channels', type: 'array', required: false, location: 'body', description: 'Notification channels.', example: ['push', 'email'] },
      { name: 'minCommissionThreshold', type: 'number', required: false, location: 'body', description: 'Minimum commission boost (pp) to alert on.', example: 15 },
      { name: 'botEnabled', type: 'boolean', required: false, location: 'body', description: 'Master on/off switch.', example: true },
    ],
    requiredPermissions: ['alerts:write'],
    rateLimitCost: 1,
    responseExample: {
      preferences: {
        botEnabled: true,
        enabledNiches: ['beauty', 'tech'],
        channels: ['push', 'email'],
        minCommissionThreshold: 15,
      },
      updatedAt: '2025-06-16T09:35:00+08:00',
    },
    errors: [
      { status: 400, code: 'INVALID_NICHE', message: 'Unknown niche "invalid".' },
    ],
    tags: ['xtra', 'preferences'],
  },
  {
    id: 'alerts-feed',
    method: 'GET',
    path: '/api/v1/alerts',
    category: 'Alerts',
    title: 'Get alert feed',
    description: 'Retrieve the current Commission XTRA alert feed (active boosted-commission products).',
    params: [
      { name: 'niche', type: 'string', required: false, location: 'query', description: 'Filter by niche.', example: 'beauty' },
      { name: 'status', type: 'string', required: false, location: 'query', description: 'active | expired | all.', example: 'active' },
    ],
    requiredPermissions: ['alerts:read'],
    rateLimitCost: 1,
    responseExample: {
      alerts: [
        { id: 'xtra-001', type: 'live_xtra', productName: 'Garnier Vitamin C Serum', baseCommission: 18, boostedCommission: 30, expiresAt: '2025-06-16T22:00:00+08:00' },
      ],
      total: 12,
    },
    errors: [{ status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' }],
    tags: ['xtra', 'feed'],
  },
  // ─── Auth ───────────────────────────────────────────────────────────
  {
    id: 'auth-introspect',
    method: 'GET',
    path: '/api/v1/auth/introspect',
    category: 'Auth',
    title: 'Introspect API key',
    description: 'Validate an API key and return its metadata (permissions, rate limit, remaining quota). Useful for client-side sanity checks.',
    params: [],
    requiredPermissions: [],
    rateLimitCost: 0,
    responseExample: {
      valid: true,
      keyId: 'key-001',
      name: 'Production App',
      permissions: ['products:read', 'links:write', 'earnings:read'],
      rateLimit: 10000,
      usedToday: 4823,
      remainingToday: 5177,
      resetsAt: '2025-06-17T00:00:00+08:00',
    },
    errors: [
      { status: 401, code: 'INVALID_KEY', message: 'API key not recognised or revoked.' },
    ],
    tags: ['key', 'validate'],
  },
  {
    id: 'auth-revoke',
    method: 'DELETE',
    path: '/api/v1/auth/keys/:id',
    category: 'Auth',
    title: 'Revoke API key',
    description: 'Permanently revoke an API key. All subsequent requests with that key will return 401.',
    params: [
      { name: 'id', type: 'string', required: true, location: 'path', description: 'Key id.', example: 'key-001' },
    ],
    requiredPermissions: [],
    rateLimitCost: 0,
    responseExample: { keyId: 'key-001', revoked: true, revokedAt: '2025-06-16T10:00:00+08:00' },
    errors: [
      { status: 404, code: 'KEY_NOT_FOUND', message: 'Key "key-invalid" not found.' },
    ],
    tags: ['revoke', 'key'],
  },
]

/** Look up an endpoint by id. */
export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find((e) => e.id === id)
}

/**
 * Match a playground request (method + raw path) to an endpoint doc.
 * Path params like `/api/v1/products/:id` are matched by splitting on `/`
 * and comparing non-param segments literally.
 */
export function matchEndpoint(
  method: HttpMethod,
  rawPath: string,
): ApiEndpoint | undefined {
  const normalised = rawPath.replace(/^\/+/, '/').split('?')[0]
  const inputSegments = normalised.split('/').filter(Boolean)

  for (const ep of API_ENDPOINTS) {
    if (ep.method !== method) continue
    const epSegments = ep.path.split('/').filter(Boolean)
    if (epSegments.length !== inputSegments.length) continue

    let match = true
    for (let i = 0; i < epSegments.length; i++) {
      const epSeg = epSegments[i]
      const inSeg = inputSegments[i]
      if (epSeg.startsWith(':')) continue // path param — accept anything
      if (epSeg !== inSeg) {
        match = false
        break
      }
    }
    if (match) return ep
  }
  return undefined
}

/** Return endpoints filtered by category (preserving catalog order). */
export function endpointsByCategory(cat: EndpointCategory): ApiEndpoint[] {
  return API_ENDPOINTS.filter((e) => e.category === cat)
}
