// Supabase server client.
//
// This replaces the previous Prisma client (`db`). All server actions now read
// and write through this single Supabase client. The schema is defined entirely
// in `download/bella-luxe-spa-complete.sql` — there is no Prisma schema.
//
// TWO MODES OF OPERATION (auto-detected from env vars):
//
// 1. SERVICE_ROLE mode (recommended for production)
//    Set `SUPABASE_SERVICE_ROLE_KEY` to your project's service_role key.
//    The service_role key bypasses RLS, so server actions can read/write
//    any table without restriction. Find it in Supabase Dashboard → Settings → API.
//
// 2. ADMIN_LOGIN mode (used when service_role key is missing)
//    Falls back to logging in as the admin user (SUPABASE_ADMIN_EMAIL /
//    SUPABASE_ADMIN_PASSWORD) and using the admin's access token. RLS policies
//    grant the admin role full CRUD, so this works the same way from the
//    app's perspective. The access token is cached and auto-refreshed.
//
// Required env vars:
//   SUPABASE_URL                  — your project URL (https://<ref>.supabase.co)
//   NEXT_PUBLIC_SUPABASE_ANON_KEY — the anon public key
//
// Service-role mode (optional but recommended):
//   SUPABASE_SERVICE_ROLE_KEY     — the service_role secret key
//
// Admin-login mode (fallback when service_role key not set):
//   SUPABASE_ADMIN_EMAIL          — default: admin@bellaluxe.com
//   SUPABASE_ADMIN_PASSWORD       — default: BellaLuxe@2026

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const adminEmail = process.env.SUPABASE_ADMIN_EMAIL ?? 'admin@bellaluxe.com'
const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD ?? 'BellaLuxe@2026'

// True if a real service_role key is configured (not a placeholder).
const hasServiceRoleKey =
  supabaseServiceKey &&
  !supabaseServiceKey.startsWith('PLACEHOLDER') &&
  !supabaseServiceKey.startsWith('REPLACE_WITH') &&
  supabaseServiceKey !== 'placeholder-service-role-key'

let warnedMissing = false
function warnConfig() {
  if (warnedMissing) return
  warnedMissing = true
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase] Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      '  Set them in .env (find them in Supabase Dashboard → Settings → API).\n' +
      '  The dev server will boot, but server actions will fail until these are filled in.'
    )
  } else if (!hasServiceRoleKey) {
    console.warn(
      '[Supabase] No SUPABASE_SERVICE_ROLE_KEY set — falling back to admin login mode.\n' +
      '  Server actions will authenticate as admin@bellaluxe.com via Supabase Auth.\n' +
      '  For production, set SUPABASE_SERVICE_ROLE_KEY in .env for best performance.'
    )
  }
}

/**
 * Underlying client — uses service_role key if available, otherwise anon key.
 * The accessor below (`supabase`) wraps this with admin-token injection when needed.
 */
const baseClient: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  hasServiceRoleKey ? supabaseServiceKey : (supabaseAnonKey || 'placeholder-anon-key'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// ---- Admin-login fallback (only used when service_role key is missing) ----

interface CachedSession {
  access_token: string
  expires_at: number  // ms since epoch
}
let cachedSession: CachedSession | null = null
let loginInFlight: Promise<CachedSession | null> | null = null

async function adminLogin(): Promise<CachedSession | null> {
  if (loginInFlight) return loginInFlight
  loginInFlight = (async () => {
    try {
      const { data, error } = await baseClient.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (error || !data.session) {
        console.error('[Supabase] Admin login failed:', error?.message ?? 'no session')
        return null
      }
      const session: CachedSession = {
        access_token: data.session.access_token,
        // Refresh 5 min before actual expiry
        expires_at: (data.session.expires_at ?? 0) * 1000 - 5 * 60 * 1000,
      }
      cachedSession = session
      return session
    } catch (e) {
      console.error('[Supabase] Admin login exception:', e instanceof Error ? e.message : e)
      return null
    } finally {
      loginInFlight = null
    }
  })()
  return loginInFlight
}

async function getAccessToken(): Promise<string | null> {
  if (cachedSession && Date.now() < cachedSession.expires_at) {
    return cachedSession.access_token
  }
  const session = await adminLogin()
  return session?.access_token ?? null
}

/**
 * Returns a Supabase client ready for server action use.
 *
 * - In service_role mode: returns the base client (RLS bypassed).
 * - In admin-login mode: returns a per-call client with the admin's
 *   access token injected into the Authorization header (RLS applies
 *   based on admin role, which has full CRUD via the schema policies).
 *
 * IMPORTANT: This is async — always `await getSupabase()` to get the
 * working client. Calls in server actions should do:
 *
 *   const sb = await getSupabase()
 *   const { data, error } = await sb.from('members').select('*')
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (hasServiceRoleKey) return baseClient
  // Admin-login mode — build a client with the admin's access token
  const token = await getAccessToken()
  if (!token) return baseClient  // will fail with clear error
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

/**
 * BACKWARDS COMPATIBILITY: a synchronous client for code that hasn't been
 * updated yet. In service_role mode this is the same as `getSupabase()`.
 * In admin-login mode, this returns the base client (anon key, no auth)
 * — server actions should prefer `await getSupabase()` for RLS-protected
 * reads/writes.
 */
export const supabase: SupabaseClient = baseClient

// Emit the warning eagerly at module load.
warnConfig()

/**
 * Helper: convert a Postgres timestamptz / date column returned by Supabase
 * into a serialized ISO string. Supabase returns the raw string from Postgres,
 * so we just normalize it to ISO format for client consumption.
 */
export function toISO(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

/**
 * Helper: convert a snake_case column name (Postgres convention) to camelCase
 * for the client DTOs. Used when we want to remap rows from the DB.
 */
export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Helper: convert all top-level keys of an object from snake_case to camelCase.
 */
export function camelize<T extends Record<string, any>>(row: T): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v
  }
  return out
}
