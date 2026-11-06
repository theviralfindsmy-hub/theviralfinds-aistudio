/**
 * TikTok Shop Affiliate Service — Orchestrator
 *
 * Auto-switches between real TikTok Shop Affiliate API and a built-in mock
 * data service:
 *   - When `TIKTOK_APP_KEY` + `TIKTOK_APP_SECRET` + `TIKTOK_ACCESS_TOKEN`
 *     are present in the environment (or supplied via `getTikTokServiceFromDB`)
 *     → uses `TikTokApiClient` against the live API.
 *   - Otherwise, or if a real-API call fails → falls back to `TikTokMockService`.
 *
 * The signature of every method matches the mock service so they can be
 * used interchangeably. Every response includes a `source: 'api' | 'mock'`
 * discriminator so the API routes can surface it to the UI.
 *
 * Setup (per environment / Settings page):
 *   TIKTOK_APP_KEY       = your TikTok Shop partner app key
 *   TIKTOK_APP_SECRET    = your TikTok Shop partner app secret
 *   TIKTOK_ACCESS_TOKEN  = OAuth access token (per-shop)
 *   TIKTOK_SHOP_ID       = (optional) the connected shop's ID
 *   TIKTOK_REGION        = MY | SG | ID | TH | PH | VN (default MY)
 *   TIKTOK_FORCE_MOCK    = set to "1" to force mock mode (useful in dev)
 */

import {
  TikTokApiClient,
  type TikTokClientConfig,
  type TikTokConnectionStatus,
} from './api-client'
import {
  TikTokMockService,
  getTikTokMockService,
  type TikTokAffiliateLink,
  type TikTokAffiliateProfile,
  type TikTokCategory,
  type TikTokCommissionOrder,
  type TikTokCommissionSummary,
  type TikTokProduct,
  type TikTokProductCategory,
} from './mock-data'

// ─── Re-Exports ─────────────────────────────────────────────────
// Single import surface for callers: `import { getTikTokService, type TikTokProduct } from '@/lib/tiktok/affiliate-service'`
export type {
  TikTokAffiliateLink,
  TikTokAffiliateProfile,
  TikTokCategory,
  TikTokCommissionOrder,
  TikTokCommissionSummary,
  TikTokProduct,
  TikTokProductCategory,
}
export type { TikTokClientConfig, TikTokConnectionStatus }
export { TikTokApiClient, TikTokMockService }
export { TIKTOK_CATEGORIES } from './mock-data'
export { buildTikTokOAuthUrl, exchangeTikTokCodeForToken } from './api-client'

// ─── Service Config ─────────────────────────────────────────────

export interface TikTokServiceConfig {
  appKey?: string
  appSecret?: string
  accessToken?: string
  shopId?: string
  region?: 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'VN'
  forceMock?: boolean
}

export type TikTokDataSource = 'api' | 'mock'

// ─── Service Class ──────────────────────────────────────────────

export class TikTokAffiliateService {
  private client: TikTokApiClient | null = null
  private mock: TikTokMockService
  private _status: TikTokConnectionStatus = 'disconnected'
  private config: TikTokServiceConfig

  constructor(config: TikTokServiceConfig = {}) {
    this.config = config
    this.mock = getTikTokMockService()

    const hasCreds =
      !!config.appKey &&
      !!config.appSecret &&
      !!config.accessToken &&
      !config.forceMock

    if (hasCreds) {
      try {
        this.client = new TikTokApiClient({
          appKey: config.appKey!,
          appSecret: config.appSecret!,
          accessToken: config.accessToken!,
          shopId: config.shopId,
          region: config.region || 'MY',
        })
        this._status = 'connected'
      } catch {
        this._status = 'error'
        this.client = null
      }
    } else {
      this._status = config.forceMock ? 'no_access' : 'disconnected'
    }
  }

  get status(): TikTokConnectionStatus {
    return this._status
  }

  get isUsingMock(): boolean {
    return !this.client || this._status !== 'connected'
  }

  /**
   * Returns the data-source discriminator for API responses.
   */
  private getSource(): TikTokDataSource {
    return this.isUsingMock ? 'mock' : 'api'
  }

  // ─── Product APIs ───────────────────────────────────────────

