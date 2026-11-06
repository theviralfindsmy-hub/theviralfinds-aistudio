'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore, type PageId } from '@/store/app-store'
import { useTheme } from '@/components/theme-provider'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Calculator,
  Megaphone,
  Wallet,
  CalendarClock,
  PenTool,
  TrendingUp,
  Target,
  Film,
  Lightbulb,
  Image as ImageIcon,
  FlaskConical,
  Users2,
  Hash,
  CalendarDays,
  Music2,
  Radio,
  GitCompare,
  LayoutGrid,
  Search,
  Globe,
  Heart,
  Tag,
  DollarSign,
  MessageCircle,
  Crown,
  Store,
  Building2,
  Palette,
  Key,
  Trophy,
  Award,
  Users,
  Bot,
  Settings,
  Plus,
  FileText,
  Download,
  Moon,
  Sun,
  PanelLeftClose,
  Focus,
  Sparkles,
  Boxes,
  Share2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Navigation items — mirrors sidebar categories
// ---------------------------------------------------------------------------

interface NavEntry {
  id: PageId
  label: string
  icon: React.ElementType
  shortcut?: string
}

const navigationItems: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { id: 'products', label: 'Products', icon: ShoppingBag, shortcut: '2' },
  { id: 'links', label: 'Affiliate Links', icon: Link2, shortcut: '3' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: '4' },
  { id: 'earnings', label: 'Earnings', icon: Wallet, shortcut: '5' },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot },
  { id: 'content', label: 'AI Content Generator', icon: PenTool },
  { id: 'trends', label: 'Trend Spy', icon: TrendingUp },
  { id: 'profit', label: 'Profit Optimizer', icon: Target },
  { id: 'studio', label: 'Content Studio', icon: Film },
  { id: 'autopost', label: 'Auto Post', icon: CalendarClock },
  { id: 'recommender', label: 'AI Recommender', icon: Lightbulb },
  { id: 'thumbnails', label: 'AI Thumbnails', icon: ImageIcon },
  { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical },
  { id: 'audience', label: 'Audience AI', icon: Users2 },
  { id: 'hashtags', label: 'Hashtag AI', icon: Hash },
  { id: 'calendar', label: 'AI Calendar', icon: CalendarDays },
  { id: 'live', label: 'Live Stream', icon: Radio },
  { id: 'tiktok', label: 'TikTok Shop', icon: Music2 },
  { id: 'lazada', label: 'Lazada', icon: ShoppingBag },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'unified', label: 'Unified Earnings', icon: LayoutGrid },
  { id: 'matcher', label: 'Product Matcher', icon: Search },
  { id: 'intelligence', label: 'Market Intelligence', icon: Globe },
  { id: 'health', label: 'Account Health', icon: Heart },
  { id: 'promotions', label: 'Promotion Hub', icon: Tag },
  { id: 'ads', label: 'Shopee Ads', icon: DollarSign },
  { id: 'chat', label: 'Seller Chat', icon: MessageCircle },
  { id: 'pricing', label: 'Pricing', icon: Crown },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'team', label: 'Team Dashboard', icon: Building2 },
  { id: 'whitelabel', label: 'White Label', icon: Palette },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'addons', label: 'Manus Addons', icon: Boxes },
  { id: 'socialhub', label: 'Social Hub', icon: Share2 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

interface ActionEntry {
  id: string
  label: string
  icon: React.ElementType
  shortcut?: string
  action: () => void
}

// ---------------------------------------------------------------------------
// Settings items
// ---------------------------------------------------------------------------

interface SettingsEntry {
  id: string
  label: string
  icon: React.ElementType
  shortcut?: string
  action: () => void
}

// ---------------------------------------------------------------------------
// Command Palette Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActivePage, toggleSidebar, toggleFocusMode } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const handleNavigate = useCallback(
    (pageId: PageId) => {
      setActivePage(pageId)
      setCommandPaletteOpen(false)
    },
    [setActivePage, setCommandPaletteOpen]
  )

  const handleAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case 'create-link':
          setActivePage('links')
          break
        case 'search-products':
          setActivePage('products')
          break
        case 'generate-content':
          setActivePage('content')
          break
        case 'export-data':
          setActivePage('analytics')
          break
      }
      setCommandPaletteOpen(false)
    },
    [setActivePage, setCommandPaletteOpen]
  )

  const handleSetting = useCallback(
    (settingId: string) => {
      switch (settingId) {
        case 'toggle-theme':
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
          break
        case 'toggle-sidebar':
          toggleSidebar()
          break
        case 'toggle-focus':
          toggleFocusMode()
          break
      }
      setCommandPaletteOpen(false)
    },
    [resolvedTheme, setTheme, toggleSidebar, toggleFocusMode, setCommandPaletteOpen]
  )

  // Build action items with callbacks
  const actionItems: ActionEntry[] = [
    { id: 'create-link', label: 'Create Affiliate Link', icon: Plus, shortcut: '⇧L', action: () => handleAction('create-link') },
    { id: 'search-products', label: 'Search Products', icon: Search, shortcut: '⇧P', action: () => handleAction('search-products') },
    { id: 'generate-content', label: 'Generate AI Content', icon: Sparkles, shortcut: '⇧G', action: () => handleAction('generate-content') },
    { id: 'export-data', label: 'Export Data', icon: Download, shortcut: '⇧E', action: () => handleAction('export-data') },
  ]

  // Build settings items with callbacks
  const settingsItems: SettingsEntry[] = [
    { id: 'toggle-theme', label: 'Toggle Theme', icon: resolvedTheme === 'dark' ? Sun : Moon, shortcut: '⇧D', action: () => handleSetting('toggle-theme') },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: PanelLeftClose, shortcut: '⇧B', action: () => handleSetting('toggle-sidebar') },
    { id: 'toggle-focus', label: 'Toggle Focus Mode', icon: Focus, shortcut: '⇧F', action: () => handleSetting('toggle-focus') },
  ]

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200]"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0A1628]/70 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Dialog container — centered */}
          <div className="flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl relative"
            >
              <CommandDialog
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                title="Command Palette"
                description="Search for pages, actions, and settings"
                className="bg-[#0A1628] border-[#1E3A5F]/60 text-white shadow-2xl shadow-black/40 rounded-xl overflow-hidden [&_[cmdk-group-heading]]:text-[#CCFF00]/70 [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-input]]:text-white [&_[cmdk-input]]:placeholder:text-[#4A6A8A] [&_[cmdk-input-wrapper]]:border-[#1E3A5F]/60 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-item]]:text-[#B0C4DE] [&_[cmdk-item]]:data-[selected=true]:bg-[#0066FF]/20 [&_[cmdk-item]]:data-[selected=true]:text-white [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:transition-colors [&_[cmdk-empty]]:text-[#4A6A8A] [&_[cmdk-list]]:max-h-[420px] [&_[cmdk-group]]:px-2 [&_[cmdk-separator]]:bg-[#1E3A5F]/40"
                showCloseButton={false}
              >
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>

                  {/* Navigation Group */}
                  <CommandGroup heading="Navigation">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.label} ${item.id}`}
                          onSelect={() => handleNavigate(item.id)}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.shortcut && (
                            <CommandShortcut className="text-[#4A6A8A] text-[11px] font-mono">
                              {item.shortcut}
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>

                  <CommandSeparator />

                  {/* Actions Group */}
                  <CommandGroup heading="Actions">
                    {actionItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.label}
                          onSelect={item.action}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.shortcut && (
                            <CommandShortcut className="text-[#4A6A8A] text-[11px] font-mono">
                              {item.shortcut}
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>

                  <CommandSeparator />

                  {/* Settings Group */}
                  <CommandGroup heading="Settings">
                    {settingsItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.label}
                          onSelect={item.action}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-[#4A6A8A] flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.shortcut && (
                            <CommandShortcut className="text-[#4A6A8A] text-[11px] font-mono">
                              {item.shortcut}
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[#1E3A5F]/40">
                  <div className="flex items-center gap-3 text-[11px] text-[#4A6A8A]">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/50 text-[10px] font-mono">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/50 text-[10px] font-mono">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/50 text-[10px] font-mono">esc</kbd>
                      close
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4A6A8A]">
                    <Sparkles className="w-3 h-3 text-[#CCFF00]/60" />
                    <span>Powered by TVF</span>
                  </div>
                </div>
              </CommandDialog>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
