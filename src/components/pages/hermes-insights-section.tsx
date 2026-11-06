'use client'

/**
 * HermesInsightsSection — Reusable Proactive Insights UI
 *
 * Embeddable component that shows the live list of HERMES proactive insights
 * (daily summary, anomaly detection, opportunity alerts, trend alerts, and AI
 * recommendations). Designed to drop into the HERMES page (new tab) or any
 * dashboard.
 *
 * Features:
 *   - Header with "Proactive Insights" title + new-insights badge
 *   - Type filter (All / Daily / Anomaly / Opportunity / Trend / Recommendation)
 *   - Insight cards sorted by severity + time, color-coded by type
 *   - Rich card variants: daily_summary shows inline mini-stats,
 *     anomaly shows before/after comparison, opportunity shows trending product
 *   - Primary CTA button ("View Product", "Investigate", "Generate Content")
 *   - "Mark as Actioned" secondary button
 *   - "Generate Fresh Insight" button (calls /api/hermes/insights/generate)
 *   - Auto-refresh every 60s
 *   - Loading skeletons + empty state
 *   - Toast notifications for user actions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Bot, Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
  Lightbulb, Calendar, Rocket, CheckCircle2, ArrowRight, MousePointerClick,
  Target, Clock, Zap, Activity, Filter, Bell, ChevronRight,
} from 'lucide-react'

// ─── Types (mirrors src/lib/hermes-insights/types.ts) ────────────────────────

type InsightType =
  | 'daily_summary' | 'anomaly' | 'opportunity' | 'trend_alert' | 'recommendation'

type InsightSeverity = 'info' | 'warning' | 'critical' | 'success'

interface InsightData {
  today?: { clicks: number; conversions: number; earnings: number; conversionRate: number }
  yesterday?: { clicks: number; conversions: number; earnings: number; conversionRate: number }
  changePct?: { clicks?: number; conversions?: number; earnings?: number }
  metric?: string
  before?: number
  after?: number
  dropPct?: number
  window?: string
  productName?: string
  itemId?: string
  category?: string
  trendPct?: number
  opportunitiesAvailable?: number
  commissionRate?: number
  estimatedEarnings?: number
  recommendationType?: string
  suggestedTime?: string
  expectedLift?: number
}

interface InsightAction {
  label: string
  action: string
  href?: string
  payload?: Record<string, string | number | boolean>
}

interface ProactiveInsight {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
  timestamp: string
  relevance: number
  isRead: boolean
  isActioned: boolean
  source: 'mock' | 'ai' | 'algorithm'
  data?: InsightData
  action?: InsightAction
  secondaryAction?: InsightAction
}

interface InsightsListResponse {
  insights: ProactiveInsight[]
  count: number
  newCount: number
  generatedAt: string
  source: 'mock' | 'ai' | 'algorithm' | 'mixed'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 60_000

const TYPE_META: Record<InsightType, {
  label: string
  icon: typeof Calendar
  color: string
  bg: string
  border: string
}> = {
  daily_summary: {
    label: 'Daily Summary',
    icon: Calendar,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  anomaly: {
    label: 'Anomaly',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  opportunity: {
    label: 'Opportunity',
    icon: Rocket,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  trend_alert: {
    label: 'Trend Alert',
    icon: TrendingUp,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  recommendation: {
    label: 'Recommendation',
    icon: Lightbulb,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
}

const SEVERITY_RING: Record<InsightSeverity, string> = {
  critical: 'ring-2 ring-red-500/30',
  warning: 'ring-2 ring-amber-500/30',
  success: 'ring-2 ring-green-500/30',
  info: 'ring-1 ring-border',
}

const FILTERS: { value: InsightType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'daily_summary', label: 'Daily' },
  { value: 'anomaly', label: 'Anomaly' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'trend_alert', label: 'Trend' },
  { value: 'recommendation', label: 'Recommend' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

function formatChange(pct: number | undefined): string {
  if (pct === undefined) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct}%`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: ProactiveInsight['source'] }) {
  const map = {
    mock: { label: 'Mock', className: 'bg-muted text-muted-foreground border-border' },
    ai: { label: 'AI', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    algorithm: { label: 'Algo', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  }
  const m = map[source]
  return (
    <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', m.className)}>
      {m.label}
    </Badge>
  )
}

function RelevanceBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-red-500' : score >= 70 ? 'bg-amber-500' : 'bg-muted-foreground/40'
  return (
    <div className="flex items-center gap-1.5" title={`Relevance: ${score}/100`}>
      <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground tabular-nums">{score}</span>
    </div>
  )
}

function DailySummaryStats({ data }: { data: InsightData }) {
  if (!data.today || !data.yesterday) return null
  const t = data.today
  const y = data.yesterday
  const chg = data.changePct ?? {}

  const stats = [
    { label: 'Clicks', today: t.clicks, change: chg.clicks, icon: MousePointerClick },
    { label: 'Conv.', today: t.conversions, change: chg.conversions, icon: Target },
    { label: 'Earnings', today: formatRM(t.earnings), change: chg.earnings, icon: Activity },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {stats.map((s) => {
        const isUp = (s.change ?? 0) >= 0
        const Icon = s.icon
        return (
          <div
            key={s.label}
            className={cn(
              'rounded-lg border p-2.5',
              isUp ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
              <Icon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="text-sm font-bold tabular-nums mt-0.5">{s.today}</div>
            {s.change !== undefined && (
              <div className={cn(
                'flex items-center gap-0.5 text-[10px] font-medium mt-0.5',
                isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              )}>
                {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {formatChange(s.change)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AnomalyComparison({ data }: { data: InsightData }) {
  if (data.before === undefined || data.after === undefined) return null
  const isDrop = (data.dropPct ?? 0) < 0
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground">Before</div>
        <div className="text-sm font-bold tabular-nums">{data.before}</div>
      </div>
      <ArrowRight className={cn('h-4 w-4', isDrop ? 'text-red-500' : 'text-green-500')} />
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground">After</div>
        <div className="text-sm font-bold tabular-nums">{data.after}</div>
      </div>
      <div className={cn(
        'px-2 py-1 rounded-md text-xs font-bold',
        isDrop ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/20 text-green-600 dark:text-green-400',
      )}>
        {formatChange(data.dropPct)}
      </div>
    </div>
  )
}

function OpportunityPreview({ data }: { data: InsightData }) {
  if (!data.productName) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
      {data.category && (
        <Badge variant="outline" className="text-[10px] bg-amber-500/5 border-amber-500/20">
          {data.category}
        </Badge>
      )}
      {data.trendPct !== undefined && (
        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
          <TrendingUp className="h-3 w-3" /> +{data.trendPct}% searches
        </span>
      )}
      {data.opportunitiesAvailable !== undefined && data.opportunitiesAvailable > 0 && (
        <span className="text-muted-foreground">
          {data.opportunitiesAvailable} products
        </span>
      )}
      {data.commissionRate !== undefined && data.commissionRate > 0 && (
        <span className="text-muted-foreground">
          {data.commissionRate}% commission
        </span>
      )}
      {data.estimatedEarnings !== undefined && data.estimatedEarnings > 0 && (
        <span className="text-green-600 dark:text-green-400 font-medium">
          ~{formatRM(data.estimatedEarnings)}/mo
        </span>
      )}
    </div>
  )
}

function RecommendationMeta({ data }: { data: InsightData }) {
  if (!data.recommendationType) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
      {data.suggestedTime && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
          <Clock className="h-3 w-3" /> {data.suggestedTime}
        </span>
      )}
      {data.expectedLift !== undefined && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
          <Zap className="h-3 w-3" /> +{data.expectedLift}% expected lift
        </span>
      )}
    </div>
  )
}

// ─── Insight Card ────────────────────────────────────────────────────────────

function InsightCard({
  insight,
  onAction,
  onMarkActioned,
}: {
  insight: ProactiveInsight
  onAction: (insight: ProactiveInsight) => void
  onMarkActioned: (id: string) => void
}) {
  const meta = TYPE_META[insight.type]
  const Icon = meta.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-shadow hover:shadow-md',
        SEVERITY_RING[insight.severity],
        insight.isActioned && 'opacity-60',
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className={cn('flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center', meta.bg, meta.border, 'border')}>
                <Icon className={cn('h-4 w-4', meta.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', meta.bg, meta.border, meta.color)}>
                    {meta.label}
                  </Badge>
                  {insight.severity === 'critical' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                      Critical
                    </Badge>
                  )}
                  {insight.severity === 'warning' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                      Warning
                    </Badge>
                  )}
                  <SourceBadge source={insight.source} />
                  {!insight.isRead && !insight.isActioned && (
                    <span className="h-1.5 w-1.5 rounded-full bg-hermes flex-shrink-0" title="New" />
                  )}
                </div>
                <CardTitle className="text-sm font-semibold mt-1.5 leading-snug">
                  {insight.title}
                </CardTitle>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <RelevanceBar score={insight.relevance} />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {timeAgo(insight.timestamp)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.description}
          </p>

          {/* Rich data renders per type */}
          {insight.type === 'daily_summary' && insight.data && (
            <DailySummaryStats data={insight.data} />
          )}
          {insight.type === 'anomaly' && insight.data && (
            <AnomalyComparison data={insight.data} />
          )}
          {insight.type === 'opportunity' && insight.data && (
            <OpportunityPreview data={insight.data} />
          )}
          {insight.type === 'recommendation' && insight.data && (
            <RecommendationMeta data={insight.data} />
          )}
          {insight.type === 'trend_alert' && insight.data?.trendPct !== undefined && (
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <Badge variant="outline" className="bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
                <TrendingUp className="h-3 w-3 mr-1" /> +{insight.data.trendPct}% growth
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {insight.action && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-[11px] px-2.5"
                onClick={() => onAction(insight)}
                disabled={insight.isActioned}
              >
                {insight.action.label}
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] px-2.5"
              onClick={() => onMarkActioned(insight.id)}
              disabled={insight.isActioned}
            >
              {insight.isActioned ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Actioned
                </>
              ) : (
                'Mark as Actioned'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function InsightCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-3.5 w-3/4 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-hermes/10 flex items-center justify-center mb-3">
          <Bell className="h-6 w-6 text-hermes" />
        </div>
        <h3 className="text-sm font-semibold">No proactive insights yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          HERMES is still scanning your data. Generate a fresh insight now, or
          wait — new ones get pushed automatically as anomalies and trends
          surface.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onGenerate}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Generate Insight
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface HermesInsightsSectionProps {
  /** Optional className for outer wrapper. */
  className?: string
  /** Whether to show the type filter chips. Default: true. */
  showFilter?: boolean
  /** Whether to show the "Generate Insight" button. Default: true. */
  showGenerate?: boolean
  /** Max height for the scrollable list (Tailwind class). Default: 'max-h-[640px]'. */
  maxHeight?: string
}

export function HermesInsightsSection({
  className,
  showFilter = true,
  showGenerate = true,
  maxHeight = 'max-h-[640px]',
}: HermesInsightsSectionProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const [newCount, setNewCount] = useState(0)
  const [source, setSource] = useState<InsightsListResponse['source']>('mock')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<InsightType | 'all'>('all')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch insights ──────────────────────────────────────────────────────
  const fetchInsights = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/hermes/insights', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: InsightsListResponse = await res.json()
      setInsights(data.insights)
      setNewCount(data.newCount)
      setSource(data.source)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[HermesInsightsSection] fetch failed:', err)
      if (!silent) {
        toast.error('Failed to load insights', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // ─── Generate fresh insight ──────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/hermes/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: filter === 'all' ? 'recommendation' : filter,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      toast.success('Fresh insight generated', {
        description: data.insight?.title?.slice(0, 80) ?? '',
      })
      // Refresh list to show the new insight
      await fetchInsights(true)
    } catch (err) {
      console.error('[HermesInsightsSection] generate failed:', err)
      toast.error('Failed to generate insight', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setGenerating(false)
    }
  }, [filter, fetchInsights])

  // ─── Mark as actioned ────────────────────────────────────────────────────
  const handleMarkActioned = useCallback(async (id: string) => {
    // Optimistic update
    setInsights(prev => prev.map(i =>
      i.id === id ? { ...i, isActioned: true, isRead: true } : i,
    ))
    setNewCount(prev => Math.max(0, prev - 1))
    try {
      await fetch('/api/hermes/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'actioned' }),
      })
      toast.success('Insight marked as actioned', {
        description: 'HERMES will learn from this action.',
      })
    } catch (err) {
      console.error('[HermesInsightsSection] mark actioned failed:', err)
      // Revert on failure
      setInsights(prev => prev.map(i =>
        i.id === id ? { ...i, isActioned: false, isRead: false } : i,
      ))
      toast.error('Failed to mark insight')
    }
  }, [])

  // ─── Primary action handler ──────────────────────────────────────────────
  const handleAction = useCallback((insight: ProactiveInsight) => {
    const action = insight.action
    if (!action) return

    // Mark as read optimistically
    setInsights(prev => prev.map(i =>
      i.id === insight.id ? { ...i, isRead: true } : i,
    ))
    setNewCount(prev => Math.max(0, prev - 1))

    // Fire async mark-as-read (don't await — UX shouldn't block navigation)
    void fetch('/api/hermes/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: insight.id, action: 'read' }),
    }).catch(() => { /* silent */ })

    // Execute the action
    switch (action.action) {
      case 'view_product':
      case 'view_analytics':
      case 'view_earnings':
      case 'investigate':
      case 'schedule_post':
      case 'generate_content':
        if (action.href) {
          toast.info(action.label, { description: `Navigating to ${action.href}` })
          // Use window.location for soft nav if same origin
          if (typeof window !== 'undefined') {
            window.location.href = action.href
          }
        } else {
          toast.info(action.label)
        }
        break
      case 'generate_link':
        toast.success('Generate Link', {
          description: insight.data?.productName
            ? `Opening link generator for ${insight.data.productName}`
            : 'Opening link generator',
        })
        if (typeof window !== 'undefined') {
          window.location.href = '/links'
        }
        break
      case 'dismiss':
        void handleMarkActioned(insight.id)
        break
      default:
        toast.info(action.label)
    }
  }, [handleMarkActioned])

  // ─── Auto-refresh every 60s ──────────────────────────────────────────────
  useEffect(() => {
    void fetchInsights()
    refreshTimer.current = setInterval(() => {
      void fetchInsights(true)
    }, REFRESH_INTERVAL_MS)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [fetchInsights])

  // ─── Apply client-side filter (server already filters, but for instant UX) ─
  const visibleInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.type === filter)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-hermes/10 border border-hermes/20">
            <Bot className="h-4 w-4 text-hermes" />
          </div>
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              Proactive Insights
              {newCount > 0 && (
                <Badge className="bg-hermes text-white text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                  {newCount}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              HERMES pushes insights as they surface — no need to ask.
              {lastRefresh && (
                <span className="ml-1 opacity-70">· Updated {timeAgo(lastRefresh.toISOString())}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] capitalize',
              source === 'ai' && 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
              source === 'mock' && 'bg-muted text-muted-foreground',
              source === 'algorithm' && 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
              source === 'mixed' && 'bg-hermes/10 border-hermes/20 text-hermes',
            )}
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            {source}
          </Badge>
          {showGenerate && (
            <Button
              size="sm"
              variant="default"
              className="h-8"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generate Insight
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => fetchInsights()}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      {showFilter && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground mr-1" />
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                filter === f.value
                  ? 'bg-hermes text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Insights list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <InsightCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleInsights.length === 0 ? (
        <EmptyState onGenerate={handleGenerate} />
      ) : (
        <ScrollArea className={cn('pr-3', maxHeight)}>
          <div className="space-y-3 pb-2">
            <AnimatePresence mode="popLayout">
              {visibleInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={handleAction}
                  onMarkActioned={handleMarkActioned}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Footer summary */}
      {!loading && visibleInsights.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>
            Showing {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''}
            {filter !== 'all' && ` · filtered: ${FILTERS.find(f => f.value === filter)?.label}`}
          </span>
          <span>Auto-refreshes every 60s</span>
        </div>
      )}
    </div>
  )
}

export default HermesInsightsSection
