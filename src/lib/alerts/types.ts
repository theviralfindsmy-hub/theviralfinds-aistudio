/**
 * Smart Commission XTRA Alert Bot — Type Definitions
 *
 * Fasa 3.3 (CHECKLIST Section 3.3).
 *
 * The alert bot monitors Commission XTRA product opportunities on Shopee MY
 * (and later TikTok Shop / Lazada) and pushes real-time notifications when a
 * new boosted-commission product appears in the affiliate's niche.
 *
 * All currency values are in Malaysian Ringgit (RM). Time values are stored
 * as ISO-8601 strings for portability between server and client.
 */

/** Source-of-truth flag for every API response. */
export type AlertDataSource = 'mock' | 'api'

/** The four Commission XTRA programme types that Shopee MY runs. */
export type AlertType =
  | 'live_xtra' // 🟠 Shopee Live XTRA — boosted commission during live streams
  | 'flash_xtra' // 🔴 Flash XTRA — short-burst commission spike (1-6h)
  | 'weekend_xtra' // 🟣 Weekend XTRA — Friday-Sunday boost
  | 'mega_xtra' // 🟡 Mega XTRA — campaign-scale (11.11, 12.12, payday)

/** Urgency tiers, derived from expiry + commission magnitude. */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

/**
 * The affiliate niches supported by the matcher. These map to the user's
 * chosen "primary niche" on the dashboard and gate which alerts they see.
 */
export type AlertNiche = 'beauty' | 'tech' | 'fashion' | 'home' | 'food'

/** Notification channels the user can opt into. */
export type AlertChannel = 'push' | 'email' | 'sms'

/**
 * A single XTRA product currently being monitored by the bot.
 * This is the raw signal — a `CommissionAlert` is what gets delivered to
 * a specific user once the matcher decides it is relevant to them.
 */
export interface XtraProduct {
  /** Stable id (e.g. "xtra-001"). */
  id: string
  /** Display name, Malaysian context (mix of EN + BM). */
  productName: string
  /** Shopee item id (mock: synthetic). */
  itemId: string
  /** Square thumbnail URL (placeholder image service). */
  thumbnail: string
  /** Original/base commission rate before the XTRA boost (percentage 0-100). */
  baseCommission: number
  /** Boosted commission rate while XTRA is active (percentage 0-100). */
  boostedCommission: number
  /** Absolute uplift in percentage points (boostedCommission - baseCommission). */
  boostDelta: number
  /** Product price in RM (used to compute potential commission RM). */
  price: number
  /** Primary niche this product belongs to. */
  niche: AlertNiche
  /** Human-readable category label (e.g. "Skincare", "Audio"). */
  category: string
  /** Shop name (Malaysian sellers). */
  shopName: string
  /** Which XTRA programme is currently boosting this product. */
  xtraType: AlertType
  /** ISO-8601 timestamp when the XTRA boost became active. */
  startedAt: string
  /** ISO-8601 timestamp when the XTRA boost expires. */
  expiresAt: string
  /** Estimated monthly sales volume (units) — used for RM earning potential. */
  estimatedMonthlySales: number
  /** Product rating 0-5. */
  rating: number
}

/**
 * A user-facing alert. One `CommissionAlert` per (user, XtraProduct) pair
 * after the matcher has scored relevance.
 */
export interface CommissionAlert {
  /** Stable id (e.g. "alert-001"). */
  id: string
  /** The underlying XTRA product this alert is about. */
  product: XtraProduct
  /** Which XTRA programme triggered the alert (mirrors product.xtraType). */
  type: AlertType
  /** Computed urgency tier. */
  severity: AlertSeverity
  /** Relevance score 0-100 for the current user's niche. */
  relevanceScore: number
  /** Human-readable headline (e.g. "Shopee Live XTRA — Garnier Vitamin C Serum 30ml"). */
  title: string
  /** Short description explaining the boost. */
  description: string
  /** Estimated extra commission (RM) the affiliate could earn if they
   *  generate a link now and convert before expiry. */
  potentialExtraEarnings: number
  /** ISO-8601 timestamp the alert was created (server time). */
  createdAt: string
  /** ISO-8601 timestamp the XTRA boost expires. */
  expiresAt: string
  /** Whether the user has marked this alert as read. */
  read: boolean
  /** Whether the user dismissed/snoozed this alert. */
  dismissed: boolean
  /** If snoozed, ISO-8601 timestamp until which the alert is hidden. */
  snoozedUntil: string | null
}

/**
 * User alert preferences. Stored in DB once auth lands (Fasa 1.1); for now
 * kept in memory and round-tripped through the preferences API.
 */
export interface AlertPreferences {
  /** Niches the user wants alerts for. Empty array = all niches. */
  enabledNiches: AlertNiche[]
  /** Channels the user wants alerts delivered through. */
  channels: AlertChannel[]
  /** Minimum total boosted commission (%) required to trigger an alert. */
  minCommissionThreshold: number
  /** Minimum relevance score (0-100) required to push an alert. */
  minRelevanceScore: number
  /** Quiet hours — no push notifications during this window (24h, MY time). */
  quietHours: {
    enabled: boolean
    start: string // "22:00"
    end: string // "07:00"
  }
  /** Whether to bundle low-severity alerts into a daily email digest. */
  dailyDigest: boolean
  /** Whether the bot is globally enabled. */
  botEnabled: boolean
}

/** Default preferences for a new user. */
export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enabledNiches: ['beauty', 'tech', 'fashion', 'home', 'food'],
  channels: ['push', 'email'],
  minCommissionThreshold: 20,
  minRelevanceScore: 60,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
  dailyDigest: true,
  botEnabled: true,
}

/** GET /api/alerts/xtra response shape. */
export interface XtraAlertsResponse {
  alerts: CommissionAlert[]
  products: XtraProduct[]
  totalActive: number
  matchedCount: number
  avgBoostPercent: number
  potentialExtraEarnings: number
  niche: AlertNiche | 'all'
  source: AlertDataSource
  lastCheckedAt: string
}

/** GET /api/alerts/preferences response shape. */
export interface AlertPreferencesResponse {
  preferences: AlertPreferences
  source: AlertDataSource
}

/** POST /api/alerts/preferences request body. */
export interface UpdateAlertPreferencesRequest {
  preferences: Partial<AlertPreferences>
}

/** POST /api/alerts/xtra request body (mark as read / dismiss / snooze). */
export interface XtraAlertActionRequest {
  alertId: string
  action: 'read' | 'dismiss' | 'snooze'
  /** Minutes to snooze (only when action === 'snooze'). */
  snoozeMinutes?: number
}

/** POST /api/alerts/xtra response shape. */
export interface XtraAlertActionResponse {
  success: boolean
  alertId: string
  action: 'read' | 'dismiss' | 'snooze'
  source: AlertDataSource
}
