/**
 * TheViralFindsMY Service Worker
 * ---------------------------------
 * Strategy:
 *  - Pre-cache critical shell on install (app shell pattern)
 *  - Network-first for API + navigation requests (always fresh, fall back to cache offline)
 *  - Stale-while-revalidate for static assets (_next/static, images, icons, fonts)
 *  - Cache POST? No — only GET requests are cached
 *  - Bump CACHE_NAME on every release to invalidate old caches on activate
 */

const CACHE_NAME = 'theviralfindsmy-v8'
const RUNTIME_CACHE = 'theviralfindsmy-runtime-v8'

// App shell — minimal set of URLs cached on install so the app boots offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
  '/favicon.ico',
  '/logo.svg',
]

// Routes that are pure navigation (HTML)
const NAVIGATION_CACHE = 'theviralfindsmy-nav-v8'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![CACHE_NAME, RUNTIME_CACHE, NAVIGATION_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET — let everything else go straight to network
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip cross-origin requests (e.g. analytics, third-party APIs) — let browser handle them
  if (url.origin !== self.location.origin) return

  // Skip Next.js HMR + dev-only routes (don't cache dev server noise)
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  if (url.pathname.includes('/__nextjs')) return

  // ── API requests → network-first (always try to get fresh data, fall back to cache) ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful JSON responses
          if (response.ok && response.status === 200) {
            const clone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(
          JSON.stringify({ error: 'offline', message: 'You are offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )))
    )
    return
  }

  // ── Navigation requests (HTML pages) → network-first, fall back to cached "/" ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(NAVIGATION_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    )
    return
  }

  // ── Static assets → stale-while-revalidate ──
  // Covers _next/static/*, images, icons, fonts, manifest
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})

// Allow page to trigger immediate activation (skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
