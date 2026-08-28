/**
 * The first-run sequence (ADR-0021): a landing, then the account choice, shown once, ever.
 *
 * Pure by design — no storage, no DOM. The persisted "has onboarded" flag and the localStorage
 * write live in `storage/`; the UI holds the current step. This module owns only the decision
 * that is most likely to break silently: given the persisted flag, whether sync is configured,
 * and the step, which screen shows — and how a step advances. "Shown once, never again" is a
 * property of these functions, so it can be tested exhaustively.
 */

/** `'app'` means the first run is over: render the card/path, not a first-run screen. */
export type FirstRunStep = 'landing' | 'account' | 'app'

/** Where the sequence starts on load: skipped entirely once the flag is set. */
export function initialStep(hasOnboarded: boolean): FirstRunStep {
  return hasOnboarded ? 'app' : 'landing'
}

/** The screen a step maps to. Identity today, but the single place the mapping is defined. */
export function screenForStep(step: FirstRunStep): 'landing' | 'account' | 'app' {
  return step
}

/**
 * Leaving the landing ("Empezar"). The choice is recorded here (`persist: true`) — before the
 * account screen — so abandoning between the two steps still never re-shows the sequence. Then
 * it advances to the account screen when sync exists, or straight to the app when it doesn't.
 */
export function advanceFromLanding(authConfigured: boolean): {
  step: FirstRunStep
  persist: boolean
} {
  return { step: authConfigured ? 'account' : 'app', persist: true }
}
