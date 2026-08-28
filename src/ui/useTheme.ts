import { useState } from 'react'
import { type Theme } from '../core/theme'
import { getTheme, setTheme as persistTheme } from '../storage/theme'

/** Set the root's data-theme; :root is dark by default, [data-theme="light"] overrides it. */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * The theme choice (dark/light) and a setter. The initial attribute was set before paint by
 * the inline script in index.html (matching this hook's initial state), so there's nothing to
 * apply on mount; choosing persists, applies to the root, and updates the control.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  const setTheme = (next: Theme): void => {
    persistTheme(next)
    applyTheme(next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
