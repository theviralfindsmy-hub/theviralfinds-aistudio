/**
 * TikTok Integration — "Share Draft" Approach
 *
 * TikTok's direct video upload API requires:
 *   - Approved TikTok Developer application
 *   - Video file upload (we don't have video files for text posts)
 *   - Content Posting API access (early access program)
 *
 * Pragmatic approach: generate a pre-filled TikTok share URL with the
 * caption + affiliate link. The user taps "Open TikTok" to complete
 * the post manually. This is the same approach used by Buffer, Hootsuite,
 * and other tools without TikTok Content Posting API access.
 *
 * Demo Mode: Returns a fake TikTok post URL after a short delay.
 *
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
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

export async function publishToTikTok(
  account: SocialAccount,
  payload: PublishPayload,
): Promise<PlatformPublishResult> {
  const composedCaption = composeCaption(payload.caption, payload.hashtags)
  const demo = isDemoAccount(account)

  // ─── Demo mode ────────────────────────────────────────────────
  if (demo) {
    await sleep(1200 + Math.random() * 800)
    const postId = generateDemoPostId('tiktok')
    return {
      platform: 'tiktok',
      success: true,
      demo: true,
      platformPostId: postId,
      platformUrl: 'https://www.tiktok.com/upload',
      publishedAt: new Date().toISOString(),
    }
  }

  // ─── Real "share draft" mode ──────────────────────────────────
  // For TikTok, "publishing" actually means generating a pre-filled
  // share URL the user opens manually. We don't POST to TikTok's API
  // directly (requires video file upload).
  try {
    const shareText = `${composedCaption}\n\n${payload.affiliateLink || payload.productUrl || ''}`.trim()
    // TikTok's "share to TikTok" intent URL — opens the TikTok app or web
    // uploader with the caption pre-filled (when supported by device).
    const shareUrl = `https://www.tiktok.com/upload?text=${encodeURIComponent(shareText.slice(0, 500))}`

    // Persist the share URL as the "platform post ID" so the UI can offer
    // an "Open in TikTok" button.
    return {
      platform: 'tiktok',
      success: true,
      demo: false,
      platformPostId: `share_${Date.now()}`,
      platformUrl: shareUrl,
      publishedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      platform: 'tiktok',
      success: false,
      demo: false,
      error: err instanceof Error ? err.message : 'Unknown TikTok share error',
      publishedAt: new Date().toISOString(),
    }
  }
}

/**
 * Build the TikTok Login Kit OAuth URL.
 * TikTok uses OAuth 2.0 with the standard authorize flow.
 *
 * Scopes: user.info.basic, video.publish (for Content Posting API)
 */
export function buildTikTokOAuthUrl(redirectUri: string, state: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    throw new Error('TIKTOK_CLIENT_KEY is not configured')
  }
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    state,
    scope: 'user.info.basic,video.publish',
    response_type: 'code',
  })
  return `https://www.tiktok.com/auth/authorize?${params.toString()}`
}

/**
 * Exchange TikTok OAuth code for an access token.
 */
export async function exchangeTikTokCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; openId: string; displayName?: string }> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    throw new Error('TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET not configured')
  }

  const res = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const json = (await res.json()) as {
    data?: { access_token?: string; open_id?: string; display_name?: string }
    error?: { message?: string }
  }
  if (!res.ok || !json.data?.access_token) {
    throw new Error(json.error?.message || 'Failed to exchange TikTok code')
  }
  return {
    accessToken: json.data.access_token,
    openId: json.data.open_id || '',
    displayName: json.data.display_name,
  }
}
