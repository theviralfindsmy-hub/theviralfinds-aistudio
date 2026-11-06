import { create } from 'zustand'

export type PageId =
  | 'dashboard'
  | 'products'
  | 'links'
  | 'analytics'
  | 'campaigns'
  | 'calculator'
  | 'earnings'
  | 'autopost'
  | 'content'
  | 'trends'
  | 'profit'
  | 'studio'
  | 'hermes'
  | 'achievements'
  | 'leaderboard'
  | 'referrals'
  | 'notifications'
  | 'settings'
  | 'addons'
  | 'socialhub'
  // Fasa 2 — Multi-platform expansion
  | 'tiktok'
  | 'lazada'
  | 'live'
  | 'compare'
  | 'unified'
  | 'matcher'
  // Fasa 3 — AI Superpowers
  | 'recommender'
  | 'thumbnails'
  | 'alerts'
  | 'abtesting'
  | 'audience'
  | 'hashtags'
  | 'calendar'
  // Fasa 4 — Monetize & Scale
  | 'pricing'
  | 'marketplace'
  | 'team'
  | 'whitelabel'
  | 'apikeys'
  // Fasa 5 — Shopee Open API Integration
  | 'intelligence'
  | 'health'
  | 'promotions'
  | 'ads'
  | 'chat'

export type AuthView = 'landing' | 'login' | 'register'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  image?: string | null
  avatarUrl?: string | null
  shopeeAffId?: string | null
  isActive?: boolean
  lastLoginAt?: string | null
  emailVerified?: string | null
  createdAt?: string
}

interface AppState {
  activePage: PageId
  setActivePage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  hermesConnected: boolean
  setHermesConnected: (connected: boolean) => void
  shopeeConnected: boolean
  setShopeeConnected: (connected: boolean) => void
  shopeeDataSource: 'graphql_api' | 'mock'
  setShopeeDataSource: (source: 'graphql_api' | 'mock') => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  focusMode: boolean
  toggleFocusMode: () => void

  // Auth state
  user: AuthUser | null
  isAuthenticated: boolean
  isLoadingAuth: boolean
  authView: AuthView
  setAuthView: (view: AuthView) => void
  setUser: (user: AuthUser | null) => void
  checkAuth: () => Promise<void>
  quickDemoLogin: () => void
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginWithProvider: (provider: 'google' | 'facebook') => Promise<void>
  logout: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  hermesConnected: false,
  setHermesConnected: (connected) => set({ hermesConnected: connected }),
  shopeeConnected: false,
  setShopeeConnected: (connected) => set({ shopeeConnected: connected }),
  shopeeDataSource: 'mock',
  setShopeeDataSource: (source) => set({ shopeeDataSource: source }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  // Auth state
  // Auth state — default to active Demo Affiliate session so app loads immediately
  user: {
    id: 'demo-user',
    name: 'Demo Affiliate',
    email: 'demo@theviralfindsmy.com',
    role: 'affiliate',
  },
  isAuthenticated: true,
  isLoadingAuth: false,
  authView: 'landing' as AuthView,
  setAuthView: (view) => set({ authView: view }),
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoadingAuth: false,
    }),

  quickDemoLogin: () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'tvf_demo=true; path=/; max-age=86400'
    }
    set({
      user: {
        id: 'demo-user',
        name: 'Demo Affiliate',
        email: 'demo@theviralfindsmy.com',
        role: 'affiliate',
      },
      isAuthenticated: true,
      isLoadingAuth: false,
      activePage: 'dashboard',
    })
  },

  checkAuth: async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null)
      clearTimeout(timeout)

      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.user) {
          set({
            user: data.user,
            isAuthenticated: true,
            isLoadingAuth: false,
          })
          return
        }
      }
      set({ isLoadingAuth: false })
    } catch {
      set({ isLoadingAuth: false })
    }
  },

  login: async (email, password) => {
    try {
      const { signIn } = await import('next-auth/react')
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      if (!result || result.error) {
        return {
          ok: false,
          error: result?.error || 'Login failed. Please check your credentials.',
        }
      }
      // Fetch the full user profile
      await get().checkAuth()
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Login failed. Please try again.',
      }
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data?.error || 'Registration failed.' }
      }
      // Auto-login after register
      const loginRes = await get().login(email, password)
      return loginRes
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Registration failed.',
      }
    }
  },

  loginWithProvider: async (provider) => {
    try {
      const { signIn } = await import('next-auth/react')
      await signIn(provider, { callbackUrl: '/' })
    } catch (err) {
      console.error('OAuth login error:', err)
    }
  },

  logout: async () => {
    try {
      const { signOut } = await import('next-auth/react')
      await signOut({ redirect: false })
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, authView: 'landing', activePage: 'dashboard' })
  },
}))
