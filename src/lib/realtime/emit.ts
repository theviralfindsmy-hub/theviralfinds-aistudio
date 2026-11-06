/**
 * Server-side helper to emit events to the notification mini-service.
 *
 * Used by Next.js API routes (e.g. Shopee webhook handler) to push real-time
 * notifications to connected clients. Falls back gracefully if the service
 * is unavailable (logs a warning, never throws).
 *
 * IMPORTANT: This is a server-only module. Do not import from client code.
 *
 * Architecture note:
 *   The notification mini-service runs TWO ports:
 *     - Port 3003: Socket.io server (path: '/' — required by Caddy gateway)
 *     - Port 3004: Internal control API (POST /emit, GET /health, GET /stats)
 *   We POST to port 3004 because Socket.io with `path: '/'` intercepts all
 *   HTTP requests on port 3003 (engine.io attaches its own request listener
 *   that matches `path === req.url.slice(0, path.length)`).
 */

export type NotificationEvent =
  | 'conversion'
  | 'click'
  | 'commission_xtra'
  | 'hermes_insight'
  | 'notification'

export interface EmitOptions {
  /** Target user ID. The frontend must have called `socket.emit('join', userId)`. */
  userId: string
  /** Event name (one of the predefined NotificationEvent or any custom string). */
  event: NotificationEvent | string
  /** Payload to deliver to the client. */
  data?: unknown
  /** Optional: broadcast to ALL connected clients instead of one user. */
  broadcast?: boolean
  /** Optional: target a custom room (overrides userId). */
  room?: string
  /** Optional: timeout in ms (default 3000). */
  timeoutMs?: number
}

const NOTIFICATION_SERVICE_URL = 'http://localhost:3004/emit'

/**
 * Emit an event to the notification service.
 *
 * Returns `{ ok: true, delivered: 'live' | 'pending' | 'broadcast' }` on success
 * or `{ ok: false, error: string }` on failure. Never throws.
 */
export async function emitNotification({
  userId,
  event,
  data,
  broadcast,
  room,
  timeoutMs = 3000,
}: EmitOptions): Promise<{ ok: boolean; delivered?: string; error?: string }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event, data, broadcast, room }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown error')
      return { ok: false, error: `HTTP ${res.status}: ${text}` }
    }

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean
      delivered?: string
      error?: string
    }

    if (json.success === false) {
      return { ok: false, error: json.error || 'service rejected event' }
    }

    return { ok: true, delivered: json.delivered }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    // Mini-service notification is optional in dev environment; silently store failure without throwing warning
    if (process.env.DEBUG_REALTIME === 'true') {
      console.warn(`[emitNotification] Offline notice "${event}" to user ${userId}: ${msg}`)
    }
    return { ok: false, error: msg }
  }
}

/**
 * Convenience wrappers for typed events.
 */

export function emitConversion(
  userId: string,
  data: {
    productName?: string
    itemId?: string
    orderId?: string
    commission?: number
    amount?: number
  },
) {
  return emitNotification({ userId, event: 'conversion', data })
}

export function emitClick(
  userId: string,
  data: { productName?: string; itemId?: string; referer?: string },
) {
  return emitNotification({ userId, event: 'click', data })
}

export function emitCommissionXtra(
  userId: string,
  data: { message?: string; productName?: string; totalRate?: number },
) {
  return emitNotification({ userId, event: 'commission_xtra', data })
}

export function emitHermesInsight(
  userId: string,
  data: { title: string; description?: string; insight?: string; category?: string },
) {
  return emitNotification({ userId, event: 'hermes_insight', data })
}

export function emitNotificationGeneric(
  userId: string,
  data: { title: string; description?: string; type?: string },
) {
  return emitNotification({ userId, event: 'notification', data })
}
