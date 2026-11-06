/**
 * Lazada Affiliate Service — Main Service
 *
 * Auto-switches between real Lazada Open Platform API and mock data:
 * - When `LAZADA_APP_KEY` + `LAZADA_APP_SECRET` env vars are set (or passed via DB
 *   settings), AND a valid access token is present → uses real REST API
 * - When no credentials are present → uses mock data so the UI is fully functional
 *
 * Mirrors the dual-source pattern used by `ShopeeAffiliateService`.
 *
 * Official API Docs: https://open.lazada.com/
 * Affiliate Portal: https://lazada-affiliate.com/
 *
 * Setup:
 *  1. Register at https://open.lazada.com/ as a developer
 *  2. Create an App to get App Key + App Secret
 *  3. Authorize your app via OAuth to receive an access token
 *  4. Enter credentials in Settings > Lazada Integration
 */

import { LazadaApiClient, type LazadaClientConfig } from './api-client'
import { LazadaMockService } from './mock-data'
import type {
  LazadaProduct,
  LazadaAffiliateLink,
  LazadaCommissionOrder,
  LazadaCommissionSummary,
  LazadaCategory,
  LazadaAffiliateProfile,
} from './mock-data'

// ─── Types ─────────────────────────────────────────────────────

export type LazadaConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'no_access'
  | 'error'

export type LazadaDataSource = 'api' | 'mock'

export interface LazadaServiceConfig {
  appKey?: string
  appSecret?: string
  region?: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'
  accessToken?: string
  forceMock?: boolean
}

// Re-export the public types so consumers can import everything from one module
export type {
  LazadaProduct,
  LazadaAffiliateLink,
  LazadaCommissionOrder,
  LazadaCommissionSummary,
  LazadaCategory,
  LazadaAffiliateProfile,
}

// ─── Service ───────────────────────────────────────────────────

export class LazadaAffiliateService {
  private client: LazadaApiClient | null = null
  private mock: LazadaMockService
  private _status: LazadaConnectionStatus = 'disconnected'
  private config: LazadaServiceConfig

  constructor(config: LazadaServiceConfig = {}) {
    this.config = config
    this.mock = new LazadaMockService()

    if (config.appKey && config.appSecret && !config.forceMock) {
      try {
        const clientConfig: LazadaClientConfig = {
          appKey: config.appKey,
          appSecret: config.appSecret,
          region: config.region || 'my',
          accessToken: config.accessToken,
        }
        this.client = new LazadaApiClient(clientConfig)
        this._status = config.accessToken ? 'connected' : 'no_access'
      } catch {
        this._status = 'error'
        this.client = null
      }
    } else {
      this._status = config.forceMock ? 'no_access' : 'disconnected'
    }
  }

  get status(): LazadaConnectionStatus {
    return this._status
  }

  get isUsingMock(): boolean {
    return !this.client || this._status !== 'connected'
  }

  // ─── Product APIs ─────────────────────────────────────────

