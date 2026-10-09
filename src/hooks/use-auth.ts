'use client'

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '@/lib/supabaseClient'

/**
 * Client-side auth hook.
 *
 * Returns:
 *   - user: the logged-in Supabase user, or null if not logged in
 *   - loading: true while the initial session check is in flight
 *   - signIn: (email, password) => Promise<{ error?: string }>
 *   - signOut: () => Promise<void>
 *
 * The hook subscribes to Supabase auth state changes, so the UI updates
 * instantly when the user logs in or out (or when their session expires).
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const sb = getSupabaseBrowser()
    if (!sb) {
      // Use a microtask to defer the setState outside of the effect body
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(false)
      })
      return
    }

    let initialDone = false

    // Get the current session
    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setUser(data.session?.user ?? null)
      initialDone = true
      setLoading(false)
    })

    // Subscribe to auth state changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (!initialDone) {
        initialDone = true
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const sb = getSupabaseBrowser()
    if (!sb) return { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env' }
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    const sb = getSupabaseBrowser()
    if (!sb) return
    await sb.auth.signOut()
    setUser(null)
    // Hard reload to clear all cached data
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }, [])

  return { user, loading, signIn, signOut }
}
