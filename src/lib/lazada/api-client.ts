/**
 * Lazada Open Platform API Client
 *
 * Handles:
 *  - HMAC-MD5 request signing (per Lazada Open Platform spec)
 *  - REST API calls
 *  - Affiliate program operations (product search, link generation, commissions)
 *
 * Official API Docs: https://open.lazada.com/
 * Auth flow:
 *   1. Register at https://open.lazada.com/ as a developer
 *   2. Create an App to get App Key + App Secret
 *   3. Authorize the App at https://auth.lazada.com.my/oauth/authorize?response_type=code&force_auth=true&client_id=APP_KEY&redirect_uri=REDIRECT_URL
 *   4. Exchange the code for an access_token at /rest/auth/token/create
 *
 * Affiliate program (separate from Seller API):
 *   - Sign up at https://lazada-affiliate.com/
 *   - Get Affiliate ID from the portal
 *   - Use the Affiliate Product API to fetch products with commission info
 *   - Use the Conversion API to fetch commission orders
 */

import crypto from 'crypto'
import type {
  LazadaProduct,
  LazadaAffiliateLink,
  LazadaCommissionOrder,
  LazadaCommissionSummary,
  LazadaCategory,
  LazadaAffiliateProfile,
} from './mock-data'

// ─── Region → API Base URL ─────────────────────────────────────

const API_BASES: Record<string, string> = {
  my: 'https://api.lazada.com.my/rest',
  sg: 'https://api.lazada.sg/rest',
  id: 'https://api.lazada.co.id/rest',
  th: 'https://api.lazada.co.th/rest',
  ph: 'https://api.lazada.com.ph/rest',
  vn: 'https://api.lazada.vn/rest',
}

const AUTH_URLS: Record<string, string> = {
  my: 'https://auth.lazada.com.my/oauth',
  sg: 'https://auth.lazada.sg/oauth',
  id: 'https://auth.lazada.co.id/oauth',
  th: 'https://auth.lazada.co.th/oauth',
  ph: 'https://auth.lazada.com.ph/oauth',
  vn: 'https://auth.lazada.vn/oauth',
}

// ─── Client Config ─────────────────────────────────────────────

export interface LazadaClientConfig {
  appKey: string
  appSecret: string
  region?: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'
  accessToken?: string
}

// ─── Lazada API Client ─────────────────────────────────────────

export class LazadaApiClient {
  private appKey: string
  private appSecret: string
  private accessToken?: string
  private baseUrl: string
  private authUrl: string
  private region: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'

  constructor(config: LazadaClientConfig) {
    this.appKey = config.appKey
    this.appSecret = config.appSecret
    this.accessToken = config.accessToken
    this.region = config.region || 'my'
    this.baseUrl = API_BASES[this.region] || API_BASES.my
    this.authUrl = AUTH_URLS[this.region] || AUTH_URLS.my
  }

  get isConnected(): boolean {
    return !!this.accessToken
  }

  get currentRegion(): string {
    return this.region
  }

  // ─── Signing ──────────────────────────────────────────────

  /**
   * Generate the Lazada HMAC-MD5 signature.
   *
   * Algorithm (per Lazada spec):
   *   sign = uppercase(md5("/" + path + appSecret + sortedQueryString + appSecret))
   *
   * Note: Lazada uses MD5 (legacy), not HMAC-SHA256. We follow the official spec
   * to ensure compatibility with the real Lazada Open Platform.
   */
  private sign(path: string, params: Record<string, string>): string {
    // Sort params alphabetically by key
    const sortedKeys = Object.keys(params).sort()
    const sortedQuery = sortedKeys
      .map((k) => `${k}=${params[k]}`)
      .join('&')

    const payload = `/${path}${this.appSecret}${sortedQuery}${this.appSecret}`
    return crypto.createHash('md5').update(payload).digest('hex').toUpperCase()
  }

