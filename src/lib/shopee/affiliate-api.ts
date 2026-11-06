/**
 * Shopee Affiliate API - Main Service
 * 
 * Auto-switches between real GraphQL API and mock data:
 * - When Shopee API credentials are configured and working → uses real GraphQL API
 * - When no credentials or API access not approved → uses mock data
 * 
 * Official API Docs: https://open.shopee.com/
 * Affiliate Portal: https://affiliate.shopee.com.my/
 * 
 * Setup:
 * 1. Register at https://affiliate.shopee.com.my/
 * 2. Go to Account > API > Open API
 * 3. Generate your API Key (app_id + secret)
 * 4. Enter credentials in Settings > Shopee Integration
 */

import crypto from 'crypto'
import { ShopeeGraphQLClient } from './graphql-client'
import { ShopeeMockService } from './mock-data'

// ─── Connection Status ──────────────────────────────────────────

export type ShopeeConnectionStatus = 'connected' | 'disconnected' | 'no_access' | 'error'

export interface ShopeeServiceConfig {
  appId?: string
  secret?: string
  region?: string
  accessToken?: string
  forceMock?: boolean
}

// ─── Types ──────────────────────────────────────────────────────

export interface ShopeeAffiliateConfig {
  appId: string
  secret: string
  region: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn' | 'br' | 'mx' | 'co' | 'cl'
  accessToken?: string
}

export interface ShopeeProduct {
  itemId: number
  name: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionMin: number
  commissionMax: number
  sales: number
  ratingStar: number
  shopName: string
  shopId: number
  category: string
  categoryId: number
  productLink: string
  deepLink?: string
}

export interface ShopeeAffiliateLink {
  shortUrl: string
  longUrl: string
  deepLink: string
  generateUrl: string
}

export interface ShopeeCommissionOrder {
  orderSn: string
  orderCreateTime: number
  itemId: number
  itemName: string
  itemPrice: number
  commissionRate: number
  commission: number
  commissionStatus: 'pending' | 'confirmed' | 'rejected' | 'paid'
  orderStatus: string
  settleTime?: number
  clickTime: number
  subId?: string
}

export interface ShopeeCommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  rejectedCommission: number
  paidCommission: number
  totalOrders: number
  conversionRate: number
}

export interface ShopeeClickStats {
  date: string
  clicks: number
  uniqueClicks: number
  conversions: number
  earnings: number
}

export interface ShopeeAffiliateProfile {
  affiliateId: string
  name: string
  email: string
  status: string
  commissionRate: number
  totalEarnings: number
  joinDate: string
  region: string
}

export interface ShopeeCategory {
  categoryId: number
  name: string
  productCount: number
  avgCommissionRate: number
}

// ─── API Base URLs (legacy REST, kept for backward compat) ──────

const API_BASES: Record<string, string> = {
  my: 'https://open.shopee.com.my/api/v2',
  sg: 'https://open.shopee.sg/api/v2',
  id: 'https://open.shopee.co.id/api/v2',
  th: 'https://open.shopee.co.th/api/v2',
  ph: 'https://open.shopee.ph/api/v2',
  vn: 'https://open.shopee.vn/api/v2',
}

// ─── Shopee Affiliate Service ───────────────────────────────────

export class ShopeeAffiliateService {
  private client: ShopeeGraphQLClient | null = null
  private mock: ShopeeMockService
  private _status: ShopeeConnectionStatus = 'disconnected'
  private config: ShopeeServiceConfig

  // Legacy REST fields (kept for backward compat with webhook verification)
  private legacyConfig: ShopeeAffiliateConfig | null = null
  private legacyBaseUrl: string = API_BASES.my

