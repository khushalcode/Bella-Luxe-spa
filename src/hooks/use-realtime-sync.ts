'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Realtime sync hook.
 *
 * Combines two mechanisms so the UI auto-updates without a page refresh:
 *
 *   1. Supabase Realtime subscriptions (instant updates when any row in any
 *      of the 14 tables is INSERTed/UPDATEd/DELETEd — works across browser
 *      tabs and even from direct changes in Supabase Dashboard).
 *
 *   2. Polling fallback every 5 seconds — calls `router.refresh()` which
 *      re-runs all server components and refetches all server action data
 *      without a full page reload. This guarantees updates even if the
 *      Supabase Realtime websocket is blocked or not configured.
 *
 * Both mechanisms call `router.refresh()` (Next.js App Router soft refresh)
 * which does NOT cause a full page reload — it just refetches the server
 * data and reconciles the changes in place.
 *
 * Returns: { status: 'live' | 'polling' | 'off', lastSync: number }
 *   - 'live'     → Supabase Realtime is connected + 5s polling is running
 *   - 'polling'  → 5s polling is running (Supabase Realtime couldn't connect)
 *   - 'off'      → no realtime (missing env vars)
 */

const SUPABASE_TABLES = [
  'profiles',
  'members',
  'membership_plans',
  'memberships',
  'services',
  'staff',
  'appointments',
  'payments',
  'package_offers',
  'campaigns',
  'notifications',
  'activity_logs',
  'daily_entries',
  'staff_attendance',
] as const

const POLL_INTERVAL_MS = 5000 // 5 seconds

type RealtimeStatus = 'live' | 'polling' | 'off'

let cachedClient: SupabaseClient | null = null
function getRealtimeClient(): SupabaseClient | null {
  if (cachedClient !== null) return cachedClient || null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon || url.includes('placeholder')) {
    cachedClient = null
    return null
  }
  cachedClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

export function useRealtimeSync() {
  const router = useRouter()
  const [status, setStatus] = useState<RealtimeStatus>('off')
  const [lastSync, setLastSync] = useState<number>(Date.now())
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null)
  const mountedRef = useRef(true)
  const refreshLockRef = useRef(false)

  // Use a ref to avoid stale closure issues
  const routerRef = useRef(router)
  useEffect(() => {
    routerRef.current = router
  }, [router])

  const safeRefresh = useCallback(() => {
    if (!mountedRef.current) return
    if (refreshLockRef.current) return
    refreshLockRef.current = true
    try {
      routerRef.current.refresh()
      setLastSync(Date.now())
    } catch (e) {
      console.warn('[realtime] refresh failed:', e)
    } finally {
      // Unlock shortly after — allows the next poll cycle
      setTimeout(() => {
        refreshLockRef.current = false
      }, 800)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // 1. Start 5-second polling (always on — this is the guaranteed fallback)
    setStatus((prev) => (prev === 'off' ? 'polling' : prev))
    pollTimerRef.current = setInterval(safeRefresh, POLL_INTERVAL_MS)

    // Initial sync shortly after mount
    const initialTimer = setTimeout(safeRefresh, 1500)

    // 2. Try to set up Supabase Realtime subscriptions (best-effort)
    const client = getRealtimeClient()
    if (client) {
      try {
        // Build a single channel that listens to all 14 tables
        const channel = client.channel('bella-luxe-realtime-all-tables')

        for (const table of SUPABASE_TABLES) {
          channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              // Any change to any table → trigger a refresh
              if (process.env.NODE_ENV !== 'production') {
                console.log(`[realtime] change on ${table}:`, payload.eventType)
              }
              safeRefresh()
            }
          )
        }

        channel.subscribe((status_: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
          if (!mountedRef.current) return
          if (status_ === 'SUBSCRIBED') {
            setStatus('live')
            console.log('[realtime] Supabase Realtime connected — instant updates active')
          } else if (status_ === 'CHANNEL_ERROR' || status_ === 'TIMED_OUT') {
            setStatus('polling')
            console.warn('[realtime] Supabase Realtime failed, falling back to 5s polling only')
          }
        })

        channelRef.current = channel
      } catch (e) {
        console.warn('[realtime] Failed to set up subscriptions:', e)
        setStatus('polling')
      }
    } else {
      console.warn('[realtime] No Supabase env vars — using 5s polling only')
      setStatus('polling')
    }

    // 3. Listen for window focus to refresh immediately when the user
    //    returns to the tab (catches changes that happened while away)
    const handleFocus = () => safeRefresh()
    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      mountedRef.current = false
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe()
        } catch {}
        channelRef.current = null
      }
      if (initialTimer) clearTimeout(initialTimer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [safeRefresh])

  return { status, lastSync }
}
