import type { SourceInfo } from '../content/sources'
import { type Theme } from '../core/theme'
import { copy } from './copy'
import { HeroConstellation } from './HeroConstellation'
import repsIcon from './reps-icon.svg'
import cardDark from './shots/card-dark.png'
import cardLight from './shots/card-light.png'
import trailDark from './shots/trail-dark.png'
import trailLight from './shots/trail-light.png'
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
  syncConfigured,
  theme,
  onSetTheme,
  onStart,
  onBack,
}: {
  source: SourceInfo
  questionCount: number
  syncConfigured: boolean
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
        <HeroConstellation theme={theme} />
        <h1 className="landing-title">{copy.appName}</h1>
        <div className="landing-scale">
          <p className="landing-scale-main">{copy.landingScale(questionCount)}</p>
          <p className="landing-scale-sub">{copy.landingScaleSub}</p>
        </div>
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
              <p className="landing-cta-note">
                {syncConfigured ? copy.landingCtaNoteSync : copy.landingCtaNote}
              </p>
            </div>
          )}
        </div>
      </header>

      <section className="landing-how" id="landing-how">
        <div className="landing-rule">
          <span className="landing-eyebrow">{copy.landingHowEyebrow}</span>
        </div>
        {/* A question on the left, a plain description of a lesson on the right. */}
        <div className="landing-feature">
          <figure className="landing-feature-shot">
            <img className="landing-shot-img shot-dark" src={cardDark} alt="" width="585" height="1050" />
            <img className="landing-shot-img shot-light" src={cardLight} alt="" width="585" height="1050" />
          </figure>
          <div className="landing-feature-text">
            <span className="landing-eyebrow">{copy.landingShotQuestion}</span>
            <div className="landing-point">
              <h2 className="landing-point-title">{copy.landingQuestionTitle}</h2>
              <p className="landing-point-body">{copy.landingQuestionBody}</p>
              <p className="landing-point-body">{copy.landingQuestionBody2}</p>
            </div>
          </div>
        </div>

        {/* The path on the right, the numbered points on the left. */}
        <div className="landing-feature landing-feature-reverse">
          <figure className="landing-feature-shot">
            <img className="landing-shot-img shot-dark" src={trailDark} alt="" width="585" height="1050" />
            <img className="landing-shot-img shot-light" src={trailLight} alt="" width="585" height="1050" />
          </figure>
          <div className="landing-feature-text">
            <span className="landing-eyebrow">{copy.landingShotTrail}</span>
            <ol className="landing-points">
              {copy.landingPoints.map((point, i) => (
                <li key={point.title} className="landing-point">
                  <span className="landing-point-num">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="landing-point-title">{point.title}</h2>
                  <p className="landing-point-body">{point.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="landing-close">
        <h2 className="landing-close-title">{copy.landingCloseTitle}</h2>
        <p className="landing-close-body">{copy.landingCloseBody}</p>
        <p className="landing-close-remate">{copy.landingCloseRemate}</p>
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