  /**
   * Search products on TikTok Shop with commission info.
   * Falls back to mock data on any error.
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
  ): Promise<{ products: TikTokProduct[]; total: number; source: TikTokDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.searchProducts(query, options)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API search error, falling back to mock:', error)
      }
    }
    const result = await this.mock.searchProducts(query, options)
    return { ...result, source: 'mock' }
  }

  /**
   * Get product detail by product ID.
   */
  async getProductDetail(
    productId: string
  ): Promise<(TikTokProduct & { source: TikTokDataSource }) | null> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getProductDetail(productId)
        if (result) return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API product detail error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getProductDetail(productId)
    if (!result) return null
    return { ...result, source: 'mock' }
  }

  // ─── Affiliate Link APIs ────────────────────────────────────

  /**
   * Generate a TikTok Shop affiliate tracking link.
   */
  async generateAffiliateLink(params: {
    productId?: string
    productUrl?: string
    subId?: string
  }): Promise<TikTokAffiliateLink & { source: TikTokDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.generateAffiliateLink(params)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API generate link error, falling back to mock:', error)
      }
    }
    const result = await this.mock.generateAffiliateLink(params)
    return { ...result, source: 'mock' }
  }

  // ─── Commission APIs ────────────────────────────────────────

  /**
   * Get commission orders (conversions). Falls back to mock on error.
   */
  async getCommissions(filters?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: TikTokCommissionOrder['commissionStatus']
  }): Promise<{ orders: TikTokCommissionOrder[]; total: number; source: TikTokDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionOrders(filters)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API commission orders error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getCommissionOrders(filters)
    return { ...result, source: 'mock' }
  }

  /**
   * Get commission orders (alias of getCommissions for spec parity).
   */
  async getOrders(filters?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: TikTokCommissionOrder['commissionStatus']
  }): Promise<{ orders: TikTokCommissionOrder[]; total: number; source: TikTokDataSource }> {
    return this.getCommissions(filters)
  }

  /**
   * Get commission summary. Falls back to mock on error.
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<TikTokCommissionSummary & { source: TikTokDataSource }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCommissionSummary(params)
        return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API commission summary error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getCommissionSummary(params)
    return { ...result, source: 'mock' }
  }

  // ─── Profile / Categories / Top Products ────────────────────

  async getAffiliateProfile(): Promise<
    (TikTokAffiliateProfile & { source: TikTokDataSource }) | null
  > {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getAffiliateProfile()
        if (result) return { ...result, source: 'api' }
      } catch (error) {
        console.error('TikTok API profile error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getAffiliateProfile()
    return { ...result, source: 'mock' }
  }

  async getTopProducts(
    limit?: number
  ): Promise<(TikTokProduct & { source: TikTokDataSource })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getTopProducts(limit)
        return result.map((p) => ({ ...p, source: 'api' as const }))
      } catch (error) {
        console.error('TikTok API top products error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getTopProducts(limit)
    return result.map((p) => ({ ...p, source: 'mock' as const }))
  }

  async getCategories(): Promise<(TikTokCategory & { source: TikTokDataSource })[]> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.getCategories()
        return result.map((c) => ({ ...c, source: 'api' as const }))
      } catch (error) {
        console.error('TikTok API categories error, falling back to mock:', error)
      }
    }
    const result = await this.mock.getCategories()
    return result.map((c) => ({ ...c, source: 'mock' as const }))
  }

  // ─── Test & Utility ─────────────────────────────────────────

  async testConnection(): Promise<{
    success: boolean
    message: string
    region: string
    source: TikTokDataSource
  }> {
    if (this.client && this._status === 'connected') {
      try {
        const result = await this.client.testConnection()
        if (result.success) {
          return { ...result, source: 'api' }
        }
        // Real API test failed — downgrade and fall back
        this._status = 'error'
      } catch (error) {
        this._status = 'error'
        console.error('TikTok API connection test error, falling back to mock:', error)
      }
    }
    const result = await this.mock.testConnection()
    return { ...result, source: 'mock' }
  }
}

// ─── Singleton Factory ──────────────────────────────────────────

let _instance: TikTokAffiliateService | null = null

/**
 * Get or create a `TikTokAffiliateService` instance.
 *
 * Passing `config` will always create a fresh instance (used by the
 * `/api/tiktok/connect` route after the user enters credentials).
 */
export function getTikTokService(config?: TikTokServiceConfig): TikTokAffiliateService {
  if (config) {
    _instance = new TikTokAffiliateService(config)
  }
  if (!_instance) {
    _instance = new TikTokAffiliateService({ forceMock: true })
  }
  return _instance
}

/**
 * Build a `TikTokAffiliateService` from environment variables.
 *
 * Reads:
 *   - TIKTOK_APP_KEY, TIKTOK_APP_SECRET, TIKTOK_ACCESS_TOKEN
 *   - TIKTOK_SHOP_ID, TIKTOK_REGION, TIKTOK_FORCE_MOCK
 *
 * Returns a mock-mode service when credentials are missing.
 */
export function getTikTokServiceFromEnv(): TikTokAffiliateService {
  const appKey = process.env.TIKTOK_APP_KEY
  const appSecret = process.env.TIKTOK_APP_SECRET
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN
  const shopId = process.env.TIKTOK_SHOP_ID
  const region = (process.env.TIKTOK_REGION as TikTokServiceConfig['region']) || 'MY'
  const forceMock = process.env.TIKTOK_FORCE_MOCK === '1' || process.env.TIKTOK_FORCE_MOCK === 'true'

  return new TikTokAffiliateService({
    appKey,
    appSecret,
    accessToken,
    shopId,
    region,
    forceMock,
  })
}

/**
 * Build a `TikTokAffiliateService` from database-stored settings.
 *
 * Reads the same AppSetting rows the Shopee integration uses
 * (`tiktok_app_key`, `tiktok_app_secret`, `tiktok_access_token`,
 *  `tiktok_shop_id`, `tiktok_region`, `tiktok_force_mock`).
 *
 * Returns a mock-mode service on any failure.
 */
export async function getTikTokServiceFromDB(): Promise<TikTokAffiliateService> {
  try {
    const { db } = await import('@/lib/db')

    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'tiktok_app_key',
            'tiktok_app_secret',
            'tiktok_access_token',
            'tiktok_shop_id',
            'tiktok_region',
            'tiktok_force_mock',
          ],
        },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    if (
      !settingsMap.tiktok_app_key ||
      !settingsMap.tiktok_app_secret ||
      !settingsMap.tiktok_access_token
    ) {
      // No credentials configured — return a mock service
      return new TikTokAffiliateService({ forceMock: true })
    }

    return new TikTokAffiliateService({
      appKey: settingsMap.tiktok_app_key,
      appSecret: settingsMap.tiktok_app_secret,
      accessToken: settingsMap.tiktok_access_token,
      shopId: settingsMap.tiktok_shop_id,
      region:
        (settingsMap.tiktok_region as TikTokServiceConfig['region']) || 'MY',
      forceMock: settingsMap.tiktok_force_mock === '1' || settingsMap.tiktok_force_mock === 'true',
    })
  } catch (error) {
    console.error('Failed to load TikTok service from DB:', error)
    return new TikTokAffiliateService({ forceMock: true })
  }
}
