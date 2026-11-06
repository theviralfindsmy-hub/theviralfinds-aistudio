export interface DashboardStats {
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  conversionRate: number
  activeLinks: number
  activeCampaigns: number
  clicksTrend: number
  conversionsTrend: number
  earningsTrend: number
}

export interface AffiliateLinkData {
  id: string
  name: string
  productUrl: string
  affiliateUrl: string
  productName: string | null
  productImage: string | null
  productPrice: number | null
  commission: number | null
  commissionRate: number | null
  category: string | null
  clicks: number
  conversions: number
  earnings: number
  ctr: number | null
  status: 'active' | 'paused' | 'expired'
  shortCode: string
  tags: string | null
  createdAt: string
  expiresAt: string | null
}

export interface ProductData {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  commission: number
  commissionRate: number
  category: string
  rating: number
  sold: number
  shopName: string
  url: string
}

export interface CampaignData {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'completed'
  budget: number | null
  spent: number
  links: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export interface EarningsData {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
  pendingPayout: number
  completedPayout: number
  chart: Array<{ date: string; earnings: number; conversions: number }>
  recentConversions: Array<{
    id: string
    amount: number
    commission: number
    status: string
    createdAt: string
    productName: string
  }>
}

export interface AnalyticsData {
  clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks: number }>
  conversionsOverTime: Array<{ date: string; conversions: number; revenue: number }>
  topCountries: Array<{ country: string; clicks: number; conversions: number }>
  deviceBreakdown: Array<{ device: string; count: number }>
  topLinks: Array<{ name: string; clicks: number; conversions: number; earnings: number }>
  categoryPerformance: Array<{ category: string; clicks: number; conversions: number; earnings: number }>
  conversionFunnel: { views: number; clicks: number; addToCart: number; purchases: number }
}

export interface HermesMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: string
  tokens?: number
}

export interface HermesConversation {
  id: string
  title: string
  messageCount: number
  isActive: boolean
  createdAt: string
}

export interface HermesSkill {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'draft' | 'archived' | 'learning'
  usageCount: number
  successRate: number
  version: number
  learnedFrom: string | null
  createdAt: string
}

export interface HermesTask {
  id: string
  name: string
  description: string | null
  schedule: string | null
  status: 'scheduled' | 'running' | 'completed' | 'failed'
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  lastResult: string | null
}

export interface HermesInsight {
  id: string
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  isRead: boolean
  isActioned: boolean
  createdAt: string
}

export interface HermesConnection {
  id: string
  name: string
  endpoint: string
  apiKey: string | null
  model: string
  isActive: boolean
  lastConnected: string | null
  status: 'connected' | 'disconnected' | 'error'
}

export interface NotificationData {
  id: string
  type: string
  title: string
  description: string
  read: boolean
  createdAt: string
}

export interface LeaderboardEntry {
  id: string
  userName: string
  totalEarnings: number
  totalClicks: number
  totalConversions: number
  period: string
  rank: number
}

export interface AchievementData {
  id: string
  type: string
  title: string
  description: string
  icon: string
  earnedAt: string
}

export interface ReferralData {
  id: string
  referredEmail: string
  referredName: string | null
  status: string
  commission: number | null
  createdAt: string
}