  constructor(config: ShopeeServiceConfig = {}) {
    this.config = config
    this.mock = new ShopeeMockService()

    if (config.appId && config.secret && !config.forceMock) {
      try {
        this.client = new ShopeeGraphQLClient({
          appId: config.appId,
          secret: config.secret,
          region: (config.region as 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn') || 'my',
          accessToken: config.accessToken,
        })
        this._status = 'connected'

        // Also set up legacy config for webhook verification
        const region = (config.region as ShopeeAffiliateConfig['region']) || 'my'
        this.legacyConfig = {
          appId: config.appId,
          secret: config.secret,
          region,
          accessToken: config.accessToken,
        }
        this.legacyBaseUrl = API_BASES[region] || API_BASES.my
      } catch {
        this._status = 'error'
      }
    } else {
      this._status = config.forceMock ? 'no_access' : 'disconnected'
    }
  }

  get status(): ShopeeConnectionStatus {
    return this._status
  }

  get isUsingMock(): boolean {
    return !this.client || this._status !== 'connected'
  }

  /**
   * Get the data source indicator
   */
  private getSource(): 'graphql_api' | 'mock' {
    return this.isUsingMock ? 'mock' : 'graphql_api'
  }

  // ─── Product APIs ───────────────────────────────────────────

  /**
   * Search products on Shopee with commission info
   * Tries GraphQL API first, falls back to mock data
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
  ): Promise<{ products: ShopeeProduct[]; total: number; source: 'graphql_api' | 'mock' }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.searchProducts(query, options)
        return {
          products: result.products.map((p) => ({
            ...p,
            commissionMin: p.commissionMin ?? 0,
            commissionMax: p.commissionMax ?? 0,
          })),
          total: result.total,
          source: 'graphql_api',
        }
      } catch (error) {
        console.error('Shopee GraphQL search error, falling back to mock:', error)
        // Fall through to mock
      }
    }

    const result = await this.mock.searchProducts(query, options)
    return { ...result, source: 'mock' }
  }

  /**
   * Get product details by item ID
   * Tries GraphQL API first, falls back to mock data
   */
  async getProductDetail(itemId: number): Promise<(ShopeeProduct & { source: 'graphql_api' | 'mock' }) | null> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getProductDetail(itemId)
        if (result) {
          return {
            ...result,
            commissionMin: result.commissionMin ?? 0,
            commissionMax: result.commissionMax ?? 0,
            source: 'graphql_api',
          }
        }
      } catch (error) {
        console.error('Shopee GraphQL product detail error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getProductDetail(itemId)
    if (!result) return null
    return { ...result, source: 'mock' }
  }

  // ─── Affiliate Link APIs ────────────────────────────────────

  /**
   * Generate affiliate tracking link
   * Tries GraphQL API first, falls back to mock data
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
    deepLinkType?: 'default' | 'app_only'
  }): Promise<ShopeeAffiliateLink & { source: 'graphql_api' | 'mock' }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.generateAffiliateLink(params)
        return { ...result, source: 'graphql_api' }
      } catch (error) {
        console.error('Shopee GraphQL generate link error, falling back to mock:', error)
      }
    }

    const result = await this.mock.generateAffiliateLink(params)
    return { ...result, source: 'mock' }
  }

  // ─── Commission & Earnings APIs ─────────────────────────────

  /**
   * Get commission orders (conversions)
   * Tries GraphQL API first, falls back to mock data
   */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: ShopeeCommissionOrder[]; total: number; source: 'graphql_api' | 'mock' }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionOrders(params)
        return { ...result, source: 'graphql_api' }
      } catch (error) {
        console.error('Shopee GraphQL commission orders error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCommissionOrders(params)
    return { ...result, source: 'mock' }
  }

  /**
   * Get commission summary
   * Tries GraphQL API first, falls back to mock data
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<ShopeeCommissionSummary & { source: 'graphql_api' | 'mock' }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionSummary(params)
        return { ...result, source: 'graphql_api' }
      } catch (error) {
        console.error('Shopee GraphQL commission summary error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCommissionSummary(params)
    return { ...result, source: 'mock' }
  }

  // ─── Click & Stats APIs ─────────────────────────────────────

  /**
   * Get click statistics
   * Tries GraphQL API first, falls back to mock data
   */
  async getClickStats(params: {
    startTime: number
    endTime: number
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }): Promise<(ShopeeClickStats & { source?: 'graphql_api' | 'mock' })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getClickStats(params)
        return result.map((s) => ({ ...s, source: 'graphql_api' as const }))
      } catch (error) {
        console.error('Shopee GraphQL click stats error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getClickStats(params)
    return result.map((s) => ({ ...s, source: 'mock' as const }))
  }

  // ─── Profile & Category APIs ────────────────────────────────

  /**
   * Get affiliate profile
   * Tries GraphQL API first, falls back to mock data
   */
  async getAffiliateProfile(): Promise<(ShopeeAffiliateProfile & { source: 'graphql_api' | 'mock' }) | null> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getAffiliateProfile()
        if (result) return { ...result, source: 'graphql_api' }
      } catch (error) {
        console.error('Shopee GraphQL profile error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getAffiliateProfile()
    return { ...result, source: 'mock' }
  }

  /**
   * Get top products by commission/earnings
   * Tries GraphQL API first, falls back to mock data
   */
  async getTopProducts(limit?: number): Promise<(ShopeeProduct & { source: 'graphql_api' | 'mock' })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getTopProducts(limit)
        return result.map((p) => ({
          ...p,
          commissionMin: 0,
          commissionMax: 0,
          shopId: 0,
          categoryId: 0,
          source: 'graphql_api' as const,
        }))
      } catch (error) {
        console.error('Shopee GraphQL top products error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getTopProducts(limit)
    return result.map((p) => ({ ...p, source: 'mock' as const }))
  }

  /**
   * Get product categories
   * Tries GraphQL API first, falls back to mock data
   */
  async getCategories(): Promise<(ShopeeCategory & { source: 'graphql_api' | 'mock' })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCategories()
        return result.map((c) => ({ ...c, source: 'graphql_api' as const }))
      } catch (error) {
        console.error('Shopee GraphQL categories error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCategories()
    return result.map((c) => ({ ...c, source: 'mock' as const }))
  }

  // ─── Utility ────────────────────────────────────────────────

  /**
   * Test API connection
   * Tries GraphQL API first, falls back to mock
   */
  async testConnection(): Promise<{ success: boolean; message: string; region: string; source: 'graphql_api' | 'mock' }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.testConnection()
        if (result.success) {
          return { ...result, source: 'graphql_api' }
        }
        // If real API test fails, update status and fall back
        this._status = 'error'
      } catch (error) {
        this._status = 'error'
        console.error('Shopee GraphQL connection test error, falling back to mock:', error)
      }
    }

    const result = await this.mock.testConnection()
    return { ...result, source: 'mock' }
  }

  /**
   * Verify webhook signature (static method, uses crypto directly)
   * This is used by the webhook route to verify incoming Shopee events
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSign = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSign)
    )
  }
}

// ─── Singleton Factory ──────────────────────────────────────────

let _instance: ShopeeAffiliateService | null = null

/**
 * Get or create a ShopeeAffiliateService instance
 * @param config - Optional config to create a new instance
 */
