/**
 * Shared browser Supabase client. Demo-safe when env vars are absent.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return Boolean(url?.trim() && key?.trim())
}

/** Returns a singleton client, or null when credentials are missing. */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  if (!url || !key) {
    client = null
    return null
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}

/** Test helper — reset singleton between unit tests. */
export function __resetSupabaseClientForTests() {
  client = undefined
}
