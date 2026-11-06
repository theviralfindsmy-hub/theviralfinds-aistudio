// ─── Shopee Live — Domain Types ──────────────────────────────────────────────
// These types model the live-session affiliate workflow on Shopee Live.
// Commission structure: base (2.5%–12%) + Shopee Live bonus (up to +72%) = up to 80% total.

export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface LiveProduct {
  id: string
  name: string
  category: string
  imageUrl?: string
  originalPrice: number // RM, before any live discount
  livePrice: number // RM, the price shown during the live session
  flashPrice?: number // RM, optional lower price during a flash sale window
  baseCommission: number // %, e.g. 8 means 8%
  liveBonusCommission: number // %, e.g. 72 means +72%
  totalCommission: number // %, base + bonus (capped at 80)
  estimatedUnits: number // expected units to sell during the session
  displayDurationSec: number // how long to feature the product in the queue
  flashSale?: {
    enabled: boolean
    durationMin: number
    firstNBuyers: number
    flashPrice: number
  }
}

export interface LiveScript {
  id: string
  sessionId: string
  productId?: string // optional — if scoped to one product
  templateId: string
  language: 'manglish' | 'bahasa' | 'english' | 'mix'
  tone: 'casual' | 'excited' | 'professional' | 'funny'
  content: string
  generatedBy: 'ai' | 'template'
  generatedAt: string // ISO date
}

export interface ScriptTemplate {
  id: string
  name: string
  description: string
  durationMin: number
  category: 'opening' | 'demo' | 'qa' | 'flash_sale' | 'closing' | 'full'
  placeholders: string[] // e.g. ['session_title', 'host_name', 'product_name']
  body: string // template body with {placeholder} tokens
}

export interface LiveAnalytics {
  sessionId: string
  viewers: number
  peakViewers: number
  avgViewDurationSec: number
  clicks: number
  conversions: number
  conversionRate: number // %
  earnings: number // RM
  potentialCommission: number // RM (if all estimatedUnits convert)
  topProducts: Array<{
    productId: string
    name: string
    unitsSold: number
    earnings: number
    conversionRate: number
  }>
  viewerTimeline: Array<{ time: string; viewers: number }>
  funnel: {
    impressions: number
    clicks: number
    addToCart: number
    purchases: number
  }
  earningsBreakdown: {
    baseCommission: number
    liveBonus: number
    total: number
  }
}

export interface LiveSession {
  id: string
  title: string
  description?: string
  scheduledAt: string // ISO date
  durationMin: number // 30-120
  status: LiveSessionStatus
  hostName: string
  products: LiveProduct[]
  coverImage?: string
  tags: string[]
  averageCommission: number // % across all products
  potentialEarnings: number // RM
  actualEarnings?: number // RM, only for completed sessions
  viewerCount?: number // for completed/live sessions
  peakViewerCount?: number
  createdAt: string
  updatedAt: string
  startedAt?: string
  endedAt?: string
  scripts: LiveScript[]
}

export interface LiveSessionSummary {
  totalSessions: number
  liveNow: number
  liveNowIds: string[]
  upcoming: number
  completed: number
  totalViewers: number
  totalEarnings: number
  avgConversionRate: number
  avgCommission: number
}

// ─── API Request/Response shapes ─────────────────────────────────────────────

export interface CreateLiveSessionInput {
  title: string
  description?: string
  scheduledAt: string
  durationMin: number
  hostName: string
  productIds?: string[]
  tags?: string[]
}

export interface UpdateLiveSessionInput {
  title?: string
  description?: string
  scheduledAt?: string
  durationMin?: number
  status?: LiveSessionStatus
  hostName?: string
  tags?: string[]
  productIds?: string[]
}

export interface GenerateScriptInput {
  sessionId: string
  productId?: string
  templateId: string
  language?: 'manglish' | 'bahasa' | 'english' | 'mix'
  tone?: 'casual' | 'excited' | 'professional' | 'funny'
}
