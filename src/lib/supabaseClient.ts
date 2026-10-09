// Browser-side Supabase client for client-side auth.
// Uses the anon key (RLS-protected) — auth state determines what data the user can read.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let cachedClient: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cachedClient !== null) return cachedClient || null
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn('[supabase-browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    cachedClient = null
    return null
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'bella-luxe-auth',
    },
  })
  return cachedClient
}
