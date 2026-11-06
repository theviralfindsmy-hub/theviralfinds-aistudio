/**
 * Shopee Open API v2 Client Library
 *
 * Inspired by @congminh1254/shopee-sdk — a TypeScript SDK wrapping the full
 * Shopee Open Platform API v2 with 29 managers and 270+ endpoints.
 *
 * This client provides a lightweight, focused subset covering affiliate/seller
 * use cases: product, order, shop, payment, logistics, promotion,
 * account-health, ads, push, and chat management.
 *
 * Official Docs: https://open.shopee.com/api-explorer
 * Auth: HMAC-SHA256 signature (partner_id + path + timestamp [+ access_token + shop_id])
 *
 * DO NOT modify graphql-client.ts or affiliate-api.ts — this module works alongside them.
 */

import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════
// Region & Base URLs
// ═══════════════════════════════════════════════════════════════════

export type ShopeeRegion = 'MY' | 'SG' | 'ID' | 'TH' | 'PH' | 'VN'

const REGION_BASE_URLS: Record<ShopeeRegion, string> = {
  MY: 'https://partner.shopeemobile.com.my/api/v2',
  SG: 'https://partner.shopeemobile.sg/api/v2',
  ID: 'https://partner.shopeemobile.co.id/api/v2',
  TH: 'https://partner.shopeemobile.co.th/api/v2',
  PH: 'https://partner.shopeemobile.ph/api/v2',
  VN: 'https://partner.shopeemobile.vn/api/v2',
}

// ═══════════════════════════════════════════════════════════════════
// Token Storage Interface (Strategy Pattern)
// ═══════════════════════════════════════════════════════════════════

export interface TokenData {
  accessToken: string
  refreshToken: string
  expireAt: number      // unix timestamp (seconds) when access_token expires
  refreshExpireAt: number // unix timestamp (seconds) when refresh_token expires
}

/**
 * Pluggable token storage strategy.
 * Implement this interface to persist tokens in DB, Redis, filesystem, etc.
 */
export interface TokenStorage {
  /** Store tokens for a given shop */
  store(shopId: number, tokens: TokenData): Promise<void>
  /** Retrieve stored tokens for a given shop */
  get(shopId: number): Promise<TokenData | null>
  /** Remove stored tokens (e.g. on logout / revocation) */
  clear(shopId: number): Promise<void>
}

/** In-memory token storage (default, suitable for single-process use) */
export class InMemoryTokenStorage implements TokenStorage {
  private _store = new Map<number, TokenData>()

  async store(shopId: number, tokens: TokenData): Promise<void> {
    this._store.set(shopId, tokens)
  }

  async get(shopId: number): Promise<TokenData | null> {
    return this._store.get(shopId) ?? null
  }

  async clear(shopId: number): Promise<void> {
    this._store.delete(shopId)
  }
}

// ═══════════════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════════════

export class ShopeeApiError extends Error {
  public readonly code: number
  public readonly message: string
  public readonly httpStatus: number
  public readonly raw?: unknown

  constructor(params: { code: number; message: string; httpStatus?: number; raw?: unknown }) {
    super(`ShopeeApiError(${params.code}): ${params.message}`)
    this.name = 'ShopeeApiError'
    this.code = params.code
    this.message = params.message
    this.httpStatus = params.httpStatus ?? 0
    this.raw = params.raw
  }
}

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

export interface ShopeeOpenAPIConfig {
  partnerId: number
  partnerKey: string
  shopId?: number
  region: ShopeeRegion
  /** Custom token storage (defaults to in-memory) */
  tokenStorage?: TokenStorage
  /** Access token (if already obtained) */
  accessToken?: string
  /** Refresh token (if already obtained) */
  refreshToken?: string
  /** Token expiry timestamp (seconds) */
  tokenExpireAt?: number
  /** Custom base URL override (for testing) */
  baseUrl?: string
}

// ═══════════════════════════════════════════════════════════════════
// Common Response Types
// ═══════════════════════════════════════════════════════════════════

interface ShopeeBaseResponse {
  error: number
  message: string
  warning?: string
  request_id: string
}

interface ShopeePaginatedResponse {
  has_next: boolean
  next_offset?: number
}

// ═══════════════════════════════════════════════════════════════════
// Product Types
// ═══════════════════════════════════════════════════════════════════

// -- Product Manager Params --

export interface GetItemListParams {
  offset?: number
  page_size?: number
  update_time_from?: number
  update_time_to?: number
  item_status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST'
}

export interface GetItemBaseInfoParams {
  item_id_list: number[]
}

export interface SearchItemParams {
  page_size?: number
  offset?: number
  keyword?: string
  category_id?: number
  sort_by?: 'RELEVANCE' | 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'SALES'
}

export interface GetCategoryParams {
  language?: string
}

export interface GetBrandListParams {
  category_id?: number
  offset?: number
  page_size?: number
  status?: number
}

export interface BoostItemParams {
  item_id_list: number[]
}

export interface GetBoostedListParams {
  offset?: number
  page_size?: number
}

export interface GetCommentParams {
  item_id: number
  comment_status?: 'READY_TO_REPLY' | 'REPLIED'
  offset?: number
  page_size?: number
  sort_by?: 'CREATE_TIME_ASC' | 'CREATE_TIME_DESC' | 'RATING_ASC' | 'RATING_DESC'
}

export interface ReplyCommentParams {
  comment_list: Array<{
    comment_id: number
    comment_reply: string
  }>
}

// -- Product Manager Responses --

export interface ShopeeItem {
  item_id: number
  item_name: string
  item_status: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST'
  category_id: number
  image: { image_url: string }[]
  price_info: { original_price: number; current_price: number }[]
  stock_info_v2: { stock_type: string; stock: number }[]
  item_sku: string
  create_time: number
  update_time: number
  promotion_reserved?: number
}

