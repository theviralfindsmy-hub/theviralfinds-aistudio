/**
 * Shopee Affiliate Open API - GraphQL Client
 * 
 * Official Docs: https://affiliate.shopee.com.my/affiliate-api
 * Uses GraphQL specification over HTTP
 * 
 * Authentication: AppID + Secret via headers (HMAC-SHA256 signature)
 * Endpoint: https://open.shopee.com.my/affiliate/graphql (for Malaysia)
 */

import crypto from 'crypto'

// ─── Configuration ──────────────────────────────────────────────

export interface ShopeeGraphQLConfig {
  appId: string
  secret: string
  region: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'
  accessToken?: string
}

/** Regional GraphQL API endpoints */
const GRAPHQL_ENDPOINTS: Record<string, string> = {
  my: 'https://open.shopee.com.my/affiliate/graphql',
  sg: 'https://open.shopee.sg/affiliate/graphql',
  id: 'https://open.shopee.co.id/affiliate/graphql',
  th: 'https://open.shopee.co.th/affiliate/graphql',
  ph: 'https://open.shopee.ph/affiliate/graphql',
  vn: 'https://open.shopee.vn/affiliate/graphql',
}

// ─── GraphQL Response Types ─────────────────────────────────────

export interface GraphQLError {
  message: string
  locations?: Array<{ line: number; column: number }>
  path?: Array<string | number>
  extensions?: Record<string, unknown>
}

export interface GraphQLResponse<T = unknown> {
  data?: T
  errors?: GraphQLError[]
}

// ─── GraphQL Client ─────────────────────────────────────────────

export class ShopeeGraphQLClient {
  private config: ShopeeGraphQLConfig
  private endpoint: string

  constructor(config: ShopeeGraphQLConfig) {
    this.config = config
    this.endpoint = GRAPHQL_ENDPOINTS[config.region] || GRAPHQL_ENDPOINTS.my
  }

  // ─── Authentication ─────────────────────────────────────────

