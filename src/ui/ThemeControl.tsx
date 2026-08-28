import { type Theme, THEMES } from '../core/theme'
import { copy } from './copy'

/**
 * A quiet, top-right theme control (dark/light/system). Three monochrome icon buttons — no
 * accent, no visible label, each a 40px tap target — so it doesn't compete with the content.
 * Kept off the card, whose header belongs to the lesson (ADR-0010); it lives on the path and
 * the landing. The words are the accessible labels; the glyphs are the icons.
 */
export function ThemeControl({
  theme,
  onSetTheme,
}: {
  theme: Theme
  onSetTheme: (theme: Theme) => void
}) {
  return (
    <div className="theme-control" role="group" aria-label={copy.themeLabel}>
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          className={`theme-opt${t === theme ? ' theme-opt-active' : ''}`}
          aria-label={copy.themeOptions[t]}
          aria-pressed={t === theme}
          onClick={() => onSetTheme(t)}
        >
          <span aria-hidden="true">{copy.themeGlyphs[t]}</span>
        </button>
      ))}
    </div>
  )
}