  /**
   * Build the full URL with signed query string for a Lazada API call.
   */
  private buildSignedUrl(
    path: string,
    action: string,
    extraParams: Record<string, string> = {}
  ): string {
    const common: Record<string, string> = {
      app_key: this.appKey,
      sign_method: 'md5',
      timestamp: String(Math.floor(Date.now() / 1000) * 1000),
      action,
    }

    if (this.accessToken) {
      common.access_token = this.accessToken
    }

    const allParams = { ...common, ...extraParams }
    const signature = this.sign(path, allParams)
    const query = new URLSearchParams({
      ...allParams,
      sign: signature,
    }).toString()

    return `${this.baseUrl}/${path}?${query}`
  }

  /**
   * Execute a signed REST API call.
   */
  private async execute<T = unknown>(
    path: string,
    action: string,
    method: 'GET' | 'POST' = 'GET',
    extraParams: Record<string, string> = {}
  ): Promise<T> {
    const url = this.buildSignedUrl(path, action, extraParams)

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TheViralFindsMY-Lazada/1.0',
      },
      // Next.js 16: opt out of caching for live API calls
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `Lazada API ${action} failed with HTTP ${res.status}: ${res.statusText}`
      )
    }

    const json = (await res.json()) as { code?: string; message?: string; data?: T }

    // Lazada API uses "0" as success code
    if (json.code && json.code !== '0') {
      throw new Error(
        `Lazada API ${action} error: ${json.code} - ${json.message || 'Unknown error'}`
      )
    }

    return json.data as T
  }

  // ─── OAuth ────────────────────────────────────────────────

  /** Build the OAuth authorize URL for the user to grant app access */
  buildAuthorizeUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      force_auth: 'true',
      client_id: this.appKey,
      redirect_uri: redirectUri,
    })
    if (state) params.set('state', state)
    return `${this.authUrl}/authorize?${params.toString()}`
  }

  /** Exchange the OAuth code for an access token */
  async getAccessToken(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    countryUserInfo: Array<{ country: string; sellerId: string; shortCode: string }>
  }> {
    const url = `${this.baseUrl}/auth/token/create`
    const body = {
      code,
      app_key: this.appKey,
      app_secret: this.appSecret,
      redirect_uri: redirectUri,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `Lazada token exchange failed: HTTP ${res.status} ${res.statusText}`
      )
    }

    const json = await res.json()
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: json.expires_in ?? 2592000, // 30 days
      countryUserInfo: json.country_user_info ?? [],
    }
  }

  /** Refresh the access token using a refresh token */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
  }> {
    const url = `${this.baseUrl}/auth/token/refresh`
    const body = {
      refresh_token: refreshToken,
      app_key: this.appKey,
      app_secret: this.appSecret,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `Lazada token refresh failed: HTTP ${res.status} ${res.statusText}`
      )
    }

    const json = await res.json()
    return {
      accessToken: json.access_token,
      expiresIn: json.expires_in ?? 2592000,
    }
  }

  // ─── Product APIs ─────────────────────────────────────────

  /**
   * Search products with affiliate commission info.
   * Lazada Open Platform action: "GetProductItems" or affiliate-specific "afn.products.search"
   *
   * Note: This calls the real Lazada API. For development use LazadaAffiliateService
   * which automatically falls back to mock data when no credentials are set.
   */
  async searchProducts(
    query: string,
    options?: {
      page?: number
      limit?: number
      sortField?: 'commission' | 'price' | 'sales' | 'rating'
      sortOrder?: 'asc' | 'desc'
      categoryId?: number
      minPrice?: number
      maxPrice?: number
    }
  ): Promise<{ products: LazadaProduct[]; total: number }> {
    const params: Record<string, string> = {
      keyword: query,
      page: String(options?.page || 1),
      page_size: String(options?.limit || 20),
      sort_field: options?.sortField || 'sales',
      sort_order: options?.sortOrder || 'desc',
    }

    if (options?.categoryId) params.category_id = String(options.categoryId)
    if (options?.minPrice !== undefined) params.min_price = String(options.minPrice)
    if (options?.maxPrice !== undefined) params.max_price = String(options.maxPrice)

    const data = await this.execute<{
      products: LazadaProduct[]
      total_count: number
    }>('afn/products', 'afn.products.search', 'GET', params)

    // Normalise: ensure each product has a platform tag
    const products = (data.products || []).map((p) => ({
      ...p,
      platform: 'lazada' as const,
    }))

    return { products, total: data.total_count || products.length }
  }

  /** Get product detail by item ID */
  async getProductDetail(itemId: number): Promise<LazadaProduct | null> {
    const params: Record<string, string> = { item_id: String(itemId) }
    const data = await this.execute<LazadaProduct | null>(
      'afn/products',
      'afn.products.get',
      'GET',
      params
    )
    if (!data) return null
    return { ...data, platform: 'lazada' }
  }

  // ─── Affiliate Link APIs ──────────────────────────────────

  /**
   * Generate an affiliate tracking link for a product.
   * Lazada action: "afn.link.generate"
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
  }): Promise<LazadaAffiliateLink> {
    const reqParams: Record<string, string> = {}
    if (params.itemId) reqParams.item_id = String(params.itemId)
    if (params.productUrl) reqParams.product_url = params.productUrl
    if (params.subId) reqParams.sub_id = params.subId

    const data = await this.execute<LazadaAffiliateLink>(
      'afn/link',
      'afn.link.generate',
      'POST',
      reqParams
    )
    return data
  }

  // ─── Commission APIs ──────────────────────────────────────

  /**
   * Get commission orders (conversions).
   * Lazada action: "afn.orders.get"
   */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: LazadaCommissionOrder[]; total: number }> {
    const reqParams: Record<string, string> = {
      page: String(params?.page || 1),
      page_size: String(params?.limit || 50),
    }
    if (params?.startTime) reqParams.start_time = String(params.startTime)
    if (params?.endTime) reqParams.end_time = String(params.endTime)
    if (params?.commissionStatus) reqParams.status = params.commissionStatus

    const data = await this.execute<{
      orders: LazadaCommissionOrder[]
      total_count: number
    }>('afn/orders', 'afn.orders.get', 'GET', reqParams)

    const orders = (data.orders || []).map((o) => ({
      ...o,
      platform: 'lazada' as const,
    }))

    return { orders, total: data.total_count || orders.length }
  }

  /**
   * Get commission summary (totals by status).
   * Lazada action: "afn.commissions.summary"
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<LazadaCommissionSummary> {
    const reqParams: Record<string, string> = {}
    if (params?.startTime) reqParams.start_time = String(params.startTime)
    if (params?.endTime) reqParams.end_time = String(params.endTime)

    return this.execute<LazadaCommissionSummary>(
      'afn/commissions',
      'afn.commissions.summary',
      'GET',
      reqParams
    )
  }

  // ─── Profile & Categories ─────────────────────────────────

  /** Get affiliate profile */
  async getAffiliateProfile(): Promise<LazadaAffiliateProfile | null> {
    return this.execute<LazadaAffiliateProfile>(
      'afn/profile',
      'afn.profile.get',
      'GET'
    )
  }

  /** Get categories */
  async getCategories(): Promise<LazadaCategory[]> {
    const data = await this.execute<{ categories: LazadaCategory[] }>(
      'afn/categories',
      'afn.categories.get',
      'GET'
    )
    return data.categories || []
  }

  // ─── Connection Test ──────────────────────────────────────

  /** Test the API connection by calling the profile endpoint */
  async testConnection(): Promise<{
    success: boolean
    message: string
    region: string
  }> {
    try {
      const profile = await this.getAffiliateProfile()
      if (profile) {
        return {
          success: true,
          message: `Connected as ${profile.name} (${profile.affiliateId})`,
          region: this.region.toUpperCase(),
        }
      }
      return {
        success: true,
        message: 'Lazada API connection OK',
        region: this.region.toUpperCase(),
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? `Connection failed: ${error.message}`
            : 'Connection failed',
        region: this.region.toUpperCase(),
      }
    }
  }
}
