/**
 * Twitter / X API v2 Integration
 *
 * Posts text tweets (with optional image) via the Twitter API v2
 * `POST /2/tweets` endpoint.
 *
 * Required setup:
 *   1. Create a Twitter App at https://developer.twitter.com/
 *   2. Enable OAuth 2.0 with PKCE (confidential client)
 *   3. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET
 *   4. Required scopes: tweet.read, tweet.write, users.read, offline.access
 *
 * For image tweets, the user must first upload media to v1.1 media/upload
 * (then attach media_ids in v2 tweet create). Media upload requires
 * OAuth 1.0a user context — out of scope for this dev/demo build.
 * Currently only text tweets are supported in real mode.
 *
 * Docs:
 *   - https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 *   - https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 *
 * Demo Mode: Simulates a successful tweet after a short delay.
 */

import type { SocialAccount } from '@prisma/client'
import {
  type PlatformPublishResult,
  type PublishPayload,
  composeCaption,
  generateDemoPostId,
  isDemoAccount,
  sleep,
} from './types'

const TWITTER_API_BASE = 'https://api.twitter.com/2'
const TWITTER_OAUTH_BASE = 'https://twitter.com/i/oauth2'

/** Twitter's 280-char limit (extended for premium, but free tier is 280). */
const TWITTER_CHAR_LIMIT = 280

/**
 * Truncate a caption to fit Twitter's character limit. If a link is present,
 * Twitter auto-shortens it to ~23 chars — so we reserve space for it.
 */
function truncateForTwitter(text: string, link?: string | null): string {
  const linkReserve = link ? 25 : 0 // 23 chars + 2 spaces
  const maxText = TWITTER_CHAR_LIMIT - linkReserve
  if (text.length <= maxText) return text
  return text.slice(0, maxText - 1) + '…'
}

export async function publishToTwitter(
  account: SocialAccount,
  payload: PublishPayload,
): Promise<PlatformPublishResult> {
  const demo = isDemoAccount(account)
  const composedCaption = composeCaption(payload.caption, payload.hashtags)
  const link = payload.affiliateLink || payload.productUrl || null
  const tweetText = truncateForTwitter(composedCaption, link)

  // ─── Demo mode ────────────────────────────────────────────────
  if (demo) {
    await sleep(900 + Math.random() * 600)
    const postId = generateDemoPostId('twitter')
    return {
      platform: 'twitter',
      success: true,
      demo: true,
      platformPostId: postId,
      platformUrl: `https://twitter.com/${account.platformUsername || 'i'}/status/${postId.slice(-19)}`,
      publishedAt: new Date().toISOString(),
    }
  }

  // ─── Real API mode ────────────────────────────────────────────
  try {
    const body: { text: string } = { text: link ? `${tweetText}\n${link}` : tweetText }
    const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as {
      data?: { id: string; text: string }
      error?: string
      detail?: string
      title?: string
    }

    if (!res.ok || !json.data?.id) {
      const msg = json.title || json.detail || json.error || `Twitter API ${res.status}`
      throw new Error(msg)
    }

    const username = account.platformUsername || 'i'
    return {
      platform: 'twitter',
      success: true,
      demo: false,
      platformPostId: json.data.id,
      platformUrl: `https://twitter.com/${username}/status/${json.data.id}`,
      publishedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      platform: 'twitter',
      success: false,
      demo: false,
      error: err instanceof Error ? err.message : 'Unknown Twitter API error',
      publishedAt: new Date().toISOString(),
    }
  }
}

/**
 * Build the Twitter OAuth 2.0 with PKCE authorize URL.
 *
 * PKCE: caller generates a random `code_verifier`, computes its SHA-256
 * hash as `code_challenge` (base64url encoded), and includes both
 * `code_challenge` and `code_challenge_method=S256` in the authorize URL.
 * The verifier is then sent in the token exchange request.
 */
export function buildTwitterOAuthUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string,
): string {
  const clientId = process.env.TWITTER_CLIENT_ID
  if (!clientId) {
    throw new Error('TWITTER_CLIENT_ID is not configured')
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'tweet.read tweet.write users.read offline.access',
  })
  return `${TWITTER_OAUTH_BASE}/authorize?${params.toString()}`
}

/**
 * Exchange the Twitter OAuth code for an access token.
 * PKCE requires sending the original `code_verifier`.
 */
export async function exchangeTwitterCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ accessToken: string; userId: string; username?: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET not configured')
  }

  // Exchange code → token (Basic auth with client_id:client_secret)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'Failed to exchange Twitter code')
  }
  const accessToken = tokenJson.access_token

  // Get the user info (id + username)
  const meRes = await fetch(`${TWITTER_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const meJson = (await meRes.json()) as {
    data?: { id: string; name: string; username: string }
  }
  return {
    accessToken,
    userId: meJson.data?.id || '',
    username: meJson.data?.username,
    refreshToken: tokenJson.refresh_token,
    expiresIn: tokenJson.expires_in,
  }
}
