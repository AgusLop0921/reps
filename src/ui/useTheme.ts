import { useState } from 'react'
import { resolveThemeAttr, type Theme } from '../core/theme'
import { getTheme, setTheme as persistTheme } from '../storage/theme'

/** Set or clear the root's data-theme; 'system' clears it so prefers-color-scheme governs. */
function applyTheme(theme: Theme): void {
  const attr = resolveThemeAttr(theme)
  const root = document.documentElement
  if (attr) root.setAttribute('data-theme', attr)
  else root.removeAttribute('data-theme')
}

/**
 * The theme choice and a setter. The initial attribute was set before paint by the inline
 * script in index.html (matching this hook's initial state), so there's nothing to apply on
 * mount; choosing persists, applies to the root, and updates the control. 'system' follows the
 * OS live through CSS — no listener needed.
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
