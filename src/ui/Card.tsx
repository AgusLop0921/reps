import type { Check as CheckData, Question } from '../content/schema'
import { SOURCES } from '../content/sources'
import { Check } from './Check'
import { copy } from './copy'
import { Markdown } from './Markdown'

/**
 * The teaching card (ADR-0010, ADR-0012). Explanation and code are visible immediately — no
 * reveal step. Below them, the generated check for this question. A card with no check (or a
 * failed load) still works: read, continue. The advance control appears once the check is
 * answered, or right away when there is no check.
 */
export function Card({
  question,
  check,
  sectionTitle,
  lessonOrder,
  isReview,
  reviewCount,
  picked,
  onPick,
  onAdvance,
  advanceLabel,
}: {
  question: Question
  check: CheckData | null
  sectionTitle: string
  lessonOrder: number
  isReview: boolean
  reviewCount: number
  picked: number | null
  onPick: (index: number) => void
  onAdvance: () => void
  advanceLabel: string
}) {
  const source = SOURCES[question.sourceId]
  const canAdvance = check ? picked !== null : true

  return (
    <article className="card">
      <div className="card-body">
        <div className="card-head">
          <div className="card-kicker">
            {sectionTitle} · {copy.lessonLabel} {lessonOrder}
            {isReview ? ` · ${copy.reviewBadge}` : ''}
          </div>
          <h1 className="card-title">{question.question}</h1>
        </div>

        <div className="teaching">
          <Markdown>{question.answerMd}</Markdown>
        </div>

        {source && (
          <footer className="attribution">
            {copy.sourcePrefix}{' '}
            <a href={source.url} target="_blank" rel="noreferrer noopener">
              {source.name}
            </a>{' '}
            · {source.license}
          </footer>
        )}

        {check && (
          <Check check={check} reviewCount={reviewCount} picked={picked} onPick={onPick} />
        )}
      </div>

      <div className="controls">
        {canAdvance && (
          <button type="button" className="primary" onClick={onAdvance}>
            {advanceLabel}
          </button>
        )}
      </div>
    </article>
  )
}
