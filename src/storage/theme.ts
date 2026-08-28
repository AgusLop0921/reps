import { isTheme, type Theme } from '../core/theme'

/**
 * The persisted theme choice (dark/light/system), a per-device preference kept in
 * localStorage — not synced. Same fail-safe pattern as the onboarding flag: if storage is
 * unavailable, fall back to `'system'` rather than break, and let a failed write be silent.
 */
const KEY = 'reps.theme'

export function getTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY)
    return isTheme(raw) ? raw : 'system'
  } catch {
    return 'system'
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* the preference just won't persist this session; not fatal */
  }
}
