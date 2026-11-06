'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Store,
  Music2,
  ShoppingBag,
  PartyPopper,
  ChevronDown,
  ChevronUp,
  X,
  Wand2,
  Send,
  RefreshCw,
  Loader2,
  TrendingUp,
  Hash,
  History,
  Lightbulb,
  Zap,
  Edit3,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  CalendarEntry,
  CalendarNiche,
  CalendarPlatform,
  CalendarPreferences,
  CalendarTone,
  ContentCalendar,
  DayOfWeek,
  GenerateCalendarResponse,
  ScheduleCalendarResponse,
  SeasonalEvent,
  TimeSlot,
} from '@/lib/calendar/types'
import {
  DAYS_OF_WEEK,
  NICHE_LABELS,
  PLATFORM_LABELS,
  TIME_SLOTS,
  TONE_LABELS,
} from '@/lib/calendar/types'

// ─── Platform Metadata ────────────────────────────────────────────────────────

const PLATFORM_META: Record<CalendarPlatform, {
  label: string
  short: string
  icon: typeof Store
  badgeBg: string
  badgeText: string
  dot: string
}> = {
  shopee: {
    label: 'Shopee',
    short: 'S',
    icon: ShoppingBag,
    badgeBg: 'bg-shopee',
    badgeText: 'text-white',
    dot: 'bg-shopee',
  },
  tiktok: {
    label: 'TikTok',
    short: 'TT',
    icon: Music2,
    badgeBg: 'bg-neutral-900 dark:bg-neutral-100',
    badgeText: 'text-white dark:text-neutral-900',
    dot: 'bg-neutral-900 dark:bg-neutral-100',
  },
  lazada: {
    label: 'Lazada',
    short: 'L',
    icon: Store,
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    dot: 'bg-purple-600',
  },
}

const NICHE_OPTIONS: { value: CalendarNiche; label: string; emoji: string }[] = [
  { value: 'beauty', label: 'Beauty', emoji: '💄' },
  { value: 'tech', label: 'Tech', emoji: '📱' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'food', label: 'Food', emoji: '🍜' },
  { value: 'mixed', label: 'Mixed', emoji: '✨' },
]

const TONE_OPTIONS: { value: CalendarTone; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'hype', label: 'Hype' },
  { value: 'educational', label: 'Educational' },
]

const SCORE_COLORS: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  mid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  low: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

function scoreClass(score: number): string {
  if (score >= 80) return SCORE_COLORS.high
  if (score >= 65) return SCORE_COLORS.mid
  return SCORE_COLORS.low
}

// ─── Week Helpers ─────────────────────────────────────────────────────────────

