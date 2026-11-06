import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, hermesConnectionSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

export async function GET() {
  try {
    const connection = await db.hermesConnection.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!connection) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        connection: null,
      })
    }

    return NextResponse.json({
      connected: connection.status === 'connected',
      status: connection.status,
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
        model: connection.model,
        isActive: connection.isActive,
        lastConnected: connection.lastConnected
          ? connection.lastConnected.toISOString()
          : null,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { endpoint, apiKey, model, name } = await validateBody(request, hermesConnectionSchema)

    // Test connection by trying to create a simple AI request
    let isConnected = false
    let latency = 0

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const startTime = Date.now()
      const zai = await ZAI.create()
      await zai.chat.completions.create({
        messages: [
          { role: 'user', content: 'ping' },
        ],
        thinking: { type: 'disabled' },
      })
      latency = Date.now() - startTime
      isConnected = true
    } catch {
      isConnected = false
    }

    // Deactivate existing connections
    await db.hermesConnection.updateMany({
      where: { isActive: true },
      data: { isActive: false, status: 'disconnected' },
    })

    // Save or update connection
    const connection = await db.hermesConnection.create({
      data: {
        name: name || 'Hermes Connection',
        endpoint,
        apiKey: apiKey || null,
        model: model || 'hermes-3',
        isActive: isConnected,
        status: isConnected ? 'connected' : 'disconnected',
        lastConnected: isConnected ? new Date() : null,
      },
    })

    return NextResponse.json({
      connected: isConnected,
      latency,
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
        model: connection.model,
        isActive: connection.isActive,
        status: connection.status,
        lastConnected: connection.lastConnected
          ? connection.lastConnected.toISOString()
          : null,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
