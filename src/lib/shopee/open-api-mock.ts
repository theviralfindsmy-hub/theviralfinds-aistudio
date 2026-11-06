/**
 * Shopee Open API v2 — Mock Data Service
 *
 * Simulates realistic Shopee seller/affiliate data for Malaysia (MY) market.
 * Uses Malaysian Ringgit (RM) pricing, authentic Malay/English product names,
 * and realistic Malaysian shop names.
 *
 * This service mirrors the same method signatures as ShopeeOpenAPIClient's managers,
 * so they can be used interchangeably for development and testing.
 *
 * DO NOT modify graphql-client.ts, affiliate-api.ts, or open-api-client.ts.
 */

import type {
  // Product
  GetItemListResponse,
  GetItemBaseInfoResponse,
  SearchItemResponse,
  GetCategoryResponse,
  GetBrandListResponse,
  BoostItemResponse,
  GetBoostedListResponse,
  GetCommentResponse,
  ReplyCommentResponse,
  // Order
  GetOrderListResponse,
  GetOrderDetailResponse,
  GetShipmentListResponse,
  CancelOrderResponse,
  // Shop
  GetShopProfileResponse,
  GetShopInfoResponse,
  UpdateProfileResponse,
  GetShopPerformanceResponse,
  // Payment
  GetEscrowDetailResponse,
  GetEscrowListResponse,
  GetWalletTransactionListResponse,
  GetIncomeOverviewResponse,
  // Logistics
  GetShippingParameterResponse,
  GetTrackingNumberResponse,
  GetTrackingInfoResponse,
  GetChannelListResponse,
  // Promotion
  GetDiscountListResponse,
  GetVoucherListResponse,
  AddVoucherResponse,
  GetFlashSaleListResponse,
  GetBundleDealListResponse,
  GetAddOnDealListResponse,
  // Account Health
  GetPenaltyPointHistoryResponse,
  GetPunishmentHistoryResponse,
  GetListingsWithIssuesResponse,
  GetLateOrdersResponse,
  // Ads
  GetTotalBalanceResponse,
  GetCampaignPerformanceResponse,
  GetRecommendedKeywordsResponse,
  // Push
  SetPushConfigResponse,
  GetPushConfigResponse,
  // Chat
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse,
} from './open-api-client'

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const now = () => Math.floor(Date.now() / 1000)
const daysAgo = (d: number) => now() - d * 86400
const hoursAgo = (h: number) => now() - h * 3600
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals))

const MOCK_REQUEST_ID = () => `mock-${Date.now()}-${randomInt(1000, 9999)}`
const BASE_RESPONSE = (error = 0, message = 'success') => ({
  error,
  message,
  request_id: MOCK_REQUEST_ID(),
})

