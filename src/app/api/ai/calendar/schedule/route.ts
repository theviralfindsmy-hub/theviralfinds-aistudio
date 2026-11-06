import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError, parseJsonBody } from '@/lib/api-error'
import {
  type CalendarEntry,
  type ContentCalendar,
  type DayOfWeek,
  type ScheduleCalendarItemResult,
  type ScheduleCalendarRequest,
  type ScheduleCalendarResponse,
  type TimeSlot,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  PLATFORM_LABELS,
} from '@/lib/calendar/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00+08:00')
}

function resolveEntryDateTime(weekStartIso: string, entry: CalendarEntry): Date {
  const weekStart = isoToDate(weekStartIso)
  const dayIndex = DAYS_OF_WEEK.indexOf(entry.day)
  const d = new Date(weekStart)
  d.setDate(weekStart.getDate() + dayIndex)
  d.setHours(entry.hour, entry.minute, 0, 0)
  return d
}

function buildCaption(entry: CalendarEntry, calendar: ContentCalendar): string {
  const tags = entry.hashtags && entry.hashtags.length > 0
    ? entry.hashtags.join(' ')
    : '#ad'
  const platformLabel = PLATFORM_LABELS[entry.platform]
  const seasonalNote = entry.seasonalEventId
    ? `\n\n📅 Themed for ${calendar.seasonalEvents.find((e) => e.id === entry.seasonalEventId)?.name ?? 'seasonal event'}`
    : ''
  return `${entry.product} — ${entry.contentBrief}\n\n🛒 Platform: ${platformLabel}\n\n${tags}${seasonalNote}`
}

/** Find entries from a calendar stored in ContentLibrary by calendarId. */
async function findCalendarEntries(calendarId: string, entryIds: string[]): Promise<{ entries: CalendarEntry[]; calendar: ContentCalendar | null }> {
  try {
    // Search ContentLibrary for the calendar
    const saved = await db.contentLibrary.findFirst({
      where: {
        type: 'live_script',
        content: { contains: calendarId },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (saved) {
      try {
        const calendar = JSON.parse(saved.content) as ContentCalendar
        const entries = entryIds.length === 0
          ? calendar.entries
          : calendar.entries.filter((e: CalendarEntry) => entryIds.includes(e.id))
        return { entries, calendar }
      } catch {
        // Malformed JSON
      }
    }
  } catch (dbErr) {
    console.warn('[calendar/schedule] DB lookup failed:', dbErr)
  }

  return { entries: [], calendar: null }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const body = await parseJsonBody<ScheduleCalendarRequest>(request)
    if (!body.calendarId || !body.weekStartDate) {
      throw ApiError.badRequest('Missing required fields: calendarId, weekStartDate')
    }

    const requestedIds = Array.isArray(body.entryIds) ? body.entryIds : []

    // Look up entries from ContentLibrary (DB)
    const { entries, calendar: sourceCalendar } = await findCalendarEntries(body.calendarId, requestedIds)

    if (entries.length === 0) {
      throw ApiError.notFound(
        `No entries found for calendarId=${body.calendarId}` +
        (requestedIds.length ? ` with entryIds=${requestedIds.join(',')}` : '') +
        '. Generate a calendar first via POST /api/ai/calendar.',
      )
    }

    const defaultCalendar: ContentCalendar = {
      id: body.calendarId,
      weekStartDate: body.weekStartDate,
      weekEndDate: body.weekStartDate,
      label: `Week of ${body.weekStartDate}`,
      entries,
      seasonalEvents: [],
      preferences: { niche: 'mixed', platforms: ['shopee'], postsPerDay: 2, tone: 'casual', seasonalBoost: true },
      source: 'ai',
      generatedAt: new Date().toISOString(),
    }
    const refCalendar = sourceCalendar ?? defaultCalendar

    const results: ScheduleCalendarItemResult[] = []
    let scheduled = 0
    let failed = 0

    for (const entry of entries) {
      try {
        const scheduledAt = resolveEntryDateTime(body.weekStartDate, entry)
        const now = new Date()
        let finalDate = scheduledAt
        if (scheduledAt.getTime() < now.getTime()) {
          finalDate = new Date(now.getTime() + 60 * 60 * 1000)
        }

        const caption = buildCaption(entry, refCalendar)
        const platforms = [entry.platform]
        const post = await db.scheduledPost.create({
          data: {
            caption,
            platforms: JSON.stringify(platforms),
            productUrl: null,
            affiliateLink: null,
            imageUrl: null,
            hashtags: JSON.stringify(entry.hashtags),
            status: 'scheduled',
            scheduledAt: finalDate,
          },
        })

        results.push({
          entryId: entry.id,
          scheduledPostId: post.id,
          scheduledAt: finalDate.toISOString(),
          platform: entry.platform,
          success: true,
        })
        scheduled++
      } catch (err) {
        results.push({
          entryId: entry.id,
          scheduledPostId: null,
          scheduledAt: resolveEntryDateTime(body.weekStartDate, entry).toISOString(),
          platform: entry.platform,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown scheduling error',
        })
        failed++
      }
    }

    const response: ScheduleCalendarResponse = {
      calendarId: body.calendarId,
      scheduled,
      failed,
      results,
      source: 'ai',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
