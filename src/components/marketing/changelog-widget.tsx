'use client'

import { useState, useCallback, useSyncExternalStore, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Sparkles,
  Wrench,
  Shield,
  Zap,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { changelogEntries, type ChangelogCategory } from '@/lib/community/mock-data'

// ─── localStorage-backed seen-version via useSyncExternalStore ────────────────
// SSR-safe: server snapshot is always empty string, so the red dot only
// appears after client hydration. No setState-in-effect → lint-safe.

const STORAGE_KEY = 'tvf_changelog_seen_version'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('tvf-changelog-storage', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('tvf-changelog-storage', callback)
  }
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function getServerSnapshot(): string {
  return ''
}

function setSeenVersion(version: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, version)
    // Dispatch custom event so same-window subscribers get notified
    window.dispatchEvent(new Event('tvf-changelog-storage'))
  } catch {
    /* ignore */
  }
}

// ─── Category metadata ────────────────────────────────────────────────────────

const categoryMeta: Record<
  ChangelogCategory,
  { icon: typeof Sparkles; color: string; bg: string }
> = {
  Feature: { icon: Sparkles, color: 'text-shopee', bg: 'bg-shopee/10' },
  Fix: { icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  Improvement: { icon: Zap, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950/40' },
  Security: { icon: Shield, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ChangelogWidgetProps {
  /** Compact mode: only show the badge trigger, no card wrapper */
  compact?: boolean
  className?: string
}

export function ChangelogWidget({ compact = false, className }: ChangelogWidgetProps) {
  const [open, setOpen] = useState(false)
  const seenVersion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const latestVersion = changelogEntries[0].version
  const hasNew = seenVersion !== latestVersion

  const handleMarkSeen = useCallback(() => {
    setSeenVersion(latestVersion)
  }, [latestVersion])

  // When user opens the modal, automatically mark as seen after a short delay
  useEffect(() => {
    if (!open || !hasNew) return
    const t = setTimeout(() => setSeenVersion(latestVersion), 800)
    return () => clearTimeout(t)
  }, [open, hasNew, latestVersion])

  const recent5 = changelogEntries.slice(0, 5)

  const trigger = compact ? (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        'relative flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent',
        className,
      )}
      aria-label={`What's new${hasNew ? ' (new updates available)' : ''}`}
    >
      <Bell className="size-3.5" />
      <span>What&apos;s New</span>
      {hasNew && <RedDot />}
    </button>
  ) : (
    <Card className={cn('card-hover overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-start justify-between gap-2 text-left"
          aria-label={`Open changelog${hasNew ? ' (new updates available)' : ''}`}
        >
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="relative flex size-2">
                {hasNew && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                )}
                <span
                  className={cn(
                    'relative inline-flex size-2 rounded-full',
                    hasNew ? 'bg-red-500' : 'bg-muted-foreground/40',
                  )}
                />
              </span>
              What&apos;s New
            </CardTitle>
            <CardDescription>
              Latest updates and improvements to TheViralFindsMY
            </CardDescription>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {recent5.map((entry) => {
          const meta = categoryMeta[entry.category]
          const Icon = meta.icon
          const entryIsNew = hasNew && entry.version === latestVersion
          return (
            <button
              key={entry.version}
              onClick={() => setOpen(true)}
              className="group flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent/60"
            >
              <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', meta.bg)}>
                <Icon className={cn('size-3.5', meta.color)} />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono">
                    {entry.version}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                  {entryIsNew && <RedDot />}
                </div>
                <p className="line-clamp-1 text-sm font-medium">{entry.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {entry.description}
                </p>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-4 text-shopee" />
              Changelog
              {hasNew && (
                <Badge className="bg-red-500 text-[10px] hover:bg-red-500">
                  <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-white" />
                  New
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Every improvement, fix, and feature we&apos;ve shipped. Most recent first.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-180px)] px-6 py-4">
            <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              {changelogEntries.map((entry) => {
                const meta = categoryMeta[entry.category]
                const Icon = meta.icon
                const entryIsNew = hasNew && entry.version === latestVersion
                return (
                  <li key={entry.version} className="relative flex gap-4">
                    <div
                      className={cn(
                        'z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                        meta.bg,
                      )}
                    >
                      <Icon className={cn('size-4', meta.color)} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="h-5 font-mono text-[10px]">
                          {entry.version}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-5 text-[10px]',
                            meta.bg,
                            meta.color,
                            'border-transparent',
                          )}
                        >
                          {entry.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {entry.date}
                        </span>
                        {entryIsNew && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400"
                          >
                            NEW
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {entry.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </ScrollArea>

          <div className="flex items-center justify-between gap-2 border-t px-6 py-3">
            <p className="text-xs text-muted-foreground">
              {changelogEntries.length} updates since v6.1
            </p>
            <Button size="sm" variant="outline" onClick={handleMarkSeen} className="gap-1.5">
              <Check className="size-3.5 text-emerald-500" />
              Mark all as seen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RedDot() {
  return (
    <span className="relative flex size-2" aria-label="New">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  )
}

export default ChangelogWidget
