/**
 * The one-time first-run account choice (ADR-0021). Persisted in localStorage so the choice
 * — including "Seguir sin cuenta" — is remembered permanently and the screen is shown once,
 * ever. If localStorage is unavailable the screen must **fail closed**: `hasOnboarded`
 * reports true so the screen is never shown, rather than risk re-prompting on every load.
 */
const KEY = 'reps.onboarded'

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true // storage unavailable → never prompt (ADR-0021: fail closed)
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* nothing persists without storage; not fatal */
  }
}
