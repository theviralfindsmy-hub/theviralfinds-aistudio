'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  Megaphone, Wallet, Settings, Bell, Trophy, Award, Users,
  Bot, X, Sparkles, CalendarClock, PenTool, Target, TrendingUp, Film,
  Music2, Radio, GitCompare, LayoutGrid, Search,
  Lightbulb, Image as ImageIcon, BellRing, FlaskConical, Users2, Hash, CalendarDays,
  Crown, Store, Building2, Palette, Key,
  Globe, Heart, Tag, DollarSign, MessageCircle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
}

const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'links', label: 'Affiliate Links', icon: Link2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'autopost', label: 'Auto Post', icon: CalendarClock, badge: 'NEW', color: 'autopost' },
  { id: 'content', label: 'AI Content', icon: PenTool, badge: 'AI', color: 'content' },
  { id: 'trends', label: 'Trend Spy', icon: TrendingUp, badge: 'NEW', color: 'trends' },
  { id: 'profit', label: 'Profit Optimizer', icon: Target, badge: 'AI', color: 'profit' },
  { id: 'studio', label: 'Content Studio', icon: Film, badge: 'NEW', color: 'studio' },
  // Fasa 2
  { id: 'tiktok', label: 'TikTok Shop', icon: Music2, badge: 'NEW', color: 'studio' },
  { id: 'lazada', label: 'Lazada', icon: ShoppingBag, badge: 'NEW', color: 'profit' },
  { id: 'live', label: 'Shopee Live', icon: Radio, badge: '80%', color: 'hermes' },
  { id: 'compare', label: 'Compare', icon: GitCompare, badge: 'NEW', color: 'trends' },
  { id: 'unified', label: 'Unified Earnings', icon: LayoutGrid, color: 'autopost' },
  { id: 'matcher', label: 'Product Matcher', icon: Search, color: 'profit' },
  // Fasa 3
  { id: 'recommender', label: 'AI Recommender', icon: Lightbulb, badge: 'AI', color: 'hermes' },
  { id: 'thumbnails', label: 'AI Thumbnails', icon: ImageIcon, badge: 'AI', color: 'content' },
  { id: 'alerts', label: 'XTRA Alerts', icon: BellRing, badge: 'NEW', color: 'profit' },
  { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical, badge: 'AI', color: 'hermes' },
  { id: 'audience', label: 'Audience AI', icon: Users2, badge: 'AI', color: 'content' },
  { id: 'hashtags', label: 'Hashtag AI', icon: Hash, badge: 'AI', color: 'trends' },
  { id: 'calendar', label: 'AI Calendar', icon: CalendarDays, badge: 'AI', color: 'hermes' },
  // Fasa 4
  { id: 'pricing', label: 'Pricing', icon: Crown, badge: 'PRO', color: 'profit' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, badge: 'NEW', color: 'studio' },
  { id: 'team', label: 'Team Dashboard', icon: Building2, badge: 'NEW', color: 'hermes' },
  { id: 'whitelabel', label: 'White-Label', icon: Palette, badge: 'ENT', color: 'content' },
  { id: 'apikeys', label: 'API Keys', icon: Key, badge: 'API', color: 'trends' },
  // Fasa 5 — Shopee Pro
  { id: 'intelligence', label: 'Market Intel', icon: Globe, badge: 'NEW', color: 'profit' },
  { id: 'health', label: 'Account Health', icon: Heart, badge: 'NEW', color: 'hermes' },
  { id: 'promotions', label: 'Promotion Hub', icon: Tag, badge: 'NEW', color: 'autopost' },
  { id: 'ads', label: 'Shopee Ads', icon: DollarSign, badge: 'NEW', color: 'trends' },
  { id: 'chat', label: 'Seller Chat', icon: MessageCircle, badge: 'NEW', color: 'studio' },
  // Existing
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function MobileSheet() {
  const { mobileMenuOpen, setMobileMenuOpen, setActivePage, user, isAuthenticated } = useAppStore()

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border min-h-[64px]">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-shopee text-white font-bold text-sm flex-shrink-0">
              TV
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">TheViralFinds</span>
              <span className="text-[10px] text-muted-foreground">Affiliate Manager Pro</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-9 w-9 flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Nav Items — each row min 44px tall for touch */}
          <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto custom-scrollbar overscroll-contain" aria-label="Mobile navigation menu">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const isHermes = item.color === 'hermes'
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80 active:scale-[0.99] transition-all"
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isHermes && 'text-hermes')} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className={cn(
                      'text-[10px] px-1.5 py-0 border-0 flex-shrink-0',
                      isHermes ? 'bg-hermes/10 text-hermes' : 'bg-shopee/10 text-shopee'
                    )}>
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          <Separator />

          {/* User — touch-friendly row */}
          <button
            onClick={() => {
              setActivePage('settings')
              setMobileMenuOpen(false)
            }}
            className="p-3 flex items-center gap-3 w-full min-h-[56px] hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">
                {isAuthenticated && user
                  ? (user.name || user.email || 'U').slice(0, 2).toUpperCase()
                  : 'TV'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {isAuthenticated && user ? user.name : 'Guest User'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isAuthenticated ? (user?.role === 'admin' ? 'Admin Plan' : 'Affiliate Plan') : 'Tap to sign in'}
              </span>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
