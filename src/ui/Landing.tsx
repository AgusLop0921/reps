import type { SourceInfo } from '../content/sources'
import { copy } from './copy'

/**
 * The landing (ADR-0021): what the app is, why, how, and a prominent source credit — read in
 * twenty seconds, not a marketing site. Shown once at first run (with `onStart`) and reopenable
 * from the path (with `onBack`). The credit is pulled from the source metadata (ADR-0007), so
 * the real author, repo link, and license render — never a placeholder. The line about the
 * generated checks keeps a bad check from being blamed on the source (ADR-0017).
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

      <div className="landing-body">
        <h1 className="landing-title">{copy.appName}</h1>
        <p className="landing-lead">{copy.landingWhat}</p>
        <p className="landing-text">{copy.landingWhy}</p>
        <p className="landing-text">{copy.landingHow}</p>

        <div className="landing-credit">
          <p className="landing-text">{copy.landingCreditText(source.author)}</p>
          <p className="landing-credit-source">
            <a href={source.url} target="_blank" rel="noreferrer noopener">
              {source.name}
            </a>{' '}
            · {source.license}
          </p>
          <p className="landing-note">{copy.landingChecksNote}</p>
        </div>
      </div>

      {onStart && (
        <div className="landing-cta">
          <button type="button" className="primary" onClick={onStart}>
            {copy.landingStart}
          </button>
        </div>
      )}
    </section>
  )
}
