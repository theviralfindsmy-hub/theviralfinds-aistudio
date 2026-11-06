'use client'

import React, { memo, useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore, type PageId } from '@/store/app-store'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Calculator,
  Megaphone,
  Wallet,
  Settings,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trophy,
  Award,
  Activity,
  Users,
  Zap,
  Bot,
  Sparkles,
  CalendarClock,
  PenTool,
  Target,
  TrendingUp,
  Film,
  Music2,
  Radio,
  GitCompare,
  LayoutGrid,
  Search,
  Lightbulb,
  Image as ImageIcon,
  BellRing,
  FlaskConical,
  Users2,
  Hash,
  CalendarDays,
  Crown,
  Store,
  Building2,
  Palette,
  Key,
  ChevronDown,
  Globe,
  Heart,
  Tag,
  DollarSign,
  MessageCircle,
  Boxes,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItemData {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
}

interface NavCategory {
  name: string
  items: NavItemData[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const categories: NavCategory[] = [
  {
    name: 'CORE',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'Products', icon: ShoppingBag },
      { id: 'links', label: 'Affiliate Links', icon: Link2 },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
      { id: 'earnings', label: 'Earnings', icon: Wallet },
    ],
  },
  {
    name: 'AI POWERED',
    items: [
      { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
      { id: 'autopost', label: 'Auto Post', icon: CalendarClock, badge: 'NEW', color: 'autopost' },
      { id: 'content', label: 'AI Content', icon: PenTool, badge: 'AI', color: 'content' },
      { id: 'trends', label: 'Trend Spy', icon: TrendingUp, badge: 'NEW', color: 'trends' },
      { id: 'profit', label: 'Profit Optimizer', icon: Target, badge: 'AI', color: 'profit' },
      { id: 'studio', label: 'Content Studio', icon: Film, badge: 'NEW', color: 'studio' },
      { id: 'recommender', label: 'AI Recommender', icon: Lightbulb, badge: 'AI', color: 'hermes' },
      { id: 'thumbnails', label: 'AI Thumbnails', icon: ImageIcon, badge: 'AI', color: 'content' },
      { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical, badge: 'AI', color: 'hermes' },
      { id: 'audience', label: 'Audience AI', icon: Users2, badge: 'AI', color: 'content' },
      { id: 'hashtags', label: 'Hashtag AI', icon: Hash, badge: 'AI', color: 'trends' },
      { id: 'calendar', label: 'AI Calendar', icon: CalendarDays, badge: 'AI', color: 'hermes' },
      { id: 'addons', label: 'Manus Addons', icon: Boxes, badge: 'v2.1', color: 'hermes' },
    ],
  },
  {
    name: 'PLATFORMS',
    items: [
      { id: 'tiktok', label: 'TikTok Shop', icon: Music2, badge: 'NEW', color: 'studio' },
      { id: 'lazada', label: 'Lazada', icon: ShoppingBag, badge: 'NEW', color: 'profit' },
      { id: 'live', label: 'Shopee Live', icon: Radio, badge: '80%', color: 'hermes' },
      { id: 'compare', label: 'Compare', icon: GitCompare, badge: 'NEW', color: 'trends' },
      { id: 'unified', label: 'Unified Earnings', icon: LayoutGrid, color: 'autopost' },
      { id: 'matcher', label: 'Product Matcher', icon: Search, color: 'profit' },
    ],
  },
  {
    name: 'SCALE',
    items: [
      { id: 'pricing', label: 'Pricing', icon: Crown, badge: 'PRO', color: 'profit' },
      { id: 'marketplace', label: 'Marketplace', icon: Store, badge: 'NEW', color: 'studio' },
      { id: 'team', label: 'Team Dashboard', icon: Building2, badge: 'NEW', color: 'hermes' },
      { id: 'whitelabel', label: 'White-Label', icon: Palette, badge: 'ENT', color: 'content' },
      { id: 'apikeys', label: 'API Keys', icon: Key, badge: 'API', color: 'trends' },
    ],
  },
  {
    name: 'SHOPEE PRO',
    items: [
      { id: 'intelligence', label: 'Market Intel', icon: Globe, badge: 'NEW', color: 'profit' },
      { id: 'health', label: 'Account Health', icon: Heart, badge: 'NEW', color: 'hermes' },
      { id: 'promotions', label: 'Promotion Hub', icon: Tag, badge: 'NEW', color: 'autopost' },
      { id: 'ads', label: 'Shopee Ads', icon: DollarSign, badge: 'NEW', color: 'trends' },
      { id: 'chat', label: 'Seller Chat', icon: MessageCircle, badge: 'NEW', color: 'studio' },
    ],
  },
  {
    name: 'SOCIAL',
    items: [
      { id: 'socialhub', label: 'Social Hub', icon: Share2, badge: 'AUTO', color: 'studio' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
      { id: 'achievements', label: 'Achievements', icon: Award },
      { id: 'referrals', label: 'Referrals', icon: Users },
    ],
  },
]

// Flatten for search mode
const allNavItems: NavItemData[] = categories.flatMap((c) => c.items)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpecialColor(color?: string): string {
  if (color === 'hermes') return 'hermes'
  if (color === 'autopost') return 'emerald'
  if (color === 'content') return 'violet'
  if (color === 'trends') return 'amber'
  if (color === 'profit') return 'rose'
  if (color === 'studio') return 'sky'
  return 'shopee'
}

// ---------------------------------------------------------------------------
// NavItem (React.memo)
// ---------------------------------------------------------------------------

interface NavItemProps {
  item: NavItemData
  isActive: boolean
  sidebarOpen: boolean
  onSelect: (id: PageId) => void
}

const NavItem = memo(function NavItem({ item, isActive, sidebarOpen, onSelect }: NavItemProps) {
  const Icon = item.icon
  const isSpecial =
    item.color === 'hermes' ||
    item.color === 'autopost' ||
    item.color === 'content' ||
    item.color === 'trends' ||
    item.color === 'profit' ||
    item.color === 'studio'

  const specialColor = getSpecialColor(item.color)

  const buttonContent = (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={() => onSelect(item.id)}
      className={cn(
        'flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative',
        isActive
          ? isSpecial
            ? `bg-${specialColor}/10 text-${specialColor} dark:bg-${specialColor}/20`
            : 'bg-shopee/10 text-shopee dark:bg-shopee/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {/* Active indicator with layout animation */}
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 rounded-lg bg-shopee/10"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <Icon
        className={cn(
          'w-5 h-5 flex-shrink-0 relative z-10',
          isActive && isSpecial ? `text-${specialColor}` : isActive ? 'text-shopee' : ''
        )}
      />
      {sidebarOpen && <span className="relative z-10">{item.label}</span>}
      {sidebarOpen && item.badge && (
        <Badge
          variant="secondary"
          className={cn(
            'ml-auto text-[10px] px-1.5 py-0 border-0 relative z-10',
            isSpecial ? `bg-${specialColor}/10 text-${specialColor}` : 'bg-shopee/10 text-shopee'
          )}
        >
          {item.badge}
        </Badge>
      )}
    </motion.button>
  )

  // When collapsed, wrap with Tooltip
  if (!sidebarOpen) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
})

// ---------------------------------------------------------------------------
// CategoryGroup
// ---------------------------------------------------------------------------

interface CategoryGroupProps {
  category: NavCategory
  activePage: PageId
  sidebarOpen: boolean
  onSelect: (id: PageId) => void
  defaultOpen?: boolean
}

function CategoryGroup({ category, activePage, sidebarOpen, onSelect, defaultOpen = true }: CategoryGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  // Auto-expand if the active page is in this category
  const hasActive = category.items.some((item) => item.id === activePage)

  return (
    <div className="mb-1">
      {/* Category header - only show when sidebar is expanded */}
      {sidebarOpen && (
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase"
        >
          <motion.div
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
          <span className="truncate">{category.name}</span>
        </button>
      )}

      {/* Collapsible items */}
      <AnimatePresence initial={false}>
        {(open || !sidebarOpen) && (
          <motion.div
            initial={false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {category.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activePage === item.id}
                  sidebarOpen={sidebarOpen}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, user, isAuthenticated, logout, setAuthView } =
    useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  const [search, setSearch] = useState('')

  // Stable callback so memo'd children don't re-render unnecessarily
  const handleSelect = useCallback(
    (id: PageId) => {
      setActivePage(id)
    },
    [setActivePage]
  )

  // Determine if search is active
  const isSearching = search.trim().length > 0

  // Filter items when searching
  const filteredItems = useMemo(() => {
    if (!isSearching) return null
    const q = search.toLowerCase().trim()
    return allNavItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    )
  }, [isSearching, search])

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-300 bg-sidebar',
        sidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-shopee flex-shrink-0 overflow-hidden">
          <img src="/apple-touch-icon.png" alt="TVF" className="w-full h-full object-cover" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">THEVIRALFINDS</span>
            <span className="text-[10px] text-lime font-semibold tracking-wider">AFFILIATE MANAGER</span>
          </div>
        )}
      </div>

      {/* Search / Filter - only when expanded */}
      {sidebarOpen && (
        <div className="px-2 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/50 border-0"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto custom-scrollbar">
        {isSearching && filteredItems ? (
          // Flattened search results
          <div className="space-y-0.5">
            {filteredItems.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No pages found</p>
            )}
            {filteredItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activePage === item.id}
                sidebarOpen={sidebarOpen}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          // Categorized view
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryGroup
                key={cat.name}
                category={cat}
                activePage={activePage}
                sidebarOpen={sidebarOpen}
                onSelect={handleSelect}
                defaultOpen={cat.name === 'CORE'}
              />
            ))}
          </div>
        )}
      </nav>

      <Separator />

      {/* Bottom section */}
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size={sidebarOpen ? 'sm' : 'icon'}
            className={sidebarOpen ? 'flex-1 justify-start gap-3 min-h-[40px]' : 'justify-center min-h-[44px] min-w-[44px]'}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            <span className="relative w-4 h-4 inline-flex items-center justify-center">
              <Moon className="w-4 h-4 dark:hidden" />
              <Sun className="w-4 h-4 hidden dark:block" />
            </span>
            {sidebarOpen && <span className="text-sm">Theme</span>}
          </Button>
        </div>

        <Button
          variant="ghost"
          size={sidebarOpen ? 'sm' : 'icon'}
          className="w-full justify-start gap-3 min-h-[44px]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-sm">Collapse</span>}
        </Button>

        <Separator />

        {/* User */}
        <div className={cn('flex items-center gap-3 px-2 py-2', !sidebarOpen && 'justify-center')}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold border-2 border-shopee/30">
              {isAuthenticated && user
                ? (user.name || user.email || 'U').slice(0, 2).toUpperCase()
                : 'TV'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {isAuthenticated && user ? user.name : 'Guest User'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isAuthenticated ? (user?.role === 'admin' ? 'Admin Plan' : 'Affiliate Plan') : 'Not signed in'}
              </span>
            </div>
          )}
          {sidebarOpen && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-red-600"
              onClick={async () => {
                await logout()
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
          {sidebarOpen && !isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 min-h-[44px] text-xs bg-shopee/10 text-shopee hover:bg-shopee/20"
              onClick={() => setAuthView('login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