export function getShopeeService(config?: ShopeeServiceConfig): ShopeeAffiliateService {
  if (config) {
    _instance = new ShopeeAffiliateService(config)
  }

  if (!_instance) {
    // Create with mock mode by default
    _instance = new ShopeeAffiliateService({ forceMock: true })
  }

  return _instance
}

/**
 * Get Shopee service from database settings
 * Reads the API credentials from the AppSetting table
 */
export async function getShopeeServiceFromDB(): Promise<ShopeeAffiliateService | null> {
  try {
    const { db } = await import('@/lib/db')

    const settings = await db.appSetting.findMany({
      where: {
        key: { in: ['shopee_app_id', 'shopee_secret', 'shopee_region', 'shopee_access_token'] },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    if (!settingsMap.shopee_app_id || !settingsMap.shopee_secret) {
      // Return a mock service when no credentials configured
      return new ShopeeAffiliateService({ forceMock: true })
    }

    return new ShopeeAffiliateService({
      appId: settingsMap.shopee_app_id,
      secret: settingsMap.shopee_secret,
      region: settingsMap.shopee_region || 'my',
      accessToken: settingsMap.shopee_access_token,
    })
  } catch (error) {
    console.error('Failed to load Shopee service from DB:', error)
    // Return a mock service as fallback
    return new ShopeeAffiliateService({ forceMock: true })
  }
}
