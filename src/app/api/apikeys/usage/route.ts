import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import type {
  ApiKeyUsagePoint,
  EndpointUsageRow,
  KeyUsageRow,
  UsageAnalytics,
  UsageAnalyticsResponse,
} from '@/lib/apikeys/types'

/**
 * GET /api/apikeys/usage
 *
 * Returns aggregated API usage analytics for the authenticated user
 * from the ApiKeyUsage table in the database.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as const },
        { status: 401 },
      )
    }

    // Get all API keys for this user
    const apiKeys = await db.apiKey.findMany({
      where: { userId },
      include: {
        usageLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (apiKeys.length === 0) {
      const emptyAnalytics: UsageAnalytics = {
        timeseries: [],
        byEndpoint: [],
        byKey: [],
        totalCalls: 0,
        totalErrors: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        errorTrend: [],
        latencyDistribution: [],
      }
      const body: UsageAnalyticsResponse = { analytics: emptyAnalytics, source: 'db' }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    // Collect all usage logs
    const allLogs = apiKeys.flatMap((k) => k.usageLogs)

    // Build 30-day timeseries
    const timeseriesMap: Record<string, { calls: number; errors: number; latencySum: number; latencyCount: number }> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const label = d.toISOString().slice(0, 10)
      timeseriesMap[label] = { calls: 0, errors: 0, latencySum: 0, latencyCount: 0 }
    }

    for (const log of allLogs) {
      const dayLabel = log.createdAt.toISOString().slice(0, 10)
      if (timeseriesMap[dayLabel]) {
        timeseriesMap[dayLabel].calls++
        if (log.statusCode >= 400) {
          timeseriesMap[dayLabel].errors++
        }
        timeseriesMap[dayLabel].latencySum += log.latencyMs
        timeseriesMap[dayLabel].latencyCount++
      }
    }

    const timeseries: ApiKeyUsagePoint[] = Object.entries(timeseriesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        errors: data.errors,
        avgLatencyMs: data.latencyCount > 0 ? Math.round(data.latencySum / data.latencyCount) : 0,
      }))

    // Per-endpoint breakdown
    const endpointMap: Record<string, { calls: number; errors: number; latencySum: number; method: string }> = {}
    for (const log of allLogs) {
      const ep = log.endpoint
      if (!endpointMap[ep]) {
        endpointMap[ep] = { calls: 0, errors: 0, latencySum: 0, method: log.method }
      }
      endpointMap[ep].calls++
      if (log.statusCode >= 400) endpointMap[ep].errors++
      endpointMap[ep].latencySum += log.latencyMs
    }

    const byEndpoint: EndpointUsageRow[] = Object.entries(endpointMap)
      .map(([endpoint, data]) => ({
        endpoint,
        method: data.method as EndpointUsageRow['method'],
        calls: data.calls,
        errors: data.errors,
        avgLatencyMs: data.calls > 0 ? Math.round(data.latencySum / data.calls) : 0,
      }))
      .sort((a, b) => b.calls - a.calls)

    // Per-key breakdown
    const byKey: KeyUsageRow[] = apiKeys.map((k) => {
      const logs = k.usageLogs
      const calls = logs.length
      const errors = logs.filter((l) => l.statusCode >= 400).length
      const avgLatency = calls > 0
        ? Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / calls)
        : 0
      return {
        keyId: k.id,
        keyName: k.name,
        calls,
        errors,
        errorRate: calls > 0 ? errors / calls : 0,
        avgLatencyMs: avgLatency,
      }
    })

    // Aggregates
    const totalCalls = allLogs.length
    const totalErrors = allLogs.filter((l) => l.statusCode >= 400).length
    const avgLatencyMs = totalCalls > 0
      ? Math.round(allLogs.reduce((s, l) => s + l.latencyMs, 0) / totalCalls)
      : 0

    // Error trend (daily)
    const errorTrend = timeseries.map((p) => ({
      date: p.date,
      errorRate: p.calls > 0 ? p.errors / p.calls : 0,
    }))

    // Latency distribution
    const latencyBuckets = {
      '<50ms': 0,
      '50-100ms': 0,
      '100-200ms': 0,
      '200-500ms': 0,
      '500ms-1s': 0,
      '>1s': 0,
    }
    for (const log of allLogs) {
      if (log.latencyMs < 50) latencyBuckets['<50ms']++
      else if (log.latencyMs < 100) latencyBuckets['50-100ms']++
      else if (log.latencyMs < 200) latencyBuckets['100-200ms']++
      else if (log.latencyMs < 500) latencyBuckets['200-500ms']++
      else if (log.latencyMs < 1000) latencyBuckets['500ms-1s']++
      else latencyBuckets['>1s']++
    }

    const latencyDistribution = Object.entries(latencyBuckets).map(([bucket, calls]) => ({
      bucket,
      calls,
    }))

    const analytics: UsageAnalytics = {
      timeseries,
      byEndpoint,
      byKey,
      totalCalls,
      totalErrors,
      errorRate: totalCalls > 0 ? totalErrors / totalCalls : 0,
      avgLatencyMs,
      errorTrend,
      latencyDistribution,
    }

    const body: UsageAnalyticsResponse = { analytics, source: 'db' }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys/usage] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch usage analytics.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}
