// Browser + cookie-aware Supabase clients.
//
// `supabaseBrowser` is the singleton browser client used inside React client
// components and server actions for auth (signIn / signUp / signOut /
// resetPasswordForEmail). It uses @supabase/ssr's `createBrowserClient` so the
// auth session is persisted in cookies automatically and refreshed in the
// background.
//
// Server components / route handlers / server actions should use
// `getServerSupabase()` from `./supabase-server` instead — it reads the
// incoming cookies via `next/headers` so it sees the logged-in user.
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (publishable / anon key)
//
// The anon JWT also works as a fallback for older code paths.

import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
// `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the new key name Supabase exposes
// in the dashboard. Older projects only have `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
// We accept either one (publishable wins, anon falls back).
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

let warned = false
if (!warned && (!url || !publishableKey)) {
  warned = true
  console.warn(
    '[Supabase Browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Login / sign-up will not work until these are set in .env'
  )
}

export const supabaseBrowser = createBrowserClient(
  url || 'https://placeholder.supabase.co',
  publishableKey || 'placeholder-anon-key'
)
