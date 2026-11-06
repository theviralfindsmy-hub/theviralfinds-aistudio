/**
 * Post Execution Engine
 *
 * This module is the heart of the Auto-Post publishing flow. It:
 *   1. Queries the DB for due scheduled posts (scheduledAt <= now)
 *   2. For each platform on each post, calls the platform's publish() function
 *   3. Records the result in a PostLog row (per platform, per attempt)
 *   4. Updates the ScheduledPost.status → publishing → published | failed | partial
 *   5. Implements retry logic: failed platforms get retried up to maxAttempts (3)
 *
 * Trigger options:
 *   - Manual: caller hits POST /api/social/execute (public endpoint, cron-friendly)
 *   - Per-post: caller hits POST /api/social/post with a postId (publishes now)
 *   - Frontend polling: AutoPost page calls /api/social/execute every 30s
 *
 * Demo Mode behavior:
 *   - When account is demo OR platform env vars aren't set, publish() returns
 *     success=true, demo=true after a short simulated delay.
 *   - The status transitions look identical to real publishing, so the
 *     schedule → publishing → published flow can be demoed end-to-end.
 */

import { db } from '@/lib/db'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { emitNotificationGeneric } from '@/lib/realtime/emit'
import type { ScheduledPost, SocialAccount } from '@prisma/client'
import { publishToFacebook } from './facebook'
import { publishToInstagram } from './instagram'
import { publishToTikTok } from './tiktok'
import { publishToTwitter } from './twitter'
import type { Platform, PlatformPublishResult, PublishPayload } from './types'

const MAX_ATTEMPTS = 3

/** Map platform id → its publish function. */
const PUBLISHERS: Record<Platform, (account: SocialAccount, payload: PublishPayload) => Promise<PlatformPublishResult>> = {
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  twitter: publishToTwitter,
}

export interface ExecuteOptions {
  /** If set, only execute this one post. Otherwise processes all due posts. */
  postId?: string
  /** When true, retry platforms that have failed but are under MAX_ATTEMPTS. */
  retry?: boolean
  /** Max posts to process in one execution (default 20). */
  limit?: number
}

export interface ExecuteResult {
  processed: number
  published: number
  failed: number
  retried: number
  skipped: number
  results: Array<{ postId: string; caption: string; status: string; platforms: Record<string, PlatformPublishResult & { attempt: number }> }>
}

/**
 * Main entry point. Finds due scheduled posts and publishes them.
 *
 * A post is "due" when:
 *   - status = 'scheduled' AND scheduledAt <= now
 *   - OR status = 'partial' AND retry=true AND scheduledAt <= now
 *   - OR status = 'failed' AND retry=true AND retryCount < MAX_ATTEMPTS AND scheduledAt <= now
 *
 * Note: For simplicity in this demo, we use a single DEMO_USER_ID for the
 * SocialAccount lookup. In production with real auth, you'd pass the user's
 * ID from the session/JWT.
 */
export async function executeScheduledPosts(opts: ExecuteOptions = {}): Promise<ExecuteResult> {
  const { postId, retry = true, limit = 20 } = opts
  const now = new Date()

  // Build the WHERE clause for due posts
  const where: Record<string, unknown> = {}
  if (postId) {
    where.id = postId
  } else {
    where.scheduledAt = { lte: now }
    if (retry) {
      where.status = { in: ['scheduled', 'partial', 'failed'] }
    } else {
      where.status = 'scheduled'
    }
  }

  const posts = await db.scheduledPost.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })

  const result: ExecuteResult = {
    processed: 0,
    published: 0,
    failed: 0,
    retried: 0,
    skipped: 0,
    results: [],
  }

  for (const post of posts) {
    const r = await publishPost(post)
    result.processed++
    if (r.status === 'published') result.published++
    if (r.status === 'failed') result.failed++
    result.results.push({
      postId: post.id,
      caption: post.caption,
      status: r.status,
      platforms: r.platforms,
    })
  }

  return result
}

/**
 * Publish a single scheduled post to all its platforms.
 * Creates / updates PostLog rows per platform.
 */