  /**
   * Search Lazada products with commission info.
   * Tries real API first, falls back to mock data on any error.
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
  ): Promise<{ products: LazadaProduct[]; total: number; source: LazadaDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.searchProducts(query, options)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API search error, falling back to mock:', error)
      }
    }

    const result = await this.mock.searchProducts(query, options)
    return { ...result, source: 'mock' }
  }

  /** Get product detail by item ID */
  async getProductDetail(
    itemId: number
  ): Promise<(LazadaProduct & { source: LazadaDataSource }) | null> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getProductDetail(itemId)
        if (result) return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API product detail error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getProductDetail(itemId)
    if (!result) return null
    return { ...result, source: 'mock' }
  }

  // ─── Affiliate Link APIs ──────────────────────────────────

  /**
   * Generate an affiliate tracking link for a Lazada product.
   * Tries real API first, falls back to mock on any error.
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
  }): Promise<LazadaAffiliateLink & { source: LazadaDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.generateAffiliateLink(params)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API generate link error, falling back to mock:', error)
      }
    }

    const result = await this.mock.generateAffiliateLink(params)
    return { ...result, source: 'mock' }
  }

  // ─── Commission APIs ──────────────────────────────────────

  /**
   * Get commission orders (conversions).
   * Tries real API first, falls back to mock on any error.
   */
  async getCommissions(filters?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: LazadaCommissionOrder[]; total: number; source: LazadaDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionOrders(filters)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API commission orders error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCommissionOrders(filters)
    return { ...result, source: 'mock' }
  }

  /**
   * Alias for getCommissions to match the task spec naming.
   * LazadaAffiliateService.getOrders(filters) is an alias for getCommissions(filters).
   */
  async getOrders(filters?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: LazadaCommissionOrder[]; total: number; source: LazadaDataSource }> {
    return this.getCommissions(filters)
  }

  /**
   * Get commission summary (totals by status).
   * Tries real API first, falls back to mock on any error.
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<LazadaCommissionSummary & { source: LazadaDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionSummary(params)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API commission summary error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCommissionSummary(params)
    return { ...result, source: 'mock' }
  }

  // ─── Profile & Categories ─────────────────────────────────

  /** Get affiliate profile */
  async getAffiliateProfile(): Promise<(LazadaAffiliateProfile & { source: LazadaDataSource }) | null> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getAffiliateProfile()
        if (result) return { ...result, source: 'api' }
      } catch (error) {
        console.error('Lazada API profile error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getAffiliateProfile()
    return { ...result, source: 'mock' }
  }

  /** Get top products by commission × sales */
  async getTopProducts(limit?: number): Promise<(LazadaProduct & { source: LazadaDataSource })[]> {
    if (this.client && this._status === 'connected') {
      try {
        // Real API doesn't have a dedicated "top products" endpoint, so we search
        // with a broad keyword and sort by sales, then map to a top-N slice.
        const result = await this.client.searchProducts('', {
          limit: limit || 10,
          sortField: 'sales',
          sortOrder: 'desc',
        })
        return result.products.map((p) => ({ ...p, source: 'api' as const }))
      } catch (error) {
        console.error('Lazada API top products error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getTopProducts(limit)
    return result.map((p) => ({ ...p, source: 'mock' as const }))
  }

  /** Get categories */
  async getCategories(): Promise<(LazadaCategory & { source: LazadaDataSource })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCategories()
        if (result.length > 0) {
          return result.map((c) => ({ ...c, source: 'api' as const }))
        }
      } catch (error) {
        console.error('Lazada API categories error, falling back to mock:', error)
      }
    }

    const result = await this.mock.getCategories()
    return result.map((c) => ({ ...c, source: 'mock' as const }))
  }

  // ─── Utility ──────────────────────────────────────────────

  /**
   * Test the connection.
   * Tries real API first; on failure updates status and falls back to mock.
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    region: string
    source: LazadaDataSource
  }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.testConnection()
        if (result.success) return { ...result, source: 'api' }
        // If real test fails, downgrade status and fall back
        this._status = 'error'
      } catch (error) {
        this._status = 'error'
        console.error('Lazada API connection test error, falling back to mock:', error)
      }
    }

    const result = await this.mock.testConnection()
    return { ...result, source: 'mock' }
  }
}

// ─── Singleton Factory ─────────────────────────────────────────

let _instance: LazadaAffiliateService | null = null

/**
 * Get or create a LazadaAffiliateService instance.
 * @param config Optional config — when supplied, replaces the singleton.
 */
export function getLazadaService(config?: LazadaServiceConfig): LazadaAffiliateService {
  if (config) {
    _instance = new LazadaAffiliateService(config)
  }

  if (!_instance) {
    // Mock mode by default
    _instance = new LazadaAffiliateService({ forceMock: true })
  }

  return _instance
}

/**
 * Get LazadaAffiliateService using credentials from environment variables.
 * Used by API routes when no DB integration is wired up yet.
 *
 * Required env vars:
 *   - LAZADA_APP_KEY
 *   - LAZADA_APP_SECRET
 * Optional env vars:
 *   - LAZADA_REGION (default: 'my')
 *   - LAZADA_ACCESS_TOKEN
 */
export function getLazadaServiceFromEnv(): LazadaAffiliateService {
  const appKey = process.env.LAZADA_APP_KEY
  const appSecret = process.env.LAZADA_APP_SECRET
  const region = (process.env.LAZADA_REGION as 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn') || 'my'
  const accessToken = process.env.LAZADA_ACCESS_TOKEN

  if (appKey && appSecret) {
    return new LazadaAffiliateService({
      appKey,
      appSecret,
      region,
      accessToken,
    })
  }

  // Fall back to mock mode
  return new LazadaAffiliateService({ forceMock: true })
}

/**
 * Get LazadaAffiliateService from database settings (AppSetting table).
 * Looks for keys: lazada_app_key, lazada_app_secret, lazada_region, lazada_access_token.
 *
 * Falls back to mock mode on any error or missing credentials.
 */
export async function getLazadaServiceFromDB(): Promise<LazadaAffiliateService> {
  try {
    const { db } = await import('@/lib/db')

    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'lazada_app_key',
            'lazada_app_secret',
            'lazada_region',
            'lazada_access_token',
          ],
        },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    if (!settingsMap.lazada_app_key || !settingsMap.lazada_app_secret) {
      // No credentials configured → mock mode
      return new LazadaAffiliateService({ forceMock: true })
    }

    return new LazadaAffiliateService({
      appKey: settingsMap.lazada_app_key,
      appSecret: settingsMap.lazada_app_secret,
      region: (settingsMap.lazada_region as 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn') || 'my',
      accessToken: settingsMap.lazada_access_token,
    })
  } catch (error) {
    console.error('Failed to load Lazada service from DB, falling back to mock:', error)
    return new LazadaAffiliateService({ forceMock: true })
  }
}
