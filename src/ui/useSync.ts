import { useEffect, useRef } from 'react'
import { syncNow } from '../storage/sync'

/**
 * Runs a two-way sync while signed in (ADR-0020). It fires once on sign-in (the initial
 * merge), then on `online`, `focus`, and `visibilitychange` — the last is what pushes a
 * device's fresh answers when you put it down and pick up another. Best-effort: failures are
 * swallowed and retried on the next trigger; local IndexedDB is never blocked or corrupted.
 *
 * `onSynced(isInitial)` runs after each successful sync — the caller reloads state, and on
 * the initial merge also repositions to the resumed lesson.
 */
export function useSync(
  userId: string | null,
  onSynced: (isInitial: boolean) => void | Promise<void>,
): void {
  const onSyncedRef = useRef(onSynced)
  onSyncedRef.current = onSynced

  useEffect(() => {
    if (!userId) return
    let active = true
    let first = true

    const run = (): void => {
      const isInitial = first
      first = false
      void syncNow(userId)
        .then(() => {
          if (active) void onSyncedRef.current(isInitial)
        })
        .catch(() => {
          /* best-effort; retries on the next trigger */
        })
    }

    run()
    window.addEventListener('online', run)
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', run)
    return () => {
      active = false
      window.removeEventListener('online', run)
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', run)
    }
  }, [userId])
}