  /**
   * Generate HMAC-SHA256 signature for authenticated requests
   * Signature base: secret + appId + timestamp + payload
   */
  private generateSignature(payload: string, timestamp: number): string {
    const baseString = `${this.config.appId}${timestamp}${payload}`
    return crypto
      .createHmac('sha256', this.config.secret)
      .update(baseString)
      .digest('hex')
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(payload: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.generateSignature(payload, timestamp)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-App-Id': this.config.appId,
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
    }

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`
    }

    return headers
  }

  // ─── Core Query Method ──────────────────────────────────────

  /**
   * Execute a GraphQL query/mutation
   * 
   * @param query - GraphQL query string
   * @param variables - Optional query variables
   * @returns Parsed response data
   * @throws Error if GraphQL errors are present in the response
   */
  async query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const payload = JSON.stringify({ query, variables })
    const headers = this.buildHeaders(payload)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: payload,
    })

    if (!response.ok) {
      throw new Error(
        `Shopee API HTTP Error: ${response.status} ${response.statusText}`
      )
    }

    const data: GraphQLResponse<T> = await response.json()

    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors
        .map((e) => e.message)
        .join(', ')
      throw new Error(`Shopee GraphQL Error: ${errorMessages}`)
    }

    if (!data.data) {
      throw new Error('Shopee GraphQL Error: No data in response')
    }

    return data.data
  }

  // ─── Convenience Methods ────────────────────────────────────

  /**
   * Test API connection by querying affiliate profile
   */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    try {
      const result = await this.query<{
        affiliateProfile: {
          affiliateId: string
          name: string
          email: string
          status: string
        } | null
      }>(`
        query {
          affiliateProfile {
            affiliateId
            name
            email
            status
          }
        }
      `)

      const profile = result.affiliateProfile
      return {
        success: true,
        message: profile
          ? `Connected as ${profile.name} (${profile.status})`
          : 'Connected but no profile data',
        region: this.config.region.toUpperCase(),
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        region: this.config.region.toUpperCase(),
      }
    }
  }

  /**
   * Get the configured endpoint URL
   */
  getEndpoint(): string {
    return this.endpoint
  }

  /**
   * Get the configured region
   */
  getRegion(): string {
    return this.config.region
  }

  // ─── GraphQL Query Builders ─────────────────────────────────

  /**
   * Search products with commission information
   */
  async searchProducts(
    keyword: string,
    options?: {
      page?: number
      limit?: number
      sortField?: 'commission' | 'price' | 'sales' | 'rating'
      sortOrder?: 'asc' | 'desc'
      categoryId?: number
      minPrice?: number
      maxPrice?: number
    }
  ): Promise<{
    products: Array<{
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
    }>
    total: number
  }> {
    const result = await this.query<{
      productSearch: {
        nodes: Array<Record<string, unknown>>
        totalCount: number
      }
    }>(
      `
        query ProductSearch(
          $keyword: String!
          $page: Int
          $limit: Int
          $sortField: String
          $sortOrder: String
          $categoryId: Int
          $minPrice: Float
          $maxPrice: Float
        ) {
          productSearch(
            keyword: $keyword
            page: $page
            limit: $limit
            sortField: $sortField
            sortOrder: $sortOrder
            categoryId: $categoryId
            minPrice: $minPrice
            maxPrice: $maxPrice
          ) {
            nodes {
              itemId
              name
              image
              price
              originalPrice
              commissionRate
              commissionMin
              commissionMax
              sales
              ratingStar
              shopName
              shopId
              category
              categoryId
              productLink
            }
            totalCount
          }
        }
      `,
      {
        keyword,
        page: options?.page || 1,
        limit: options?.limit || 20,
        sortField: options?.sortField || 'sales',
        sortOrder: options?.sortOrder || 'desc',
        categoryId: options?.categoryId,
        minPrice: options?.minPrice,
        maxPrice: options?.maxPrice,
      }
    )

    return {
      products: (result.productSearch?.nodes || []).map((p) => ({
        itemId: Number(p.itemId || 0),
        name: String(p.name || ''),
        image: String(p.image || ''),
        price: Number(p.price || 0),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        commissionRate: Number(p.commissionRate || 0),
        commissionMin: Number(p.commissionMin || 0),
        commissionMax: Number(p.commissionMax || 0),
        sales: Number(p.sales || 0),
        ratingStar: Number(p.ratingStar || 0),
        shopName: String(p.shopName || ''),
        shopId: Number(p.shopId || 0),
        category: String(p.category || ''),
        categoryId: Number(p.categoryId || 0),
        productLink: String(p.productLink || ''),
      })),
      total: result.productSearch?.totalCount || 0,
    }
  }

  /**
   * Get product detail by item ID
   */
  async getProductDetail(itemId: number): Promise<{
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
  } | null> {
    const result = await this.query<{
      productDetail: Record<string, unknown> | null
    }>(
      `
        query ProductDetail($itemId: Int!) {
          productDetail(itemId: $itemId) {
            itemId
            name
            image
            price
            originalPrice
            commissionRate
            commissionMin
            commissionMax
            sales
            ratingStar
            shopName
            shopId
            category
            categoryId
            productLink
            deepLink
          }
        }
      `,
      { itemId }
    )

    const p = result.productDetail
    if (!p) return null

    return {
      itemId: Number(p.itemId || 0),
      name: String(p.name || ''),
      image: String(p.image || ''),
      price: Number(p.price || 0),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      commissionRate: Number(p.commissionRate || 0),
      commissionMin: Number(p.commissionMin || 0),
      commissionMax: Number(p.commissionMax || 0),
      sales: Number(p.sales || 0),
      ratingStar: Number(p.ratingStar || 0),
      shopName: String(p.shopName || ''),
      shopId: Number(p.shopId || 0),
      category: String(p.category || ''),
      categoryId: Number(p.categoryId || 0),
      productLink: String(p.productLink || ''),
      deepLink: p.deepLink ? String(p.deepLink) : undefined,
    }
  }

  /**
   * Generate an affiliate tracking link
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
    deepLinkType?: 'default' | 'app_only'
  }): Promise<{
    shortUrl: string
    longUrl: string
    deepLink: string
    generateUrl: string
  }> {
    const result = await this.query<{
      generateAffiliateLink: Record<string, unknown>
    }>(
      `
        mutation GenerateAffiliateLink(
          $itemId: Int
          $productUrl: String
          $subId: String
          $deepLinkType: String
        ) {
          generateAffiliateLink(
            itemId: $itemId
            productUrl: $productUrl
            subId: $subId
            deepLinkType: $deepLinkType
          ) {
            shortUrl
            longUrl
            deepLink
            generateUrl
          }
        }
      `,
      {
        itemId: params.itemId,
        productUrl: params.productUrl,
        subId: params.subId,
        deepLinkType: params.deepLinkType || 'default',
      }
    )

    const link = result.generateAffiliateLink
    return {
      shortUrl: String(link?.shortUrl || ''),
      longUrl: String(link?.longUrl || link?.url || ''),
      deepLink: String(link?.deepLink || ''),
      generateUrl: String(link?.generateUrl || ''),
    }
  }

  /**
   * Get commission orders
   */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{
    orders: Array<{
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
    }>
    total: number
  }> {
    const result = await this.query<{
      commissionOrders: {
        nodes: Array<Record<string, unknown>>
        totalCount: number
      }
    }>(
      `
        query CommissionOrders(
          $page: Int
          $limit: Int
          $startTime: Int
          $endTime: Int
          $commissionStatus: String
        ) {
          commissionOrders(
            page: $page
            limit: $limit
            startTime: $startTime
            endTime: $endTime
            commissionStatus: $commissionStatus
          ) {
            nodes {
              orderSn
              orderCreateTime
              itemId
              itemName
              itemPrice
              commissionRate
              commission
              commissionStatus
              orderStatus
              settleTime
              clickTime
              subId
            }
            totalCount
          }
        }
      `,
      {
        page: params?.page || 1,
        limit: params?.limit || 50,
        startTime: params?.startTime,
        endTime: params?.endTime,
        commissionStatus: params?.commissionStatus,
      }
    )

    return {
      orders: (result.commissionOrders?.nodes || []).map((o) => ({
        orderSn: String(o.orderSn || ''),
        orderCreateTime: Number(o.orderCreateTime || 0),
        itemId: Number(o.itemId || 0),
        itemName: String(o.itemName || ''),
        itemPrice: Number(o.itemPrice || 0),
        commissionRate: Number(o.commissionRate || 0),
        commission: Number(o.commission || 0),
        commissionStatus: String(o.commissionStatus || 'pending') as 'pending' | 'confirmed' | 'rejected' | 'paid',
        orderStatus: String(o.orderStatus || ''),
        settleTime: o.settleTime ? Number(o.settleTime) : undefined,
        clickTime: Number(o.clickTime || 0),
        subId: o.subId ? String(o.subId) : undefined,
      })),
      total: result.commissionOrders?.totalCount || 0,
    }
  }

  /**
   * Get commission summary
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<{
    totalCommission: number
    pendingCommission: number
    confirmedCommission: number
    rejectedCommission: number
    paidCommission: number
    totalOrders: number
    conversionRate: number
  }> {
    const result = await this.query<{
      commissionSummary: Record<string, unknown>
    }>(
      `
        query CommissionSummary($startTime: Int, $endTime: Int) {
          commissionSummary(startTime: $startTime, endTime: $endTime) {
            totalCommission
            pendingCommission
            confirmedCommission
            rejectedCommission
            paidCommission
            totalOrders
            conversionRate
          }
        }
      `,
      {
        startTime: params?.startTime,
        endTime: params?.endTime,
      }
    )

    const s = result.commissionSummary
    return {
      totalCommission: Number(s?.totalCommission || 0),
      pendingCommission: Number(s?.pendingCommission || 0),
      confirmedCommission: Number(s?.confirmedCommission || 0),
      rejectedCommission: Number(s?.rejectedCommission || 0),
      paidCommission: Number(s?.paidCommission || 0),
      totalOrders: Number(s?.totalOrders || 0),
      conversionRate: Number(s?.conversionRate || 0),
    }
  }

  /**
   * Get click statistics
   */
  async getClickStats(params: {
    startTime: number
    endTime: number
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }): Promise<
    Array<{
      date: string
      clicks: number
      uniqueClicks: number
      conversions: number
      earnings: number
    }>
  > {
    const result = await this.query<{
      clickStats: Array<Record<string, unknown>>
    }>(
      `
        query ClickStats(
          $startTime: Int!
          $endTime: Int!
          $granularity: String
        ) {
          clickStats(
            startTime: $startTime
            endTime: $endTime
            granularity: $granularity
          ) {
            date
            clicks
            uniqueClicks
            conversions
            earnings
          }
        }
      `,
      {
        startTime: params.startTime,
        endTime: params.endTime,
        granularity: params.granularity || 'day',
      }
    )

    return (result.clickStats || []).map((s) => ({
      date: String(s.date || ''),
      clicks: Number(s.clicks || 0),
      uniqueClicks: Number(s.uniqueClicks || 0),
      conversions: Number(s.conversions || 0),
      earnings: Number(s.earnings || 0),
    }))
  }

  /**
   * Get affiliate profile
   */
  async getAffiliateProfile(): Promise<{
    affiliateId: string
    name: string
    email: string
    status: string
    commissionRate: number
    totalEarnings: number
    joinDate: string
    region: string
  } | null> {
    const result = await this.query<{
      affiliateProfile: Record<string, unknown> | null
    }>(`
      query {
        affiliateProfile {
          affiliateId
          name
          email
          status
          commissionRate
          totalEarnings
          joinDate
          region
        }
      }
    `)

    const p = result.affiliateProfile
    if (!p) return null

    return {
      affiliateId: String(p.affiliateId || ''),
      name: String(p.name || ''),
      email: String(p.email || ''),
      status: String(p.status || ''),
      commissionRate: Number(p.commissionRate || 0),
      totalEarnings: Number(p.totalEarnings || 0),
      joinDate: String(p.joinDate || ''),
      region: String(p.region || ''),
    }
  }

  /**
   * Get top products by commission/earnings
   */
  async getTopProducts(limit?: number): Promise<
    Array<{
      itemId: number
      name: string
      image: string
      price: number
      commissionRate: number
      sales: number
      ratingStar: number
      shopName: string
      category: string
      productLink: string
    }>
  > {
    const result = await this.query<{
      topProducts: Array<Record<string, unknown>>
    }>(
      `
        query TopProducts($limit: Int) {
          topProducts(limit: $limit) {
            itemId
            name
            image
            price
            commissionRate
            sales
            ratingStar
            shopName
            category
            productLink
          }
        }
      `,
      { limit: limit || 10 }
    )

    return (result.topProducts || []).map((p) => ({
      itemId: Number(p.itemId || 0),
      name: String(p.name || ''),
      image: String(p.image || ''),
      price: Number(p.price || 0),
      commissionRate: Number(p.commissionRate || 0),
      sales: Number(p.sales || 0),
      ratingStar: Number(p.ratingStar || 0),
      shopName: String(p.shopName || ''),
      category: String(p.category || ''),
      productLink: String(p.productLink || ''),
    }))
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<
    Array<{
      categoryId: number
      name: string
      productCount: number
      avgCommissionRate: number
    }>
  > {
    const result = await this.query<{
      categories: Array<Record<string, unknown>>
    }>(`
      query {
        categories {
          categoryId
          name
          productCount
          avgCommissionRate
        }
      }
    `)

    return (result.categories || []).map((c) => ({
      categoryId: Number(c.categoryId || 0),
      name: String(c.name || ''),
      productCount: Number(c.productCount || 0),
      avgCommissionRate: Number(c.avgCommissionRate || 0),
    }))
  }
}
