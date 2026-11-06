import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/api-error'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { PLATFORM_META, isPlatformConfigured, type Platform } from '@/lib/social/types'
import { buildFacebookOAuthUrl } from '@/lib/social/facebook'
import { buildInstagramOAuthUrl } from '@/lib/social/instagram'
import { buildTikTokOAuthUrl } from '@/lib/social/tiktok'
import { buildTwitterOAuthUrl } from '@/lib/social/twitter'

/**
 * GET /api/social/connect/[platform]
 *
 * Initiates the OAuth flow for the given platform.
 *
 * Two modes:
 *   1. Real mode (env vars configured): redirects to the platform's OAuth
 *      authorize URL. After authorization, the platform redirects back to
 *      /api/social/callback/[platform] with a `code` query param.
 *   2. Demo mode (env vars missing): creates a fake SocialAccount in the DB
 *      with isDemo=true and accessToken="demo-…". Returns a JSON response
 *      telling the frontend to redirect to the Settings page to see the
 *      connected demo account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const { platform } = await params
    if (!['facebook', 'instagram', 'tiktok', 'twitter'].includes(platform)) {
      throw ApiError.badRequest(`Unsupported platform: ${platform}`)
    }
    const plat = platform as Platform

    // Build the callback URL — same origin as this app
    const origin = new URL(request.url).origin
    const redirectUri = `${origin}/api/social/callback/${plat}`

    // ─── Demo Mode ──────────────────────────────────────────────
    // Create (or upsert) a demo SocialAccount for the demo user.
    if (!isPlatformConfigured(plat)) {
      const meta = PLATFORM_META[plat]
      // Use a URL-safe handle-style username so platform URLs (e.g. twitter.com/<name>/status/<id>)
      // remain valid even in demo mode.
      const demoUsername = `demo_${plat}_user`
      const demoDisplayName = `Demo ${meta.displayName} User`
      const demoPlatformUserId = `demo_${plat}_${Date.now()}`
      const demoAccessToken = `demo-${plat}-token-${Math.random().toString(36).slice(2, 12)}`

      const account = await db.socialAccount.upsert({
        where: {
          userId_platform: { userId: DEMO_USER_ID, platform: plat },
        },
        update: {
          platformUserId: demoPlatformUserId,
          platformUsername: demoUsername,
          accessToken: demoAccessToken,
          refreshToken: null,
          expiresAt: null,
          isConnected: true,
          isDemo: true,
          lastUsedAt: null,
        },
        create: {
          userId: DEMO_USER_ID,
          platform: plat,
          platformUserId: demoPlatformUserId,
          platformUsername: demoUsername,
          accessToken: demoAccessToken,
          isDemo: true,
          isConnected: true,
        },
      })

      return NextResponse.json({
        mode: 'demo',
        platform: plat,
        message: `${meta.displayName} connected in demo mode. Publishes will be simulated.`,
        account: {
          id: account.id,
          platform: account.platform,
          platformUsername: account.platformUsername,
          displayName: demoDisplayName,
          isDemo: account.isDemo,
          isConnected: account.isConnected,
          createdAt: account.createdAt,
        },
      })
    }

    // ─── Real Mode ──────────────────────────────────────────────
    // Generate a state token to prevent CSRF, store it briefly in DB,
    // then redirect to the platform's OAuth authorize URL.
    const state = `${plat}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
    await db.appSetting.upsert({
      where: { key: `oauth_state_${state}` },
      update: { value: plat },
      create: { key: `oauth_state_${state}`, value: plat },
    })

    let authUrl: string
    switch (plat) {
      case 'facebook':
        authUrl = buildFacebookOAuthUrl(redirectUri, state)
        break
      case 'instagram':
        authUrl = buildInstagramOAuthUrl(redirectUri, state)
        break
      case 'tiktok':
        authUrl = buildTikTokOAuthUrl(redirectUri, state)
        break
      case 'twitter': {
        // Twitter uses PKCE — generate verifier + challenge
        // For simplicity, store the verifier in AppSetting keyed by state
        // so the callback handler can use it.
        const verifier = `${plat}_verifier_${Date.now()}_${Math.random().toString(36).slice(2, 50)}`
        // Compute S256 code_challenge = base64url(sha256(verifier))
        const { createHash } = await import('crypto')
        const challenge = createHash('sha256').update(verifier).digest('base64url')
        await db.appSetting.upsert({
          where: { key: `pkce_${state}` },
          update: { value: verifier },
          create: { key: `pkce_${state}`, value: verifier },
        })
        authUrl = buildTwitterOAuthUrl(redirectUri, state, challenge)
        break
      }
      default:
        throw ApiError.badRequest(`Unsupported platform: ${plat}`)
    }

    return NextResponse.json({
      mode: 'oauth',
      platform: plat,
      authUrl,
      state,
      redirectUri,
    })
  } catch (error) {
    return handleError(error)
  }
}
