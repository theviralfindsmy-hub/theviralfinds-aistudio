import {
  Lock,
  BadgeCheck,
  Shield,
  Key,
  type LucideIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { securityBadges } from '@/lib/community/mock-data'

const iconMap: Record<string, LucideIcon> = {
  lock: Lock,
  'badge-check': BadgeCheck,
  shield: Shield,
  key: Key,
}

interface SecurityBadgesProps {
  /** Layout variant. "row" = horizontal (footer / landing). "grid" = 2x2 (settings). */
  variant?: 'row' | 'grid'
  className?: string
}

export function SecurityBadges({
  variant = 'row',
  className,
}: SecurityBadgesProps) {
  const isGrid = variant === 'grid'

  return (
    <div
      className={cn(
        isGrid
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
          : 'flex flex-wrap items-center justify-center gap-2 sm:gap-3',
        className,
      )}
      role="list"
      aria-label="Security and trust badges"
    >
      {securityBadges.map((badge) => {
        const Icon = iconMap[badge.icon] ?? Lock
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div
                role="listitem"
                tabIndex={0}
                className={cn(
                  'group flex cursor-default items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-emerald-500/40 hover:bg-emerald-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:bg-emerald-950/20',
                  isGrid && 'flex-col gap-1.5 px-3 py-3 text-center',
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 text-emerald-600 dark:text-emerald-400',
                    isGrid ? 'size-5' : 'size-3.5',
                  )}
                />
                <span className={cn('leading-tight', isGrid && 'text-[11px]')}>
                  {badge.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs bg-foreground text-background text-xs"
            >
              <div className="space-y-1">
                <p className="font-semibold">{badge.tooltip}</p>
                <p className="text-background/80 leading-relaxed">{badge.detail}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default SecurityBadges
