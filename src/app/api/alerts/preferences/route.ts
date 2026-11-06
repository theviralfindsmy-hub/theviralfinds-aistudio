import { NextRequest, NextResponse } from 'next/server'

import {
  DEFAULT_ALERT_PREFERENCES,
  type AlertChannel,
  type AlertNiche,
  type AlertPreferences,
  type AlertPreferencesResponse,
  type UpdateAlertPreferencesRequest,
} from '@/lib/alerts/types'
import { ALL_NICHES } from '@/lib/alerts/mock-data'

/**
 * In-memory store of the user's alert preferences.
 *
 * In production this would live in the `AlertPreference` Prisma model (one
 * row per user). For Fasa 3.3 we keep it in module scope so the GET/POST
 * round-trips within the same dev server process. Initialised with the
 * sensible defaults from `DEFAULT_ALERT_PREFERENCES`.
 */
let userPreferences: AlertPreferences = { ...DEFAULT_ALERT_PREFERENCES }

/** Validate a partial preferences object. Returns a cleaned partial. */
function validatePreferences(
  input: Partial<AlertPreferences>,
): Partial<AlertPreferences> {
  const out: Partial<AlertPreferences> = {}

  if (Array.isArray(input.enabledNiches)) {
    out.enabledNiches = input.enabledNiches.filter((n): n is AlertNiche =>
      ALL_NICHES.includes(n as AlertNiche),
    )
  }

  if (Array.isArray(input.channels)) {
    out.channels = input.channels.filter((c): c is AlertChannel =>
      ['push', 'email', 'sms'].includes(c as AlertChannel),
    )
  }

  if (typeof input.minCommissionThreshold === 'number') {
    out.minCommissionThreshold = Math.min(
      100,
      Math.max(0, input.minCommissionThreshold),
    )
  }

  if (typeof input.minRelevanceScore === 'number') {
    out.minRelevanceScore = Math.min(
      100,
      Math.max(0, input.minRelevanceScore),
    )
  }

  if (input.quietHours && typeof input.quietHours === 'object') {
    out.quietHours = {
      enabled: Boolean(input.quietHours.enabled),
      start:
        typeof input.quietHours.start === 'string' && /^\d{2}:\d{2}$/.test(input.quietHours.start)
          ? input.quietHours.start
          : DEFAULT_ALERT_PREFERENCES.quietHours.start,
      end:
        typeof input.quietHours.end === 'string' && /^\d{2}:\d{2}$/.test(input.quietHours.end)
          ? input.quietHours.end
          : DEFAULT_ALERT_PREFERENCES.quietHours.end,
    }
  }

  if (typeof input.dailyDigest === 'boolean') {
    out.dailyDigest = input.dailyDigest
  }

  if (typeof input.botEnabled === 'boolean') {
    out.botEnabled = input.botEnabled
  }

  return out
}

/**
 * GET /api/alerts/preferences
 *
 * Returns the user's current alert preferences. If no preferences have been
 * saved yet, returns the defaults.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const body: AlertPreferencesResponse = {
      preferences: userPreferences,
      source: 'mock',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/alerts/preferences] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch alert preferences.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/alerts/preferences
 *
 * Body: { preferences: Partial<AlertPreferences> }
 *
 * Merges the supplied partial preferences into the in-memory store and
 * returns the full updated preferences object.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: UpdateAlertPreferencesRequest
    try {
      body = (await request.json()) as UpdateAlertPreferencesRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { preferences: Partial<AlertPreferences> }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.preferences || typeof body.preferences !== 'object') {
      return NextResponse.json(
        {
          error: 'Field "preferences" is required (object).',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    const cleaned = validatePreferences(body.preferences)
    userPreferences = {
      ...userPreferences,
      ...cleaned,
      quietHours: { ...userPreferences.quietHours, ...(cleaned.quietHours ?? {}) },
    }

    const response: AlertPreferencesResponse = {
      preferences: userPreferences,
      source: 'mock',
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/alerts/preferences] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update alert preferences.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