// ═══════════════════════════════════════════════════════════════════
// Product Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_PRODUCTS = [
  {
    item_id: 100001,
    item_name: 'Wireless Bluetooth Earbuds TWS Pro',
    item_status: 'NORMAL' as const,
    category_id: 100067,
    image: [{ image_url: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-1' }],
    price_info: [{ original_price: 8990, current_price: 4990 }],
    stock_info_v2: [{ stock_type: 'infinite', stock: 999 }],
    item_sku: 'WBE-TWS-PRO',
    create_time: daysAgo(90),
    update_time: daysAgo(2),
  },
  {
    item_id: 100002,
    item_name: 'Kemeja Slim Fit Lelaki / Men Formal Shirt',
    item_status: 'NORMAL' as const,
    category_id: 100013,
    image: [{ image_url: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-2' }],
    price_info: [{ original_price: 5900, current_price: 2900 }],
    stock_info_v2: [{ stock_type: 'finite', stock: 150 }],
    item_sku: 'KEM-SLIM-01',
    create_time: daysAgo(120),
    update_time: daysAgo(5),
  },
  {
    item_id: 100003,
    item_name: 'Samsung Galaxy A54 5G Case Clear TPU',
    item_status: 'NORMAL' as const,
    category_id: 100089,
    image: [{ image_url: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-3' }],
    price_info: [{ original_price: 1990, current_price: 890 }],
    stock_info_v2: [{ stock_type: 'infinite', stock: 999 }],
    item_sku: 'CSE-SAM-A54',
    create_time: daysAgo(60),
    update_time: daysAgo(1),
  },
  {
    item_id: 100004,
    item_name: 'Vitamin C 1000mg + Zinc / 90 Tablets',
    item_status: 'NORMAL' as const,
    category_id: 100106,
    image: [{ image_url: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-4' }],
    price_info: [{ original_price: 3900, current_price: 1990 }],
    stock_info_v2: [{ stock_type: 'finite', stock: 500 }],
    item_sku: 'VIT-C-ZN-90',
    create_time: daysAgo(200),
    update_time: daysAgo(3),
  },
  {
    item_id: 100005,
    item_name: 'LED Desk Lamp Adjustable Eye-Care',
    item_status: 'NORMAL' as const,
    category_id: 100131,
    image: [{ image_url: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-5' }],
    price_info: [{ original_price: 12900, current_price: 7900 }],
    stock_info_v2: [{ stock_type: 'finite', stock: 75 }],
    item_sku: 'LMP-LED-ADJ',
    create_time: daysAgo(45),
    update_time: daysAgo(7),
  },
]

const MOCK_CATEGORIES = [
  { category_id: 100001, parent_category_id: 0, original_category_name: 'Mobile & Gadgets', display_name: 'Mobile & Gadgets', has_children: true },
  { category_id: 100013, parent_category_id: 0, original_category_name: 'Men\'s Clothes', display_name: 'Men\'s Clothes', has_children: true },
  { category_id: 100067, parent_category_id: 100001, original_category_name: 'Audio', display_name: 'Audio', has_children: false },
  { category_id: 100089, parent_category_id: 100001, original_category_name: 'Mobile Accessories', display_name: 'Mobile Accessories', has_children: false },
  { category_id: 100106, parent_category_id: 0, original_category_name: 'Health', display_name: 'Health', has_children: true },
  { category_id: 100131, parent_category_id: 0, original_category_name: 'Home Appliances', display_name: 'Home Appliances', has_children: true },
  { category_id: 100142, parent_category_id: 0, original_category_name: 'Women\'s Clothes', display_name: 'Women\'s Clothes', has_children: true },
  { category_id: 100158, parent_category_id: 0, original_category_name: 'Beauty & Personal Care', display_name: 'Beauty & Personal Care', has_children: true },
]

const MOCK_BRANDS = [
  { brand_id: 2001, brand_name: 'Samsung', original_brand_name: 'Samsung' },
  { brand_id: 2002, brand_name: 'Xiaomi', original_brand_name: 'Xiaomi' },
  { brand_id: 2003, brand_name: 'Anker', original_brand_name: 'Anker' },
  { brand_id: 2004, brand_name: 'Logitech', original_brand_name: 'Logitech' },
  { brand_id: 2005, brand_name: 'Uniqlo', original_brand_name: 'Uniqlo' },
]

const MOCK_COMMENTS = [
  {
    comment_id: 30001,
    item_id: 100001,
    user_name: 'ahmad_buyer',
    rating_star: 5,
    comment: 'Kualiti sangat baik! Sound quality pun ok. Recommended seller 👍',
    create_time: daysAgo(2),
    reply_list: [],
  },
  {
    comment_id: 30002,
    item_id: 100001,
    user_name: 'siti_shopper',
    rating_star: 4,
    comment: 'Barang ok, tapi penghantaran lambat sikit. Overall puas hati.',
    create_time: daysAgo(1),
    reply_list: [
      { reply_id: 30051, reply: 'Terima kasih atas maklum balas! Kami akan improve shipping time.', create_time: hoursAgo(12) },
    ],
  },
  {
    comment_id: 30003,
    item_id: 100002,
    user_name: 'john_my',
    rating_star: 3,
    comment: 'Material not bad for the price. Size runs a bit small.',
    create_time: daysAgo(3),
    reply_list: [],
  },
  {
    comment_id: 30004,
    item_id: 100004,
    user_name: 'nurul_health',
    rating_star: 5,
    comment: 'Sudah repeat order 3 kali! Vitamin ni paling berkesan.',
    create_time: hoursAgo(6),
    reply_list: [],
  },
]

// ═══════════════════════════════════════════════════════════════════
// Order Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_ORDERS = [
  {
    order_sn: 'MY240301ABCDE1',
    order_status: 'SHIPPED',
    create_time: daysAgo(3),
    update_time: daysAgo(1),
    checkout_time: daysAgo(3),
    item_list: [
      {
        item_id: 100001,
        model_id: 0,
        item_name: 'Wireless Bluetooth Earbuds TWS Pro',
        model_name: 'Black',
        order_item_id: 40001,
        original_price: 8990,
        deal_price: 4990,
        quantity_purchased: 1,
        product_discount: 4000,
        item_discount: 0,
        wholesale: false,
        weight: 120,
        image: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-1',
      },
    ],
    buyer_user_id: 50001,
    buyer_username: 'ahmad_buyer',
    recipient_address: {
      name: 'Ahmad Bin Ismail',
      phone: '6012345678',
      town: 'Petaling Jaya',
      district: 'Petaling',
      city: 'Petaling Jaya',
      state: 'Selangor',
      region: 'MY',
      zipcode: '47800',
      full_address: 'No 12, Jalan SS2/75, Petaling Jaya, 47800 Selangor',
    },
    actual_shipping_fee: 450,
    total_amount: 5440,
    currency: 'MYR',
    escrow_amount: 4655,
    days_to_ship: 3,
    ship_by_date: daysAgo(0),
    payment_method: 'Credit Card',
    shipping_carrier: 'SPX Express',
  },
  {
    order_sn: 'MY240302FGHIJ2',
    order_status: 'READY_TO_SHIP',
    create_time: daysAgo(1),
    update_time: daysAgo(1),
    checkout_time: daysAgo(1),
    item_list: [
      {
        item_id: 100004,
        model_id: 0,
        item_name: 'Vitamin C 1000mg + Zinc / 90 Tablets',
        model_name: 'Default',
        order_item_id: 40002,
        original_price: 3900,
        deal_price: 1990,
        quantity_purchased: 2,
        product_discount: 1910,
        item_discount: 0,
        wholesale: false,
        weight: 200,
        image: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-4',
      },
    ],
    buyer_user_id: 50002,
    buyer_username: 'nurul_health',
    recipient_address: {
      name: 'Nurul Aisyah',
      phone: '6019876543',
      town: 'Kuala Lumpur',
      district: 'Wilayah Persekutuan',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      region: 'MY',
      zipcode: '50000',
      full_address: 'A-3-8, Condo Villa, Jalan Ampang, 50000 Kuala Lumpur',
    },
    actual_shipping_fee: 350,
    total_amount: 4330,
    currency: 'MYR',
    escrow_amount: 3680,
    days_to_ship: 2,
    ship_by_date: daysAgo(0) + 86400,
    payment_method: 'ShopeePay',
    shipping_carrier: 'J&T Express',
  },
  {
    order_sn: 'MY240303KLMNO3',
    order_status: 'COMPLETED',
    create_time: daysAgo(14),
    update_time: daysAgo(7),
    checkout_time: daysAgo(14),
    item_list: [
      {
        item_id: 100002,
        model_id: 0,
        item_name: 'Kemeja Slim Fit Lelaki / Men Formal Shirt',
        model_name: 'White - L',
        order_item_id: 40003,
        original_price: 5900,
        deal_price: 2900,
        quantity_purchased: 1,
        product_discount: 3000,
        item_discount: 0,
        wholesale: false,
        weight: 250,
        image: 'https://cf.shopee.com.my/file/sg-11134201-22100-latest-2',
      },
    ],
    buyer_user_id: 50003,
    buyer_username: 'john_my',
    recipient_address: {
      name: 'John Tan',
      phone: '6011223344',
      town: 'Johor Bahru',
      district: 'Johor Bahru',
      city: 'Johor Bahru',
      state: 'Johor',
      region: 'MY',
      zipcode: '80000',
      full_address: '32, Jalan Dedap 13, Johor Jaya, 81100 Johor Bahru',
    },
    actual_shipping_fee: 500,
    total_amount: 3400,
    currency: 'MYR',
    escrow_amount: 2700,
    days_to_ship: 3,
    payment_method: 'Online Banking',
    shipping_carrier: 'Pos Laju',
  },
]

// ═══════════════════════════════════════════════════════════════════
// Shop Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_SHOP_PROFILE = {
  shop_id: 888999,
  shop_name: 'TechGadget MY Official Store',
  shop_description: 'Your trusted online store for quality tech gadgets, accessories, and lifestyle products in Malaysia. 100% authentic with fast shipping!',
  shop_logo: 'https://cf.shopee.com.my/file/shop-logo-techgadget-my',
  region: 'MY',
  status: 'NORMAL',
  item_limit: 5000,
  create_time: daysAgo(365),
}

const MOCK_SHOP_PERFORMANCE = {
  shop_id: 888999,
  rating_star: 4.85,
  rating_bad: 12,
  rating_normal: 58,
  rating_good: 2830,
  overall_rating_count: 2900,
  response_rate: 0.95,
  preparation_time: 18,
  cancellation_rate: 0.012,
  non_fulfillment_rate: 0.008,
  order_count_30d: 458,
  order_count_60d: 912,
  order_count_90d: 1347,
}

// ═══════════════════════════════════════════════════════════════════
// Payment / Escrow Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_ESCROW_DETAIL = {
  order_sn: 'MY240301ABCDE1',
  order_income: {
    escrow_amount: 4655,
    buyer_paid_amount: 5440,
    actual_shipping_fee: 450,
    original_shipping_fee: 450,
    commission_fee: 326,
    service_fee: 55,
    voucher_from_seller: 0,
    voucher_from_shopee: 4000,
    coin: 0,
    credit_card_promotion: 0,
    order_adjustment_fee: 0,
    cross_border_tax: 0,
    seller_return_refund: 0,
    last_mile_fee: 0,
    payment_promo: 0,
  },
  income_time: daysAgo(5),
  escrow_time: daysAgo(3),
}

const MOCK_WALLET_TRANSACTIONS = [
  { transaction_id: 60001, transaction_type: 'Order Income', transaction_amount: 4655, current_balance: 125430, create_time: daysAgo(3), order_sn: 'MY240301ABCDE1', description: 'Income from order MY240301ABCDE1' },
  { transaction_id: 60002, transaction_type: 'Order Income', transaction_amount: 2700, current_balance: 120775, create_time: daysAgo(7), order_sn: 'MY240303KLMNO3', description: 'Income from order MY240303KLMNO3' },
  { transaction_id: 60003, transaction_type: 'Withdrawal', transaction_amount: -50000, current_balance: 118075, create_time: daysAgo(10), withdrawal_id: 70001, description: 'Withdrawal to bank account ****6789' },
  { transaction_id: 60004, transaction_type: 'Shopee Subsidy', transaction_amount: 450, current_balance: 168075, create_time: daysAgo(14), description: 'Shipping fee subsidy' },
]

const MOCK_INCOME_OVERVIEW = {
  total_income: 234567,
  income_7d: 12450,
  income_30d: 56890,
  pending_income: 8335,
  available_for_withdrawal: 125430,
  in_withdrawal: 0,
  currency: 'MYR',
}

// ═══════════════════════════════════════════════════════════════════
// Logistics Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_SHIPPING_PARAMETER = {
  order_sn: 'MY240302FGHIJ2',
  pickup: {
    address_list: [
      { address_id: 1, address: 'Warehouse A, No 8, Jalan Industri, Subang Jaya, 47500 Selangor', is_default: true },
      { address_id: 2, address: 'Warehouse B, No 15, Jalan Teknologi, Shah Alam, 40000 Selangor', is_default: false },
    ],
    pickup_time_list: [
      { date: '2024-03-05', time_text: '09:00 - 12:00', pickup_time_id: 101 },
      { date: '2024-03-05', time_text: '14:00 - 17:00', pickup_time_id: 102 },
      { date: '2024-03-06', time_text: '09:00 - 12:00', pickup_time_id: 103 },
    ],
  },
  dropoff: {
    branch_list: [
      { branch_id: 201, branch_name: 'SPX Drop-off Subang Jaya', region: 'Selangor', address: 'SS15, Subang Jaya' },
      { branch_id: 202, branch_name: 'J&T Drop-off Kelana Jaya', region: 'Selangor', address: 'Kelana Jaya, PJ' },
    ],
  },
  info_needed: {
    pickup: ['pickup_time_id', 'address_id'],
    dropoff: ['branch_id'],
  },
}

const MOCK_TRACKING_INFO = {
  order_sn: 'MY240301ABCDE1',
  package_number: 'PKG240301A',
  tracking_number: 'SPXMY0123456789',
  tracking_info_list: [
    { status: 'Delivered', update_time: daysAgo(1), description: 'Parcel delivered to recipient', city: 'Petaling Jaya', state: 'Selangor', country: 'Malaysia' },
    { status: 'Out for Delivery', update_time: daysAgo(1) + 28800, description: 'Parcel out for delivery', city: 'Petaling Jaya', state: 'Selangor', country: 'Malaysia' },
    { status: 'In Transit', update_time: daysAgo(2), description: 'Parcel in transit to destination', city: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'Malaysia' },
    { status: 'Picked Up', update_time: daysAgo(3), description: 'Parcel picked up by courier', city: 'Subang Jaya', state: 'Selangor', country: 'Malaysia' },
  ],
}

const MOCK_LOGISTICS_CHANNELS = [
  { channel_id: 1, channel_name: 'SPX Express', enabled: true, cod_enabled: true, estimated_shipping_fee: 450, estimated_delivery_time: 3, region: 'MY' },
  { channel_id: 2, channel_name: 'J&T Express', enabled: true, cod_enabled: true, estimated_shipping_fee: 500, estimated_delivery_time: 3, region: 'MY' },
  { channel_id: 3, channel_name: 'Pos Laju', enabled: true, cod_enabled: false, estimated_shipping_fee: 600, estimated_delivery_time: 4, region: 'MY' },
  { channel_id: 4, channel_name: 'Ninja Van', enabled: true, cod_enabled: true, estimated_shipping_fee: 400, estimated_delivery_time: 2, region: 'MY' },
  { channel_id: 5, channel_name: 'DHL eCommerce', enabled: false, cod_enabled: false, estimated_shipping_fee: 1200, estimated_delivery_time: 5, region: 'MY' },
]

// ═══════════════════════════════════════════════════════════════════
// Promotion Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_DISCOUNTS = [
  { discount_id: 8001, discount_name: 'March Mega Sale - 40% Off', discount_type: 1, discount_start_time: daysAgo(5), discount_end_time: daysAgo(0) + 86400 * 5, status: 'ONGOING', item_count: 15 },
  { discount_id: 8002, discount_name: 'Flash Deals - Up to 60% Off', discount_type: 1, discount_start_time: now() + 86400, discount_end_time: now() + 86400 * 3, status: 'UPCOMING', item_count: 8 },
  { discount_id: 8003, discount_name: 'Chinese New Year Sale', discount_type: 1, discount_start_time: daysAgo(30), discount_end_time: daysAgo(25), status: 'EXPIRED', item_count: 20 },
]

const MOCK_VOUCHERS = [
  { voucher_id: 9001, voucher_name: 'RM5 Off Min Spend RM30', voucher_code: 'TECH5OFF', voucher_type: 1, discount: 500, min_spend: 3000, start_time: daysAgo(10), end_time: daysAgo(0) + 86400 * 20, voucher_quantity: 1000, claimed_quantity: 678, status: 'ONGOING' },
  { voucher_id: 9002, voucher_name: 'RM15 Off Min Spend RM100', voucher_code: 'SAVE15MY', voucher_type: 1, discount: 1500, min_spend: 10000, start_time: daysAgo(5), end_time: daysAgo(0) + 86400 * 25, voucher_quantity: 500, claimed_quantity: 234, status: 'ONGOING' },
  { voucher_id: 9003, voucher_name: 'Free Shipping Voucher', voucher_code: 'FREESHIP', voucher_type: 2, discount: 500, min_spend: 0, start_time: daysAgo(30), end_time: daysAgo(25), voucher_quantity: 2000, claimed_quantity: 2000, status: 'EXPIRED' },
]

const MOCK_FLASH_SALES = [
  { flash_sale_id: 11001, flash_sale_name: '12.12 Flash Sale', start_time: now() - 3600, end_time: now() + 3600 * 5, status: 'ONGOING', item_count: 5 },
  { flash_sale_id: 11002, flash_sale_name: 'Payday Flash Sale', start_time: now() + 86400, end_time: now() + 86400 + 3600 * 12, status: 'UPCOMING', item_count: 10 },
]

const MOCK_BUNDLE_DEALS = [
  { bundle_deal_id: 12001, bundle_deal_name: 'Buy 2 Save 10%', start_time: daysAgo(7), end_time: daysAgo(0) + 86400 * 23, status: 'ONGOING', item_count: 8 },
  { bundle_deal_id: 12002, bundle_deal_name: 'Buy 3 Save 15%', start_time: daysAgo(7), end_time: daysAgo(0) + 86400 * 23, status: 'ONGOING', item_count: 5 },
]

const MOCK_ADD_ON_DEALS = [
  { add_on_deal_id: 13001, add_on_deal_name: 'Add-On RM1 Cable', start_time: daysAgo(14), end_time: daysAgo(0) + 86400 * 16, status: 'ONGOING', item_count: 3 },
  { add_on_deal_id: 13002, add_on_deal_name: 'Add-On Screen Protector', start_time: daysAgo(14), end_time: daysAgo(0) + 86400 * 16, status: 'ONGOING', item_count: 2 },
]

// ═══════════════════════════════════════════════════════════════════
// Account Health Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_PENALTY_POINTS = [
  { penalty_id: 14001, penalty_points: 2, reason: 'Late shipment for order MY240201XXYZ1', order_sn: 'MY240201XXYZ1', violation_type: 'LATE_SHIPMENT', create_time: daysAgo(15) },
  { penalty_id: 14002, penalty_points: 1, reason: 'Order cancellation due to out of stock', order_sn: 'MY240205AABB2', violation_type: 'OUT_OF_STOCK_CANCELLATION', create_time: daysAgo(10) },
]

const MOCK_PUNISHMENTS = [
  { punishment_id: 15001, punishment_type: 'LISTING_RESTRICTION', reason: 'High cancellation rate (3.2%) exceeds threshold (2.5%)', start_time: daysAgo(5), end_time: daysAgo(0) + 86400 * 5, is_active: true },
]

const MOCK_LISTING_ISSUES = [
  { item_id: 100006, item_name: 'iPhone 15 Pro Max 256GB - CHEAP!', issue_type: 'PROHIBITED_LISTING', issue_description: 'Potential counterfeit product listing detected', severity: 'HIGH' as const, detected_time: daysAgo(2) },
  { item_id: 100007, item_name: 'Face Whitening Cream Fast Result', issue_type: 'POLICY_VIOLATION', issue_description: 'Product claims may violate health regulations', severity: 'MEDIUM' as const, detected_time: daysAgo(4) },
  { item_id: 100008, item_name: 'USB Cable Type-C 1m', issue_type: 'LOW_QUALITY_IMAGE', issue_description: 'Product image does not meet minimum quality requirements', severity: 'LOW' as const, detected_time: daysAgo(1) },
]

const MOCK_LATE_ORDERS = [
  { order_sn: 'MY240220LATE1', order_status: 'PROCESSED', create_time: daysAgo(8), ship_by_date: daysAgo(5), days_late: 3, reason: 'Inventory delay' },
  { order_sn: 'MY240225LATE2', order_status: 'PROCESSED', create_time: daysAgo(6), ship_by_date: daysAgo(4), days_late: 2, reason: 'Courier pickup missed' },
]

// ═══════════════════════════════════════════════════════════════════
// Ads Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_ADS_BALANCE = {
  total_balance: 250000,
  frozen_balance: 35000,
  available_balance: 215000,
  currency: 'MYR',
}

const MOCK_CAMPAIGN_PERFORMANCE = [
  { campaign_id: 16001, campaign_name: 'Earbuds Discovery Campaign', campaign_type: 'discovery', impressions: 45230, clicks: 1890, ctr: 4.18, cost: 5670, conversions: 89, roas: 7.82, date: '2024-03-01' },
  { campaign_id: 16001, campaign_name: 'Earbuds Discovery Campaign', campaign_type: 'discovery', impressions: 48100, clicks: 2010, ctr: 4.18, cost: 6030, conversions: 95, roas: 7.87, date: '2024-03-02' },
  { campaign_id: 16002, campaign_name: 'Vitamin C Search Ads', campaign_type: 'search', impressions: 12800, clicks: 890, ctr: 6.95, cost: 2670, conversions: 67, roas: 12.53, date: '2024-03-01' },
  { campaign_id: 16002, campaign_name: 'Vitamin C Search Ads', campaign_type: 'search', impressions: 13500, clicks: 920, ctr: 6.81, cost: 2760, conversions: 71, roas: 12.86, date: '2024-03-02' },
]

const MOCK_RECOMMENDED_KEYWORDS = [
  { keyword: 'bluetooth earbuds', search_volume: 12500, suggested_bid: 350, competition_level: 'HIGH' as const, relevance_score: 0.95 },
  { keyword: 'wireless earphones', search_volume: 9800, suggested_bid: 280, competition_level: 'HIGH' as const, relevance_score: 0.88 },
  { keyword: 'tws earbuds', search_volume: 7200, suggested_bid: 220, competition_level: 'MEDIUM' as const, relevance_score: 0.92 },
  { keyword: 'earbuds murah', search_volume: 5400, suggested_bid: 180, competition_level: 'MEDIUM' as const, relevance_score: 0.78 },
  { keyword: 'sport earbuds', search_volume: 3800, suggested_bid: 150, competition_level: 'LOW' as const, relevance_score: 0.72 },
  { keyword: 'gaming earbuds low latency', search_volume: 2100, suggested_bid: 120, competition_level: 'LOW' as const, relevance_score: 0.65 },
]

// ═══════════════════════════════════════════════════════════════════
// Push Config Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_PUSH_CONFIGS = [
  { push_type: 'NEW_ORDER', enable: true },
  { push_type: 'ORDER_CANCELLATION', enable: true },
  { push_type: 'ORDER_PAYMENT', enable: true },
  { push_type: 'PRODUCT_REVIEW', enable: true },
  { push_type: 'CHAT_MESSAGE', enable: true },
  { push_type: 'SHOPEE_OFFICIAL', enable: false },
]

// ═══════════════════════════════════════════════════════════════════
// Chat Mock Data
// ═══════════════════════════════════════════════════════════════════

const MOCK_CONVERSATIONS = [
  {
    conversation_id: 17001,
    conversation_type: 1,
    last_message: 'Hi, is this item available in black color?',
    last_message_time: hoursAgo(2),
    unread_count: 1,
    buyer_user_id: 50001,
    buyer_username: 'ahmad_buyer',
    shop_id: 888999,
  },
  {
    conversation_id: 17002,
    conversation_type: 1,
    last_message: 'Terima kasih! Barang dah sampai 😊',
    last_message_time: daysAgo(1),
    unread_count: 0,
    buyer_user_id: 50002,
    buyer_username: 'nurul_health',
    shop_id: 888999,
  },
  {
    conversation_id: 17003,
    conversation_type: 1,
    last_message: 'Can I get bulk discount for 10 units?',
    last_message_time: daysAgo(3),
    unread_count: 0,
    buyer_user_id: 50003,
    buyer_username: 'john_my',
    shop_id: 888999,
  },
]

const MOCK_CHAT_MESSAGES: Record<number, Array<{
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
}>> = {
  17001: [
    { message_id: 18001, conversation_id: 17001, message: 'Hi, is this item available in black color?', message_type: 'TEXT', from_user_id: 50001, from_username: 'ahmad_buyer', to_user_id: 888999, to_username: 'TechGadget MY', create_time: hoursAgo(2), read: true },
    { message_id: 18002, conversation_id: 17001, message: 'Hi! Yes, black color is available. Would you like to order?', message_type: 'TEXT', from_user_id: 888999, from_username: 'TechGadget MY', to_user_id: 50001, to_username: 'ahmad_buyer', create_time: hoursAgo(1.5), read: true },
    { message_id: 18003, conversation_id: 17001, message: 'Great! What about warranty?', message_type: 'TEXT', from_user_id: 50001, from_username: 'ahmad_buyer', to_user_id: 888999, to_username: 'TechGadget MY', create_time: hoursAgo(1), read: false },
  ],
  17002: [
    { message_id: 18004, conversation_id: 17002, message: 'Order saya dah buat, bila boleh sampai?', message_type: 'TEXT', from_user_id: 50002, from_username: 'nurul_health', to_user_id: 888999, to_username: 'TechGadget MY', create_time: daysAgo(3), read: true },
    { message_id: 18005, conversation_id: 17002, message: 'Biasanya 2-3 hari bekerja ya kak. Terima kasih!', message_type: 'TEXT', from_user_id: 888999, from_username: 'TechGadget MY', to_user_id: 50002, to_username: 'nurul_health', create_time: daysAgo(3) + 3600, read: true },
    { message_id: 18006, conversation_id: 17002, message: 'Terima kasih! Barang dah sampai 😊', message_type: 'TEXT', from_user_id: 50002, from_username: 'nurul_health', to_user_id: 888999, to_username: 'TechGadget MY', create_time: daysAgo(1), read: true },
  ],
}

// ═══════════════════════════════════════════════════════════════════
// Mock Service Class
// ═══════════════════════════════════════════════════════════════════

/**
 * ShopeeOpenAPIMockService — Provides realistic mock data for all
 * Shopee Open API v2 manager methods.
 *
 * Each method returns a Promise with the same shape as the real API response,
 * allowing drop-in replacement during development and testing.
 */
export class ShopeeOpenAPIMockService {
  // ─── Delay to simulate network ──────────────────────────────

  private async delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms + randomInt(0, 100)))
  }

  // ═══════════════════════════════════════════════════════════════
  // Product Manager
  // ═══════════════════════════════════════════════════════════════

  async getItemList(params?: { offset?: number; page_size?: number }): Promise<GetItemListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const allItems = MOCK_PRODUCTS.map((p) => ({
      item_id: p.item_id,
      item_status: p.item_status,
      update_time: p.update_time,
    }))
    const items = allItems.slice(offset, offset + pageSize)
    return {
      ...BASE_RESPONSE(),
      response: {
        item: items,
        has_next: offset + pageSize < allItems.length,
        next_offset: offset + pageSize < allItems.length ? offset + pageSize : undefined,
        total_count: allItems.length,
      },
    }
  }

  async getItemBaseInfo(params: { item_id_list: number[] }): Promise<GetItemBaseInfoResponse> {
    await this.delay()
    const items = MOCK_PRODUCTS.filter((p) => params.item_id_list.includes(p.item_id))
    return {
      ...BASE_RESPONSE(),
      response: { item_list: items },
    }
  }

  async searchItem(params?: { keyword?: string; page_size?: number; offset?: number }): Promise<SearchItemResponse> {
    await this.delay()
    const keyword = params?.keyword?.toLowerCase() ?? ''
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const filtered = keyword
      ? MOCK_PRODUCTS.filter((p) => p.item_name.toLowerCase().includes(keyword))
      : MOCK_PRODUCTS
    const items = filtered.slice(offset, offset + pageSize).map((p) => ({
      item_id: p.item_id,
      item_name: p.item_name,
      image: p.image[0]?.image_url ?? '',
      price_min: p.price_info[0]?.current_price ?? 0,
      price_max: p.price_info[0]?.original_price ?? 0,
      currency: 'MYR',
      category_id: p.category_id,
      shop_id: 888999,
      shop_name: 'TechGadget MY Official Store',
      sales: randomInt(100, 5000),
      rating_star: randomFloat(4.0, 5.0, 1),
    }))
    return {
      ...BASE_RESPONSE(),
      response: {
        item_list: items,
        has_next: offset + pageSize < filtered.length,
        next_offset: offset + pageSize < filtered.length ? offset + pageSize : undefined,
        total_count: filtered.length,
      },
    }
  }

  async getCategory(): Promise<GetCategoryResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { category_list: MOCK_CATEGORIES },
    }
  }

  async getBrandList(): Promise<GetBrandListResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        brand_list: MOCK_BRANDS,
        has_next: false,
      },
    }
  }

  async boostItem(params: { item_id_list: number[] }): Promise<BoostItemResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        boost_item_list: params.item_id_list.map((id) => ({
          item_id: id,
          boost_status: 1,
          start_time: now(),
          end_time: now() + 3600 * 4,
        })),
      },
    }
  }

  async getBoostedList(params?: { offset?: number; page_size?: number }): Promise<GetBoostedListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const boosted = [
      { item_id: 100001, boost_status: 1, start_time: now() - 3600, end_time: now() + 3600 * 3 },
      { item_id: 100004, boost_status: 2, start_time: daysAgo(1), end_time: daysAgo(1) + 3600 * 4 },
    ]
    return {
      ...BASE_RESPONSE(),
      response: {
        boosted_item_list: boosted.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  async getComment(params: { item_id: number; page_size?: number; offset?: number }): Promise<GetCommentResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const filtered = MOCK_COMMENTS.filter((c) => c.item_id === params.item_id)
    const comments = filtered.slice(offset, offset + pageSize)
    return {
      ...BASE_RESPONSE(),
      response: {
        comment_list: comments,
        has_next: false,
        total_count: filtered.length,
      },
    }
  }

  async replyComment(params: { comment_list: Array<{ comment_id: number; comment_reply: string }> }): Promise<ReplyCommentResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        reply_list: params.comment_list.map((c) => ({
          comment_id: c.comment_id,
          reply_id: randomInt(30000, 39999),
        })),
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Order Manager
  // ═══════════════════════════════════════════════════════════════

  async getOrderList(params: { time_from: number; time_to: number; page_size?: number; cursor?: string }): Promise<GetOrderListResponse> {
    await this.delay()
    const pageSize = params?.page_size ?? 20
    const filtered = MOCK_ORDERS.filter(
      (o) => o.create_time >= params.time_from && o.create_time <= params.time_to
    )
    return {
      ...BASE_RESPONSE(),
      response: {
        order_list: filtered.slice(0, pageSize).map((o) => ({
          order_sn: o.order_sn,
          order_status: o.order_status,
        })),
        more: filtered.length > pageSize,
        next_cursor: filtered.length > pageSize ? 'next-cursor-mock' : undefined,
      },
    }
  }

  async getOrderDetail(params: { order_sn_list: string[] }): Promise<GetOrderDetailResponse> {
    await this.delay()
    const orders = MOCK_ORDERS.filter((o) => params.order_sn_list.includes(o.order_sn))
    return {
      ...BASE_RESPONSE(),
      response: { order_list: orders },
    }
  }

  async getShipmentList(params?: { page_size?: number; cursor?: string }): Promise<GetShipmentListResponse> {
    await this.delay()
    const pageSize = params?.page_size ?? 20
    const readyToShip = MOCK_ORDERS.filter((o) => o.order_status === 'READY_TO_SHIP' || o.order_status === 'SHIPPED')
    return {
      ...BASE_RESPONSE(),
      response: {
        order_list: readyToShip.slice(0, pageSize).map((o) => ({
          order_sn: o.order_sn,
          order_status: o.order_status,
          package_number: `PKG${o.order_sn.slice(-6)}`,
        })),
        more: false,
      },
    }
  }

  async cancelOrder(params: { order_sn: string; cancel_reason: string }): Promise<CancelOrderResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { order_sn: params.order_sn },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Shop Manager
  // ═══════════════════════════════════════════════════════════════

  async getProfile(): Promise<GetShopProfileResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: MOCK_SHOP_PROFILE,
    }
  }

  async getShopInfo(params?: { shop_id_list?: number[] }): Promise<GetShopInfoResponse> {
    await this.delay()
    const shops = params?.shop_id_list
      ? [{ shop_id: 888999, shop_name: 'TechGadget MY Official Store', shop_description: MOCK_SHOP_PROFILE.shop_description, shop_logo: MOCK_SHOP_PROFILE.shop_logo, status: 'NORMAL' }].filter((s) => params.shop_id_list!.includes(s.shop_id))
      : [{ shop_id: 888999, shop_name: 'TechGadget MY Official Store', shop_description: MOCK_SHOP_PROFILE.shop_description, shop_logo: MOCK_SHOP_PROFILE.shop_logo, status: 'NORMAL' }]
    return {
      ...BASE_RESPONSE(),
      response: { shop_list: shops },
    }
  }

  async updateProfile(_params?: Record<string, unknown>): Promise<UpdateProfileResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {},
    }
  }

  async getShopPerformance(): Promise<GetShopPerformanceResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: MOCK_SHOP_PERFORMANCE,
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Payment Manager
  // ═══════════════════════════════════════════════════════════════

  async getEscrowDetail(params: { order_sn: string }): Promise<GetEscrowDetailResponse> {
    await this.delay()
    const detail = { ...MOCK_ESCROW_DETAIL, order_sn: params.order_sn }
    return {
      ...BASE_RESPONSE(),
      response: detail,
    }
  }

  async getEscrowList(params?: { offset?: number; page_size?: number }): Promise<GetEscrowListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const allEscrow = MOCK_ORDERS.map((o) => ({
      order_sn: o.order_sn,
      escrow_amount: o.escrow_amount ?? randomInt(1000, 10000),
      escrow_status: o.order_status === 'COMPLETED' ? 'RELEASED' : 'FROZEN',
      create_time: o.create_time,
    }))
    return {
      ...BASE_RESPONSE(),
      response: {
        order_list: allEscrow.slice(offset, offset + pageSize),
        has_next: offset + pageSize < allEscrow.length,
        next_offset: offset + pageSize < allEscrow.length ? offset + pageSize : undefined,
      },
    }
  }

  async getWalletTransactionList(params?: { offset?: number; page_size?: number }): Promise<GetWalletTransactionListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        transaction_list: MOCK_WALLET_TRANSACTIONS.slice(offset, offset + pageSize),
        has_next: offset + pageSize < MOCK_WALLET_TRANSACTIONS.length,
        next_offset: offset + pageSize < MOCK_WALLET_TRANSACTIONS.length ? offset + pageSize : undefined,
        total_count: MOCK_WALLET_TRANSACTIONS.length,
      },
    }
  }

  async getIncomeOverview(): Promise<GetIncomeOverviewResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: MOCK_INCOME_OVERVIEW,
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Logistics Manager
  // ═══════════════════════════════════════════════════════════════

  async getShippingParameter(params: { order_sn: string }): Promise<GetShippingParameterResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { ...MOCK_SHIPPING_PARAMETER, order_sn: params.order_sn },
    }
  }

  async getTrackingNumber(params: { order_sn: string }): Promise<GetTrackingNumberResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        order_sn: params.order_sn,
        package_number: `PKG${params.order_sn.slice(-6)}`,
        tracking_number: `SPXMY${randomInt(100000000, 999999999)}`,
      },
    }
  }

  async getTrackingInfo(params: { order_sn: string }): Promise<GetTrackingInfoResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { ...MOCK_TRACKING_INFO, order_sn: params.order_sn },
    }
  }

  async getChannelList(): Promise<GetChannelListResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { logistics_channel_list: MOCK_LOGISTICS_CHANNELS },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Promotion Manager
  // ═══════════════════════════════════════════════════════════════

  async getDiscountList(params?: { offset?: number; page_size?: number; discount_status?: string }): Promise<GetDiscountListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const filtered = params?.discount_status
      ? MOCK_DISCOUNTS.filter((d) => d.status === params.discount_status)
      : MOCK_DISCOUNTS
    return {
      ...BASE_RESPONSE(),
      response: {
        discount_list: filtered.slice(offset, offset + pageSize),
        has_next: false,
        total_count: filtered.length,
      },
    }
  }

  async getVoucherList(params?: { offset?: number; page_size?: number }): Promise<GetVoucherListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        voucher_list: MOCK_VOUCHERS.slice(offset, offset + pageSize),
        has_next: false,
        total_count: MOCK_VOUCHERS.length,
      },
    }
  }

  async addVoucher(params: { voucher_name: string; discount: number }): Promise<AddVoucherResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        voucher_id: randomInt(9000, 9999),
        voucher_code: `MOCK${randomInt(1000, 9999)}`,
      },
    }
  }

  async getFlashSaleList(params?: { offset?: number; page_size?: number }): Promise<GetFlashSaleListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        flash_sale_list: MOCK_FLASH_SALES.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  async getBundleDealList(params?: { offset?: number; page_size?: number }): Promise<GetBundleDealListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        bundle_deal_list: MOCK_BUNDLE_DEALS.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  async getAddOnDealList(params?: { offset?: number; page_size?: number }): Promise<GetAddOnDealListResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        add_on_deal_list: MOCK_ADD_ON_DEALS.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Account Health Manager
  // ═══════════════════════════════════════════════════════════════

  async getAccountHealthPerformance(): Promise<GetShopPerformanceResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: MOCK_SHOP_PERFORMANCE,
    }
  }

  async getPenaltyPointHistory(params?: { offset?: number; page_size?: number }): Promise<GetPenaltyPointHistoryResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        penalty_point_list: MOCK_PENALTY_POINTS.slice(offset, offset + pageSize),
        total_penalty_points: MOCK_PENALTY_POINTS.reduce((sum, p) => sum + p.penalty_points, 0),
        has_next: false,
      },
    }
  }

  async getPunishmentHistory(params?: { offset?: number; page_size?: number }): Promise<GetPunishmentHistoryResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        punishment_list: MOCK_PUNISHMENTS.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  async getListingsWithIssues(params?: { offset?: number; page_size?: number }): Promise<GetListingsWithIssuesResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        listing_issue_list: MOCK_LISTING_ISSUES.slice(offset, offset + pageSize),
        has_next: false,
        total_count: MOCK_LISTING_ISSUES.length,
      },
    }
  }

  async getLateOrders(params?: { offset?: number; page_size?: number }): Promise<GetLateOrdersResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        late_order_list: MOCK_LATE_ORDERS.slice(offset, offset + pageSize),
        has_next: false,
        total_count: MOCK_LATE_ORDERS.length,
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Ads Manager
  // ═══════════════════════════════════════════════════════════════

  async getTotalBalance(): Promise<GetTotalBalanceResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: MOCK_ADS_BALANCE,
    }
  }

  async getCampaignPerformance(params: { from_time: number; to_time: number }): Promise<GetCampaignPerformanceResponse> {
    await this.delay()
    const filtered = MOCK_CAMPAIGN_PERFORMANCE.filter((c) => {
      const ts = Math.floor(new Date(c.date).getTime() / 1000)
      return ts >= params.from_time && ts <= params.to_time
    })
    return {
      ...BASE_RESPONSE(),
      response: {
        campaign_performance_list: filtered,
        has_next: false,
      },
    }
  }

  async getRecommendedKeywords(params: { item_id: number; page_size?: number }): Promise<GetRecommendedKeywordsResponse> {
    await this.delay()
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        keyword_list: MOCK_RECOMMENDED_KEYWORDS.slice(0, pageSize),
        has_next: false,
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Push Manager
  // ═══════════════════════════════════════════════════════════════

  async setPushConfig(params: { push_config_list: Array<{ push_type: string; enable: boolean }> }): Promise<SetPushConfigResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        push_config_list: params.push_config_list.map((p) => ({
          push_type: p.push_type,
          enable: p.enable,
        })),
      },
    }
  }

  async getPushConfig(): Promise<GetPushConfigResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: { push_config_list: MOCK_PUSH_CONFIGS },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Chat Manager
  // ═══════════════════════════════════════════════════════════════

  async getConversations(params?: { offset?: number; page_size?: number }): Promise<GetConversationsResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    return {
      ...BASE_RESPONSE(),
      response: {
        conversation_list: MOCK_CONVERSATIONS.slice(offset, offset + pageSize),
        has_next: false,
        total_count: MOCK_CONVERSATIONS.length,
      },
    }
  }

  async getMessages(params: { conversation_id: number; offset?: number; page_size?: number }): Promise<GetMessagesResponse> {
    await this.delay()
    const offset = params?.offset ?? 0
    const pageSize = params?.page_size ?? 20
    const messages = MOCK_CHAT_MESSAGES[params.conversation_id] ?? []
    return {
      ...BASE_RESPONSE(),
      response: {
        message_list: messages.slice(offset, offset + pageSize),
        has_next: false,
      },
    }
  }

  async sendMessage(params: { conversation_id: number; message: string }): Promise<SendMessageResponse> {
    await this.delay()
    return {
      ...BASE_RESPONSE(),
      response: {
        message_id: randomInt(18000, 19999),
        conversation_id: params.conversation_id,
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Connection Test
  // ═══════════════════════════════════════════════════════════════

  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    await this.delay(100)
    return {
      success: true,
      message: `Connected as ${MOCK_SHOP_PROFILE.shop_name} (${MOCK_SHOP_PROFILE.status}) [MOCK]`,
      region: 'MY',
    }
  }
}
