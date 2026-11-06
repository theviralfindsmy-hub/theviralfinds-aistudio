'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/* ============================================================
   Accent color helper — maps accent keys to Tailwind classes
   ============================================================ */

function accentIconClasses(accentColor: string) {
  return cn(
    accentColor === 'shopee' ? 'bg-shopee/10 text-shopee' :
    accentColor === 'hermes' ? 'bg-hermes/10 text-hermes' :
    accentColor === 'lime' ? 'bg-lime/15 text-lime-dark' :
    accentColor === 'profit' ? 'bg-profit/10 text-profit' :
    'bg-muted text-muted-foreground'
  )
}

function accentBadgeClasses(accentColor: string) {
  return cn(
    'text-[10px] px-1.5 py-0 border-0',
    accentColor === 'shopee' ? 'bg-shopee/10 text-shopee' :
    accentColor === 'hermes' ? 'bg-hermes/10 text-hermes' :
    accentColor === 'lime' ? 'bg-lime/15 text-lime-dark' :
    'bg-muted text-muted-foreground'
  )
}

/* ============================================================
   1. PageHeader
   ============================================================ */

export function PageHeader({ icon: Icon, title, description, badge, accentColor = 'shopee' }: {
  icon: React.ElementType
  title: string
  description?: string
  badge?: string
  accentColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2.5 rounded-lg', accentIconClasses(accentColor))}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {badge && (
              <Badge variant="secondary" className={accentBadgeClasses(accentColor)}>
                {badge}
              </Badge>
            )}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
    </motion.div>
  )
}

/* ============================================================
   2. StatCard
   ============================================================ */

export function StatCard({ icon: Icon, label, value, trend, trendLabel, index = 0, accentColor = 'shopee' }: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  index?: number
  accentColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="p-4 border-border card-hover">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('p-2 rounded-lg', accentIconClasses(accentColor))}>
            <Icon className="w-4 h-4" />
          </div>
          {trend && trendLabel && (
            <span className={cn(
              'text-xs font-medium flex items-center gap-0.5',
              trend === 'up' ? 'text-emerald-600' :
              trend === 'down' ? 'text-red-500' :
              'text-muted-foreground'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              {trendLabel}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </Card>
    </motion.div>
  )
}

/* ============================================================
   3. SectionCard
   ============================================================ */

export function SectionCard({ title, action, children, className }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className={cn('border-border', className)}>
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {action}
        </div>
        <div className="p-4">{children}</div>
      </Card>
    </motion.div>
  )
}

/* ============================================================
   4. ComingSoonPage
   ============================================================ */

export function ComingSoonPage({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-2xl bg-shopee/10 text-shopee flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-md"
      >
        This feature is currently under development. Stay tuned for updates!
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <Badge variant="outline" className="text-lime border-lime/30">Coming Soon</Badge>
      </motion.div>
    </div>
  )
}

/* ============================================================
   5. Skeleton components
   ============================================================ */

export function StatCardSkeleton() {
  return (
    <Card className="p-4 border-border">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-muted animate-shimmer" />
        <div className="w-16 h-4 rounded bg-muted animate-shimmer" />
      </div>
      <div className="w-24 h-7 rounded bg-muted animate-shimmer mb-1" />
      <div className="w-16 h-3 rounded bg-muted animate-shimmer" />
    </Card>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-lg bg-muted animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-4 rounded bg-muted animate-shimmer" />
        <div className="w-1/2 h-3 rounded bg-muted animate-shimmer" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border overflow-hidden">
          <div className="aspect-square bg-muted animate-shimmer" />
          <div className="p-3 space-y-2">
            <div className="w-3/4 h-4 rounded bg-muted animate-shimmer" />
            <div className="w-1/2 h-5 rounded bg-muted animate-shimmer" />
          </div>
        </Card>
      ))}
    </div>
  )
}
