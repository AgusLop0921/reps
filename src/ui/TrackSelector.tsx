import type { Track } from '../content/schema'
import { pathQuestionCount } from '../core/curriculum'
import { copy } from './copy'
import repsIcon from './reps-icon.svg'
import { ThemeControl } from './ThemeControl'
import type { Theme } from '../core/theme'

export function TrackSelector({
  tracks,
  theme,
  onSetTheme,
  onSelect,
  onBack,
}: {
  tracks: Track[]
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onSelect: (trackId: string) => void
  onBack: () => void
}) {
  return (
    <section className="track-select">
      <header className="path-head">
        <button type="button" className="path-home" aria-label={copy.pathHome} onClick={onBack}>
          <img className="path-home-icon" src={repsIcon} alt="" width="30" height="30" />
        </button>
        <ThemeControl theme={theme} onSetTheme={onSetTheme} />
      </header>

      <div className="track-select-body">
        <p className="track-select-eyebrow">{copy.trackSelectEyebrow}</p>
        <h1 className="track-select-title">{copy.trackSelectTitle}</h1>
        <div className="track-grid">
          {tracks.map((track) => {
            return (
              <button
                key={track.id}
                type="button"
                className="track-option"
                onClick={() => onSelect(track.id)}
              >
                <span className="track-option-name">{track.title}</span>
                <span className="track-option-description">{track.description}</span>
                <span className="track-option-meta">
                  {copy.trackQuestionCount(pathQuestionCount(track.curriculum))}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
