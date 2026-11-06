/**
 * Facebook Graph API Integration
 *
 * Publishes text, image, and link posts to a Facebook Page using the
 * Graph API v18.0.
 *
 * Required setup:
 *   1. Create a Facebook App at https://developers.facebook.com/
 *   2. Add "Facebook Login" + "Pages" permissions
 *   3. Get FB App ID + Secret, set as FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
 *   4. OAuth flow returns a user access token; exchange for long-lived
 *      Page access token (stored in SocialAccount.accessToken).
 *
 * Required permissions: pages_manage_posts, pages_read_engagement,
 *                       publish_to_groups (optional)
 *
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/feed
 *
 * Demo Mode: When FACEBOOK_APP_ID is not set, OR the connected account is
 * flagged as demo, the publish() call simulates a successful post after a
 * short delay and returns a fake post ID.
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

/**
 * Publish a post to the connected Facebook Page.
 *
 * The SocialAccount's `platformUserId` is the Page ID, and `accessToken`
 * is the Page access token (long-lived).
 *
 * Three post types based on payload:
 *   - imageUrl present → POST /{page-id}/photos (single photo post)
 *   - affiliateLink/productUrl present → POST /{page-id}/feed with link
 *   - text only → POST /{page-id}/feed with message only
 */
export async function publishToFacebook(
  account: SocialAccount,
  payload: PublishPayload,
): Promise<PlatformPublishResult> {
  const composedCaption = composeCaption(payload.caption, payload.hashtags)
  const demo = isDemoAccount(account)

  // ─── Demo mode ────────────────────────────────────────────────
  if (demo) {
    await sleep(1500 + Math.random() * 1000)
    const postId = generateDemoPostId('facebook')
    return {
      platform: 'facebook',
      success: true,
      demo: true,
      platformPostId: postId,
      platformUrl: `https://www.facebook.com/${account.platformUserId}/posts/${postId}`,
      publishedAt: new Date().toISOString(),
    }
  }

  // ─── Real API mode ────────────────────────────────────────────
  try {
    const pageId = account.platformUserId
    const token = account.accessToken
    const link = payload.affiliateLink || payload.productUrl

    if (payload.imageUrl) {
      // Photo post — POST /{page-id}/photos
      const res = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: payload.imageUrl,
          message: composedCaption,
          access_token: token,
        }),
      })
      const json = (await res.json()) as { id?: string; error?: { message: string } }
      if (!res.ok || !json.id) {
        throw new Error(json.error?.message || `Facebook API ${res.status}`)
      }
      return {
        platform: 'facebook',
        success: true,
        demo: false,
        platformPostId: `${pageId}_${json.id}`,
        platformUrl: `https://www.facebook.com/${json.id}`,
        publishedAt: new Date().toISOString(),
      }
    }

    // Text or link post — POST /{page-id}/feed
    const body: Record<string, string> = {
      message: composedCaption,
      access_token: token,
    }
    if (link) body.link = link

    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await res.json()) as { id?: string; error?: { message: string } }
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message || `Facebook API ${res.status}`)
    }
    return {
      platform: 'facebook',
      success: true,
      demo: false,
      platformPostId: json.id,
      platformUrl: `https://www.facebook.com/${json.id}`,
      publishedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      platform: 'facebook',
      success: false,
      demo: false,
      error: err instanceof Error ? err.message : 'Unknown Facebook API error',
      publishedAt: new Date().toISOString(),
    }
  }
}

/**
 * Build the Facebook OAuth authorize URL.
 * The user must grant pages_show_list, pages_manage_posts, pages_read_engagement.
 */
export function buildFacebookOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.FACEBOOK_APP_ID
  if (!appId) {
    throw new Error('FACEBOOK_APP_ID is not configured')
  }
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,pages_messaging',
    response_type: 'code',
    auth_type: 'rerequest',
  })
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

/**
 * Exchange the OAuth code for a user access token, then exchange for a
 * long-lived Page access token. Returns the page access token + page ID.
 */
export async function exchangeFacebookCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; pageId: string; pageName: string }> {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('FACEBOOK_APP_ID / FACEBOOK_APP_SECRET not configured')
  }

  // Step 1: Exchange code → short-lived user token
  const tokenRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  }).toString()}`)
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string
    error?: { message: string }
  }
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error?.message || 'Failed to get user access token')
  }
  const userToken = tokenJson.access_token

  // Step 2: Exchange for long-lived user token
  const llRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: userToken,
  }).toString()}`)
  const llJson = (await llRes.json()) as { access_token?: string }
  const longLivedUserToken = llJson.access_token || userToken

  // Step 3: List user's Pages and get Page access token for the first one
  const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?${new URLSearchParams({
    access_token: longLivedUserToken,
    fields: 'id,name,access_token',
  }).toString()}`)
  const pagesJson = (await pagesRes.json()) as {
    data?: Array<{ id: string; name: string; access_token: string }>
  }
  if (!pagesJson.data || pagesJson.data.length === 0) {
    throw new Error('No Facebook Pages found. Create a Page first.')
  }
  const page = pagesJson.data[0]
  return {
    accessToken: page.access_token,
    pageId: page.id,
    pageName: page.name,
  }
}
