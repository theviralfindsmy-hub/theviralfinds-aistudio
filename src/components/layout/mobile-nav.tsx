'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Wallet,
  Bot,
  PenTool,
} from 'lucide-react'

const mobileNavItems: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'content', label: 'AI Content', icon: PenTool },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'earnings', label: 'Wallet', icon: Wallet },
]

export function MobileNav() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-lg safe-area-inset-bottom"
    >
      <ul
        className="flex items-center justify-around h-14 sm:h-16 px-1"
        role="tablist"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <li key={item.id} className="flex-1 flex justify-center">
              <button
                role="tab"
                aria-selected={isActive}
                aria-label={item.label}
                onClick={() => setActivePage(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-full min-h-[44px] min-w-[44px] rounded-lg transition-colors active:scale-95 active:bg-muted/60',
                  isActive ? 'text-shopee' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
