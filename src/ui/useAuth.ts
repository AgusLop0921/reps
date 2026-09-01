import { useEffect, useState } from 'react'
import { clearAll } from '../storage/repository'
import { isSyncConfigured, supabase } from '../storage/supabaseClient'

// Where OAuth / magic links return to: the app's own URL, base included. `origin` alone drops
// the project-page base (`/reps/`), so it must be appended. This URL must also be in Supabase's
// redirect allowlist, or Supabase falls back to the project's Site URL.
const appUrl = window.location.origin + import.meta.env.BASE_URL

/**
 * Supabase auth, magic-link only (ADR-0020). When Supabase is not configured this reports
 * `configured: false` and every method is a no-op, so the no-account, local-only path is
 * completely unaffected. Deleting the account removes the remote data and the auth user
 * (via the `delete_account` function) and then wipes local storage — "everything in it".
 */
export function useAuth() {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  // Until the initial session resolves we can't tell signed-in from out; the boot waits on
  // this so it can route the home screen (ADR-0022). No Supabase → resolved immediately.
  const [loading, setLoading] = useState(isSyncConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
      setUserId(data.session?.user.id ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setUserId(session?.user.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(address: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: appUrl },
    })
    if (error) throw error
  }

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: appUrl },
    })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function deleteAccount(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.rpc('delete_account')
    if (error) throw error
    await supabase.auth.signOut()
    await clearAll()
  }

  return {
    configured: isSyncConfigured,
    loading,
    email,
    userId,
    signIn,
    signInWithGoogle,
    signOut,
    deleteAccount,
  }
}
