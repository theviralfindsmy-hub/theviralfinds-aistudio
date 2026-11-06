'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  DollarSign,
  AlertTriangle,
  Info,
  Settings,
  ShoppingCart,
  TrendingUp,
  Gift,
  Clock,
  Shield,
  Megaphone,
  Zap,
  Wifi,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRealtimeStore } from '@/store/realtime-store'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'system' | 'earnings' | 'alerts'

interface Notification {
  id: string
  type: NotificationType
  icon: typeof Bell
  title: string
  description: string
  timestamp: string
  read: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'earnings',
    icon: DollarSign,
    title: 'Commission Received',
    description: 'You earned RM 45.90 commission from Xiaomi 14 Ultra purchase.',
    timestamp: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'alerts',
    icon: AlertTriangle,
    title: 'Link Expiring Soon',
    description: 'Your "11.11 Mega Sale" affiliate link expires in 2 days. Renew it now.',
    timestamp: '15 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'earnings',
    icon: TrendingUp,
    title: 'Earnings Milestone',
    description: 'Congratulations! You\'ve reached RM 4,000 in monthly earnings.',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '4',
    type: 'system',
    icon: Shield,
    title: 'Security Update',
    description: 'Your account password was changed successfully. If this wasn\'t you, contact support.',
    timestamp: '3 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'earnings',
    icon: ShoppingCart,
    title: 'New Conversion',
    description: 'Samsung Galaxy S24 FE was purchased through your link. Pending commission: RM 170.91.',
    timestamp: '5 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    icon: Settings,
    title: 'Scheduled Maintenance',
    description: 'The platform will undergo maintenance on March 20, 2:00 AM - 4:00 AM MYT.',
    timestamp: '8 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'alerts',
    icon: Megaphone,
    title: 'New Campaign Available',
    description: 'Join the "12.12 Year-End Sale" campaign with boosted commission rates up to 15%.',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: '8',
    type: 'earnings',
    icon: Gift,
    title: 'Referral Bonus',
    description: 'You earned RM 22.50 from your referral Amirul Hakim\'s commissions this week.',
    timestamp: '2 days ago',
    read: true,
  },
]

const typeConfig: Record<NotificationType, { color: string; bgColor: string }> = {
  system: { color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  earnings: { color: 'text-shopee', bgColor: 'bg-shopee/10' },
  alerts: { color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [activeTab, setActiveTab] = useState<string>('all')

  const realtimeConnected = useRealtimeStore((s) => s.isConnected)
  const realtimeUnread = useRealtimeStore((s) => s.unreadCount)
  const realtimeNotifications = useRealtimeStore((s) => s.notifications)
  const markAllRealtimeRead = useRealtimeStore((s) => s.markAllRead)
  const markRealtimeRead = useRealtimeStore((s) => s.markRead)

  const [testing, setTesting] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length + realtimeUnread

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeTab)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    markAllRealtimeRead()
  }

  const triggerTestEvent = async (event: 'conversion' | 'click' | 'commission_xtra' | 'hermes_insight' | 'notification') => {
    setTesting(event)
    try {
      const res = await fetch('/api/realtime/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error('Test failed', { description: json.error || 'Notification service unavailable' })
      } else {
        toast.info('Test event emitted', {
          description: `${event} → ${json.delivered}`,
        })
      }
    } catch (err) {
      toast.error('Test failed', { description: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Stay updated with your latest activity
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2 text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" />
          Mark All Read
        </Button>
      </motion.div>

      {/* Real-time connection + test panel */}
      <motion.div {...fadeIn}>
        <Card className="border-shopee/20 bg-shopee/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wifi className={cn('size-4', realtimeConnected ? 'text-emerald-500' : 'text-red-500')} />
                <span className="text-sm font-medium">
                  Real-time service: {realtimeConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                    realtimeConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                  {realtimeConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {realtimeUnread > 0 ? `${realtimeUnread} live notification(s) this session` : 'No live notifications yet'}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="size-3.5 text-shopee" />
                <span className="text-xs font-semibold">Test real-time events</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Trigger a sample event through the full pipeline (API → notification-service → Socket.io → this browser).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {([
                  { event: 'conversion', label: '💰 Conversion', color: 'bg-emerald-500 hover:bg-emerald-600' },
                  { event: 'click', label: '👆 Click', color: 'bg-sky-500 hover:bg-sky-600' },
                  { event: 'commission_xtra', label: '🔥 Commission XTRA', color: 'bg-amber-500 hover:bg-amber-600' },
                  { event: 'hermes_insight', label: '🤖 HERMES Insight', color: 'bg-hermes hover:bg-hermes/90' },
                  { event: 'notification', label: '🔔 Generic', color: 'bg-slate-500 hover:bg-slate-600' },
                ] as const).map((b) => (
                  <Button
                    key={b.event}
                    size="sm"
                    variant="secondary"
                    className={cn('text-white text-xs h-8 gap-1.5', b.color)}
                    disabled={testing === b.event}
                    onClick={() => triggerTestEvent(b.event)}
                  >
                    {testing === b.event && (
                      <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {b.label}
                  </Button>
                ))}
              </div>
            </div>

            {realtimeNotifications.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Live notifications (this session)</span>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={markAllRealtimeRead}>
                      Mark all read
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {realtimeNotifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRealtimeRead(n.id)}
                        className={cn(
                          'w-full text-left p-2.5 rounded-lg border transition-colors',
                          n.read
                            ? 'border-border bg-background/50 opacity-70'
                            : 'border-shopee/30 bg-shopee/5 hover:bg-shopee/10',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium leading-tight">{n.title}</p>
                            {n.description && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                              {n.event}
                            </Badge>
                            {!n.read && <span className="size-1.5 rounded-full bg-shopee" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {['all', 'unread', 'system', 'earnings', 'alerts'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <Card className="card-hover">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="text-muted-foreground size-10" />
                      <p className="mt-3 text-sm font-medium">No notifications</p>
                      <p className="text-xs text-muted-foreground">
                        You&apos;re all caught up!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                      const cfg = typeConfig[notification.type]
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Card
                            className={cn(
                              'card-hover cursor-pointer transition-colors',
                              !notification.read && 'border-shopee/20 bg-shopee/5'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CardContent className="flex items-start gap-3 p-4">
                              <div
                                className={cn(
                                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                  cfg.bgColor
                                )}
                              >
                                <notification.icon className={cn('size-4', cfg.color)} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={cn('text-sm font-medium leading-tight', !notification.read && 'text-foreground')}>
                                      {notification.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                      {notification.description}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {notification.timestamp}
                                    </span>
                                    {!notification.read && (
                                      <div className="size-2 rounded-full bg-shopee animate-pulse" />
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="mt-2 text-[10px] capitalize"
                                >
                                  {notification.type}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}
