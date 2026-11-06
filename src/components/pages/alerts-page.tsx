'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellRing,
  Radio,
  Zap,
  Target,
  TrendingUp,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Link2,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Mail,
  MessageSquare,
  Bell,
  Moon,
  RefreshCw,
  Flame,
  ShoppingBag,
  CheckCheck,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import type {
  AlertChannel,
  AlertNiche,
  AlertPreferences,
  AlertType,
  CommissionAlert,
  XtraAlertsResponse,
  AlertPreferencesResponse,
  XtraAlertActionRequest,
} from '@/lib/alerts/types'
import { ALERT_TYPE_META, NICHE_META, ALL_NICHES } from '@/lib/alerts/mock-data'

// ─── Local types ────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'high' | 'niche'

type AlertActionBody = XtraAlertActionRequest

// ─── Helpers ────────────────────────────────────────────────────────────────

/** "Ends in 3h 24m" / "Ends in 12m" / "Ends in 2d 4h" / "Expired". */
function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `Ends in ${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hours < 24) return `Ends in ${hours}h ${remMins}m`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return `Ends in ${days}d ${remHours}h`
}

/** "RM 1,234.56" */
function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Severity → tailwind classes for the badge. */
function severityBadgeClass(severity: CommissionAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
    case 'high':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
    case 'medium':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'low':
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
  }
}

/** Relevance score → tailwind classes for the score badge. */
function relevanceBadgeClass(score: number): string {
  if (score >= 85) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  if (score >= 70) return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30'
  if (score >= 60) return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30'
}

// ─── Live countdown ticker hook ────────────────────────────────────────────

/**
 * Returns a value that updates every 30s so the countdown UI re-renders
 * without spamming the API. Driven by TanStack Query's refetchInterval
 * for the data itself; this hook just bumps the local clock.
 */
function useTicker(intervalMs = 30_000): number {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return tick
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: typeof Zap
  label: string
  value: string
  sub?: string
  accent: string
  loading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              accent,
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PreferencesBar({
  preferences,
  onChange,
  saving,
}: {
  preferences: AlertPreferences
  onChange: (next: AlertPreferences) => void
  saving: boolean
}) {
  const [open, setOpen] = useState(false)

  const toggleNiche = (n: AlertNiche) => {
    const has = preferences.enabledNiches.includes(n)
    const next = has
      ? preferences.enabledNiches.filter((x) => x !== n)
      : [...preferences.enabledNiches, n]
    onChange({ ...preferences, enabledNiches: next })
  }

  const toggleChannel = (c: AlertChannel) => {
    const has = preferences.channels.includes(c)
    const next = has
      ? preferences.channels.filter((x) => x !== c)
      : [...preferences.channels, c]
    onChange({ ...preferences, channels: next })
  }

  const channelMeta: { id: AlertChannel; label: string; icon: typeof Bell }[] = [
    { id: 'push', label: 'Push', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
  ]

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/40"
            aria-expanded={open}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-shopee/10">
                <SlidersHorizontal className="size-4 text-shopee" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Alert Preferences</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {preferences.enabledNiches.length} niche(s) ·{' '}
                  {preferences.channels.length} channel(s) · min{' '}
                  {preferences.minCommissionThreshold}% commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <RefreshCw className="size-3 animate-spin" />
                  Saving…
                </span>
              )}
              {open ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <CardContent className="p-4 space-y-5">
            {/* Bot enabled master switch */}
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Radio
                  className={cn(
                    'size-4 shrink-0',
                    preferences.botEnabled
                      ? 'text-emerald-500'
                      : 'text-muted-foreground',
                  )}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">XTRA Alert Bot</p>
                  <p className="text-[10px] text-muted-foreground">
                    {preferences.botEnabled ? 'Active · monitoring 24/7' : 'Paused'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.botEnabled}
                onCheckedChange={(v) =>
                  onChange({ ...preferences, botEnabled: v })
                }
                aria-label="Toggle XTRA alert bot"
              />
            </div>

            {/* Niche toggles */}
            <div>
              <p className="text-xs font-semibold mb-2">Niche subscriptions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ALL_NICHES.map((n) => {
                  const meta = NICHE_META[n]
                  const active = preferences.enabledNiches.includes(n)
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNiche(n)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all',
                        active
                          ? 'border-shopee/40 bg-shopee/5 ring-1 ring-shopee/20'
                          : 'border-border bg-background hover:bg-accent/40 opacity-70',
                      )}
                      aria-pressed={active}
                    >
                      <span className="text-base leading-none">{meta.emoji}</span>
                      <span className="text-xs font-medium">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Min commission slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">Minimum commission threshold</p>
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {preferences.minCommissionThreshold}%
                </Badge>
              </div>
              <Slider
                value={[preferences.minCommissionThreshold]}
                min={0}
                max={80}
                step={5}
                onValueChange={(v) =>
                  onChange({
                    ...preferences,
                    minCommissionThreshold: v[0] ?? 0,
                  })
                }
                className="w-full"
                aria-label="Minimum commission threshold"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Only push alerts when the boosted commission is at least{' '}
                <span className="font-medium">
                  {preferences.minCommissionThreshold}%
                </span>
                .
              </p>
            </div>

            {/* Channels + quiet hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-2">Channels</p>
                <div className="space-y-2">
                  {channelMeta.map((c) => {
                    const active = preferences.channels.includes(c.id)
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <c.icon className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{c.label}</span>
                        </div>
                        <Switch
                          checked={active}
                          onCheckedChange={() => toggleChannel(c.id)}
                          aria-label={`Toggle ${c.label} channel`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2">Quiet hours</p>
                <div className="rounded-lg border bg-background p-2.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Moon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">Enable</span>
                    </div>
                    <Switch
                      checked={preferences.quietHours.enabled}
                      onCheckedChange={(v) =>
                        onChange({
                          ...preferences,
                          quietHours: { ...preferences.quietHours, enabled: v },
                        })
                      }
                      aria-label="Toggle quiet hours"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>From</span>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) =>
                        onChange({
                          ...preferences,
                          quietHours: {
                            ...preferences.quietHours,
                            start: e.target.value,
                          },
                        })
                      }
                      className="rounded-md border bg-background px-1.5 py-1 text-[11px]"
                      disabled={!preferences.quietHours.enabled}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) =>
                        onChange({
                          ...preferences,
                          quietHours: {
                            ...preferences.quietHours,
                            end: e.target.value,
                          },
                        })
                      }
                      className="rounded-md border bg-background px-1.5 py-1 text-[11px]"
                      disabled={!preferences.quietHours.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">Daily digest</span>
                    </div>
                    <Switch
                      checked={preferences.dailyDigest}
                      onCheckedChange={(v) =>
                        onChange({ ...preferences, dailyDigest: v })
                      }
                      aria-label="Toggle daily digest"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function AlertCard({
  alert,
  tick,
  onAction,
  acting,
}: {
  alert: CommissionAlert
  tick: number
  onAction: (action: AlertActionBody['action']) => void
  acting: boolean
}) {
  const meta = ALERT_TYPE_META[alert.type]
  // `tick` is referenced so the countdown re-renders every 30s.
  void tick
  const countdown = formatCountdown(alert.expiresAt)
  const isExpired = countdown === 'Expired'
  const isCritical = alert.severity === 'critical'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.98 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'transition-colors',
          !alert.read && cn('ring-1', meta.ring, 'bg-card'),
          alert.read && 'opacity-90',
          isExpired && 'opacity-50',
        )}
      >
        <CardContent className="p-4">
          {/* Top row: type badge + severity + countdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                  meta.bg,
                  meta.color,
                )}
              >
                <span className="text-[10px] leading-none">{meta.emoji}</span>
                {meta.shortLabel}
              </span>
              <Badge
                variant="outline"
                className={cn('text-[10px] capitalize', severityBadgeClass(alert.severity))}
              >
                {alert.severity}
              </Badge>
              {!alert.read && (
                <span className="size-1.5 rounded-full bg-shopee animate-pulse" aria-label="Unread" />
              )}
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium tabular-nums',
                isExpired
                  ? 'text-muted-foreground'
                  : isCritical
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground',
              )}
            >
              <Clock className="size-3" />
              {countdown}
            </div>
          </div>

          {/* Middle row: thumbnail + product + commission arrow */}
          <div className="flex items-start gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
              <img
                src={alert.product.thumbnail}
                alt={alert.product.productName}
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight line-clamp-2">
                {alert.product.productName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                {alert.product.shopName} · {alert.product.category}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground line-through tabular-nums">
                    {alert.product.baseCommission}%
                  </span>
                  <ArrowRight className="size-3 text-emerald-500" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {alert.product.boostedCommission}%
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-1 text-[9px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    +{alert.product.boostDelta}pp
                  </Badge>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
            {alert.description}
          </p>

          {/* Bottom row: relevance + potential + actions */}
          <Separator className="my-3" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-[10px] tabular-nums', relevanceBadgeClass(alert.relevanceScore))}
                title={`Relevance: ${alert.relevanceScore}/100 for your niche`}
              >
                <Target className="size-3" />
                {alert.relevanceScore}% match
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] tabular-nums border-shopee/30 bg-shopee/5 text-shopee"
                title="Estimated extra commission if you convert a typical monthly volume at the boosted rate"
              >
                <Wallet className="size-3" />
                +{formatRM(alert.potentialExtraEarnings)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {NICHE_META[alert.product.niche].emoji} {NICHE_META[alert.product.niche].label}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 h-8 bg-shopee text-white hover:bg-shopee/90"
              disabled={isExpired}
              onClick={() =>
                toast.success('Affiliate link generated', {
                  description: `${alert.product.productName} — ${alert.product.boostedCommission}% commission now tracked.`,
                })
              }
            >
              <Link2 className="size-3.5" />
              Generate Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              disabled={acting}
              onClick={() => onAction('snooze')}
            >
              <Clock className="size-3.5" />
              Snooze 1h
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-8 text-muted-foreground hover:text-foreground"
              disabled={acting}
              onClick={() => onAction('dismiss')}
            >
              <X className="size-3.5" />
              Dismiss
            </Button>
            {!alert.read && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 h-8 ml-auto text-muted-foreground hover:text-foreground"
                disabled={acting}
                onClick={() => onAction('read')}
              >
                <CheckCheck className="size-3.5" />
                Mark read
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="size-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export function AlertsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  // Local editable preferences — only set once the user actually edits.
  // Until then we render straight from the prefs query (derived state).
  const [localPrefs, setLocalPrefs] = useState<AlertPreferences | null>(null)
  const [actingAlertId, setActingAlertId] = useState<string | null>(null)
  const tick = useTicker(30_000)

  // ── Query: alerts (30s polling simulates real-time push) ──────────────
  const alertsQuery = useQuery<XtraAlertsResponse>({
    queryKey: ['alerts', 'xtra', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/xtra?niche=all', {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as XtraAlertsResponse
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  // ── Query: preferences ─────────────────────────────────────────────────
  const prefsQuery = useQuery<AlertPreferencesResponse>({
    queryKey: ['alerts', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/preferences', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as AlertPreferencesResponse
    },
    staleTime: 30_000,
  })

  // Sync the prefs query result into local editable state.
  // `prefs` is derived: prefer locally-edited prefs, fall back to server data.
  // Once the mutation succeeds, server data updates and we keep local in sync.
  const prefs = localPrefs ?? prefsQuery.data?.preferences ?? null

  // ── Mutation: update preferences (debounced save) ─────────────────────
  const prefsMutation = useMutation<
    AlertPreferencesResponse,
    Error,
    AlertPreferences
  >({
    mutationFn: async (next) => {
      const res = await fetch('/api/alerts/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: next }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as AlertPreferencesResponse
    },
    onSuccess: (data) => {
      setLocalPrefs(data.preferences)
      queryClient.setQueryData(['alerts', 'preferences'], data)
      // Preferences affect the alert feed (threshold filter) — invalidate.
      queryClient.invalidateQueries({ queryKey: ['alerts', 'xtra'] })
    },
    onError: (err) => {
      toast.error('Failed to save preferences', {
        description: err.message,
      })
    },
  })

  const handlePreferencesChange = useCallback(
    (next: AlertPreferences) => {
      // Optimistic local update for instant UI feedback.
      setLocalPrefs(next)
      prefsMutation.mutate(next)
    },
    [prefsMutation],
  )

  // ── Mutation: alert actions (read / dismiss / snooze) ─────────────────
  const actionMutation = useMutation<
    { success: boolean },
    Error,
    { alertId: string; action: AlertActionBody['action'] }
  >({
    mutationFn: async ({ alertId, action }) => {
      const res = await fetch('/api/alerts/xtra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action,
          snoozeMinutes: action === 'snooze' ? 60 : undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as { success: boolean }
    },
    onMutate: ({ alertId }) => setActingAlertId(alertId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'xtra'] })
      const verb =
        vars.action === 'read'
          ? 'marked as read'
          : vars.action === 'dismiss'
          ? 'dismissed'
          : 'snoozed for 1 hour'
      toast.success(`Alert ${verb}`, {
        description: 'The XTRA feed has been updated.',
      })
    },
    onError: (err) => {
      toast.error('Action failed', { description: err.message })
    },
    onSettled: () => setActingAlertId(null),
  })

  // ── Derived state ──────────────────────────────────────────────────────
  const alerts = alertsQuery.data?.alerts ?? []
  const stats = alertsQuery.data
  // (prefs is already derived above from localPrefs + server data)

  const filteredAlerts = useMemo(() => {
    let list = alerts
    if (activeTab === 'unread') {
      list = list.filter((a) => !a.read)
    } else if (activeTab === 'high') {
      list = list.filter((a) => a.severity === 'critical' || a.severity === 'high')
    } else if (activeTab === 'niche') {
      // "My Niche Only" = alerts whose product niche is in enabledNiches AND
      // whose relevance is >= minRelevanceScore.
      const niches = prefs?.enabledNiches ?? []
      const minRel = prefs?.minRelevanceScore ?? 60
      list = list.filter(
        (a) =>
          niches.includes(a.product.niche) && a.relevanceScore >= minRel,
      )
    }
    return list
  }, [alerts, activeTab, prefs])

  const unreadCount = alerts.filter((a) => !a.read).length
  const highPriorityCount = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high',
  ).length
  const myNicheCount = useMemo(() => {
    const niches = prefs?.enabledNiches ?? []
    const minRel = prefs?.minRelevanceScore ?? 60
    return alerts.filter(
      (a) => niches.includes(a.product.niche) && a.relevanceScore >= minRel,
    ).length
  }, [alerts, prefs])

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
              <BellRing className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Commission XTRA Alert Bot
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Real-time alerts when Shopee boosts commission in your niche.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400"
            aria-label="Live status"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            LIVE
          </span>
          <Badge variant="secondary" className="gap-1">
            <Flame className="size-3 text-orange-500" />
            {stats?.totalActive ?? 0} products boosting now
          </Badge>
        </div>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard
          icon={Zap}
          label="Active XTRA Products"
          value={stats ? String(stats.totalActive) : '—'}
          sub="Currently boosting commission"
          accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          loading={alertsQuery.isLoading}
        />
        <StatCard
          icon={Target}
          label="My Matched Alerts"
          value={stats ? String(stats.matchedCount) : '—'}
          sub={`of ${stats?.totalActive ?? 0} active XTRA products`}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          loading={alertsQuery.isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Commission Boost"
          value={stats ? `+${stats.avgBoostPercent}pp` : '—'}
          sub="Mean uplift across active alerts"
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          loading={alertsQuery.isLoading}
        />
        <StatCard
          icon={Wallet}
          label="Potential Extra Earnings"
          value={stats ? formatRM(stats.potentialExtraEarnings) : '—'}
          sub="If you convert at boosted rate"
          accent="bg-shopee/10 text-shopee"
          loading={alertsQuery.isLoading}
        />
      </motion.div>

      {/* ── Preferences bar ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {prefs ? (
          <PreferencesBar
            preferences={prefs}
            onChange={handlePreferencesChange}
            saving={prefsMutation.isPending}
          />
        ) : (
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ── Filter tabs + alerts feed ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all" className="gap-1.5">
                All
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {alerts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-1.5">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="high" className="gap-1.5">
                High Priority
                {highPriorityCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] h-4 px-1.5 bg-red-500/10 text-red-600 dark:text-red-400"
                  >
                    {highPriorityCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="niche" className="gap-1.5">
                My Niche
                {myNicheCount > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                    {myNicheCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {alertsQuery.isFetching ? (
                <>
                  <RefreshCw className="size-3 animate-spin" />
                  Syncing…
                </>
              ) : stats ? (
                <>
                  <Sparkles className="size-3 text-shopee" />
                  Last checked {new Date(stats.lastCheckedAt).toLocaleTimeString('en-MY', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              ) : null}
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            {alertsQuery.isLoading ? (
              <AlertsSkeleton />
            ) : alertsQuery.isError ? (
              <EmptyState
                icon={Radio}
                title="Couldn't load alerts"
                description={
                  alertsQuery.error instanceof Error
                    ? alertsQuery.error.message
                    : 'Please try again in a moment.'
                }
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => alertsQuery.refetch()}
                  >
                    <RefreshCw className="size-4" />
                    Retry
                  </Button>
                }
              />
            ) : filteredAlerts.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={
                  activeTab === 'unread'
                    ? 'You are all caught up!'
                    : activeTab === 'high'
                    ? 'No high-priority alerts right now'
                    : activeTab === 'niche'
                    ? 'No alerts match your niche yet'
                    : 'No Commission XTRA products right now'
                }
                description={
                  activeTab === 'unread'
                    ? 'All alerts have been read. New XTRA boosts will appear here automatically.'
                    : activeTab === 'niche'
                    ? 'Try enabling more niches in your preferences, or wait for the next scan (every 30 minutes).'
                    : 'The bot checks Shopee every 30 minutes for new XTRA opportunities. Check back soon!'
                }
              />
            ) : (
              <ScrollArea className="max-h-[calc(100vh-22rem)]">
                <div className="space-y-3 pr-2">
                  <AnimatePresence mode="popLayout">
                    {filteredAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        tick={tick}
                        acting={actingAlertId === alert.id}
                        onAction={(action) =>
                          actionMutation.mutate({ alertId: alert.id, action })
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
