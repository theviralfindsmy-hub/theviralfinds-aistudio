'use client'

/**
 * AI Audience Analyzer — Dashboard
 * Fasa 3.6 — TheViralFindsMY
 *
 * Aggregates click data into audience segments and renders a full
 * analysis dashboard with demographics, interest map, active-hours
 * heatmap, AI content suggestions, and month-over-month audience trend.
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users2,
  Activity,
  Heart,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Sparkles,
  MapPin,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Wand2,
  Calendar,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import type {
  AudienceApiResponse,
  AudienceProfile,
  ContentSuggestion,
  DemographicSlice,
} from '@/lib/audience/types'
import { HEATMAP_DAYS } from '@/lib/audience/mock-data'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGE_CHART_COLORS = ['var(--color-shopee)', 'var(--color-hermes)', 'var(--color-profit)', 'var(--color-chart-4)']
const GENDER_COLORS: Record<string, string> = {
  female: 'var(--color-shopee)',
  male: 'var(--color-hermes)',
  other: 'var(--color-profit)',
}
const DEVICE_META: Record<
  string,
  { icon: typeof Smartphone; color: string; bg: string }
> = {
  mobile: { icon: Smartphone, color: 'var(--color-shopee)', bg: 'bg-shopee/10' },
  desktop: { icon: Monitor, color: 'var(--color-hermes)', bg: 'bg-hermes/10' },
  tablet: { icon: Tablet, color: 'var(--color-profit)', bg: 'bg-profit/10' },
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const formatNumber = (v: number) => v.toLocaleString('en-MY')

function hourLabel(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${ampm}`
}

const FORMAT_LABELS: Record<ContentSuggestion['format'], string> = {
  short_video: 'Short Video',
  live_stream: 'Live Stream',
  carousel: 'Carousel',
  story: 'Story',
  blog_post: 'Blog Post',
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top stats
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  hint: string
  icon: typeof Users2
  color: string
}) {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <Icon className="size-4" style={{ color }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-muted-foreground mt-1 text-xs">{hint}</div>
      </CardContent>
    </Card>
  )
}

function TopStatsRow({ profile }: { profile: AudienceProfile }) {
  const s = profile.summary
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      <motion.div variants={fadeIn}>
        <StatCard
          title="Audience Size"
          value={formatNumber(s.totalAudienceSize)}
          hint={`+${s.monthOverMonthGrowth}% vs last month`}
          icon={Users2}
          color="var(--color-shopee)"
        />
      </motion.div>
      <motion.div variants={fadeIn}>
        <StatCard
          title="Avg Engagement"
          value={`${s.avgEngagementRate}%`}
          hint="Across all segments"
          icon={Activity}
          color="var(--color-hermes)"
        />
      </motion.div>
      <motion.div variants={fadeIn}>
        <StatCard
          title="Top Interest"
          value={s.topInterest}
          hint={`${profile.interests.entries[0]?.affinity}% affinity`}
          icon={Heart}
          color="var(--color-profit)"
        />
      </motion.div>
      <motion.div variants={fadeIn}>
        <StatCard
          title="Peak Hour"
          value={s.peakHourLabel}
          hint="Highest click density (MYT)"
          icon={Clock}
          color="var(--color-shopee-dark)"
        />
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Demographics
// ---------------------------------------------------------------------------

function DemographicsSection({ profile }: { profile: AudienceProfile }) {
  const ageData = profile.demographics.ageRanges.map((r) => ({
    name: r.label,
    value: r.percentage,
    count: r.count,
  }))
  const genderData = profile.demographics.genders.map((r) => ({
    name: r.label,
    value: r.percentage,
    count: r.count,
    key: r.key,
  }))
  const locations = profile.demographics.locations
  const topLoc = locations[0]

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users2 className="size-4 text-shopee" />
          Audience Demographics
        </CardTitle>
        <CardDescription>
          Who clicks your affiliate links — age, gender, location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="age" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="age">Age</TabsTrigger>
            <TabsTrigger value="gender">Gender</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          {/* Age */}
          <TabsContent value="age" className="mt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ageData.map((_, i) => (
                      <Cell key={`age-${i}`} fill={AGE_CHART_COLORS[i % AGE_CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Gender */}
          <TabsContent value="gender" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {genderData.map((g, i) => (
                        <Cell
                          key={`gender-${i}`}
                          fill={GENDER_COLORS[g.key] || 'var(--color-chart-4)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {genderData.map((g) => (
                  <div key={g.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: GENDER_COLORS[g.key] }}
                      />
                      <span className="text-sm">{g.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-sm">{g.value}%</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {formatNumber(g.count)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location" className="mt-4">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-shopee" />
              <span>
                <span className="font-medium">{topLoc?.label}</span> leads with{' '}
                <span className="font-medium">{topLoc?.percentage}%</span> of clicks
              </span>
            </div>
            <ScrollArea className="max-h-72 pr-3">
              <div className="space-y-3">
                {locations.map((loc: DemographicSlice) => (
                  <div key={loc.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{loc.label}</span>
                      <span className="text-muted-foreground">
                        {loc.percentage}% · {formatNumber(loc.count)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loc.percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-shopee"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Device breakdown
// ---------------------------------------------------------------------------

function DeviceBreakdown({ profile }: { profile: AudienceProfile }) {
  const devices = profile.demographics.devices
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="size-4 text-hermes" />
          Device Breakdown
        </CardTitle>
        <CardDescription>Where your audience clicks from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {devices.map((d) => {
            const meta = DEVICE_META[d.key] || DEVICE_META.mobile
            const Icon = meta.icon
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 rounded-xl border p-4 ${meta.bg}`}
              >
                <div
                  className="flex size-10 items-center justify-center rounded-lg bg-background"
                  style={{ color: meta.color }}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatNumber(d.count)} clickers
                  </div>
                </div>
                <div className="ml-auto text-xl font-bold" style={{ color: meta.color }}>
                  {d.percentage}%
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Interest radar
// ---------------------------------------------------------------------------

function InterestMapSection({ profile }: { profile: AudienceProfile }) {
  const data = profile.interests.entries.map((e) => ({
    interest: e.interest,
    affinity: e.affinity,
    clicks: e.clicks,
    lift: e.engagementLift,
  }))
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="size-4 text-profit" />
          Interest Affinity Map
        </CardTitle>
        <CardDescription>
          Top interest:{' '}
          <span className="font-medium text-foreground">
            {profile.interests.topInterest}
          </span>{' '}
          ({profile.interests.entries[0]?.affinity}% affinity)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="interest"
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={(v: number) => `${v}`}
              />
              <Radar
                name="Affinity"
                dataKey="affinity"
                stroke="var(--color-shopee)"
                fill="var(--color-shopee)"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  `${value}${name === 'Affinity' ? '%' : ''}`,
                  name,
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Active hours heatmap
// ---------------------------------------------------------------------------

function heatmapColor(density: number): string {
  // 0-100 → light to dark shopee orange with purple tint at top end
  if (density < 8) return 'var(--color-muted)'
  // Interpolate shopee alpha
  const alpha = Math.min(0.18 + (density / 100) * 0.82, 1)
  // mix in a hint of hermes purple for the very hot cells
  if (density > 80) {
    return `color-mix(in srgb, var(--color-hermes) ${density - 80}%, var(--color-shopee))`
  }
  return `color-mix(in srgb, var(--color-shopee) ${alpha * 100}%, transparent)`
}

function ActiveHoursHeatmapSection({ profile }: { profile: AudienceProfile }) {
  const { cells, peakHour, peakDay, totalClicks } = profile.heatmap

  const hourCols = useMemo(() => Array.from({ length: 24 }, (_, h) => h), [])
  const dayRows = useMemo(() => Array.from({ length: 7 }, (_, d) => d), [])

  const cellMap = useMemo(() => {
    const m = new Map<string, (typeof cells)[number]>()
    for (const c of cells) m.set(`${c.day}-${c.hour}`, c)
    return m
  }, [cells])

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-shopee" />
          Active Hours Heatmap
        </CardTitle>
        <CardDescription>
          Peak at <span className="font-medium text-foreground">{hourLabel(peakHour)}</span>{' '}
          MYT on {HEATMAP_DAYS[peakDay]} · {formatNumber(totalClicks)} clicks mapped
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Hour labels */}
            <div
              className="grid gap-1 pl-10 mb-1"
              style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
            >
              {hourCols.map((h) => (
                <div
                  key={h}
                  className="text-center text-[10px] text-muted-foreground"
                >
                  {h % 3 === 0 ? hourLabel(h).replace(' ', '') : ''}
                </div>
              ))}
            </div>
            {/* Day rows */}
            {dayRows.map((d) => (
              <div
                key={d}
                className="grid gap-1 mb-1 items-center"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                <div className="absolute">
                  <span className="sr-only">{HEATMAP_DAYS[d]}</span>
                </div>
                {hourCols.map((h) => {
                  const cell = cellMap.get(`${d}-${h}`)
                  const density = cell?.density ?? 0
                  return (
                    <motion.div
                      key={`${d}-${h}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: (d * 24 + h) * 0.0015 }}
                      className="group relative aspect-square rounded-[3px] hover:ring-2 hover:ring-shopee/40 transition-all"
                      style={{ backgroundColor: heatmapColor(density) }}
                      title={`${HEATMAP_DAYS[d]} ${hourLabel(h)} · ${cell?.clicks ?? 0} clicks`}
                    />
                  )
                })}
              </div>
            ))}
            {/* Day labels (overlay) */}
            <div className="mt-2 space-y-1">
              {dayRows.map((d) => (
                <div
                  key={d}
                  className="text-[10px] text-muted-foreground h-[12px] leading-3"
                >
                  {HEATMAP_DAYS[d]}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[8, 25, 50, 75, 95].map((d) => (
              <span
                key={d}
                className="size-3 rounded-[3px]"
                style={{ backgroundColor: heatmapColor(d) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Content suggestions
// ---------------------------------------------------------------------------

function SuggestionCard({
  suggestion,
  onGenerate,
}: {
  suggestion: ContentSuggestion
  onGenerate: (s: ContentSuggestion) => void
}) {
  return (
    <motion.div variants={fadeIn}>
      <Card className="card-hover h-full border-shopee/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm leading-snug">
              {suggestion.title}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0 bg-shopee/10 text-shopee">
              +{suggestion.expectedLift}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {suggestion.explanation}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="border-hermes/30 text-hermes">
              {FORMAT_LABELS[suggestion.format]}
            </Badge>
            <Badge variant="outline" className="border-shopee/30 text-shopee">
              <Clock className="mr-1 size-3" />
              {suggestion.bestTime}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestion.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]"
              >
                #{t}
              </span>
            ))}
          </div>
          <Separator />
          <Button
            onClick={() => onGenerate(suggestion)}
            className="w-full bg-shopee hover:bg-shopee-dark text-white"
            size="sm"
          >
            <Wand2 className="mr-2 size-3.5" />
            Generate Content
            <ArrowRight className="ml-2 size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ContentSuggestionsSection({
  profile,
  onGenerate,
}: {
  profile: AudienceProfile
  onGenerate: (s: ContentSuggestion) => void
}) {
  const suggestions = profile.suggestions.slice(0, 6)
  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-hermes" />
              Content Suggestions
            </CardTitle>
            <CardDescription>
              AI-tailored to your audience segments and peak hours
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-hermes/10 text-hermes">
            <Sparkles className="mr-1 size-3" />
            {suggestions.length} ideas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} onGenerate={onGenerate} />
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Audience trend
// ---------------------------------------------------------------------------

function AudienceTrendSection({ profile }: { profile: AudienceProfile }) {
  const data = profile.trend.map((t) => ({
    label: t.label,
    audience: t.audienceSize,
    engagement: t.engagementRate,
    newMembers: t.newMembers,
  }))
  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-shopee" />
              Audience Growth Trend
            </CardTitle>
            <CardDescription>
              Month-over-month audience size & engagement rate
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-profit/30 text-profit">
            <Calendar className="mr-1 size-3" />
            Last 8 months
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v: number) => formatNumber(v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Engagement') return [`${value}%`, name]
                  return [formatNumber(value), name]
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="audience"
                stroke="var(--color-shopee)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-shopee)' }}
                activeDot={{ r: 5 }}
                name="Audience"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                stroke="var(--color-hermes)"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: 'var(--color-hermes)' }}
                name="Engagement"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

function SegmentsSection({ profile }: { profile: AudienceProfile }) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users2 className="size-4 text-profit" />
          Audience Segments
        </CardTitle>
        <CardDescription>{profile.segments.length} active segments detected</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96 pr-3">
          <div className="space-y-3">
            {profile.segments.map((seg) => (
              <div
                key={seg.id}
                className="rounded-xl border p-3 hover:border-shopee/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{seg.name}</span>
                      <Badge variant="secondary" className="bg-shopee/10 text-shopee">
                        {seg.sharePercentage}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {seg.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{formatNumber(seg.size)}</div>
                    <div className="text-muted-foreground text-[10px]">members</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Top interest: <span className="font-medium text-foreground">{seg.topInterest}</span>
                  </span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-muted-foreground">
                    Engagement: <span className="font-medium text-foreground">{seg.avgEngagement}%</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AudiencePage() {
  const qc = useQueryClient()
  const setActivePage = useAppStore((s) => s.setActivePage)
  const [niche, setNiche] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AudienceApiResponse>({
    queryKey: ['audience', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/ai/audience', { method: 'GET' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as AudienceApiResponse
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const refineMutation = useMutation({
    mutationFn: async (n: string) => {
      const res = await fetch('/api/ai/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: n }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as AudienceApiResponse
    },
    onSuccess: (resp) => {
      qc.setQueryData(['audience', 'profile'], resp)
      toast.success(`Audience refined for "${niche || 'general'}"`, {
        description:
          resp.source === 'ai'
            ? 'AI suggestions applied.'
            : 'Using algorithmic suggestions (AI fallback).',
      })
    },
    onError: () => {
      toast.error('Refine failed', {
        description: 'Could not refine analysis. Try again in a moment.',
      })
    },
  })

  const handleGenerateContent = (s: ContentSuggestion) => {
    toast.success('Opening Content Studio', {
      description: `"${s.title.slice(0, 48)}${s.title.length > 48 ? '…' : ''}"`,
    })
    setActivePage('content')
  }

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing audience analysis…')
  }

  const handleRefine = (e: React.FormEvent) => {
    e.preventDefault()
    refineMutation.mutate(niche.trim())
  }

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Couldn&apos;t load audience data
            </CardTitle>
            <CardDescription>
              Something went wrong fetching the analysis. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, source, fallback } = data

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        {...fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">AI Audience Analyzer</h1>
            <Badge className="bg-hermes/10 text-hermes border-hermes/20">
              <Sparkles className="mr-1 size-3" />
              AI
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Know your audience. Grow your earnings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={fallback ? 'border-muted text-muted-foreground' : 'border-shopee/30 text-shopee'}>
            {source === 'ai' ? 'AI-powered' : 'Algorithmic'}
            {fallback ? ' · fallback' : ''}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Niche refine bar */}
      <motion.div {...fadeIn}>
        <Card className="border-hermes/15 bg-hermes/5">
          <CardContent className="py-4">
            <form onSubmit={handleRefine} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-hermes" />
                <span className="text-sm font-medium">Refine by niche:</span>
              </div>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. skincare, gadgets, fashion"
                className="sm:max-w-xs"
                maxLength={60}
              />
              <Button
                type="submit"
                size="sm"
                disabled={refineMutation.isPending}
                className="bg-hermes hover:bg-hermes-dark text-white"
              >
                {refineMutation.isPending ? (
                  <RefreshCw className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-3.5" />
                )}
                Refine
              </Button>
              {profile.niche && (
                <Badge variant="secondary" className="ml-auto bg-hermes/10 text-hermes">
                  Niche: {profile.niche}
                </Badge>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top stats */}
      <TopStatsRow profile={profile} />

      {/* Demographics + Device */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div {...fadeIn} className="lg:col-span-2">
          <DemographicsSection profile={profile} />
        </motion.div>
        <motion.div {...fadeIn}>
          <DeviceBreakdown profile={profile} />
        </motion.div>
      </div>

      {/* Interest map + Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div {...fadeIn}>
          <InterestMapSection profile={profile} />
        </motion.div>
        <motion.div {...fadeIn}>
          <AudienceTrendSection profile={profile} />
        </motion.div>
      </div>

      {/* Heatmap (full width) */}
      <motion.div {...fadeIn}>
        <ActiveHoursHeatmapSection profile={profile} />
      </motion.div>

      {/* Segments + Suggestions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <motion.div {...fadeIn} className="lg:col-span-2">
          <SegmentsSection profile={profile} />
        </motion.div>
        <motion.div {...fadeIn} className="lg:col-span-3">
          <ContentSuggestionsSection
            profile={profile}
            onGenerate={handleGenerateContent}
          />
        </motion.div>
      </div>
    </div>
  )
}
