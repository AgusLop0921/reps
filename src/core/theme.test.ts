import { describe, expect, it } from 'vitest'
import { isTheme, resolveThemeAttr } from './theme'

describe('resolveThemeAttr', () => {
  it('maps dark and light to the attribute value', () => {
    expect(resolveThemeAttr('dark')).toBe('dark')
    expect(resolveThemeAttr('light')).toBe('light')
  })

  it('maps system to null — no attribute, so prefers-color-scheme governs', () => {
    expect(resolveThemeAttr('system')).toBeNull()
  })
})

describe('isTheme', () => {
  it('accepts the three themes', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
    expect(isTheme('system')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isTheme('sepia')).toBe(false)
    expect(isTheme(null)).toBe(false)
    expect(isTheme(undefined)).toBe(false)
  })
})
