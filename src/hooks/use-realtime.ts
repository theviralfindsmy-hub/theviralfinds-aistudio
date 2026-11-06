/**
 * useRealtime — connects to the notification mini-service (port 3003) and
 * forwards socket events into the realtime Zustand store + toast notifications.
 *
 * Usage (mount once near the app root, e.g. in <RealtimeProvider />):
 *
 *   const { isConnected } = useRealtime(userId)
 *
 * The hook is a no-op when `userId` is empty (SSR-safe).
 */

'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useRealtimeStore, type RealtimeEvent } from '@/store/realtime-store'
import { playNotificationSound } from '@/lib/realtime/sound'

export interface ConversionEvent {
  productName?: string
  itemId?: string
  orderId?: string
  commission?: number
  amount?: number
  currency?: string
}

export interface ClickEvent {
  productName?: string
  itemId?: string
  referer?: string
}

export interface CommissionXtraEvent {
  message?: string
  productName?: string
  totalRate?: number
  baseRate?: number
  xtraRate?: number
}

export interface HermesInsightEvent {
  title: string
  description?: string
  insight?: string
  category?: string
}

export interface GenericNotificationEvent {
  title: string
  description?: string
  type?: string
}

function safeFmtRM(n: unknown): string {
  const num = typeof n === 'number' ? n : Number(n)
  if (!isFinite(num)) return '0.00'
  return num.toFixed(2)
}

export function useRealtime(userId?: string) {
  const socketRef = useRef<Socket | null>(null)

  const setConnected = useRealtimeStore((s) => s.setConnected)
  const setReconnecting = useRealtimeStore((s) => s.setReconnecting)
  const setReconnectAttempts = useRealtimeStore((s) => s.setReconnectAttempts)
  const setLastError = useRealtimeStore((s) => s.setLastError)
  const pushNotification = useRealtimeStore((s) => s.pushNotification)

  useEffect(() => {
    if (!userId) return
    // SSR guard
    if (typeof window === 'undefined') return

    // Connect to the notification mini-service via Caddy gateway.
    // CRITICAL: never use a direct URL with port. Always use XTransformPort.
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setReconnectAttempts(0)
      socket.emit('join', userId)
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setReconnecting(true)
      }
    })

    socket.on('connect_error', (err) => {
      setLastError(err.message)
      setReconnecting(true)
    })

    socket.io.on('reconnect_attempt', (attempt) => {
      setReconnecting(true)
      setReconnectAttempts(attempt)
    })

    socket.io.on('reconnect_failed', () => {
      setLastError('Reconnection failed')
      setReconnecting(false)
    })

    // ─── Event handlers ───────────────────────────────────────────────────

    socket.on('conversion', (data: ConversionEvent = {}) => {
      const commission = data.commission ?? data.amount ?? 0
      const productName = data.productName || 'a product'
      pushNotification({
        event: 'conversion',
        title: 'New Conversion! 🎉',
        description: `RM${safeFmtRM(commission)} earned from ${productName}`,
        data,
      })
      playNotificationSound('conversion')
      toast.success('💰 New Conversion!', {
        description: `RM${safeFmtRM(commission)} earned from ${productName}`,
      })
    })

    socket.on('click', (data: ClickEvent = {}) => {
      const productName = data.productName || 'your link'
      pushNotification({
        event: 'click',
        title: 'New Click 👆',
        description: `${productName} link clicked`,
        data,
      })
      playNotificationSound('click')
      toast.info('👆 New Click', {
        description: `${productName} link clicked`,
      })
    })

    socket.on('commission_xtra', (data: CommissionXtraEvent = {}) => {
      const message = data.message || 'Boosted commission product available!'
      pushNotification({
        event: 'commission_xtra',
        title: 'Commission XTRA Alert! 🔥',
        description: message,
        data,
      })
      playNotificationSound('commission_xtra')
      toast.warning('🔥 Commission XTRA Alert!', {
        description: message,
      })
    })

    socket.on('hermes_insight', (data: HermesInsightEvent = { title: '' }) => {
      const title = data.title || 'HERMES Insight'
      const description = data.description || data.insight
      pushNotification({
        event: 'hermes_insight',
        title: `🤖 ${title}`,
        description,
        data,
      })
      playNotificationSound('hermes_insight')
      toast.info('🤖 HERMES Insight', {
        description: title,
      })
    })

    socket.on('notification', (data: GenericNotificationEvent = { title: '' }) => {
      const title = data.title || 'Notification'
      const description = data.description
      pushNotification({
        event: 'notification',
        title,
        description,
        data,
      })
      playNotificationSound('notification')
      toast(title, { description })
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [userId])

  return {
    isConnected: useRealtimeStore((s) => s.isConnected),
  }
}

// Re-export types for convenience
export type { RealtimeEvent }
