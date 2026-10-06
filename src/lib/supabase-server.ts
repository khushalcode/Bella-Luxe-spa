// Server-side Supabase client + auth helpers for use inside Server Components,
// Route Handlers, and Server Actions.
//
// - `getServerSupabase()` returns a user-aware Supabase client (reads cookies
//   via `next/headers`) so RLS policies enforce on the currently logged-in
//   user. Use this whenever the result depends on who is calling.
// - `getServerUser()` returns the current logged-in user (or null when no
//   session is present). Use this at the top of `page.tsx` to decide whether
//   to render the login page or the dashboard.
// - `getServerUserRole()` returns the role stored on `profiles` for the
//   current user. Defaults to `null` when there is no session or no profile.
//
// For admin-style CRUD that bypasses RLS (server actions that mutate shared
// CRM tables on behalf of any authenticated user), continue to use the
// service-role client exported from `./supabaseServer`.
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (publishable / anon key)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export type SpaRole = 'admin' | 'manager' | 'receptionist' | 'therapist'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

let warned = false
if (!warned && (!url || !publishableKey)) {
  warned = true
  console.warn(
    '[Supabase Server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Auth checks will treat every request as anonymous.'
  )
}

/**
 * Returns a cookie-aware Supabase client for the current request.
 *
 * `cookies()` is async in Next.js 16 — must be awaited. The returned client
 * respects the currently logged-in user's session — RLS policies will
 * enforce on that user.
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(url || 'https://placeholder.supabase.co', publishableKey || 'placeholder-anon-key', {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll is called when Supabase refreshes the JWT. Inside a
          // Server Component this throws (cookies are read-only). The
          // proxy takes care of refreshing the session instead.
        }
      },
    },
  })
}

/**
 * Returns the currently logged-in user (or null when no session).
 *
 * Use at the top of `page.tsx` to decide whether to render the login page
 * or the dashboard. Returns the full `User` object so callers can read
 * `id`, `email`, and `user_metadata`.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await getServerSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    // `getUser()` returns an error when the JWT is missing / invalid /
    // expired. Treat all of these as "no session".
    return null
  }
  return user ?? null
}

/**
 * Returns the `profiles.role` value for the current user, or null if
 * the user is not logged in / has no profile row yet.
 *
 * Falls back to `null` if a logged-in user has no profile row (should not
 * happen because the auth trigger creates one — but be safe).
 */
export async function getServerUserRole(): Promise<SpaRole | null> {
  const user = await getServerUser()
  if (!user) return null
  const supabase = await getServerSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = data?.role as SpaRole | undefined
  if (!role) return null
  return role
}

export type { SupabaseClient }
