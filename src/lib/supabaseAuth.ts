/**
 * Demo-safe Supabase Auth helpers for Aether.
 * Without VITE_SUPABASE_* the app stays usable (disabled/demo state).
 */
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'

export type AuthMode = 'disabled' | 'signed_out' | 'signed_in'

export interface AuthSnapshot {
  mode: AuthMode
  configured: boolean
  session: Session | null
  user: User | null
  email: string | null
  userId: string | null
  error: string | null
}

export function getAuthMode(session: Session | null): AuthMode {
  if (!isSupabaseConfigured()) return 'disabled'
  return session?.user ? 'signed_in' : 'signed_out'
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      mode: 'disabled',
      configured: false,
      session: null,
      user: null,
      email: null,
      userId: null,
      error: null,
    }
  }
  const sb = getSupabaseClient()
  if (!sb) {
    return {
      mode: 'disabled',
      configured: false,
      session: null,
      user: null,
      email: null,
      userId: null,
      error: null,
    }
  }
  try {
    const { data, error } = await sb.auth.getSession()
    if (error) {
      return {
        mode: 'signed_out',
        configured: true,
        session: null,
        user: null,
        email: null,
        userId: null,
        error: error.message,
      }
    }
    const session = data.session
    return {
      mode: getAuthMode(session),
      configured: true,
      session,
      user: session?.user ?? null,
      email: session?.user?.email ?? null,
      userId: session?.user?.id ?? null,
      error: null,
    }
  } catch (err) {
    return {
      mode: 'signed_out',
      configured: true,
      session: null,
      user: null,
      email: null,
      userId: null,
      error: err instanceof Error ? err.message : 'auth session failed',
    }
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error: string | null }> {
  const sb = getSupabaseClient()
  if (!sb) return { ok: false, error: 'Supabase Auth is not configured' }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
  return { ok: !error, error: error?.message ?? null }
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error: string | null }> {
  const sb = getSupabaseClient()
  if (!sb) return { ok: false, error: 'Supabase Auth is not configured' }
  const { error } = await sb.auth.signUp({ email: email.trim(), password })
  return { ok: !error, error: error?.message ?? null }
}

export async function signOut(): Promise<{ ok: boolean; error: string | null }> {
  const sb = getSupabaseClient()
  if (!sb) return { ok: false, error: 'Supabase Auth is not configured' }
  const { error } = await sb.auth.signOut()
  return { ok: !error, error: error?.message ?? null }
}

/** Subscribe to auth changes. Returns unsubscribe. No-op when unconfigured. */
export function onAuthChange(callback: (snapshot: AuthSnapshot) => void): () => void {
  const sb = getSupabaseClient()
  if (!sb) {
    callback({
      mode: 'disabled',
      configured: false,
      session: null,
      user: null,
      email: null,
      userId: null,
      error: null,
    })
    return () => undefined
  }
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback({
      mode: getAuthMode(session),
      configured: true,
      session,
      user: session?.user ?? null,
      email: session?.user?.email ?? null,
      userId: session?.user?.id ?? null,
      error: null,
    })
  })
  return () => data.subscription.unsubscribe()
}
