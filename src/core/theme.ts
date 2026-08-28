/**
 * Theme preference and how it maps to the root's `data-theme` attribute. Pure — no storage,
 * no DOM. `'system'` resolves to `null` (no attribute), which lets the `prefers-color-scheme`
 * media query govern and follow OS changes live; `'dark'`/`'light'` set the attribute to
 * override it. The persistence and the DOM write live in `storage/` and `ui/`.
 */
export type Theme = 'dark' | 'light' | 'system'

export const THEMES: readonly Theme[] = ['dark', 'light', 'system']

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
}

/** The value for the root's `data-theme`; `null` means remove it and defer to the system. */
export function resolveThemeAttr(theme: Theme): 'dark' | 'light' | null {
  return theme === 'system' ? null : theme
}
