// Supabase server client (uses service role key — bypasses RLS for server actions).
//
// This replaces the previous Prisma client (`db`). All server actions now read
// and write through this single Supabase client. The schema is defined entirely
// in `download/bella-luxe-spa-complete.sql` — there is no Prisma schema.
//
// Required environment variables (set in .env):
//   SUPABASE_URL              — your Supabase project URL (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY — the service_role key (NOT the anon key)
//
// The service role key bypasses RLS so the server can do CRUD on behalf of any
// role. The anon key is used client-side (NEXT_PUBLIC_SUPABASE_*) where RLS
// policies apply based on the logged-in user.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

let warnedMissing = false
function warnIfMissing() {
  if (warnedMissing) return
  if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.startsWith('REPLACE_WITH')) {
    warnedMissing = true
    console.warn(
      '[Supabase] Missing or placeholder env vars.\n' +
      '  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (find them in Supabase Dashboard → Settings → API).\n' +
      '  The dev server will boot, but server actions will fail until these are filled in.'
    )
  }
}

/**
 * Server-side Supabase client. Bypasses RLS (uses service_role key).
 * Use this in server actions and API routes for any CRUD operation.
 *
 * Falls back to a client built with empty strings if env vars are missing —
 * this lets the dev server boot so you can see UI errors clearly. All actual
 * DB calls will fail with a clear error message until env vars are set.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Emit the warning eagerly at module load so it shows up in the server log.
warnIfMissing()

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
