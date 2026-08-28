import { describe, expect, it } from 'vitest'
import { advanceFromLanding, initialStep, screenForStep } from './firstRun'

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

  it('after "Empezar" with sync configured, shows the account screen', () => {
    const { step } = advanceFromLanding(true)
    expect(screenForStep(step)).toBe('account')
  })

  it('after "Empezar" without sync, goes straight to the app', () => {
    const { step } = advanceFromLanding(false)
    expect(screenForStep(step)).toBe('app')
  })

  it('records the choice on leaving the landing, before the account screen', () => {
    // This is what makes abandonment safe: the flag is persisted at "Empezar", not at the
    // account choice.
    expect(advanceFromLanding(true).persist).toBe(true)
    expect(advanceFromLanding(false).persist).toBe(true)
  })

  it('abandoning between the two steps never re-shows either', () => {
    // User presses "Empezar" (sync configured) → account screen, and closes the app there.
    const { persist } = advanceFromLanding(true)
    // "Empezar" persisted the flag, so the next load reads hasOnboarded = true.
    const nextLoad = screenOnLoad(persist)
    expect(nextLoad).toBe('app')
  })
})
