import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import type {
  HttpMethod,
  PlaygroundRequest,
  PlaygroundResponse,
} from '@/lib/apikeys/types'
import { API_ENDPOINTS, matchEndpoint } from '@/lib/apikeys/endpoints'
import { maskKey } from '@/lib/apikeys/mock-data'

/**
 * POST /api/apikeys/playground
 *
 * Body: PlaygroundRequest { method, endpoint, params, body, keyId }
 *
 * Mock "send request" handler for the interactive playground tab.
 * Records the request in the ApiKeyUsage table for analytics tracking.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', source: 'db' as const },
        { status: 401 },
      )
    }

    let body: PlaygroundRequest
    try {
      body = (await request.json()) as PlaygroundRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { method, endpoint, params[], body?, keyId? }.',
          source: 'db' as const,
        },
        { status: 400 },
      )
    }

    if (!body.method || !body.endpoint) {
      return NextResponse.json(
        { error: 'Fields "method" and "endpoint" are required.', source: 'db' as const },
        { status: 400 },
      )
    }

    const method = body.method as HttpMethod
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `method must be one of: ${validMethods.join(', ')}.`, source: 'db' as const },
        { status: 400 },
      )
    }

    // Resolve path params
    let resolvedPath = body.endpoint.trim()
    const pathParams = body.params.filter((p) => p.key && p.value !== '')
    for (const pp of pathParams) {
      resolvedPath = resolvedPath.replace(`:${pp.key}`, encodeURIComponent(pp.value))
    }
    resolvedPath = resolvedPath.trim()

    const matched = matchEndpoint(method, resolvedPath)

    // ── Key resolution (for response headers)
    let maskedBearer = 'tvf_••••••••••••'
    if (body.keyId) {
      const key = await db.apiKey.findUnique({ where: { id: body.keyId } })
      if (key) {
        maskedBearer = maskKey(key.key)

        // Record usage in the database
        await db.apiKeyUsage.create({
          data: {
            apiKeyId: key.id,
            endpoint: resolvedPath,
            method,
            statusCode: matched ? 200 : 404,
            latencyMs: matched
              ? (matched.rateLimitCost >= 5 ? 1800 : matched.rateLimitCost >= 3 ? 640 : matched.rateLimitCost >= 2 ? 280 : 120)
              : 12,
          },
        })

        // Update lastUsedAt
        await db.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        })
      }
    }

    // ── No match → 404 with hint list
    if (!matched) {
      const suggestion = API_ENDPOINTS.slice(0, 5).map((e) => `${e.method} ${e.path}`)
      const responseBody: PlaygroundResponse = {
        status: 404,
        statusText: 'Not Found',
        latencyMs: 12,
        body: {
          error: 'ENDPOINT_NOT_FOUND',
          message: `No endpoint matches ${method} ${resolvedPath}.`,
          hint: `Try one of: ${suggestion.join(' | ')}`,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${maskedBearer}`,
        },
        source: 'db',
      }
      return NextResponse.json(responseBody, { status: 200 })
    }

    // ── Simulate latency
    const baseLatency =
      matched.rateLimitCost >= 5
        ? 1800
        : matched.rateLimitCost >= 3
          ? 640
          : matched.rateLimitCost >= 2
            ? 280
            : 120
    const jitter = Math.round(Math.random() * 80)
    const latencyMs = baseLatency + jitter

    // ── Simulate occasional 5xx for AI endpoints
    if (matched.id === 'content-generate' && Math.random() < 0.05) {
      const responseBody: PlaygroundResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        latencyMs,
        body: {
          error: 'AI_UNAVAILABLE',
          message: 'HERMES model temporarily unavailable. Retry with backoff.',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${maskedBearer}`,
          'X-RateLimit-Cost': String(matched.rateLimitCost),
        },
        matchedEndpoint: matched,
        source: 'db',
      }
      return NextResponse.json(responseBody, { status: 200 })
    }

    // ── Success — echo the canned responseExample
    let parsedBody: unknown = undefined
    if (body.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      try {
        parsedBody = JSON.parse(body.body)
      } catch {
        parsedBody = { _raw: body.body }
      }
    }

    const responseBodyData: Record<string, unknown> = {
      ...matched.responseExample,
    }
    if (matched.id === 'links-create' && typeof parsedBody === 'object' && parsedBody) {
      const pb = parsedBody as Record<string, unknown>
      if (typeof pb.productId === 'string') responseBodyData.productId = pb.productId
      if (typeof pb.campaign === 'string') responseBodyData.campaign = pb.campaign
    }
    if (matched.id === 'content-generate' && typeof parsedBody === 'object' && parsedBody) {
      const pb = parsedBody as Record<string, unknown>
      if (typeof pb.productId === 'string') {
        responseBodyData.caption =
          `Best gila ${pb.productId} ni! Confirm grab sebelum sold out 🔥`
        responseBodyData.hashtags = ['#malaysia', '#affiliate', '#fyp']
      }
    }

    const response: PlaygroundResponse = {
      status: 200,
      statusText: 'OK',
      latencyMs,
      body: responseBodyData,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${maskedBearer}`,
        'X-RateLimit-Cost': String(matched.rateLimitCost),
        'X-Endpoint-Id': matched.id,
      },
      matchedEndpoint: matched,
      source: 'db',
    }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[POST /api/apikeys/playground] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to execute playground request.',
        source: 'db' as const,
      },
      { status: 500 },
    )
  }
}
