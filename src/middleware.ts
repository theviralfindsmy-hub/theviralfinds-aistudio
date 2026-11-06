import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const AUTH_SECRET = (() => {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET environment variable is required in production')
    }
    console.warn('[middleware] WARNING: NEXTAUTH_SECRET is not set. Using insecure dev fallback. Set NEXTAUTH_SECRET before deploying!')
    return 'dev-only-insecure-secret-do-not-use-in-production'
  }
  return secret
})()

// Public API paths that don't require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth',           // NextAuth handlers (signin, signout, providers, etc.)
  '/api/seed',           // Database seeding endpoint
  '/api/shopee/webhook', // Shopee webhook callbacks (server-to-server)
  '/api/export',         // Data exports (CSV/PDF) — falls back to demo data when DB is empty
  '/api/health',         // Health check — used by offline banner retry button
  '/api/realtime/test',  // Real-time notification test trigger (debug only)
  '/api/social/callback',// OAuth callbacks from Facebook/Instagram/Twitter (server-to-server)
  '/api/social/execute', // Scheduled post execution trigger (called by cron/interval)
  '/api/pricing/plans',  // Public pricing catalog (marketing surface — visible pre-login)
]

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (isPublicApiPath(pathname)) {
    return NextResponse.next()
  }

  // Validate NextAuth JWT
  const token = await getToken({ req, secret: AUTH_SECRET })

  if (!token) {
    // In development or if demo mode is requested, allow request with demo fallback
    if (process.env.NODE_ENV !== 'production' || req.cookies.get('tvf_demo')?.value === 'true') {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', 'demo-user')
      requestHeaders.set('x-user-email', 'demo@theviralfindsmy.com')
      requestHeaders.set('x-user-role', 'affiliate')
      return NextResponse.next({
        request: { headers: requestHeaders },
      })
    }

    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please sign in to access this resource.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    )
  }

  // Optionally add user-id header for downstream API routes to read
  const requestHeaders = new Headers(req.headers)
  if (token.id) {
    requestHeaders.set('x-user-id', String(token.id))
  }
  if (token.email) {
    requestHeaders.set('x-user-email', String(token.email))
  }
  if (token.role) {
    requestHeaders.set('x-user-role', String(token.role))
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/api/:path*'],
}
