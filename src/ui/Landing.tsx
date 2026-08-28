import type { SourceInfo } from '../content/sources'
import { copy } from './copy'

/**
 * The landing (ADR-0021), set like a book's title page: the name and one-line description
 * dominate the hero, the supporting lines step down and are separated by rules, and the source
 * credit (ADR-0007) is a quiet block anchored at the foot — legible and unmissable, never the
 * heaviest element. Shown once at first run (with `onStart`) and reopenable from the path (with
 * `onBack`). Credit is pulled from source metadata, never hardcoded; the line about generated
 * checks keeps a bad check from being blamed on the source (ADR-0017).
 */
export function Landing({
  source,
  onStart,
  onBack,
}: {
  source: SourceInfo
  onStart?: () => void
  onBack?: () => void
}) {
  return (
    <section className="landing">
      {onBack && (
        <header className="landing-head">
          <button type="button" className="back" aria-label={copy.pathBack} onClick={onBack}>
            ‹
          </button>
        </header>
      )}

      <div className="landing-hero">
        <h1 className="landing-title">{copy.appName}</h1>
        <div className="landing-points">
          <p className="landing-lead">{copy.landingWhat}</p>
          <p className="landing-step">{copy.landingWhy}</p>
          <p className="landing-step">{copy.landingHow}</p>
        </div>
      </div>

      <div className="landing-foot">
        <div className="landing-credit">
          <p className="landing-credit-text">{copy.landingCreditText(source.author)}</p>
          <p className="landing-credit-source">
            <a href={source.url} target="_blank" rel="noreferrer noopener">
              {source.name}
            </a>{' '}
            · {source.license}
          </p>
          <p className="landing-note">{copy.landingChecksNote}</p>
        </div>

        {onStart && (
          <button type="button" className="primary landing-start" onClick={onStart}>
            {copy.landingStart}
          </button>
        )}
      </div>
    </section>
  )
}
