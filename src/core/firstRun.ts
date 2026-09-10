/**
 * The first-run sequence: a landing, then track selection. The optional account choice happens
 * only after the first selected track, when the learner has context for the decision.
 *
 * Pure by design — no storage, no DOM. The persisted "has onboarded" flag and the localStorage
 * write live in `storage/`; the UI holds the current step. This module owns only the decision
 * that is most likely to break silently: given the persisted flag, whether sync is configured,
 * and the step, which screen shows — and how a step advances. "Shown once, never again" is a
 * property of these functions, so it can be tested exhaustively.
 */

/** `'app'` means the first run is over: render the card/path, not a first-run screen. */
export type FirstRunStep = 'landing' | 'app'

/** Where the sequence starts on load: skipped entirely once the flag is set. */
export function initialStep(hasOnboarded: boolean): FirstRunStep {
  return hasOnboarded ? 'app' : 'landing'
}

/** The screen a step maps to. Identity today, but the single place the mapping is defined. */
export function screenForStep(step: FirstRunStep): 'landing' | 'app' {
  return step
}

/**
 * Leaving the landing ("Empezar") opens track selection but does not persist the first-run
 * choice. The learner still has to choose the selected track's account mode.
 */
export function advanceFromLanding(): {
  step: FirstRunStep
  persist: boolean
} {
  return { step: 'app', persist: false }
}

/** The account choice is relevant only for a fresh, local-only learner with sync available. */
export function shouldOfferAccountChoice({
  hasOnboarded,
  authConfigured,
  signedIn,
}: {
  hasOnboarded: boolean
  authConfigured: boolean
  signedIn: boolean
}): boolean {
  return !hasOnboarded && authConfigured && !signedIn
}
