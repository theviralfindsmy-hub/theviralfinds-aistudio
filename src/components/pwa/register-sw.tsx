'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * RegisterSW
 * -------------
 * Registers /sw.js in production, surfaces "new version available" toasts,
 * and triggers instant activation when the user accepts the update.
 *
 * In development we skip registration to avoid caching live code.
 */
export function RegisterSW() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [showReload, setShowReload] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // In development/preview, clean up any lingering service workers and caches to prevent stale bundles
    if (process.env.NODE_ENV !== 'production') {
      try {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) {
            reg.unregister()
          }
        })
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key)
            }
          })
        }
      } catch {
        // ignore
      }
      return
    }

    let registered = false

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        registered = true

        // New version waiting to activate → ask user to reload
        if (reg.waiting) {
          setWaitingWorker(reg.waiting)
          setShowReload(true)
        }

        // Listen for future updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowReload(true)
            }
          })
        })

        // Page took over by an activated SW — suggest hard reload once
        let reloadShown = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!reloadShown) {
            reloadShown = true
            // The browser usually auto-refreshes here, but show toast as a hint
            toast.success('App updated to the latest version')
          }
        })
      } catch (err) {
        // Silent fail — SW is a progressive enhancement
        console.warn('[PWA] SW registration failed:', err)
      }
    }

    register()

    // Online/offline → toast so the user understands why actions fail
    const onOffline = () => toast.warning('You are offline. Showing cached content.')
    const onOnline = () => toast.success('Back online — fresh data will reload shortly.')
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      void registered
    }
  }, [])

  const handleReload = () => {
    if (waitingWorker) {
      // Tell the waiting SW to skip waiting → it becomes active
      waitingWorker.postMessage('SKIP_WAITING')
    }
    setWaitingWorker(null)
    setShowReload(false)
    // Force reload to pick up new shell
    window.location.reload()
  }

  if (!showReload) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[90vw] max-w-md animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3 bg-card border border-border shadow-xl rounded-xl p-3 pl-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-shopee/10 text-shopee flex-shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Update available</p>
          <p className="text-xs text-muted-foreground">A new version of the app is ready.</p>
        </div>
        <Button size="sm" onClick={handleReload} className="bg-shopee hover:bg-shopee-dark text-white gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
        </Button>
      </div>
    </div>
  )
}