function getNextMonday(now: Date = new Date()): Date {
  const d = new Date(now)
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function shiftWeek(iso: string, weeks: number): string {
  const d = new Date(iso + 'T00:00:00+08:00')
  d.setDate(d.getDate() + weeks * 7)
  return isoDate(d)
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[monday.getMonth()]} ${monday.getDate()} — ${months[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalendarPage() {
  const qc = useQueryClient()
  const [weekStart, setWeekStart] = useState<string>(isoDate(getNextMonday()))
  const [view, setView] = useState<'week' | 'month'>('week')
  const [preferencesOpen, setPreferencesOpen] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null)
  const [scheduledEntryIds, setScheduledEntryIds] = useState<Set<string>>(new Set())

  const [preferences, setPreferences] = useState<CalendarPreferences>({
    niche: 'beauty',
    platforms: ['shopee', 'tiktok'],
    postsPerDay: 2,
    tone: 'casual',
    seasonalBoost: true,
    featuredProducts: [],
  })

  // ── Fetch current week's calendar ──
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['ai-calendar', weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/ai/calendar?week=${weekStart}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load calendar (HTTP ${res.status})`)
      const data = await res.json()
      return data as { calendar: ContentCalendar; source: 'ai' | 'mock' }
    },
  })

  // ── Fetch history ──
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-calendar-history'],
    queryFn: async () => {
      const res = await fetch('/api/ai/calendar', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load history (HTTP ${res.status})`)
      const data = await res.json()
      return data as {
        pastCalendars: ContentCalendar[]
        nextEvent: { event: SeasonalEvent; daysUntil: number } | null
        source: 'ai' | 'mock'
      }
    },
  })

  // ── Generate calendar mutation ──
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: weekStart,
          niche: preferences.niche,
          platforms: preferences.platforms,
          preferences,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Generation failed (HTTP ${res.status})`)
      }
      return (await res.json()) as GenerateCalendarResponse
    },
    onSuccess: (data) => {
      toast.success('Calendar generated!', {
        description: data.source === 'ai'
          ? `${data.calendar.entries.length} entries created with AI ✨`
          : `${data.calendar.entries.length} entries created (algorithmic fallback)`,
        duration: 5000,
      })
      setScheduledEntryIds(new Set())
      qc.invalidateQueries({ queryKey: ['ai-calendar', weekStart] })
      qc.invalidateQueries({ queryKey: ['ai-calendar-history'] })
    },
    onError: (err: Error) => {
      toast.error('Calendar generation failed', { description: err.message })
    },
  })

  // ── Schedule entry mutation ──
  const scheduleMutation = useMutation({
    mutationFn: async (vars: { calendarId: string; entryIds: string[] }) => {
      const res = await fetch('/api/ai/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: vars.calendarId,
          entryIds: vars.entryIds,
          weekStartDate: weekStart,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Scheduling failed (HTTP ${res.status})`)
      }
      return (await res.json()) as ScheduleCalendarResponse
    },
    onSuccess: (data, vars) => {
      const newlyScheduled = new Set(scheduledEntryIds)
      vars.entryIds.forEach((id) => newlyScheduled.add(id))
      setScheduledEntryIds(newlyScheduled)
      toast.success(`Scheduled ${data.scheduled} post${data.scheduled === 1 ? '' : 's'}!`, {
        description: data.failed > 0
          ? `${data.failed} failed — check console for details.`
          : 'View them in the Auto-Post page.',
        action: {
          label: 'View',
          onClick: () => {
            // No router here — just inform user
            toast.info('Open the Auto-Post page from the sidebar to manage scheduled posts.')
          },
        },
      })
    },
    onError: (err: Error) => {
      toast.error('Scheduling failed', { description: err.message })
    },
  })

  // ── Toggle platform checkbox ──
  const togglePlatform = useCallback((p: CalendarPlatform) => {
    setPreferences((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }))
  }, [])

  // ── Derived data ──
  const currentCalendar = weekData?.calendar
  const nextEvent = historyData?.nextEvent
  const pastCalendars = historyData?.pastCalendars ?? []

  // Group entries by day & time slot for the grid
  const entriesByCell = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    if (!currentCalendar) return map
    for (const entry of currentCalendar.entries) {
      const key = `${entry.day}-${entry.timeSlot}`
      const arr = map.get(key) ?? []
      arr.push(entry)
      map.set(key, arr)
    }
    return map
  }, [currentCalendar])

  const isGenerating = generateMutation.isPending
  const isSchedulingEntry = (id: string) =>
    scheduleMutation.isPending && scheduleMutation.variables?.entryIds.includes(id)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="size-7 text-shopee" />
            AI Content Calendar Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan your week in one click — trends + seasonal events + audience data → ready-to-post schedule.
          </p>
        </div>
        {currentCalendar && (
          <Badge
            variant="outline"
            className={cn(
              'self-start md:self-auto',
              currentCalendar.source === 'ai'
                ? 'border-shopee/40 text-shopee bg-shopee/5'
                : 'border-amber-500/40 text-amber-600 bg-amber-500/5',
            )}
          >
            <Sparkles className="size-3" />
            Source: {currentCalendar.source === 'ai' ? 'AI-generated' : 'Algorithmic fallback'}
          </Badge>
        )}
      </div>

      {/* ─── Seasonal Events Banner ─── */}
      {nextEvent && nextEvent.daysUntil <= 7 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-shopee/30 bg-gradient-to-r from-shopee/10 via-shopee/5 to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-3xl" aria-hidden>{nextEvent.event.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {nextEvent.event.name} {nextEvent.daysUntil === 0
                    ? 'is TODAY!'
                    : `in ${nextEvent.daysUntil} day${nextEvent.daysUntil === 1 ? '' : 's'}!`}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {nextEvent.event.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                    <Zap className="size-3" />
                    Commission x{nextEvent.event.commissionMultiplier.toFixed(1)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Themes: {nextEvent.event.contentThemes.slice(0, 2).join(' · ')}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-shopee hover:bg-shopee-dark shrink-0"
                onClick={() => generateMutation.mutate()}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Boost Calendar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Top Controls Bar ─── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            {/* Generate button */}
            <Button
              size="lg"
              className="bg-shopee hover:bg-shopee-dark text-white shadow-md shadow-shopee/20 h-12 px-6"
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating || preferences.platforms.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-5" />
                  Generate Next Week&apos;s Calendar
                </>
              )}
            </Button>

            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
                aria-label="Previous week"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/40 min-w-[180px] justify-center">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{weekLabel(new Date(weekStart + 'T00:00:00+08:00'))}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
                aria-label="Next week"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart(isoDate(getNextMonday()))}
                className="text-xs"
              >
                Today
              </Button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/40">
              <button
                onClick={() => setView('week')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  view === 'week'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  view === 'month'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Month
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Preferences Card ─── */}
      <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="size-4 text-shopee" />
                Calendar Preferences
              </CardTitle>
              <Button variant="ghost" size="icon" className="size-7">
                {preferencesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-4">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Niche selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Niche</label>
                  <Select
                    value={preferences.niche}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, niche: v as CalendarNiche }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="mr-1">{opt.emoji}</span> {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Tone</label>
                  <Select
                    value={preferences.tone}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, tone: v as CalendarTone }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Posts per day */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Posts per day</label>
                    <Badge variant="secondary" className="text-[10px]">
                      {preferences.postsPerDay} {preferences.postsPerDay === 1 ? 'post' : 'posts'}
                    </Badge>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[preferences.postsPerDay]}
                    onValueChange={(vals) => setPreferences((p) => ({ ...p, postsPerDay: vals[0] }))}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Higher = more entries, prioritises peak hours (8PM).
                  </p>
                </div>

                {/* Platforms */}
                <div className="space-y-2 md:col-span-2 lg:col-span-4">
                  <label className="text-xs font-medium text-muted-foreground">Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {(Object.keys(PLATFORM_META) as CalendarPlatform[]).map((p) => {
                      const meta = PLATFORM_META[p]
                      const Icon = meta.icon
                      const checked = preferences.platforms.includes(p)
                      return (
                        <label
                          key={p}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                            checked
                              ? 'border-shopee/40 bg-shopee/5'
                              : 'border-border hover:border-shopee/30 hover:bg-muted/40',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePlatform(p)}
                          />
                          <Icon className={cn('size-4', checked && 'text-shopee')} />
                          <span className="text-sm font-medium">{meta.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {preferences.platforms.length === 0 && (
                    <p className="text-[11px] text-rose-500">Select at least one platform to generate.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── Calendar Grid ─── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-shopee" />
              Weekly Calendar
              {currentCalendar && (
                <Badge variant="secondary" className="text-[10px]">
                  {currentCalendar.entries.length} entries
                </Badge>
              )}
            </CardTitle>
            {currentCalendar && currentCalendar.entries.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  scheduleMutation.mutate({
                    calendarId: currentCalendar.id,
                    entryIds: currentCalendar.entries.map((e) => e.id),
                  })
                }
                disabled={scheduleMutation.isPending}
              >
                {scheduleMutation.isPending
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Send className="size-3.5" />}
                Schedule All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {weekLoading ? (
            <CalendarSkeleton />
          ) : !currentCalendar || currentCalendar.entries.length === 0 ? (
            <EmptyCalendar onGenerate={() => generateMutation.mutate()} isGenerating={isGenerating} />
          ) : (
            <CalendarGrid
              entriesByCell={entriesByCell}
              scheduledEntryIds={scheduledEntryIds}
              onEntryClick={setSelectedEntry}
              view={view}
            />
          )}
        </CardContent>
      </Card>

      {/* ─── Past Calendars History ─── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4 text-shopee" />
            Past Calendars
            <Badge variant="secondary" className="text-[10px]">{pastCalendars.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {historyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : pastCalendars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No past calendars yet. Generate your first one above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {pastCalendars.slice(0, 3).map((cal) => (
                <PastCalendarCard
                  key={cal.id}
                  calendar={cal}
                  onReuse={() => {
                    setWeekStart(cal.weekStartDate)
                    toast.success(`Loaded week of ${cal.weekStartDate}`, {
                      description: 'Preferences copied from this calendar.',
                    })
                    setPreferences(cal.preferences)
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Entry Detail Dialog ─── */}
      <EntryDetailDialog
        entry={selectedEntry}
        calendar={currentCalendar ?? null}
        weekStart={weekStart}
        scheduled={selectedEntry ? scheduledEntryIds.has(selectedEntry.id) : false}
        isScheduling={selectedEntry ? isSchedulingEntry(selectedEntry.id) : false}
        onSchedule={(entryId) => {
          if (!currentCalendar) return
          scheduleMutation.mutate({ calendarId: currentCalendar.id, entryIds: [entryId] })
        }}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}

// ─── Calendar Grid (7 days × 5 time slots) ────────────────────────────────────

function CalendarGrid({
  entriesByCell,
  scheduledEntryIds,
  onEntryClick,
  view,
}: {
  entriesByCell: Map<string, CalendarEntry[]>
  scheduledEntryIds: Set<string>
  onEntryClick: (e: CalendarEntry) => void
  view: 'week' | 'month'
}) {
  // For week view: 7 columns (days) x 5 rows (time slots)
  // For month view: simple list (still show same data, different layout)
  if (view === 'month') {
    const allEntries = Array.from(entriesByCell.values()).flat()
    const grouped = new Map<DayOfWeek, CalendarEntry[]>()
    for (const e of allEntries) {
      const arr = grouped.get(e.day) ?? []
      arr.push(e)
      grouped.set(e.day, arr)
    }
    return (
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const entries = grouped.get(day) ?? []
          if (entries.length === 0) return null
          return (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{day}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {entries.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    scheduled={scheduledEntryIds.has(e.id)}
                    onClick={() => onEntryClick(e)}
                    compact
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 mb-2">
          <div className="text-[11px] text-muted-foreground font-medium flex items-end pb-1">
            Time
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-foreground py-1.5 rounded-md bg-muted/40"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Time slot rows */}
        {TIME_SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 mb-1.5"
          >
            <div className="flex flex-col justify-center text-[11px] text-muted-foreground pr-1">
              <span className="font-medium">{slot.label}</span>
              <span className="text-[10px] opacity-70">{slot.hour}:00</span>
            </div>
            {DAYS_OF_WEEK.map((day) => {
              const key = `${day}-${slot.id}`
              const entries = entriesByCell.get(key) ?? []
              return (
                <CalendarCell
                  key={key}
                  entries={entries}
                  scheduledIds={scheduledEntryIds}
                  onClick={onEntryClick}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarCell({
  entries,
  scheduledIds,
  onClick,
}: {
  entries: CalendarEntry[]
  scheduledIds: Set<string>
  onClick: (e: CalendarEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <div className="min-h-[80px] rounded-md border border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-shopee/30 transition-colors flex items-center justify-center group cursor-pointer">
        <span className="text-[10px] text-muted-foreground/60 group-hover:text-shopee/60 transition-colors flex items-center gap-1">
          <Sparkles className="size-2.5" />
          Add
        </span>
      </div>
    )
  }
  return (
    <div className="min-h-[80px] rounded-md flex flex-col gap-1 p-1">
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            scheduled={scheduledIds.has(entry.id)}
            onClick={() => onClick(entry)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  scheduled,
  onClick,
  compact = false,
}: {
  entry: CalendarEntry
  scheduled: boolean
  onClick: () => void
  compact?: boolean
}) {
  const meta = PLATFORM_META[entry.platform]
  const Icon = meta.icon
  const score = entry.predictedScore.overall
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={cn(
        'text-left w-full rounded-md border bg-card hover:shadow-sm transition-all relative overflow-hidden',
        scheduled ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:border-shopee/40',
        compact ? 'p-2.5' : 'p-1.5',
      )}
    >
      {/* Platform accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', meta.dot)} />

      <div className={cn('flex items-start gap-1.5', compact ? '' : 'pl-1.5')}>
        <Icon className={cn('size-3 shrink-0 mt-0.5', compact ? 'size-4' : '')} />
        <div className="flex-1 min-w-0">
          {/* Top row: platform + score */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <Badge
              className={cn('text-[9px] px-1 py-0 border-0', meta.badgeBg, meta.badgeText)}
            >
              {meta.label}
            </Badge>
            <div className="flex items-center gap-1">
              {scheduled && (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <Send className="size-2.5" />Scheduled
                </span>
              )}
              <span className={cn('text-[9px] px-1 py-0 rounded font-bold', scoreClass(score))}>
                {score}
              </span>
            </div>
          </div>
          {/* Product */}
          <p className={cn('font-medium leading-tight line-clamp-1', compact ? 'text-xs' : 'text-[11px]')}>
            {entry.product}
          </p>
          {/* Brief */}
          <p className={cn('text-muted-foreground line-clamp-2 leading-snug', compact ? 'text-[11px]' : 'text-[10px]')}>
            {entry.contentBrief}
          </p>
          {/* Time + seasonal badge */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="size-2.5" />
              {entry.timeLabel}
            </span>
            {entry.seasonalEventId && (
              <span className="text-[9px] text-shopee font-medium flex items-center gap-0.5">
                <PartyPopper className="size-2.5" />
                Seasonal
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Calendar Skeleton ────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5">
        <Skeleton className="h-6" />
        {DAYS_OF_WEEK.map((d) => <Skeleton key={d} className="h-6" />)}
      </div>
      {TIME_SLOTS.map((slot) => (
        <div key={slot.id} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5">
          <Skeleton className="h-16" />
          {DAYS_OF_WEEK.map((d) => <Skeleton key={d} className="h-16" />)}
        </div>
      ))}
    </div>
  )
}

// ─── Empty Calendar ───────────────────────────────────────────────────────────

function EmptyCalendar({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="size-16 rounded-full bg-shopee/10 flex items-center justify-center mx-auto mb-4">
        <CalendarIcon className="size-8 text-shopee" />
      </div>
      <h3 className="text-base font-semibold mb-1">No calendar for this week yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Click below to generate a full week of content entries with AI — seasonal events, your niche, and your platforms all considered.
      </p>
      <Button
        className="bg-shopee hover:bg-shopee-dark"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate Now
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Past Calendar Card ───────────────────────────────────────────────────────

function PastCalendarCard({
  calendar,
  onReuse,
}: {
  calendar: ContentCalendar
  onReuse: () => void
}) {
  const avgScore = calendar.entries.length > 0
    ? Math.round(calendar.entries.reduce((sum, e) => sum + e.predictedScore.overall, 0) / calendar.entries.length)
    : 0
  const platforms = Array.from(new Set(calendar.entries.map((e) => e.platform)))
  const seasonalCount = calendar.entries.filter((e) => e.seasonalEventId).length

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className="bg-gradient-to-br from-shopee/10 via-purple-500/5 to-neutral-500/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur">
            <CalendarIcon className="size-3" />
            {calendar.weekStartDate}
          </Badge>
          <Badge
            className={cn(
              'text-[10px] border-0',
              calendar.source === 'ai'
                ? 'bg-shopee text-white'
                : 'bg-amber-500 text-white',
            )}
          >
            {calendar.source === 'ai' ? 'AI' : 'Mock'}
          </Badge>
        </div>
        <p className="text-sm font-semibold line-clamp-1">{calendar.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {calendar.entries.length} entries · {NICHE_LABELS[calendar.preferences.niche]} · {TONE_LABELS[calendar.preferences.tone]}
        </p>
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="size-3" />
            Avg Score
          </span>
          <Badge className={cn('text-[10px] border-0', scoreClass(avgScore))}>
            {avgScore}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {platforms.map((p) => {
            const meta = PLATFORM_META[p]
            const Icon = meta.icon
            return (
              <Badge key={p} className={cn('text-[9px] px-1 py-0 border-0', meta.badgeBg, meta.badgeText)}>
                <Icon className="size-2.5" />
                {meta.label}
              </Badge>
            )
          })}
          {seasonalCount > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 text-shopee border-shopee/30">
              <PartyPopper className="size-2.5" />
              {seasonalCount} seasonal
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-1"
          onClick={onReuse}
        >
          <RefreshCw className="size-3.5" />
          Reuse This Calendar
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Entry Detail Dialog ──────────────────────────────────────────────────────

function EntryDetailDialog({
  entry,
  calendar,
  weekStart,
  scheduled,
  isScheduling,
  onSchedule,
  onClose,
}: {
  entry: CalendarEntry | null
  calendar: ContentCalendar | null
  weekStart: string
  scheduled: boolean
  isScheduling: boolean
  onSchedule: (entryId: string) => void
  onClose: () => void
}) {
  const seasonalEvent = entry?.seasonalEventId
    ? calendar?.seasonalEvents.find((e) => e.id === entry.seasonalEventId)
    : null

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {entry && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <EntryPlatformBadge platform={entry.platform} />
                    {entry.product}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {entry.day} · {entry.timeLabel} · {weekLabel(new Date(weekStart + 'T00:00:00+08:00'))}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Content brief */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Lightbulb className="size-3" />
                  Content Brief
                </p>
                <p className="text-sm bg-muted/40 rounded-md p-3 leading-relaxed">
                  {entry.contentBrief}
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Hash className="size-3" />
                  Hashtags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Seasonal event */}
              {seasonalEvent && (
                <div className="rounded-md border border-shopee/30 bg-shopee/5 p-3">
                  <p className="text-xs font-semibold text-shopee flex items-center gap-1">
                    <PartyPopper className="size-3" />
                    {seasonalEvent.emoji} {seasonalEvent.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {seasonalEvent.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                      <Zap className="size-3" />
                      Commission x{seasonalEvent.commissionMultiplier.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Predicted score breakdown */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  Predicted Score Breakdown
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <ScoreBar label="Engagement" value={entry.predictedScore.engagement} />
                  <ScoreBar label="Conversion" value={entry.predictedScore.conversion} />
                  <ScoreBar label="Virality" value={entry.predictedScore.virality} />
                  <ScoreBar label="Seasonal" value={entry.predictedScore.seasonal} />
                </div>
                <div className="mt-2 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <span className="text-xs font-medium">Overall Predicted Score</span>
                  <Badge className={cn('text-sm border-0', scoreClass(entry.predictedScore.overall))}>
                    {entry.predictedScore.overall}/99
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Edit entry', { description: 'Manual editing coming soon — regenerate to refresh.' })}
                >
                  <Edit3 className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Generate full content', { description: 'Use the AI Studio page to expand this brief into a full caption/script.' })}
                >
                  <Wand2 className="size-3.5" />
                  Generate Full Content
                </Button>
                <Button
                  size="sm"
                  className="bg-shopee hover:bg-shopee-dark ml-auto"
                  onClick={() => onSchedule(entry.id)}
                  disabled={isScheduling || scheduled}
                >
                  {isScheduling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : scheduled ? (
                    <Send className="size-3.5" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  {scheduled ? 'Already Scheduled' : 'Schedule Auto-Post'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EntryPlatformBadge({ platform }: { platform: CalendarPlatform }) {
  const meta = PLATFORM_META[platform]
  const Icon = meta.icon
  return (
    <Badge className={cn('text-[10px] border-0', meta.badgeBg, meta.badgeText)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-bold', scoreClass(value).split(' ').find((c) => c.startsWith('text-')))}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            value >= 80 ? 'bg-emerald-500' : value >= 65 ? 'bg-amber-500' : 'bg-rose-500',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
