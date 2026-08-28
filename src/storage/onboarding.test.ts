import { afterEach, describe, expect, it } from 'vitest'
import { hasOnboarded, markOnboarded } from './onboarding'

function stubLocalStorage(): void {
  const store = new Map<string, string>()
  const fake = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  }
  globalThis.localStorage = fake as unknown as Storage
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('onboarding flag', () => {
  it('remembers the choice once marked', () => {
    stubLocalStorage()
    expect(hasOnboarded()).toBe(false)
    markOnboarded()
    expect(hasOnboarded()).toBe(true)
  })

  it('fails closed — reports onboarded — when storage is unavailable (ADR-0021)', () => {
    // No localStorage in the node test env: reading it throws, and we must not re-prompt.
    expect(hasOnboarded()).toBe(true)
  })
})
