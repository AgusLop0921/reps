import { describe, expect, it } from 'vitest'
import { isTheme } from './theme'

describe('isTheme', () => {
  it('accepts dark and light', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
  })

  it('rejects system and anything else', () => {
    expect(isTheme('system')).toBe(false)
    expect(isTheme('sepia')).toBe(false)
    expect(isTheme(null)).toBe(false)
    expect(isTheme(undefined)).toBe(false)
  })
})
