import { isTheme, type Theme } from '../core/theme'

/**
 * The persisted theme choice (dark/light), a per-device preference kept in localStorage — not
 * synced. Same fail-safe pattern as the onboarding flag: if storage is unavailable or the
 * stored value is corrupt, fall back to `'dark'` (the designed default) rather than break, and
 * let a failed write be silent.
 */
const KEY = 'reps.theme'

export function getTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY)
    return isTheme(raw) ? raw : 'dark'
  } catch {
    return 'dark'
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* the preference just won't persist this session; not fatal */
  }
}
