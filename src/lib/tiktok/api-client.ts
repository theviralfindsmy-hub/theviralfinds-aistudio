/**
 * TikTok Shop Affiliate API Client
 *
 * Talks to the official TikTok Shop Affiliate API (202309 endpoint revision):
 *   - Auth: OAuth 2.0 with `app_key` + `app_secret` + `access_token`
 *   - Sign : HMAC-SHA256 over sorted query string
 *   - Base : https://open-api.tiktokglobalshop.com
 *   - Region: Malaysia (`MY`) by default
 *
 * Docs:
 *   - https://partner.tiktokshop.com/docv2/page/ASN4XmpZsQr5Q4
 *   - https://partner.tiktokshop.com/docv2/page/L6505orvOVPXrE
 *
 * All methods throw on network / HTTP errors. The higher-level
 * `affiliate-service.ts` is responsible for catching those and
 * falling back to the mock service.
 *
 * NOTE: This client is *real-API aware* but does NOT need real credentials
 *       to compile — it simply never makes a live request until a valid
 *       `appKey`/`appSecret`/`accessToken` trio is supplied at construction
 *       time. This is what enables the seamless mock fallback in dev.
 */

import crypto from 'crypto'
import type {
  TikTokAffiliateLink,
  TikTokAffiliateProfile,
  TikTokCategory,
  TikTokCommissionOrder,
  TikTokCommissionSummary,
  TikTokProduct,
  TikTokProductCategory,
} from './mock-data'

// ─── Public Config Types ────────────────────────────────────────

export interface TikTokClientConfig {
  appKey: string
  appSecret: string
  accessToken: string
  shopId?: string
  region?: 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'VN'
  /** Optional fetch override (used in tests). */
  fetchImpl?: typeof fetch
}

export type TikTokConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'no_access'
  | 'error'

// ─── Internal Helpers ───────────────────────────────────────────

const API_BASE_BY_REGION: Record<string, string> = {
  MY: 'https://open-api.tiktokglobalshop.com',
  SG: 'https://open-api.tiktokglobalshop.com',
  ID: 'https://open-api.tiktokglobalshop.com',
  TH: 'https://open-api.tiktokglobalshop.com',
  PH: 'https://open-api.tiktokglobalshop.com',
  VN: 'https://open-api.tiktokglobalshop.com',
}

/**
 * Build the canonical TikTok Shop signature:
 *   path + sorted_query_string  →  HMAC-SHA256(secret, payload)  →  hex
 *
 * `sign_method` is part of the query string for v2 endpoints.
 */
