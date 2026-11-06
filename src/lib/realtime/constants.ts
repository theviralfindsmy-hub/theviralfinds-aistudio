/**
 * Shared constants for the realtime notification system.
 *
 * NOTE: TheViralFindsMY does not yet have user authentication (Fasa 1.1).
 * Until auth lands, we use a stable "demo-user" ID so the frontend and
 * webhook route to the same Socket.io room. Once NextAuth is wired up,
 * replace DEMO_USER_ID with the actual session user id.
 *
 * Server-side code (Next.js API routes) uses `DEMO_USER_ID` as a fallback
 * when an AffiliateLink has no associated user.
 */

export const DEMO_USER_ID = 'demo-user'

/**
 * The ports the notification mini-service listens on.
 * Hardcoded — do NOT change to env variables (Caddy gateway depends on them).
 *
 * - SOCKET_PORT (3003): Socket.io server (frontend connects via io('/?XTransformPort=3003'))
 * - CONTROL_PORT (3004): Internal HTTP control API (POST /emit, GET /health, GET /stats)
 *
 * Two ports are needed because Socket.io with `path: '/'` intercepts ALL HTTP
 * requests on its port. The control API runs separately so internal services
 * (Next.js API routes) can POST events without colliding with Socket.io.
 */
export const NOTIFICATION_SERVICE_PORT = 3003
export const NOTIFICATION_CONTROL_PORT = 3004
