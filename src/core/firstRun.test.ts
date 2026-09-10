import { describe, expect, it } from 'vitest'
import { advanceFromLanding, initialStep, screenForStep, shouldOfferAccountChoice } from './firstRun'

/** The screen a fresh load would render, given the persisted flag. */
const screenOnLoad = (hasOnboarded: boolean) => screenForStep(initialStep(hasOnboarded))

describe('first-run sequencing (ADR-0021)', () => {
  it('first visit shows the landing', () => {
    expect(screenOnLoad(false)).toBe('landing')
  })

  it('a returning visitor sees neither screen — straight to the app', () => {
    expect(screenOnLoad(true)).toBe('app')
  })

  it('the landing is gated on first visit, not on auth (ADR-0018, ADR-0021)', () => {
    // Someone who chose "Seguir sin cuenta" is onboarded but logged out. They must go straight
    // to the card like a signed-in user — showing the landing to every logged-out visitor
    // would turn it into a funnel. `initialStep` takes only the persisted flag; auth is not an
    // input, so an onboarded visitor lands on the app regardless of auth state.
    expect(screenOnLoad(true)).toBe('app')
    // The signature makes the guarantee structural: this call has no auth argument to pass.
    expect(initialStep(true)).toBe('app')
  })

  it('after "Empezar", opens track selection before the account decision', () => {
    const { step } = advanceFromLanding()
    expect(screenForStep(step)).toBe('app')
  })

  it('does not record first run until the learner chooses an account mode for a track', () => {
    expect(advanceFromLanding().persist).toBe(false)
  })

  it('offers the account choice only to a fresh, signed-out learner when sync is available', () => {
    expect(
      shouldOfferAccountChoice({ hasOnboarded: false, authConfigured: true, signedIn: false }),
    ).toBe(true)
    expect(
      shouldOfferAccountChoice({ hasOnboarded: true, authConfigured: true, signedIn: false }),
    ).toBe(false)
    expect(
      shouldOfferAccountChoice({ hasOnboarded: false, authConfigured: false, signedIn: false }),
    ).toBe(false)
    expect(
      shouldOfferAccountChoice({ hasOnboarded: false, authConfigured: true, signedIn: true }),
    ).toBe(false)
  })

  it('keeps the landing eligible when a learner abandons before choosing a track mode', () => {
    const { persist } = advanceFromLanding()
    expect(screenOnLoad(persist)).toBe('landing')
  })
})
