/**
 * Theme preference: dark or light. Applied via `data-theme` on the root — `:root` is dark by
 * default, `[data-theme="light"]` overrides to light. There is no system/auto option: the app
 * is dark-first (the designed default), and the choice is an explicit two-way toggle. Pure —
 * persistence lives in `storage/`, the DOM write in `ui/`.
 */
export type Theme = 'dark' | 'light'

export const THEMES: readonly Theme[] = ['dark', 'light']

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}
