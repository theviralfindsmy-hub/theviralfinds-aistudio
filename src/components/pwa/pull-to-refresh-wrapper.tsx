'use client'

import { ReactNode, useCallback } from 'react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullToRefreshIndicator } from './pull-to-refresh-indicator'

interface PullToRefreshWrapperProps {
  children: ReactNode
  /** Refresh callback. Should refetch the current page's data. */
  onRefresh: () => Promise<void> | void
  /** Visual threshold for trigger. Default 70. */
  threshold?: number
  /** Extra class on the outer wrapper. */
  className?: string
}

/**
 * PullToRefreshWrapper
 * ---------------------
 * Wraps a page's content and adds pull-to-refresh on mobile.
 *
 * - On desktop (no coarse pointer) the hook is a no-op and this component
 *   renders children untouched — zero layout cost.
 * - On mobile, dragging down from the top of the page reveals a spinner.
 *
 * Mount this around the <PageComponent /> in src/app/page.tsx.
 */
export function PullToRefreshWrapper({
  children,
  onRefresh,
  threshold = 70,
  className,
}: PullToRefreshWrapperProps) {
  const handleRefresh = useCallback(async () => {
    await onRefresh()
  }, [onRefresh])

  const { pullDistance, isRefreshing, progress } = usePullToRefresh(handleRefresh, {
    threshold,
    touchOnly: true,
  })

  return (
    <div className={className}>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
        threshold={threshold}
      />
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 || isRefreshing ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
