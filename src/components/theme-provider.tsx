'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
  themes: string[]
  forcedTheme?: string
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  systemTheme: 'light',
  themes: ['light', 'dark', 'system'],
})

export interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  storageKey?: string
  themes?: string[]
  forcedTheme?: string
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
  themes = ['light', 'dark', 'system'],
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTheme
    try {
      return localStorage.getItem(storageKey) || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setSystemTheme(getSystemTheme())

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (forcedTheme) return forcedTheme === 'dark' ? 'dark' : 'light'
    const active = theme || defaultTheme
    if (active === 'system') {
      return enableSystem ? systemTheme : 'light'
    }
    return active === 'dark' ? 'dark' : 'light'
  }, [forcedTheme, theme, defaultTheme, enableSystem, systemTheme])

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const setTheme = useCallback(
    (newTheme: string) => {
      setThemeState(newTheme)
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {
        // ignore
      }
    },
    [storageKey]
  )

  const value = useMemo(
    () => ({
      theme: forcedTheme || theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes,
      forcedTheme,
    }),
    [forcedTheme, theme, setTheme, resolvedTheme, systemTheme, themes]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
