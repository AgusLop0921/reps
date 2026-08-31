import { type Theme } from '../core/theme'
import { copy } from './copy'

/**
 * A quiet, top-right theme toggle. A single monochrome icon showing the theme you'd switch to
 * — sun while dark, moon while light — no accent, no label, one 40px tap target, so it doesn't
 * compete with the content. Kept off the card, whose header belongs to the lesson (ADR-0010).
 */
export function ThemeControl({
  theme,
  onSetTheme,
}: {
  theme: Theme
  onSetTheme: (theme: Theme) => void
}) {
  const target: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <div className="theme-control">
      <button
        type="button"
        className="theme-opt"
        aria-label={copy.themeOptions[target]}
        onClick={() => onSetTheme(target)}
      >
        <span aria-hidden="true">{copy.themeGlyphs[target]}</span>
      </button>
    </div>
  )
}
