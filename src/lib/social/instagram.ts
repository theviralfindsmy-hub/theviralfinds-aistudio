/**
 * Instagram Graph API Integration
 *
 * Publishes image posts (with caption) to an Instagram Business account
 * via the Facebook Graph API v18.0.
 *
 * Instagram requires a Business/Creator account linked to a Facebook Page.
 *
 * Required setup:
 *   1. Same as Facebook (FB App + Page access token)
 *   2. Link IG Business account to your Facebook Page
 *   3. The IG user ID is stored in SocialAccount.platformUserId
 *
 * Required permissions: instagram_basic, instagram_content_publish,
 *                       pages_show_list, pages_read_engagement
 *
 * Two-step publishing flow (required by Instagram):
 *   Step 1: POST /{ig-user-id}/media — create a media container
 *   Step 2: POST /{ig-user-id}/media_publish — publish the container
 *
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 *
 * NOTE: Instagram requires an image_url. If no imageUrl is provided in
 * the payload, we fall back to a placeholder image.
 *
 * Demo Mode: Same as Facebook — simulates a successful post.
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

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

// Fallback image (a Shopee logo placeholder) — used when no imageUrl is supplied.
// Instagram requires an image; we cannot publish a text-only post.
const FALLBACK_IMAGE = 'https://cf.shopee.com.my/file/sg-11134201-7qvzw-lf6g6w3lx1tvb5'

export async function publishToInstagram(
  account: SocialAccount,
  payload: PublishPayload,
): Promise<PlatformPublishResult> {
  const composedCaption = composeCaption(payload.caption, payload.hashtags)
  const demo = isDemoAccount(account)
  const imageUrl = payload.imageUrl || FALLBACK_IMAGE

  // ─── Demo mode ────────────────────────────────────────────────
  if (demo) {
    await sleep(1800 + Math.random() * 1200)
    const postId = generateDemoPostId('instagram')
    return {
      platform: 'instagram',
      success: true,
      demo: true,
      platformPostId: postId,
      platformUrl: `https://www.instagram.com/p/${postId.slice(-11)}/`,
      publishedAt: new Date().toISOString(),
    }
  }

  // ─── Real API mode ────────────────────────────────────────────
  try {
    const igUserId = account.platformUserId
    const token = account.accessToken

    // Step 1: Create media container
    const createRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: composedCaption,
        access_token: token,
      }),
    })
    const createJson = (await createRes.json()) as {
      id?: string
      error?: { message: string }
    }
    if (!createRes.ok || !createJson.id) {
      throw new Error(createJson.error?.message || `Instagram create media failed (${createRes.status})`)
    }
    const containerId = createJson.id

    // Step 2: Publish the media container
    const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: token,
      }),
    })
    const publishJson = (await publishRes.json()) as {
      id?: string
      error?: { message: string }
    }
    if (!publishRes.ok || !publishJson.id) {
      throw new Error(publishJson.error?.message || `Instagram publish failed (${publishRes.status})`)
    }

    return {
      platform: 'instagram',
      success: true,
      demo: false,
      platformPostId: publishJson.id,
      platformUrl: `https://www.instagram.com/p/${publishJson.id}`,
      publishedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      platform: 'instagram',
      success: false,
      demo: false,
      error: err instanceof Error ? err.message : 'Unknown Instagram API error',
      publishedAt: new Date().toISOString(),
    }
  }
}

/**
 * Build the Instagram OAuth URL — uses the same FB OAuth flow with IG scopes.
 */
export function buildInstagramOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID
  if (!appId) {
    throw new Error('INSTAGRAM_APP_ID (or FACEBOOK_APP_ID) is not configured')
  }
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    response_type: 'code',
  })
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

/**
 * Exchange OAuth code for IG user ID + access token.
 *
 * Returns the IG Business account ID (not the FB Page ID) and a
 * long-lived access token.
 */
export async function exchangeInstagramCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; igUserId: string; igUsername?: string }> {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('INSTAGRAM_APP_ID / FACEBOOK_APP_SECRET not configured')
  }

  // Step 1: Exchange code → user access token
  const tokenRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  }).toString()}`)
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: { message: string } }
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error?.message || 'Failed to get IG access token')
  }
  const userToken = tokenJson.access_token

  // Step 2: Get user's Pages
  const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?${new URLSearchParams({
    access_token: userToken,
    fields: 'id,access_token,instagram_business_account',
  }).toString()}`)
  const pagesJson = (await pagesRes.json()) as {
    data?: Array<{
      id: string
      access_token: string
      instagram_business_account?: { id: string }
    }>
  }
  if (!pagesJson.data || pagesJson.data.length === 0) {
    throw new Error('No Facebook Pages found. Create a Page and link an IG Business account first.')
  }
  const page = pagesJson.data[0]
  if (!page.instagram_business_account) {
    throw new Error('No Instagram Business account linked to your Facebook Page.')
  }

  // Step 3: Get IG username (optional)
  const igRes = await fetch(`${GRAPH_API_BASE}/${page.instagram_business_account.id}?${new URLSearchParams({
    access_token: page.access_token,
    fields: 'id,username',
  }).toString()}`)
  const igJson = (await igRes.json()) as { id?: string; username?: string }

  return {
    accessToken: page.access_token,
    igUserId: page.instagram_business_account.id,
    igUsername: igJson.username,
  }
}
