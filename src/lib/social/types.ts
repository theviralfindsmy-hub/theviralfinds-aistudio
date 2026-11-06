/**
 * Shared types for the Social Media API integration layer.
 *
 * Each platform module (facebook.ts, instagram.ts, tiktok.ts, twitter.ts)
 * exports a `publish()` function that returns a `PlatformPublishResult`.
 *
 * When platform OAuth credentials are missing (e.g. in dev), the publisher
 * falls back to "demo mode" — the publish call simulates success after a
 * short delay so the entire schedule → publish → status flow can be tested
 * end-to-end without real API access.
 */

import type { SocialAccount } from '@prisma/client'

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'twitter'

export interface PublishPayload {
  /** Post caption / text */
  caption: string
  /** Optional image URL (must be publicly accessible for FB/IG) */
  imageUrl?: string | null
  /** Optional affiliate link to attach */
  affiliateLink?: string | null
  /** Optional product URL */
  productUrl?: string | null
  /** Optional hashtags array (joined into caption by caller or platform) */
  hashtags?: string[] | null
}

export interface PlatformPublishResult {
  platform: Platform
  success: boolean
  /** Demo mode = simulated publish (no real API call made) */
  demo: boolean
  /** Platform-specific post ID returned after publishing */
  platformPostId?: string
  /** Permalink to the published post (when available) */
  platformUrl?: string
  /** Error message when success = false */
  error?: string
  /** Timestamp the publish completed */
  publishedAt: string
}

export interface PlatformPublisher {
  /** Stable platform id */
  platform: Platform
  /** Human-readable name */
  displayName: string
  /** Whether real OAuth credentials are configured in env */
  isConfigured: () => boolean
  /** Whether the account is a demo (simulated) connection */
  isDemoAccount: (account: SocialAccount) => boolean
  /** Publish a post to this platform */
  publish: (account: SocialAccount, payload: PublishPayload) => Promise<PlatformPublishResult>
}

export const SUPPORTED_PLATFORMS: Platform[] = ['facebook', 'instagram', 'tiktok', 'twitter']

export const PLATFORM_META: Record<Platform, {
  displayName: string
  icon: string
  color: string
  characterLimit: number
  requiresImage: boolean
  /** Env vars that must be set to enable real OAuth */
  envVars: string[]
  /** Short description shown in UI */
  description: string
}> = {
  facebook: {
    displayName: 'Facebook',
    icon: 'MessageCircle',
    color: '#1877F2',
    characterLimit: 63206,
    requiresImage: false,
    envVars: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    description: 'Post text, images, and links to your Facebook Page.',
  },
  instagram: {
    displayName: 'Instagram',
    icon: 'Camera',
    color: '#E4405F',
    characterLimit: 2200,
    requiresImage: true,
    envVars: ['INSTAGRAM_APP_ID', 'FACEBOOK_APP_SECRET'],
    description: 'Publish image posts to your Instagram Business account.',
  },
  tiktok: {
    displayName: 'TikTok',
    icon: 'Video',
    color: '#FF0050',
    characterLimit: 2200,
    requiresImage: false,
    envVars: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    description: 'Generate a pre-filled TikTok share link with your caption.',
  },
  twitter: {
    displayName: 'Twitter / X',
    icon: 'Twitter',
    color: '#0F1419',
    characterLimit: 280,
    requiresImage: false,
    envVars: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
    description: 'Post text tweets with optional image via Twitter API v2.',
  },
}

/**
 * Check if a platform has real OAuth credentials configured.
 */
export function isPlatformConfigured(platform: Platform): boolean {
  const meta = PLATFORM_META[platform]
  return meta.envVars.every((v) => {
    const val = process.env[v]
    return val && val.trim().length > 0
  })
}

/**
 * Detect whether a connected account is a demo (simulated) connection.
 * Demo accounts have isDemo=true OR accessToken starts with "demo-".
 */
export function isDemoAccount(account: SocialAccount): boolean {
  return account.isDemo || account.accessToken.startsWith('demo-')
}

/**
 * Build a fully-composed caption by joining hashtags onto the base caption.
 */
export function composeCaption(caption: string, hashtags?: string[] | null): string {
  if (!hashtags || hashtags.length === 0) return caption
  const tagStr = hashtags.join(' ')
  return `${caption}\n\n${tagStr}`
}

/**
 * Simulate async latency for demo-mode publishes.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a fake but stable platform post ID for demo-mode publishes.
 */
export function generateDemoPostId(platform: Platform): string {
  const prefix = platform.slice(0, 2).toUpperCase()
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_DEMO_${Date.now()}_${random}`
}
