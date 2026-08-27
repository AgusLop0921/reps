import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The Supabase client for progress sync (ADR-0020), or null when the frontend was built
 * without credentials. Null is the normal local-only case: the whole sync surface degrades
 * to a no-op and the app is unaffected (ADR-0010). This module and the ones under
 * `src/storage/` are the only code that touches Supabase.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True only when both public env vars are present; gates every sync affordance in the UI. */
export const isSyncConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
