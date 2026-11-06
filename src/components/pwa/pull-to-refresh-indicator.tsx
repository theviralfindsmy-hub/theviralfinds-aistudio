'use client'

import { RefreshCw, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  progress: number
  threshold: number
}

/**
 * PullToRefreshIndicator
 * ------------------------
 * Visual indicator shown at the top of a scroll container when the user
 * pulls down to refresh. Mount this ABOVE the translated content so the
 * spinner appears in the gap created by the pull.
 */
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  // Hide entirely when nothing's happening
  if (pullDistance <= 0 && !isRefreshing) return null

  const ready = progress >= 1 || isRefreshing

  return (
    <div
      aria-live="polite"
      aria-busy={isRefreshing}
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center justify-end"
      style={{
        top: 0,
        height: `${pullDistance}px`,
        opacity: Math.min(pullDistance / 30, 1),
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors',
          ready
            ? 'border-shopee bg-shopee/10 text-shopee'
            : 'border-muted-foreground/30 text-muted-foreground'
        )}
        style={{
          transform: `rotate(${progress * 360}deg)`,
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowDown
            className={cn(
              'w-4 h-4 transition-transform',
              ready && 'rotate-180'
            )}
          />
        )}
      </div>
      <span className="text-[10px] font-medium text-muted-foreground mt-1">
        {isRefreshing ? 'Refreshing…' : ready ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  )
}
