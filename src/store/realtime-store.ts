/**
 * Realtime Store — shared state for WebSocket connection & incoming notifications.
 *
 * The hook `useRealtime` populates this store, and any UI component (header,
 * notifications page, etc.) can subscribe without prop drilling.
 */

import { create } from 'zustand'

export type RealtimeEvent =
  | 'conversion'
  | 'click'
  | 'commission_xtra'
  | 'hermes_insight'
  | 'notification'

export interface RealtimeNotification {
  id: string
  event: RealtimeEvent
  title: string
  description?: string
  data?: unknown
  ts: number
  read?: boolean
}

interface RealtimeState {
  /** True when socket is open and the user has joined their room. */
  isConnected: boolean
  /** True while socket is attempting to (re)connect. */
  isReconnecting: boolean
  /** Number of reconnection attempts. */
  reconnectAttempts: number
  /** Last error received from socket. */
  lastError: string | null
  /** Recently received notifications (max 50, newest first). */
  notifications: RealtimeNotification[]
  /** Total unread count. */
  unreadCount: number

  setConnected: (connected: boolean) => void
  setReconnecting: (reconnecting: boolean) => void
  setReconnectAttempts: (n: number) => void
  setLastError: (err: string | null) => void
  pushNotification: (n: Omit<RealtimeNotification, 'id' | 'ts' | 'read'>) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clear: () => void
}

let idCounter = 0
const nextId = () => `rt-${Date.now()}-${idCounter++}`

const MAX_NOTIFICATIONS = 50

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  lastError: null,
  notifications: [],
  unreadCount: 0,

  setConnected: (connected) =>
    set({ isConnected: connected, isReconnecting: false, lastError: null }),

  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

  setReconnectAttempts: (n) => set({ reconnectAttempts: n }),

  setLastError: (err) => set({ lastError: err }),

  pushNotification: (n) =>
    set((s) => {
      const full: RealtimeNotification = {
        ...n,
        id: nextId(),
        ts: Date.now(),
        read: false,
      }
      const notifications = [full, ...s.notifications].slice(0, MAX_NOTIFICATIONS)
      return {
        notifications,
        unreadCount: notifications.filter((x) => !x.read).length,
      }
    }),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      return {
        notifications,
        unreadCount: notifications.filter((x) => !x.read).length,
      }
    }),

  clear: () => set({ notifications: [], unreadCount: 0 }),
}))
