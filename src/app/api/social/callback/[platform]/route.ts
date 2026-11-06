import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { isPlatformConfigured, type Platform } from '@/lib/social/types'
import { exchangeFacebookCode } from '@/lib/social/facebook'
import { exchangeInstagramCode } from '@/lib/social/instagram'
import { exchangeTikTokCode } from '@/lib/social/tiktok'
import { exchangeTwitterCode } from '@/lib/social/twitter'

/**
 * GET /api/social/callback/[platform]
 *
 * OAuth callback handler for all 4 platforms. The platform redirects here
 * with `?code=...&state=...`. We exchange the code for an access token
 * and store it as a SocialAccount.
 *
 * If env vars aren't configured, we still create a demo account so the
 * end-to-end flow works (this path is hit by the OAuth demo, e.g. when
 * the OAuth provider is unavailable).
 *
 * After successful callback, redirects to /#settings so the user sees
 * their newly-connected account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    if (!['facebook', 'instagram', 'tiktok', 'twitter'].includes(platform)) {
      throw ApiError.badRequest(`Unsupported platform: ${platform}`)
    }
    const plat = platform as Platform

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')
    const oauthErrorDesc = searchParams.get('error_description')

    if (oauthError) {
      return redirectToSettings(`OAuth error: ${oauthErrorDesc || oauthError}`)
    }
    if (!code || !state) {
      return redirectToSettings('OAuth callback missing code or state')
    }

    // Verify the state matches what we issued in /connect
    const stateSetting = await db.appSetting.findUnique({
      where: { key: `oauth_state_${state}` },
    })
    if (!stateSetting || stateSetting.value !== plat) {
      return redirectToSettings('Invalid OAuth state — please try connecting again')
    }

    // Clean up state
    await db.appSetting.delete({ where: { key: `oauth_state_${state}` } }).catch(() => {})

    const origin = new URL(request.url).origin
    const redirectUri = `${origin}/api/social/callback/${plat}`

    // ─── Demo fallback: env vars missing ──────────────────────
    if (!isPlatformConfigured(plat)) {
      // Even if user clicked through a real OAuth flow, we can't exchange
      // the code without env credentials — create a demo account.
      await db.socialAccount.upsert({
        where: { userId_platform: { userId: DEMO_USER_ID, platform: plat } },
        update: {
          platformUserId: `demo_callback_${Date.now()}`,
          platformUsername: `Demo ${plat} User`,
          accessToken: `demo-${plat}-token-${Date.now()}`,
          isDemo: true,
          isConnected: true,
        },
        create: {
          userId: DEMO_USER_ID,
          platform: plat,
          platformUserId: `demo_callback_${Date.now()}`,
          platformUsername: `Demo ${plat} User`,
          accessToken: `demo-${plat}-token-${Date.now()}`,
          isDemo: true,
          isConnected: true,
        },
      })
      return redirectToSettings(`${plat} connected in demo mode (no API credentials configured)`)
    }

    // ─── Real OAuth exchange ───────────────────────────────────
    let accessToken: string
    let platformUserId: string
    let platformUsername: string | undefined

    switch (plat) {
      case 'facebook': {
        const r = await exchangeFacebookCode(code, redirectUri)
        accessToken = r.accessToken
        platformUserId = r.pageId
        platformUsername = r.pageName
        break
      }
      case 'instagram': {
        const r = await exchangeInstagramCode(code, redirectUri)
        accessToken = r.accessToken
        platformUserId = r.igUserId
        platformUsername = r.igUsername
        break
      }
      case 'tiktok': {
        const r = await exchangeTikTokCode(code, redirectUri)
        accessToken = r.accessToken
        platformUserId = r.openId
        platformUsername = r.displayName
        break
      }
      case 'twitter': {
        const verifierSetting = await db.appSetting.findUnique({
          where: { key: `pkce_${state}` },
        })
        if (!verifierSetting) {
          return redirectToSettings('Missing PKCE verifier — please reconnect Twitter')
        }
        await db.appSetting.delete({ where: { key: `pkce_${state}` } }).catch(() => {})
        const r = await exchangeTwitterCode(code, redirectUri, verifierSetting.value)
        accessToken = r.accessToken
        platformUserId = r.userId
        platformUsername = r.username
        break
      }
      default:
        throw ApiError.badRequest(`Unsupported platform: ${plat}`)
    }

    await db.socialAccount.upsert({
      where: { userId_platform: { userId: DEMO_USER_ID, platform: plat } },
      update: {
        platformUserId,
        platformUsername: platformUsername || null,
        accessToken,
        isDemo: false,
        isConnected: true,
        lastUsedAt: null,
      },
      create: {
        userId: DEMO_USER_ID,
        platform: plat,
        platformUserId,
        platformUsername: platformUsername || null,
        accessToken,
        isDemo: false,
        isConnected: true,
      },
    })

    return redirectToSettings(`${plat} connected successfully!`)
  } catch (error) {
    console.error('[OAuth callback] error:', error)
    const msg = error instanceof Error ? error.message : 'OAuth callback failed'
    return redirectToSettings(`Connection failed: ${msg}`)
  }
}

/** Helper: redirect to /#settings?social_msg=... so the SPA can show a toast. */
function redirectToSettings(message: string): NextResponse {
  const url = new URL('/', 'http://localhost')
  url.hash = 'settings'
  url.searchParams.set('social_msg', message)
  // Use a 302 redirect with a relative URL (NextResponse.redirect requires absolute)
  return NextResponse.redirect(new URL(`/?social_msg=${encodeURIComponent(message)}#settings`, 'http://localhost:3000'), {
    status: 302,
  })
}
