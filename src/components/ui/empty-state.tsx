'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  /** Compact variant — smaller padding, no icon circle. Good inside cards. */
  compact?: boolean
}

/**
 * Friendly "no data yet" placeholder. Use wherever a list, table, or feed
 * could be empty so users see a clear message + optional CTA instead of
 * a blank section.
 *
 * @example
 *   {links.length === 0 && (
 *     <EmptyState
 *       icon={Link2}
 *       title="No links yet"
 *       description="Create your first affiliate link to start tracking clicks."
 *       action={<Button onClick={handleCreate}>Create Link</Button>}
 *     />
 *   )}
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action}
      </div>
    )
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className={cn('text-center', compact ? 'p-6' : 'p-8 sm:p-12')}>
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  )
}
