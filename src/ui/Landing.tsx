import type { SourceInfo } from '../content/sources'
import { type Theme } from '../core/theme'
import { copy } from './copy'
import repsIcon from './reps-icon.svg'
import { ThemeControl } from './ThemeControl'

/**
 * The landing (ADR-0021), "Diagonal" direction from the design prototype: a nav, a rule-framed
 * hero with an oversized wordmark, a numbered three-point "cómo funciona" section, a quiet
 * credit, and a footer. Shown once at first run (with `onStart`) and reopenable from the path
 * (with `onBack`). The credit is pulled from source metadata (ADR-0007), never hardcoded; the
 * note keeps a generated check from being blamed on the source (ADR-0017). "Cómo funciona" is
 * an in-page anchor; "Contacto" is dropped for want of a destination. The scale line states the
 * content's size as a fact, high up (count from the data, author from sources.ts).
 */
export function Landing({
  source,
  questionCount,
  theme,
  onSetTheme,
  onStart,
  onBack,
}: {
  source: SourceInfo
  questionCount: number
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onStart?: () => void
  onBack?: () => void
}) {
  return (
    <section className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          {onBack && (
            <button type="button" className="back" aria-label={copy.pathBack} onClick={onBack}>
              ‹
            </button>
          )}
          <img className="landing-brand-icon" src={repsIcon} alt={copy.appName} width="32" height="32" />
        </div>
        <div className="landing-nav-right">
          <div className="landing-nav-links">
            <a className="landing-nav-link" href="#landing-how">
              {copy.landingNavHow}
            </a>
            {onStart && (
              <button type="button" className="landing-nav-link" onClick={onStart}>
                {copy.landingNavStart}
              </button>
            )}
          </div>
          <ThemeControl theme={theme} onSetTheme={onSetTheme} />
        </div>
      </nav>

      <header className="landing-hero">
        <h1 className="landing-title">{copy.appName}</h1>
        <p className="landing-scale">{copy.landingScale(questionCount, source.author)}</p>
        <div className="landing-hero-body">
          <div className="landing-hero-text">
            <p className="landing-lead">{copy.landingLead}</p>
            <p className="landing-why">{copy.landingWhy}</p>
          </div>
          {onStart && (
            <div className="landing-hero-cta">
              <button type="button" className="landing-cta-btn" onClick={onStart}>
                {copy.landingCta} <span aria-hidden="true">→</span>
              </button>
              <p className="landing-cta-note">{copy.landingCtaNote}</p>
            </div>
          )}
        </div>
      </header>

      <section className="landing-how" id="landing-how">
        <div className="landing-rule">
          <span className="landing-eyebrow">{copy.landingHowEyebrow}</span>
          <span className="landing-eyebrow">{copy.landingHowEyebrowRight}</span>
        </div>
        <ol className="landing-points">
          {copy.landingPoints.map((point, i) => (
            <li key={point.title} className="landing-point">
              <span className="landing-point-num">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="landing-point-title">{point.title}</h2>
              <p className="landing-point-body">{point.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-credit">
        <span className="landing-eyebrow">{copy.landingCreditEyebrow}</span>
        <p className="landing-credit-text">
          {copy.landingCreditPre(source.author)}
          <a href={source.url} target="_blank" rel="noreferrer noopener">
            {source.name}
          </a>
          {copy.landingCreditPost(source.license)}
        </p>
        <p className="landing-credit-note">{copy.landingCreditNote}</p>
      </section>

      <footer className="landing-footer">
        <div className="landing-nav-links">
          {onStart && (
            <button type="button" className="landing-nav-link" onClick={onStart}>
              {copy.landingNavStart}
            </button>
          )}
          <a className="landing-nav-link" href="#landing-how">
            {copy.landingNavHow}
          </a>
        </div>
        <span className="landing-footer-meta">
          {copy.landingFooterMeta(source.author, source.license)}
        </span>
      </footer>
    </section>
  )
}
