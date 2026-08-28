import { afterEach, describe, expect, it } from 'vitest'
import { getTheme, setTheme } from './theme'

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

describe('theme preference', () => {
  it('defaults to system when unset', () => {
    stubLocalStorage()
    expect(getTheme()).toBe('system')
  })

  it('persists and reads back a choice', () => {
    stubLocalStorage()
    setTheme('light')
    expect(getTheme()).toBe('light')
  })

  it('ignores a corrupt stored value, falling back to system', () => {
    stubLocalStorage()
    localStorage.setItem('reps.theme', 'sepia')
    expect(getTheme()).toBe('system')
  })

  it('falls back to system when storage is unavailable', () => {
    // No localStorage in the node test env: reading throws, and we must not break.
    expect(getTheme()).toBe('system')
    expect(() => setTheme('dark')).not.toThrow()
  })
})
