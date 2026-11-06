'use client'

/**
 * useKeyboardShortcuts
 * --------------------
 * Listens for keyboard shortcuts on `document` and dispatches to the provided
 * callback map. Supports:
 *   - Single-key shortcuts (`/`, `?`, `c`, `Escape`)
 *   - Two-key `g`-prefixed combos (`g` then `d` → Dashboard, etc.)
 *
 * Sequence combos (`g` + key) have a 700ms window between key presses.
 *
 * Shortcuts are ignored when the user is typing in an input/textarea/select
 * or contentEditable element — with the exception of `Escape` which always
 * fires (so users can blur/close overlays from inside a field).
 *
 * Modifier chords (Ctrl/Cmd/Alt) are ignored entirely so native browser
 * shortcuts (Cmd+K, Cmd+R, etc.) are never hijacked.
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     goDashboard: () => navigate('dashboard'),
 *     focusSearch: () => inputRef.current?.focus(),
 *     showHelp:    () => setHelpOpen(true),
 *   })
 *
 * NOTE: This hook is currently wired up inside <AppSidebar />. It can also be
 * called from `src/app/page.tsx` if additional app-level shortcuts are needed
 * — but doing so would require modifying page.tsx (intentionally left as a
 * follow-up per P1-f task scope).
 */

import { useEffect, useRef } from 'react'

export interface KeyboardShortcutCallbacks {
  /** `g` then `d` → Go to Dashboard */
  goDashboard?: () => void
  /** `g` then `p` → Go to Products */
  goProducts?: () => void
  /** `g` then `l` → Go to Affiliate Links */
  goLinks?: () => void
  /** `g` then `a` → Go to Analytics */
  goAnalytics?: () => void
  /** `g` then `e` → Go to Earnings */
  goEarnings?: () => void
  /** `g` then `c` → Go to AI Content */
  goContent?: () => void
  /** `g` then `t` → Go to Trend Spy */
  goTrends?: () => void
  /** `g` then `h` → Go to HERMES AI Hub */
  goHermes?: () => void
  /** `c` (single key) → Create Link */
  createLink?: () => void
  /** `/` → Focus sidebar search input */
  focusSearch?: () => void
  /** `?` (Shift+/) → Show shortcut help overlay */
  showHelp?: () => void
  /** `Escape` → Close any open overlay / clear search */
  escape?: () => void
}

const G_COMBO_WINDOW_MS = 700

const G_COMBO_MAP: Record<string, keyof KeyboardShortcutCallbacks> = {
  d: 'goDashboard',
  p: 'goProducts',
  l: 'goLinks',
  a: 'goAnalytics',
  e: 'goEarnings',
  c: 'goContent',
  t: 'goTrends',
  h: 'goHermes',
}

function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  // Radix select / dialog inputs sometimes use role="textbox"
  if (target.getAttribute('role') === 'textbox') return true
  return false
}

export function useKeyboardShortcuts(callbacks: KeyboardShortcutCallbacks) {
  // Keep the latest callbacks in a ref so we don't re-attach the document
  // listener on every render (callbacks are usually inline closures). The ref
  // is updated inside an effect — not during render — so we stay within
  // React's rules of Hooks (no ref writes during render).
  const cbRef = useRef<KeyboardShortcutCallbacks>(callbacks)
  useEffect(() => {
    cbRef.current = callbacks
  }, [callbacks])

  // Track the previous key + timestamp for `g`-prefixed combos.
  const lastKeyRef = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Never hijack modifier chords (browser/OS shortcuts).
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key.toLowerCase()

      // Escape works everywhere — even inside text fields — so users can blur
      // the search input or close the help dialog from anywhere.
      if (key === 'escape') {
        cbRef.current.escape?.()
        lastKeyRef.current = null
        return
      }

      // Inside a text input: only Escape (handled above) is allowed. The `/`
      // shortcut specifically must NOT fire inside an input because the user
      // might be typing a query that contains a slash.
      if (isTextTarget(e.target)) {
        return
      }

      // `/` → focus sidebar search
      if (key === '/') {
        e.preventDefault()
        cbRef.current.focusSearch?.()
        lastKeyRef.current = null
        return
      }

      // `?` (Shift+/) → show shortcut help overlay
      if (key === '?') {
        e.preventDefault()
        cbRef.current.showHelp?.()
        lastKeyRef.current = null
        return
      }

      // `c` (single key) → create link
      // Note: this only fires when NOT in a `g`-combo context (handled below).
      if (key === 'c' && !lastKeyRef.current) {
        e.preventDefault()
        cbRef.current.createLink?.()
        lastKeyRef.current = null
        return
      }

      // Two-key combos: `g` then [d|p|l|a|e|c|t|h]
      const now = Date.now()
      const last = lastKeyRef.current
      if (last && last.key === 'g' && now - last.at < G_COMBO_WINDOW_MS) {
        const action = G_COMBO_MAP[key]
        if (action) {
          e.preventDefault()
          cbRef.current[action]?.()
          lastKeyRef.current = null
          return
        }
        // Unknown second key after `g` — fall through and reset.
      }

      // Track `g` as the start of a potential combo.
      if (key === 'g') {
        lastKeyRef.current = { key: 'g', at: now }
        return
      }

      // Any other key resets the combo tracker.
      lastKeyRef.current = null
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
