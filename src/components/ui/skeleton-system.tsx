'use client'

/**
 * skeleton-system.tsx — layout-matched skeletons for every async surface.
 *
 * Design principle:
 *   NEVER show a generic spinner when you can show a skeleton that matches
 *   the real layout 1:1. This keeps perceived layout shift near zero and
 *   makes the app feel premium even on slow connections.
 *
 * These components live alongside (not replace) `inline-skeleton.tsx`. The
 * ones here are tuned to the specific dashboard/product/activity layouts
 * built in Wave 1 so they look pixel-correct during the loading window.
 */

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ============================================================
   1. KpiCardSkeleton
   ============================================================ */

interface KpiCardSkeletonProps {
  className?: string
}

/**
 * Matches the dashboard KPI card: small label + big number + delta row +
 * mini sparkline. Mirrors the layout from P1-c dashboard-page.tsx.
 */
export function KpiCardSkeleton({ className }: KpiCardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 space-y-3',
        className
      )}
    >
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/* ============================================================
   2. ProductCardSkeleton
   ============================================================ */

interface ProductCardSkeletonProps {
  className?: string
}

/**
 * Matches the product/trend card: square image, title, price + commission,
 * action button. Mirrors the layout from P1-d trends-page.tsx.
 */
export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden space-y-3',
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  )
}

/* ============================================================
   3. ActivityFeedSkeleton
   ============================================================ */

interface ActivityFeedSkeletonProps {
  /** Number of rows. Default 5. */
  rows?: number
  className?: string
}

/**
 * Matches the live activity feed: avatar/icon + 2 lines of text + amount.
 */
export function ActivityFeedSkeleton({
  rows = 5,
  className,
}: ActivityFeedSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   4. ChartSkeleton
   ============================================================ */

interface ChartSkeletonProps {
  /** Height of the chart area in px. Default 240. */
  height?: number
  className?: string
}

/**
 * Matches a chart container: title row, axis ticks, bar/line placeholder.
 * Suitable for Recharts containers used across dashboard, trends, content.
 */
export function ChartSkeleton({ height = 240, className }: ChartSkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {/* Y-axis placeholder */}
        <div className="flex h-full flex-col justify-between pr-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-6" />
          ))}
        </div>
        {/* Bars */}
        <div className="flex flex-1 items-end justify-between gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${30 + ((i * 13) % 70)}%` }}
            />
          ))}
        </div>
      </div>
      {/* X-axis */}
      <div className="flex justify-between px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8" />
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   5. TableSkeleton
   ============================================================ */

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

/**
 * Matches the data table layout used on Products/Links/Campaigns pages:
 * header row + N body rows with realistic column proportions.
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3.5"
            style={{ width: `${i === 0 ? 40 : i === columns - 1 ? 15 : 25}%` }}
          />
        ))}
      </div>
      {/* Body */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-3 border-b last:border-b-0 px-4 py-3.5"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4"
              style={{ width: `${c === 0 ? 45 : c === columns - 1 ? 18 : 30}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   6. PageSkeleton — full dashboard page placeholder
   ============================================================ */

interface PageSkeletonProps {
  className?: string
}

/**
 * Composite skeleton that mirrors the dashboard page: page header → KPI grid
 * → charts row → activity feed. Use inside React.lazy Suspense fallbacks or
 * while a top-level query is loading.
 */
export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <ActivityFeedSkeleton rows={5} />
      </div>
    </div>
  )
}