export async function publishPost(post: ScheduledPost): Promise<{
  status: 'published' | 'failed' | 'partial' | 'scheduled'
  platforms: Record<string, PlatformPublishResult & { attempt: number }>
}> {
  const platforms = JSON.parse(post.platforms) as string[]
  const hashtags = post.hashtags ? (JSON.parse(post.hashtags) as string[]) : []

  const payload: PublishPayload = {
    caption: post.caption,
    imageUrl: post.imageUrl,
    affiliateLink: post.affiliateLink,
    productUrl: post.productUrl,
    hashtags,
  }

  // Mark the post as "publishing" while we work
  await db.scheduledPost.update({
    where: { id: post.id },
    data: { status: 'publishing' },
  })

  // Load the SocialAccount for each platform (for the demo user)
  const accounts = await db.socialAccount.findMany({
    where: {
      userId: DEMO_USER_ID,
      platform: { in: platforms },
      isConnected: true,
    },
  })

  const accountByPlatform = new Map<string, SocialAccount>()
  for (const a of accounts) accountByPlatform.set(a.platform, a)

  const results: Record<string, PlatformPublishResult & { attempt: number }> = {}
  let successCount = 0
  let failureCount = 0
  let hadRetries = false

  for (const platform of platforms) {
    const account = accountByPlatform.get(platform)

    if (!account) {
      // No connected account for this platform — record as a failure that
      // can be retried once a connection is established.
      results[platform] = {
        platform: platform as Platform,
        success: false,
        demo: false,
        error: 'No connected account for this platform. Connect it in Settings.',
        publishedAt: new Date().toISOString(),
        attempt: 0,
      }
      failureCount++
      continue
    }

    // Look for an existing PostLog for this post+platform
    let log = await db.postLog.findFirst({
      where: { scheduledPostId: post.id, platform },
      orderBy: { attempt: 'desc' },
    })

    const nextAttempt = (log?.attempt || 0) + 1

    // If the last attempt succeeded, skip
    if (log?.status === 'published') {
      results[platform] = {
        platform: platform as Platform,
        success: true,
        demo: log.platformPostId?.includes('DEMO') ?? false,
        platformPostId: log.platformPostId || undefined,
        platformUrl: log.platformUrl || undefined,
        publishedAt: log.publishedAt?.toISOString() || new Date().toISOString(),
        attempt: log.attempt,
      }
      successCount++
      continue
    }

    // If max attempts exceeded, skip and mark as failed permanently
    if (nextAttempt > MAX_ATTEMPTS) {
      results[platform] = {
        platform: platform as Platform,
        success: false,
        demo: false,
        error: log?.errorMessage || `Max retries (${MAX_ATTEMPTS}) exceeded`,
        publishedAt: new Date().toISOString(),
        attempt: log?.attempt || MAX_ATTEMPTS,
      }
      failureCount++
      continue
    }

    // Create / update a PostLog row → status = 'publishing'
    if (log) {
      log = await db.postLog.update({
        where: { id: log.id },
        data: { status: 'publishing', attempt: nextAttempt, errorMessage: null },
      })
    } else {
      log = await db.postLog.create({
        data: {
          scheduledPostId: post.id,
          platform,
          status: 'publishing',
          attempt: nextAttempt,
          maxAttempts: MAX_ATTEMPTS,
        },
      })
    }

    // Call the platform publish function
    const publishFn = PUBLISHERS[platform as Platform]
    let publishResult: PlatformPublishResult
    if (!publishFn) {
      publishResult = {
        platform: platform as Platform,
        success: false,
        demo: false,
        error: `Unknown platform: ${platform}`,
        publishedAt: new Date().toISOString(),
      }
    } else {
      try {
        publishResult = await publishFn(account, payload)
      } catch (err) {
        publishResult = {
          platform: platform as Platform,
          success: false,
          demo: false,
          error: err instanceof Error ? err.message : 'Publish threw',
          publishedAt: new Date().toISOString(),
        }
      }
    }

    // Update PostLog with the result
    await db.postLog.update({
      where: { id: log.id },
      data: {
        status: publishResult.success ? 'published' : 'failed',
        platformPostId: publishResult.platformPostId || null,
        platformUrl: publishResult.platformUrl || null,
        errorMessage: publishResult.error || null,
        publishedAt: publishResult.success ? new Date(publishResult.publishedAt) : null,
      },
    })

    // Update lastUsedAt on the SocialAccount
    if (publishResult.success) {
      await db.socialAccount.update({
        where: { id: account.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {}) // non-fatal
    }

    if (publishResult.success) {
      successCount++
    } else {
      failureCount++
      if (nextAttempt < MAX_ATTEMPTS) hadRetries = true
    }

    results[platform] = { ...publishResult, attempt: nextAttempt }
  }

  // Compute overall status & update ScheduledPost
  let status: 'published' | 'failed' | 'partial' = 'failed'
  if (successCount === platforms.length) status = 'published'
  else if (successCount > 0) status = 'partial'
  else status = 'failed'

  // If we did any retries (whether successful or not), bump retryCount
  const newRetryCount = (post.retryCount || 0) + (hadRetries ? 1 : 0)

  const overallError = failureCount > 0
    ? `${failureCount} of ${platforms.length} platforms failed`
    : null

  await db.scheduledPost.update({
    where: { id: post.id },
    data: {
      status,
      publishedAt: status === 'published' ? new Date() : null,
      result: JSON.stringify(results),
      retryCount: newRetryCount,
      errorMessage: overallError,
    },
  })

  // Emit a real-time notification about the publish result
  try {
    await emitNotificationGeneric(DEMO_USER_ID, {
      title: status === 'published'
        ? '✅ Post published successfully!'
        : status === 'partial'
        ? '⚠️ Post partially published'
        : '❌ Post publishing failed',
      description: `"${post.caption.slice(0, 80)}${post.caption.length > 80 ? '…' : ''}" — ${successCount}/${platforms.length} platforms succeeded.`,
      type: status === 'published' ? 'post_published' : 'post_failed',
    })
  } catch {
    // Non-fatal — don't fail the publish if the WS service is down.
  }

  return { status, platforms: results }
}