export interface GetItemListResponse extends ShopeeBaseResponse {
  response: {
    item: Array<{ item_id: number; item_status: string; update_time: number }>
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface GetItemBaseInfoResponse extends ShopeeBaseResponse {
  response: {
    item_list: ShopeeItem[]
    warning?: string
  }
}

export interface ShopeeSearchItem {
  item_id: number
  item_name: string
  image: string
  price_min: number
  price_max: number
  currency: string
  category_id: number
  shop_id: number
  shop_name: string
  sales: number
  rating_star: number
}

export interface SearchItemResponse extends ShopeeBaseResponse {
  response: {
    item_list: ShopeeSearchItem[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ShopeeCategory {
  category_id: number
  parent_category_id: number
  original_category_name: string
  display_name: string
  has_children: boolean
}

export interface GetCategoryResponse extends ShopeeBaseResponse {
  response: {
    category_list: ShopeeCategory[]
  }
}

export interface ShopeeBrand {
  brand_id: number
  brand_name: string
  original_brand_name: string
}

export interface GetBrandListResponse extends ShopeeBaseResponse {
  response: {
    brand_list: ShopeeBrand[]
    has_next: boolean
    next_offset?: number
  }
}

export interface BoostItemResponse extends ShopeeBaseResponse {
  response: {
    boost_item_list: Array<{
      item_id: number
      boost_status: number
      start_time: number
      end_time: number
    }>
  }
}

export interface GetBoostedListResponse extends ShopeeBaseResponse {
  response: {
    boosted_item_list: Array<{
      item_id: number
      boost_status: number
      start_time: number
      end_time: number
    }>
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeComment {
  comment_id: number
  item_id: number
  user_name: string
  rating_star: number
  comment: string
  create_time: number
  reply_list?: Array<{
    reply_id: number
    reply: string
    create_time: number
  }>
}

export interface GetCommentResponse extends ShopeeBaseResponse {
  response: {
    comment_list: ShopeeComment[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ReplyCommentResponse extends ShopeeBaseResponse {
  response: {
    reply_list: Array<{
      comment_id: number
      reply_id: number
    }>
  }
}

// ═══════════════════════════════════════════════════════════════════
// Order Types
// ═══════════════════════════════════════════════════════════════════

export interface GetOrderListParams {
  time_range_field: 'create_time' | 'update_time'
  time_from: number
  time_to: number
  page_size?: number
  cursor?: string
  order_status?: string
}

export interface GetOrderDetailParams {
  order_sn_list: string[]
  response_optional_fields?: string[]
}

export interface GetShipmentListParams {
  cursor?: string
  page_size?: number
}

export interface CancelOrderParams {
  order_sn: string
  cancel_reason: string
  item_list?: Array<{ item_id: number; model_id?: number }>
}

export interface ShopeeOrderItem {
  item_id: number
  model_id: number
  item_name: string
  model_name: string
  order_item_id: number
  original_price: number
  deal_price: number
  quantity_purchased: number
  product_discount: number
  item_discount: number
  wholesale: boolean
  weight: number
  image: string
  promotion_group_id?: number
}

export interface ShopeeOrder {
  order_sn: string
  order_status: string
  create_time: number
  update_time: number
  checkout_time?: number
  cancel_by?: string
  cancel_reason?: string
  item_list: ShopeeOrderItem[]
  buyer_user_id: number
  buyer_username: string
  recipient_address: {
    name: string
    phone: string
    town: string
    district: string
    city: string
    state: string
    region: string
    zipcode: string
    full_address: string
  }
  actual_shipping_fee?: number
  total_amount: number
  currency: string
  escrow_amount?: number
  note?: string
  note_update_time?: number
  pay_time?: number
  days_to_ship: number
  ship_by_date?: number
  payment_method: string
  shipping_carrier: string
}

export interface GetOrderListResponse extends ShopeeBaseResponse {
  response: {
    order_list: Array<{
      order_sn: string
      order_status: string
    }>
    more: boolean
    next_cursor?: string
  }
}

export interface GetOrderDetailResponse extends ShopeeBaseResponse {
  response: {
    order_list: ShopeeOrder[]
  }
}

export interface GetShipmentListResponse extends ShopeeBaseResponse {
  response: {
    order_list: Array<{
      order_sn: string
      order_status: string
      package_number?: string
    }>
    more: boolean
    next_cursor?: string
  }
}

export interface CancelOrderResponse extends ShopeeBaseResponse {
  response: {
    order_sn: string
  }
}

// ═══════════════════════════════════════════════════════════════════
// Shop Types
// ═══════════════════════════════════════════════════════════════════

export type GetShopProfileParams = Record<string, never> // no required params — uses configured shop_id

export interface GetShopInfoParams {
  shop_id_list?: number[]
}

export interface UpdateProfileParams {
  shop_name?: string
  shop_logo?: string
  description?: string
}

export interface ShopeeShopProfile {
  shop_id: number
  shop_name: string
  shop_description: string
  shop_logo: string
  region: string
  status: string
  item_limit: number
  create_time: number
}

export interface GetShopProfileResponse extends ShopeeBaseResponse {
  response: ShopeeShopProfile
}

export interface ShopeeShopInfo {
  shop_id: number
  shop_name: string
  shop_description: string
  shop_logo: string
  status: string
}

export interface GetShopInfoResponse extends ShopeeBaseResponse {
  response: {
    shop_list: ShopeeShopInfo[]
  }
}

export interface UpdateProfileResponse extends ShopeeBaseResponse {
  response: Record<string, unknown>
}

export interface ShopeeShopPerformance {
  shop_id: number
  rating_star: number
  rating_bad: number
  rating_normal: number
  rating_good: number
  overall_rating_count: number
  response_rate: number
  preparation_time: number
  cancellation_rate: number
  non_fulfillment_rate: number
  order_count_30d: number
  order_count_60d: number
  order_count_90d: number
}

export interface GetShopPerformanceResponse extends ShopeeBaseResponse {
  response: ShopeeShopPerformance
}

// ═══════════════════════════════════════════════════════════════════
// Payment / Escrow Types
// ═══════════════════════════════════════════════════════════════════

export interface GetEscrowDetailParams {
  order_sn: string
}

export interface GetEscrowListParams {
  offset?: number
  page_size?: number
  from_time?: number
  to_time?: number
  escrow_status?: string
}

export interface GetWalletTransactionListParams {
  offset?: number
  page_size?: number
  from_time?: number
  to_time?: number
  transaction_type?: string
}

export interface GetIncomeOverviewParams {
  from_time?: number
  to_time?: number
}

export interface ShopeeEscrowDetail {
  order_sn: string
  order_income: {
    escrow_amount: number
    buyer_paid_amount: number
    actual_shipping_fee: number
    original_shipping_fee: number
    commission_fee: number
    service_fee: number
    voucher_from_seller: number
    voucher_from_shopee: number
    coin: number
    credit_card_promotion: number
    order_adjustment_fee: number
    cross_border_tax: number
    seller_return_refund: number
    last_mile_fee: number
    payment_promo: number
  }
  income_time: number
  escrow_time: number
}

export interface GetEscrowDetailResponse extends ShopeeBaseResponse {
  response: ShopeeEscrowDetail
}

export interface ShopeeEscrowSummary {
  order_sn: string
  escrow_amount: number
  escrow_status: string
  create_time: number
}

export interface GetEscrowListResponse extends ShopeeBaseResponse {
  response: {
    order_list: ShopeeEscrowSummary[]
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeWalletTransaction {
  transaction_id: number
  transaction_type: string
  transaction_amount: number
  current_balance: number
  create_time: number
  order_sn?: string
  withdrawal_id?: number
  description: string
}

export interface GetWalletTransactionListResponse extends ShopeeBaseResponse {
  response: {
    transaction_list: ShopeeWalletTransaction[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ShopeeIncomeOverview {
  total_income: number
  income_7d: number
  income_30d: number
  pending_income: number
  available_for_withdrawal: number
  in_withdrawal: number
  currency: string
}

export interface GetIncomeOverviewResponse extends ShopeeBaseResponse {
  response: ShopeeIncomeOverview
}

// ═══════════════════════════════════════════════════════════════════
// Logistics Types
// ═══════════════════════════════════════════════════════════════════

export interface GetShippingParameterParams {
  order_sn: string
}

export interface GetTrackingNumberParams {
  order_sn: string
  package_number?: string
}

export interface GetTrackingInfoParams {
  order_sn: string
  package_number?: string
}

export type GetChannelListParams = Record<string, never> // no required params

export interface ShopeeShippingParameter {
  order_sn: string
  pickup: {
    address_list: Array<{
      address_id: number
      address: string
      is_default: boolean
    }>
    pickup_time_list: Array<{
      date: string
      time_text: string
      pickup_time_id: number
    }>
  }
  dropoff: {
    branch_list: Array<{
      branch_id: number
      branch_name: string
      region: string
      address: string
    }>
  }
  info_needed: {
    pickup?: string[]
    dropoff?: string[]
  }
}

export interface GetShippingParameterResponse extends ShopeeBaseResponse {
  response: ShopeeShippingParameter
}

export interface ShopeeTrackingNumber {
  order_sn: string
  package_number: string
  tracking_number: string
}

export interface GetTrackingNumberResponse extends ShopeeBaseResponse {
  response: ShopeeTrackingNumber
}

export interface ShopeeTrackingInfo {
  order_sn: string
  package_number: string
  tracking_number: string
  tracking_info_list: Array<{
    status: string
    update_time: number
    description: string
    city: string
    state: string
    country: string
  }>
}

export interface GetTrackingInfoResponse extends ShopeeBaseResponse {
  response: ShopeeTrackingInfo
}

export interface ShopeeLogisticsChannel {
  channel_id: number
  channel_name: string
  enabled: boolean
  cod_enabled: boolean
  estimated_shipping_fee: number
  estimated_delivery_time: number
  region: string
}

export interface GetChannelListResponse extends ShopeeBaseResponse {
  response: {
    logistics_channel_list: ShopeeLogisticsChannel[]
  }
}

// ═══════════════════════════════════════════════════════════════════
// Promotion Types
// ═══════════════════════════════════════════════════════════════════

export interface GetDiscountListParams {
  discount_status?: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
  offset?: number
  page_size?: number
}

export interface GetVoucherListParams {
  voucher_status?: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
  offset?: number
  page_size?: number
}

export interface AddVoucherParams {
  voucher_name: string
  voucher_type: number
  discount: number
  min_spend: number
  start_time: number
  end_time: number
  voucher_quantity: number
  apply_items?: 'ALL_ITEMS' | 'SELECTED_ITEMS'
  item_id_list?: number[]
  max_discount?: number
}

export interface GetFlashSaleListParams {
  offset?: number
  page_size?: number
  flash_sale_status?: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
}

export interface GetBundleDealListParams {
  offset?: number
  page_size?: number
  bundle_deal_status?: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
}

export interface GetAddOnDealListParams {
  offset?: number
  page_size?: number
  add_on_deal_status?: 'UPCOMING' | 'ONGOING' | 'EXPIRED'
}

export interface ShopeeDiscount {
  discount_id: number
  discount_name: string
  discount_type: number
  discount_start_time: number
  discount_end_time: number
  status: string
  item_count: number
}

export interface GetDiscountListResponse extends ShopeeBaseResponse {
  response: {
    discount_list: ShopeeDiscount[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ShopeeVoucher {
  voucher_id: number
  voucher_name: string
  voucher_code: string
  voucher_type: number
  discount: number
  min_spend: number
  start_time: number
  end_time: number
  voucher_quantity: number
  claimed_quantity: number
  status: string
}

export interface GetVoucherListResponse extends ShopeeBaseResponse {
  response: {
    voucher_list: ShopeeVoucher[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface AddVoucherResponse extends ShopeeBaseResponse {
  response: {
    voucher_id: number
    voucher_code: string
  }
}

export interface ShopeeFlashSale {
  flash_sale_id: number
  flash_sale_name: string
  start_time: number
  end_time: number
  status: string
  item_count: number
}

export interface GetFlashSaleListResponse extends ShopeeBaseResponse {
  response: {
    flash_sale_list: ShopeeFlashSale[]
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeBundleDeal {
  bundle_deal_id: number
  bundle_deal_name: string
  start_time: number
  end_time: number
  status: string
  item_count: number
}

export interface GetBundleDealListResponse extends ShopeeBaseResponse {
  response: {
    bundle_deal_list: ShopeeBundleDeal[]
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeAddOnDeal {
  add_on_deal_id: number
  add_on_deal_name: string
  start_time: number
  end_time: number
  status: string
  item_count: number
}

export interface GetAddOnDealListResponse extends ShopeeBaseResponse {
  response: {
    add_on_deal_list: ShopeeAddOnDeal[]
    has_next: boolean
    next_offset?: number
  }
}

// ═══════════════════════════════════════════════════════════════════
// Account Health Types
// ═══════════════════════════════════════════════════════════════════

export interface GetPenaltyPointHistoryParams {
  from_time?: number
  to_time?: number
  page_size?: number
  offset?: number
}

export interface GetPunishmentHistoryParams {
  from_time?: number
  to_time?: number
  page_size?: number
  offset?: number
}

export interface GetListingsWithIssuesParams {
  page_size?: number
  offset?: number
  issue_type?: string
}

export interface GetLateOrdersParams {
  from_time?: number
  to_time?: number
  page_size?: number
  offset?: number
}

export interface ShopeePenaltyPoint {
  penalty_id: number
  penalty_points: number
  reason: string
  order_sn?: string
  violation_type: string
  create_time: number
}

export interface GetPenaltyPointHistoryResponse extends ShopeeBaseResponse {
  response: {
    penalty_point_list: ShopeePenaltyPoint[]
    total_penalty_points: number
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeePunishment {
  punishment_id: number
  punishment_type: string
  reason: string
  start_time: number
  end_time: number
  is_active: boolean
}

export interface GetPunishmentHistoryResponse extends ShopeeBaseResponse {
  response: {
    punishment_list: ShopeePunishment[]
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeListingIssue {
  item_id: number
  item_name: string
  issue_type: string
  issue_description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  detected_time: number
}

export interface GetListingsWithIssuesResponse extends ShopeeBaseResponse {
  response: {
    listing_issue_list: ShopeeListingIssue[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ShopeeLateOrder {
  order_sn: string
  order_status: string
  create_time: number
  ship_by_date: number
  days_late: number
  reason: string
}

export interface GetLateOrdersResponse extends ShopeeBaseResponse {
  response: {
    late_order_list: ShopeeLateOrder[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

// ═══════════════════════════════════════════════════════════════════
// Ads Types
// ═══════════════════════════════════════════════════════════════════

export type GetTotalBalanceParams = Record<string, never> // no required params

export interface GetCampaignPerformanceParams {
  from_time: number
  to_time: number
  campaign_id_list?: number[]
  page_size?: number
  offset?: number
}

export interface GetRecommendedKeywordsParams {
  item_id: number
  page_size?: number
  offset?: number
}

export interface ShopeeAdsBalance {
  total_balance: number
  frozen_balance: number
  available_balance: number
  currency: string
}

export interface GetTotalBalanceResponse extends ShopeeBaseResponse {
  response: ShopeeAdsBalance
}

export interface ShopeeCampaignPerformance {
  campaign_id: number
  campaign_name: string
  campaign_type: string
  impressions: number
  clicks: number
  ctr: number
  cost: number
  conversions: number
  roas: number
  date: string
}

export interface GetCampaignPerformanceResponse extends ShopeeBaseResponse {
  response: {
    campaign_performance_list: ShopeeCampaignPerformance[]
    has_next: boolean
    next_offset?: number
  }
}

export interface ShopeeRecommendedKeyword {
  keyword: string
  search_volume: number
  suggested_bid: number
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH'
  relevance_score: number
}

export interface GetRecommendedKeywordsResponse extends ShopeeBaseResponse {
  response: {
    keyword_list: ShopeeRecommendedKeyword[]
    has_next: boolean
    next_offset?: number
  }
}

// ═══════════════════════════════════════════════════════════════════
// Push Types
// ═══════════════════════════════════════════════════════════════════

export interface SetPushConfigParams {
  push_config_list: Array<{
    push_type: string
    enable: boolean
  }>
}

export type GetPushConfigParams = Record<string, never> // no required params

export interface ShopeePushConfig {
  push_type: string
  enable: boolean
}

export interface SetPushConfigResponse extends ShopeeBaseResponse {
  response: {
    push_config_list: ShopeePushConfig[]
  }
}

export interface GetPushConfigResponse extends ShopeeBaseResponse {
  response: {
    push_config_list: ShopeePushConfig[]
  }
}

// ═══════════════════════════════════════════════════════════════════
// Chat Types
// ═══════════════════════════════════════════════════════════════════

export interface GetConversationsParams {
  offset?: number
  page_size?: number
  direction?: 'ASC' | 'DESC'
  type?: number
}

export interface GetMessagesParams {
  conversation_id: number
  offset?: number
  page_size?: number
  direction?: 'ASC' | 'DESC'
}

export interface SendMessageParams {
  conversation_id: number
  message: string
  message_type?: 'TEXT' | 'IMAGE' | 'STICKER'
  image_url?: string
}

export interface ShopeeConversation {
  conversation_id: number
  conversation_type: number
  last_message: string
  last_message_time: number
  unread_count: number
  buyer_user_id: number
  buyer_username: string
  shop_id: number
}

export interface GetConversationsResponse extends ShopeeBaseResponse {
  response: {
    conversation_list: ShopeeConversation[]
    has_next: boolean
    next_offset?: number
    total_count?: number
  }
}

export interface ShopeeChatMessage {
  message_id: number
  conversation_id: number
  message: string
  message_type: string
  from_user_id: number
  from_username: string
  to_user_id: number
  to_username: string
  create_time: number
  read: boolean
}

export interface GetMessagesResponse extends ShopeeBaseResponse {
  response: {
    message_list: ShopeeChatMessage[]
    has_next: boolean
    next_offset?: number
  }
}

export interface SendMessageResponse extends ShopeeBaseResponse {
  response: {
    message_id: number
    conversation_id: number
  }
}

// ═══════════════════════════════════════════════════════════════════
// Auth / Token Types
// ═══════════════════════════════════════════════════════════════════

export interface GetTokenResponse extends ShopeeBaseResponse {
  response: TokenData & {
    request_id?: string
  }
}

export interface RefreshTokenResponse extends ShopeeBaseResponse {
  response: TokenData & {
    request_id?: string
  }
}

// ═══════════════════════════════════════════════════════════════════
// Manager Classes
// ═══════════════════════════════════════════════════════════════════

/**
 * ProductManager — Manage items, categories, brands, boosts, and comments.
 * Most methods require seller API access (not available in affiliate-only mode).
 */
class ProductManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getItemList(params: GetItemListParams): Promise<GetItemListResponse> {
    return this.client.request<GetItemListResponse>('GET', '/product/get_item_list', params)
  }

  /** Requires seller API access */
  async getItemBaseInfo(params: GetItemBaseInfoParams): Promise<GetItemBaseInfoResponse> {
    return this.client.request<GetItemBaseInfoResponse>('GET', '/product/get_item_base_info', params)
  }

  /** Search items (some regions support affiliate mode) */
  async searchItem(params: SearchItemParams): Promise<SearchItemResponse> {
    return this.client.request<SearchItemResponse>('GET', '/product/search_item', params)
  }

  /** Requires seller API access */
  async getCategory(params?: GetCategoryParams): Promise<GetCategoryResponse> {
    return this.client.request<GetCategoryResponse>('GET', '/product/get_category', params)
  }

  /** Requires seller API access */
  async getBrandList(params?: GetBrandListParams): Promise<GetBrandListResponse> {
    return this.client.request<GetBrandListResponse>('GET', '/product/get_brand_list', params)
  }

  /** Requires seller API access — boost items to improve visibility */
  async boostItem(params: BoostItemParams): Promise<BoostItemResponse> {
    return this.client.request<BoostItemResponse>('POST', '/product/boost_item', params)
  }

  /** Requires seller API access */
  async getBoostedList(params?: GetBoostedListParams): Promise<GetBoostedListResponse> {
    return this.client.request<GetBoostedListResponse>('GET', '/product/get_boosted_item_list', params)
  }

  /** Requires seller API access */
  async getComment(params: GetCommentParams): Promise<GetCommentResponse> {
    return this.client.request<GetCommentResponse>('GET', '/product/get_comment', params)
  }

  /** Requires seller API access — reply to buyer comments */
  async replyComment(params: ReplyCommentParams): Promise<ReplyCommentResponse> {
    return this.client.request<ReplyCommentResponse>('POST', '/product/reply_comment', params)
  }
}

/**
 * OrderManager — Manage orders, shipments, and cancellations.
 * All methods require seller API access.
 */
class OrderManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getOrderList(params: GetOrderListParams): Promise<GetOrderListResponse> {
    return this.client.request<GetOrderListResponse>('GET', '/order/get_order_list', params)
  }

  /** Requires seller API access */
  async getOrderDetail(params: GetOrderDetailParams): Promise<GetOrderDetailResponse> {
    return this.client.request<GetOrderDetailResponse>('GET', '/order/get_order_detail', params)
  }

  /** Requires seller API access */
  async getShipmentList(params?: GetShipmentListParams): Promise<GetShipmentListResponse> {
    return this.client.request<GetShipmentListResponse>('GET', '/order/get_shipment_list', params)
  }

  /** Requires seller API access */
  async cancelOrder(params: CancelOrderParams): Promise<CancelOrderResponse> {
    return this.client.request<CancelOrderResponse>('POST', '/order/cancel_order', params)
  }
}

/**
 * ShopManager — Shop profile and performance information.
 * Some methods may be available in affiliate mode (read-only).
 */
class ShopManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getProfile(_params?: GetShopProfileParams): Promise<GetShopProfileResponse> {
    return this.client.request<GetShopProfileResponse>('GET', '/shop/get_shop_profile')
  }

  /** Public info — may work in affiliate mode */
  async getShopInfo(params?: GetShopInfoParams): Promise<GetShopInfoResponse> {
    return this.client.request<GetShopInfoResponse>('GET', '/shop/get_shop_info', params)
  }

  /** Requires seller API access */
  async updateProfile(params: UpdateProfileParams): Promise<UpdateProfileResponse> {
    return this.client.request<UpdateProfileResponse>('POST', '/shop/update_shop_profile', params)
  }

  /** Requires seller API access */
  async getShopPerformance(): Promise<GetShopPerformanceResponse> {
    return this.client.request<GetShopPerformanceResponse>('GET', '/shop/get_shop_performance')
  }
}

/**
 * PaymentManager — Escrow, wallet, and income information.
 * All methods require seller API access.
 */
class PaymentManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getEscrowDetail(params: GetEscrowDetailParams): Promise<GetEscrowDetailResponse> {
    return this.client.request<GetEscrowDetailResponse>('GET', '/payment/get_escrow_detail', params)
  }

  /** Requires seller API access */
  async getEscrowList(params?: GetEscrowListParams): Promise<GetEscrowListResponse> {
    return this.client.request<GetEscrowListResponse>('GET', '/payment/get_escrow_list', params)
  }

  /** Requires seller API access */
  async getWalletTransactionList(params?: GetWalletTransactionListParams): Promise<GetWalletTransactionListResponse> {
    return this.client.request<GetWalletTransactionListResponse>('GET', '/payment/get_wallet_transaction_list', params)
  }

  /** Requires seller API access */
  async getIncomeOverview(params?: GetIncomeOverviewParams): Promise<GetIncomeOverviewResponse> {
    return this.client.request<GetIncomeOverviewResponse>('GET', '/payment/get_income_overview', params)
  }
}

/**
 * LogisticsManager — Shipping, tracking, and channel management.
 * All methods require seller API access.
 */
class LogisticsManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getShippingParameter(params: GetShippingParameterParams): Promise<GetShippingParameterResponse> {
    return this.client.request<GetShippingParameterResponse>('GET', '/logistics/get_shipping_parameter', params)
  }

  /** Requires seller API access */
  async getTrackingNumber(params: GetTrackingNumberParams): Promise<GetTrackingNumberResponse> {
    return this.client.request<GetTrackingNumberResponse>('GET', '/logistics/get_tracking_number', params)
  }

  /** Requires seller API access */
  async getTrackingInfo(params: GetTrackingInfoParams): Promise<GetTrackingInfoResponse> {
    return this.client.request<GetTrackingInfoResponse>('GET', '/logistics/get_tracking_info', params)
  }

  /** Requires seller API access */
  async getChannelList(_params?: GetChannelListParams): Promise<GetChannelListResponse> {
    return this.client.request<GetChannelListResponse>('GET', '/logistics/get_channel_list')
  }
}

/**
 * PromotionManager — Discounts, vouchers, flash sales, bundle & add-on deals.
 * All methods require seller API access.
 */
class PromotionManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getDiscountList(params?: GetDiscountListParams): Promise<GetDiscountListResponse> {
    return this.client.request<GetDiscountListResponse>('GET', '/discount/get_discount_list', params)
  }

  /** Requires seller API access */
  async getVoucherList(params?: GetVoucherListParams): Promise<GetVoucherListResponse> {
    return this.client.request<GetVoucherListResponse>('GET', '/voucher/get_voucher_list', params)
  }

  /** Requires seller API access */
  async addVoucher(params: AddVoucherParams): Promise<AddVoucherResponse> {
    return this.client.request<AddVoucherResponse>('POST', '/voucher/add_voucher', params)
  }

  /** Requires seller API access */
  async getFlashSaleList(params?: GetFlashSaleListParams): Promise<GetFlashSaleListResponse> {
    return this.client.request<GetFlashSaleListResponse>('GET', '/flash_sale/get_flash_sale_list', params)
  }

  /** Requires seller API access */
  async getBundleDealList(params?: GetBundleDealListParams): Promise<GetBundleDealListResponse> {
    return this.client.request<GetBundleDealListResponse>('GET', '/bundle_deal/get_bundle_deal_list', params)
  }

  /** Requires seller API access */
  async getAddOnDealList(params?: GetAddOnDealListParams): Promise<GetAddOnDealListResponse> {
    return this.client.request<GetAddOnDealListResponse>('GET', '/add_on_deal/get_add_on_deal_list', params)
  }
}

/**
 * AccountHealthManager — Shop health metrics, penalties, and listing issues.
 * All methods require seller API access.
 */
class AccountHealthManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getShopPerformance(): Promise<GetShopPerformanceResponse> {
    return this.client.request<GetShopPerformanceResponse>('GET', '/shop/get_shop_performance')
  }

  /** Requires seller API access */
  async getPenaltyPointHistory(params?: GetPenaltyPointHistoryParams): Promise<GetPenaltyPointHistoryResponse> {
    return this.client.request<GetPenaltyPointHistoryResponse>('GET', '/account_health/get_penalty_point_history', params)
  }

  /** Requires seller API access */
  async getPunishmentHistory(params?: GetPunishmentHistoryParams): Promise<GetPunishmentHistoryResponse> {
    return this.client.request<GetPunishmentHistoryResponse>('GET', '/account_health/get_punishment_history', params)
  }

  /** Requires seller API access */
  async getListingsWithIssues(params?: GetListingsWithIssuesParams): Promise<GetListingsWithIssuesResponse> {
    return this.client.request<GetListingsWithIssuesResponse>('GET', '/account_health/get_listings_with_issues', params)
  }

  /** Requires seller API access */
  async getLateOrders(params?: GetLateOrdersParams): Promise<GetLateOrdersResponse> {
    return this.client.request<GetLateOrdersResponse>('GET', '/account_health/get_late_orders', params)
  }
}

/**
 * AdsManager — Shopee Ads balance, campaign performance, and keyword recommendations.
 * All methods require seller API access with Ads feature enabled.
 */
class AdsManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access + Ads feature */
  async getTotalBalance(_params?: GetTotalBalanceParams): Promise<GetTotalBalanceResponse> {
    return this.client.request<GetTotalBalanceResponse>('GET', '/ads/get_total_balance')
  }

  /** Requires seller API access + Ads feature */
  async getCampaignPerformance(params: GetCampaignPerformanceParams): Promise<GetCampaignPerformanceResponse> {
    return this.client.request<GetCampaignPerformanceResponse>('GET', '/ads/get_campaign_performance', params)
  }

  /** Requires seller API access + Ads feature */
  async getRecommendedKeywords(params: GetRecommendedKeywordsParams): Promise<GetRecommendedKeywordsResponse> {
    return this.client.request<GetRecommendedKeywordsResponse>('GET', '/ads/get_recommended_keywords', params)
  }
}

/**
 * PushManager — Configure push notification settings.
 * Requires seller API access.
 */
class PushManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async setPushConfig(params: SetPushConfigParams): Promise<SetPushConfigResponse> {
    return this.client.request<SetPushConfigResponse>('POST', '/push/set_push_config', params)
  }

  /** Requires seller API access */
  async getPushConfig(_params?: GetPushConfigParams): Promise<GetPushConfigResponse> {
    return this.client.request<GetPushConfigResponse>('GET', '/push/get_push_config')
  }
}

/**
 * ChatManager — Manage buyer conversations and messages.
 * Requires seller API access.
 */
class ChatManager {
  constructor(private client: ShopeeOpenAPIClient) {}

  /** Requires seller API access */
  async getConversations(params?: GetConversationsParams): Promise<GetConversationsResponse> {
    return this.client.request<GetConversationsResponse>('GET', '/chat/get_conversations', params)
  }

  /** Requires seller API access */
  async getMessages(params: GetMessagesParams): Promise<GetMessagesResponse> {
    return this.client.request<GetMessagesResponse>('GET', '/chat/get_messages', params)
  }

  /** Requires seller API access */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    return this.client.request<SendMessageResponse>('POST', '/chat/send_message', params)
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main Client
// ═══════════════════════════════════════════════════════════════════

export class ShopeeOpenAPIClient {
  private readonly partnerId: number
  private readonly partnerKey: string
  private readonly shopId: number | undefined
  private readonly region: ShopeeRegion
  private readonly baseUrl: string
  private readonly tokenStorage: TokenStorage

  private accessToken: string | undefined
  private refreshToken: string | undefined
  private tokenExpireAt: number | undefined
  private refreshExpireAt: number | undefined

  // Auto-refresh buffer: refresh 5 minutes before actual expiry
  private static readonly REFRESH_BUFFER_SECONDS = 300

  // ─── Manager instances (lazy access) ─────────────────────────

  private _product: ProductManager | null = null
  private _order: OrderManager | null = null
  private _shop: ShopManager | null = null
  private _payment: PaymentManager | null = null
  private _logistics: LogisticsManager | null = null
  private _promotion: PromotionManager | null = null
  private _accountHealth: AccountHealthManager | null = null
  private _ads: AdsManager | null = null
  private _push: PushManager | null = null
  private _chat: ChatManager | null = null

  constructor(config: ShopeeOpenAPIConfig) {
    this.partnerId = config.partnerId
    this.partnerKey = config.partnerKey
    this.shopId = config.shopId
    this.region = config.region
    this.baseUrl = config.baseUrl ?? REGION_BASE_URLS[config.region]
    this.tokenStorage = config.tokenStorage ?? new InMemoryTokenStorage() as TokenStorage

    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
    this.tokenExpireAt = config.tokenExpireAt
  }

  // ─── Manager accessors ──────────────────────────────────────

  get product(): ProductManager {
    if (!this._product) this._product = new ProductManager(this)
    return this._product
  }

  get order(): OrderManager {
    if (!this._order) this._order = new OrderManager(this)
    return this._order
  }

  get shop(): ShopManager {
    if (!this._shop) this._shop = new ShopManager(this)
    return this._shop
  }

  get payment(): PaymentManager {
    if (!this._payment) this._payment = new PaymentManager(this)
    return this._payment
  }

  get logistics(): LogisticsManager {
    if (!this._logistics) this._logistics = new LogisticsManager(this)
    return this._logistics
  }

  get promotion(): PromotionManager {
    if (!this._promotion) this._promotion = new PromotionManager(this)
    return this._promotion
  }

  get accountHealth(): AccountHealthManager {
    if (!this._accountHealth) this._accountHealth = new AccountHealthManager(this)
    return this._accountHealth
  }

  get ads(): AdsManager {
    if (!this._ads) this._ads = new AdsManager(this)
    return this._ads
  }

  get push(): PushManager {
    if (!this._push) this._push = new PushManager(this)
    return this._push
  }

  get chat(): ChatManager {
    if (!this._chat) this._chat = new ChatManager(this)
    return this._chat
  }

  // ─── HMAC-SHA256 Signature ──────────────────────────────────

  /**
   * Generate the HMAC-SHA256 signature required by Shopee Open API v2.
   *
   * Signature base string format:
   *   {partner_id}{path}{timestamp}{access_token}{shop_id}
   *
   * access_token and shop_id are included only when they are available.
   */
  private generateSignature(path: string, timestamp: number): string {
    let baseString = `${this.partnerId}${path}${timestamp}`

    if (this.accessToken) {
      baseString += this.accessToken
    }

    if (this.shopId) {
      baseString += this.shopId.toString()
    }

    return crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex')
  }

  // ─── Auto Token Refresh ─────────────────────────────────────

  /**
   * Check if the current access token is expired (or about to expire).
   * Returns true if token needs refresh.
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpireAt) return true
    const now = Math.floor(Date.now() / 1000)
    return now >= (this.tokenExpireAt - ShopeeOpenAPIClient.REFRESH_BUFFER_SECONDS)
  }

  /**
   * Attempt to refresh the access token using the refresh token.
   * Automatically stores the new tokens via the token storage strategy.
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.shopId) return

    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const path = '/auth/token/get'
      const sign = this.generateSignature(path, timestamp)

      const body = {
        partner_id: this.partnerId,
        shop_id: this.shopId,
        refresh_token: this.refreshToken,
      }

      const url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&shop_id=${this.shopId}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.error(`[ShopeeOpenAPI] Token refresh HTTP error: ${response.status}`)
        return
      }

      const data = await response.json()

      if (data.error !== 0) {
        console.error(`[ShopeeOpenAPI] Token refresh API error: ${data.error} - ${data.message}`)
        return
      }

      const { access_token, refresh_token, expire_at, refresh_expire_at } = data.response

      this.accessToken = access_token
      this.refreshToken = refresh_token
      this.tokenExpireAt = expire_at
      this.refreshExpireAt = refresh_expire_at

      // Persist via token storage
      await this.tokenStorage.store(this.shopId, {
        accessToken: access_token,
        refreshToken: refresh_token,
        expireAt: expire_at,
        refreshExpireAt: refresh_expire_at,
      })

      // Token refreshed successfully — no need to log in production
    } catch (error) {
      console.error('[ShopeeOpenAPI] Token refresh failed:', error)
    }
  }

  /**
   * Load tokens from storage if not already set in memory.
   */
  private async loadTokensFromStorage(): Promise<void> {
    if (this.accessToken || !this.shopId) return

    const stored = await this.tokenStorage.get(this.shopId)
    if (stored) {
      this.accessToken = stored.accessToken
      this.refreshToken = stored.refreshToken
      this.tokenExpireAt = stored.expireAt
      this.refreshExpireAt = stored.refreshExpireAt
    }
  }

  /**
   * Ensure we have a valid (non-expired) access token.
   * Will auto-refresh if the token is expired and a refresh token is available.
   */
  private async ensureValidToken(): Promise<void> {
    await this.loadTokensFromStorage()

    if (this.isTokenExpired() && this.refreshToken) {
      await this.refreshAccessToken()
    }
  }

  // ─── Core Request Method ────────────────────────────────────

  /**
   * Make an authenticated request to Shopee Open API v2.
   *
   * @param method - HTTP method (GET or POST)
   * @param path   - API endpoint path (e.g. '/product/get_item_list')
   * @param params - Query params (GET) or body params (POST)
   * @returns Typed API response
   * @throws ShopeeApiError if the API returns a non-zero error code
   */
  async request<T>(method: 'GET' | 'POST', path: string, params?: unknown): Promise<T> {
    await this.ensureValidToken()

    const timestamp = Math.floor(Date.now() / 1000)
    const sign = this.generateSignature(path, timestamp)

    // Build common query params
    const queryParams: Record<string, string | number> = {
      partner_id: this.partnerId,
      timestamp,
      sign,
    }

    if (this.shopId) {
      queryParams.shop_id = this.shopId
    }

    if (this.accessToken) {
      queryParams.access_token = this.accessToken
    }

    let url: string
    let fetchOptions: RequestInit

    if (method === 'GET') {
      // Merge query params with endpoint-specific params
      const allParams = { ...queryParams, ...flattenParams(params as Record<string, unknown>) }
      const qs = new URLSearchParams(
        Object.entries(allParams).map(([k, v]) => [k, String(v)])
      ).toString()
      url = `${this.baseUrl}${path}?${qs}`
      fetchOptions = { method: 'GET' }
    } else {
      // POST: query params for auth, body for data
      const qs = new URLSearchParams(
        Object.entries(queryParams).map(([k, v]) => [k, String(v)])
      ).toString()
      url = `${this.baseUrl}${path}?${qs}`
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params ?? {}),
      }
    }

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new ShopeeApiError({
        code: 0,
        message: `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
      })
    }

    const data = await response.json()

    if (data.error !== undefined && data.error !== 0) {
      throw new ShopeeApiError({
        code: data.error,
        message: data.message || 'Unknown API error',
        httpStatus: response.status,
        raw: data,
      })
    }

    return data as T
  }

  // ─── Auth Helper Methods ────────────────────────────────────

  /**
   * Build the authorization URL to redirect sellers for OAuth consent.
   * After consent, Shopee redirects to your redirect_url with a code parameter.
   */
  getAuthUrl(redirectUrl: string): string {
    const path = '/api/v2/shop/auth_partner'
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = this.generateSignature(path, timestamp)

    const params = new URLSearchParams({
      partner_id: this.partnerId.toString(),
      timestamp: timestamp.toString(),
      sign,
      redirect: redirectUrl,
    })

    return `${this.baseUrl.replace('/api/v2', '')}${path}?${params.toString()}`
  }

  /**
   * Exchange an authorization code for access + refresh tokens.
   * Call this after the seller grants consent and you receive a code.
   */
  async getToken(code: string, shopId?: number): Promise<GetTokenResponse> {
    const path = '/auth/token/get'
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = this.generateSignature(path, timestamp)

    const queryParams: Record<string, string | number> = {
      partner_id: this.partnerId,
      timestamp,
      sign,
    }

    if (shopId ?? this.shopId) {
      queryParams.shop_id = (shopId ?? this.shopId)!
    }

    const qs = new URLSearchParams(
      Object.entries(queryParams).map(([k, v]) => [k, String(v)])
    ).toString()

    const url = `${this.baseUrl}${path}?${qs}`
    const body = { code, partner_id: this.partnerId, shop_id: shopId ?? this.shopId }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new ShopeeApiError({
        code: 0,
        message: `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
      })
    }

    const data = await response.json()

    if (data.error !== 0) {
      throw new ShopeeApiError({
        code: data.error,
        message: data.message || 'Token exchange failed',
        httpStatus: response.status,
        raw: data,
      })
    }

    // Store tokens
    const tokenData = data.response as TokenData
    this.accessToken = tokenData.accessToken
    this.refreshToken = tokenData.refreshToken
    this.tokenExpireAt = tokenData.expireAt
    this.refreshExpireAt = tokenData.refreshExpireAt

    const sid = shopId ?? this.shopId
    if (sid) {
      await this.tokenStorage.store(sid, tokenData)
    }

    return data as GetTokenResponse
  }

  /**
   * Cancel shop authorization (revoke tokens).
   */
  async cancelAuth(shopId?: number): Promise<void> {
    const sid = shopId ?? this.shopId
    if (sid) {
      await this.tokenStorage.clear(sid)
    }
    this.accessToken = undefined
    this.refreshToken = undefined
    this.tokenExpireAt = undefined
    this.refreshExpireAt = undefined
  }

  // ─── Utility ────────────────────────────────────────────────

  /** Get the configured region */
  getRegion(): ShopeeRegion {
    return this.region
  }

  /** Get the base URL */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /** Get current access token (if any) */
  getAccessToken(): string | undefined {
    return this.accessToken
  }

  /** Check if the client has valid (non-expired) tokens */
  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired()
  }

  /** Test connectivity — calls the shop profile endpoint */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    try {
      const result = await this.shop.getProfile()
      const profile = result.response
      return {
        success: true,
        message: `Connected as ${profile.shop_name} (${profile.status})`,
        region: this.region,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof ShopeeApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Connection test failed',
        region: this.region,
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Flatten nested params for GET query strings.
 * e.g. { item_id_list: [1, 2] } → { item_id_list: "1,2" }
 */
function flattenParams(
  params?: Record<string, unknown>
): Record<string, string | number> {
  if (!params) return {}

  const result: Record<string, string | number> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      // Shopee API expects comma-separated arrays
      result[key] = value.join(',')
    } else if (typeof value === 'object') {
      // Skip nested objects in GET params
      continue
    } else {
      result[key] = value as string | number
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════
// Singleton Factory
// ═══════════════════════════════════════════════════════════════════

let _openApiClient: ShopeeOpenAPIClient | null = null

/**
 * Get or create a ShopeeOpenAPIClient singleton.
 * Provide a config to create a new instance; omit to reuse the existing one.
 */
export function getShopeeOpenAPIClient(config?: ShopeeOpenAPIConfig): ShopeeOpenAPIClient | null {
  if (config) {
    _openApiClient = new ShopeeOpenAPIClient(config)
  }
  return _openApiClient
}

/**
 * Build a ShopeeOpenAPIClient from database settings.
 * Returns null if the required credentials (partner_id, partner_key) are not configured.
 */
export async function getShopeeOpenAPIClientFromDB(): Promise<ShopeeOpenAPIClient | null> {
  try {
    const { db } = await import('@/lib/db')

    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'shopee_partner_id',
            'shopee_partner_key',
            'shopee_shop_id',
            'shopee_region',
            'shopee_open_access_token',
            'shopee_open_refresh_token',
          ],
        },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    const partnerId = settingsMap.shopee_partner_id
    const partnerKey = settingsMap.shopee_partner_key

    if (!partnerId || !partnerKey) {
      return null
    }

    return new ShopeeOpenAPIClient({
      partnerId: Number(partnerId),
      partnerKey,
      shopId: settingsMap.shopee_shop_id ? Number(settingsMap.shopee_shop_id) : undefined,
      region: (settingsMap.shopee_region?.toUpperCase() as ShopeeRegion) || 'MY',
      accessToken: settingsMap.shopee_open_access_token,
      refreshToken: settingsMap.shopee_open_refresh_token,
    })
  } catch (error) {
    console.error('[ShopeeOpenAPI] Failed to load client from DB:', error)
    return null
  }
}