function signRequest(
  path: string,
  params: Record<string, string | number | undefined>,
  appSecret: string
): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k] as string | number}`)
    .join('&')

  const payload = `${path}${sorted}`
  return crypto.createHmac('sha256', appSecret).update(payload).digest('hex')
}

/**
 * Convert a fetch Response into a typed JSON object, throwing a friendly
 * Error if the response is not OK.
 */
async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`TikTok API returned non-JSON response: ${text.slice(0, 200)}`)
  }

  const data = json as { code?: number; message?: string; data?: unknown }
  if (typeof data.code === 'number' && data.code !== 0 && data.code !== 200) {
    throw new Error(`TikTok API error ${data.code}: ${data.message || 'Unknown error'}`)
  }
  return (data.data ?? data) as T
}

// ─── Client ─────────────────────────────────────────────────────

export class TikTokApiClient {
  private config: Omit<Required<TikTokClientConfig>, 'shopId' | 'fetchImpl'> &
    Pick<TikTokClientConfig, 'shopId'> & { fetchImpl?: typeof fetch }
  private baseUrl: string
  private fetchImpl: typeof fetch

  constructor(config: TikTokClientConfig) {
    this.fetchImpl = config.fetchImpl || fetch
    this.config = {
      appKey: config.appKey,
      appSecret: config.appSecret,
      accessToken: config.accessToken,
      region: config.region || 'MY',
      shopId: config.shopId,
      fetchImpl: config.fetchImpl,
    }
    this.baseUrl = API_BASE_BY_REGION[this.config.region] || API_BASE_BY_REGION.MY
  }

  /** Construct a signed URL for a given REST path + params. */
  private buildSignedUrl(
    path: string,
    params: Record<string, string | number | undefined>
  ): string {
    const fullParams: Record<string, string | number | undefined> = {
      app_key: this.config.appKey,
      timestamp: Math.floor(Date.now() / 1000),
      ...params,
      shop_id: this.config.shopId,
      access_token: this.config.accessToken,
    }

    const sign = signRequest(path, fullParams, this.config.appSecret)
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(fullParams)) {
      if (v !== undefined && v !== '') search.set(k, String(v))
    }
    search.set('sign', sign)
    return `${this.baseUrl}${path}?${search.toString()}`
  }

  /** Perform a GET request and return typed JSON. */
  private async get<T>(
    path: string,
    params: Record<string, string | number | undefined> = {}
  ): Promise<T> {
    const url = this.buildSignedUrl(path, params)
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`TikTok API HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return parseJsonSafe<T>(res)
  }

  /** Perform a POST request with a JSON body. */
  private async post<T>(
    path: string,
    body: Record<string, unknown>,
    params: Record<string, string | number | undefined> = {}
  ): Promise<T> {
    const url = this.buildSignedUrl(path, params)
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`TikTok API HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return parseJsonSafe<T>(res)
  }

  // ─── Product APIs ───────────────────────────────────────────

  /**
   * Search products via TikTok Shop Affiliate API.
   * Maps the API's `affiliate_products` endpoint to our internal shape.
   */
  async searchProducts(
    query: string,
    options?: {
      page?: number
      limit?: number
      sortField?: 'commission' | 'price' | 'sales' | 'rating' | 'trend'
      sortOrder?: 'asc' | 'desc'
      category?: TikTokProductCategory
      minPrice?: number
      maxPrice?: number
    }
  ): Promise<{ products: TikTokProduct[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const sortMap: Record<string, string> = {
      commission: 'COMMISSION_RATE',
      price: 'PRICE',
      sales: 'SALES',
      rating: 'RATING',
      trend: 'TREND',
    }
    const sortField = sortMap[options?.sortField || 'trend']

    const response = await this.get<{
      products?: unknown[]
      total?: number
    }>('/affiliate/202309/products/search', {
      keyword: query,
      page,
      page_size: limit,
      sort_field: sortField,
      sort_order: (options?.sortOrder || 'desc').toUpperCase(),
      category: options?.category,
      min_price: options?.minPrice,
      max_price: options?.maxPrice,
    })

    const products = (response.products || []).map(
      (raw) => this.normalizeProduct(raw as Record<string, unknown>)
    )

    return {
      products,
      total: response.total ?? products.length,
    }
  }

  /** Get a single product's detail. */
  async getProductDetail(productId: string): Promise<TikTokProduct | null> {
    try {
      const response = await this.get<{ product?: unknown }>(
        '/affiliate/202309/products/' + encodeURIComponent(productId),
        {}
      )
      if (!response.product) return null
      return this.normalizeProduct(response.product as Record<string, unknown>)
    } catch {
      return null
    }
  }

  // ─── Affiliate Link APIs ────────────────────────────────────

  /**
   * Generate an affiliate short link for a TikTok Shop product.
   */
  async generateAffiliateLink(params: {
    productId?: string
    productUrl?: string
    subId?: string
  }): Promise<TikTokAffiliateLink> {
    const response = await this.post<{
      short_url?: string
      long_url?: string
      deeplink?: string
      generate_url?: string
      tracking_id?: string
      expires_at?: string
    }>('/affiliate/202309/links', {
      product_id: params.productId,
      product_url: params.productUrl,
      sub_id: params.subId,
    })

    return {
      shortUrl: response.short_url || '',
      longUrl: response.long_url || '',
      deepLink: response.deeplink || '',
      generateUrl: response.generate_url || '',
      trackingId: response.tracking_id || '',
      expiresAt: response.expires_at,
    }
  }

  // ─── Commission & Orders APIs ───────────────────────────────

  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: TikTokCommissionOrder['commissionStatus']
  }): Promise<{ orders: TikTokCommissionOrder[]; total: number }> {
    const response = await this.get<{
      orders?: unknown[]
      total?: number
    }>('/affiliate/202309/orders', {
      page: params?.page || 1,
      page_size: params?.limit || 50,
      start_time: params?.startTime,
      end_time: params?.endTime,
      commission_status: params?.commissionStatus?.toUpperCase(),
    })

    const orders = (response.orders || []).map((raw) =>
      this.normalizeOrder(raw as Record<string, unknown>)
    )
    return { orders, total: response.total ?? orders.length }
  }

  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<TikTokCommissionSummary> {
    const response = await this.get<Record<string, unknown>>(
      '/affiliate/202309/commissions/summary',
      {
        start_time: params?.startTime,
        end_time: params?.endTime,
      }
    )
    return {
      totalCommission: Number(response.total_commission ?? 0),
      pendingCommission: Number(response.pending_commission ?? 0),
      confirmedCommission: Number(response.confirmed_commission ?? 0),
      paidCommission: Number(response.paid_commission ?? 0),
      rejectedCommission: Number(response.rejected_commission ?? 0),
      totalOrders: Number(response.total_orders ?? 0),
      conversionRate: Number(response.conversion_rate ?? 0),
      clickCount: Number(response.click_count ?? 0),
    }
  }

  // ─── Profile / Categories / Test ────────────────────────────

  async getAffiliateProfile(): Promise<TikTokAffiliateProfile> {
    const response = await this.get<Record<string, unknown>>(
      '/affiliate/202309/profile',
      {}
    )
    return {
      affiliateId: String(response.affiliate_id ?? ''),
      name: String(response.name ?? ''),
      email: String(response.email ?? ''),
      status: String(response.status ?? 'active'),
      commissionRate: Number(response.commission_rate ?? 0),
      totalEarnings: Number(response.total_earnings ?? 0),
      joinDate: String(response.join_date ?? ''),
      region: String(response.region ?? this.config.region),
      followerCount: Number(response.follower_count ?? 0),
      shopConnected: Boolean(response.shop_connected ?? true),
    }
  }

  async getTopProducts(limit?: number): Promise<TikTokProduct[]> {
    const response = await this.get<{ products?: unknown[] }>(
      '/affiliate/202309/products/top',
      { page_size: limit || 10 }
    )
    return (response.products || []).map((raw) =>
      this.normalizeProduct(raw as Record<string, unknown>)
    )
  }

  async getCategories(): Promise<TikTokCategory[]> {
    const response = await this.get<{
      categories?: Array<Record<string, unknown>>
    }>('/affiliate/202309/categories', {})
    return (response.categories || []).map((c) => ({
      categoryId: String(c.category_id ?? ''),
      name: String(c.name ?? 'Other') as TikTokProductCategory,
      productCount: Number(c.product_count ?? 0),
      avgCommissionRate: Number(c.avg_commission_rate ?? 0),
    }))
  }

  /**
   * Lightweight connectivity test — calls the /affiliate/202309/ping endpoint.
   * Returns `{ success: false, ... }` on any error so the caller can fall back.
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    region: string
  }> {
    try {
      await this.get('/affiliate/202309/ping', {})
      return {
        success: true,
        message: 'TikTok Shop API connection successful',
        region: this.config.region,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection failed',
        region: this.config.region,
      }
    }
  }

  // ─── Normalizers (snake_case → camelCase, defensive parsing) ───

  private normalizeProduct(raw: Record<string, unknown>): TikTokProduct {
    const price = Number(raw.price ?? raw.item_price ?? 0)
    const commissionRate = Number(raw.commission_rate ?? 0)
    const productId = String(raw.product_id ?? raw.id ?? '')
    return {
      id: `tt-${productId}`,
      productId,
      title: String(raw.title ?? raw.name ?? 'Untitled product'),
      description: String(raw.description ?? ''),
      price,
      originalPrice:
        raw.original_price !== undefined
          ? Number(raw.original_price)
          : undefined,
      currency: 'MYR',
      commissionRate,
      commissionAmount: Number(raw.commission_amount ?? (price * commissionRate) / 100),
      imageUrl: String(raw.image_url ?? raw.main_image ?? ''),
      videoUrl: raw.video_url ? String(raw.video_url) : undefined,
      shopName: String(raw.shop_name ?? raw.seller_name ?? ''),
      shopId: String(raw.shop_id ?? raw.seller_id ?? ''),
      category: String(raw.category ?? raw.category_name ?? 'Home') as TikTokProductCategory,
      sales: Number(raw.sales ?? raw.sold_count ?? 0),
      rating: Number(raw.rating ?? 0),
      reviewCount: Number(raw.review_count ?? 0),
      stock: Number(raw.stock ?? 0),
      productLink: String(raw.product_link ?? raw.url ?? ''),
      deepLink: raw.deeplink ? String(raw.deeplink) : undefined,
      platform: 'tiktok',
      hashtags: Array.isArray(raw.hashtags)
        ? (raw.hashtags as string[]).map(String)
        : [],
      trendScore: Number(raw.trend_score ?? 50),
    }
  }

  private normalizeOrder(raw: Record<string, unknown>): TikTokCommissionOrder {
    const unitPrice = Number(raw.unit_price ?? raw.item_price ?? 0)
    const quantity = Number(raw.quantity ?? 1)
    const commissionRate = Number(raw.commission_rate ?? 0)
    return {
      orderId: String(raw.order_id ?? raw.id ?? ''),
      orderCreateTime: Number(raw.order_create_time ?? raw.create_time ?? 0),
      productId: String(raw.product_id ?? ''),
      productTitle: String(raw.product_title ?? raw.item_name ?? ''),
      productImage: String(raw.product_image ?? ''),
      quantity,
      unitPrice,
      orderAmount: Number(raw.order_amount ?? unitPrice * quantity),
      commissionRate,
      commissionAmount: Number(
        raw.commission_amount ?? (unitPrice * quantity * commissionRate) / 100
      ),
      commissionStatus: String(
        raw.commission_status ?? 'pending'
      ).toLowerCase() as TikTokCommissionOrder['commissionStatus'],
      orderStatus: String(raw.order_status ?? 'PENDING'),
      settleTime:
        raw.settle_time !== undefined ? Number(raw.settle_time) : undefined,
      clickTime: Number(raw.click_time ?? 0),
      customerRegion: String(raw.customer_region ?? 'MY'),
      subId: raw.sub_id ? String(raw.sub_id) : undefined,
    }
  }
}

// ─── OAuth Helpers (stub) ───────────────────────────────────────

/**
 * Build the TikTok Shop OAuth authorization URL to redirect the user to.
 *
 * In production, the user signs in to TikTok Shop, authorizes our app, and
 * TikTok redirects back to our `redirectUri` with a `code` query param.
 * We then exchange that code for an `access_token` via `exchangeCodeForToken`.
 */
export function buildTikTokOAuthUrl(params: {
  appKey: string
  redirectUri: string
  state?: string
}): string {
  const url = new URL('https://services.tiktokshop.com/auth/authorize')
  url.searchParams.set('app_key', params.appKey)
  url.searchParams.set('redirect_uri', params.redirectUri)
  if (params.state) url.searchParams.set('state', params.state)
  return url.toString()
}

/**
 * Exchange the OAuth `code` returned by TikTok for an access token.
 * Returns `{ accessToken, refreshToken, expiresAt }` on success.
 */
export async function exchangeTikTokCodeForToken(params: {
  appKey: string
  appSecret: string
  code: string
  redirectUri: string
  fetchImpl?: typeof fetch
}): Promise<{
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}> {
  const fetchImpl = params.fetchImpl || fetch
  const res = await fetchImpl('https://auth.tiktok-shops.com/api/v2/token/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: params.appKey,
      app_secret: params.appSecret,
      auth_code: params.code,
      redirect_uri: params.redirectUri,
    }),
  })
  if (!res.ok) {
    throw new Error(`TikTok OAuth token exchange failed: HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    data?: {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    message?: string
    code?: number
  }
  if (!data.data?.access_token) {
    throw new Error(`TikTok OAuth error: ${data.message ?? 'unknown'}`)
  }
  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresAt:
      data.data.expires_in !== undefined
        ? Date.now() + data.data.expires_in * 1000
        : undefined,
  }
}
