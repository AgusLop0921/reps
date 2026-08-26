import { copy } from './copy'

/** A card the user answered incorrectly, shown so its explanation can be revisited. */
type Missed = { questionId: string; title: string; explanation: string }

/**
 * End of lesson (ADR-0010, ADR-0018): a finished lesson leads forward, not back into
 * itself. When there is a next lesson, its topic is announced so curiosity — not a generic
 * label — pulls the next tap; continuing and stopping each cost one tap, with no
 * interstitial and no celebration. The primary action is the next lesson; when the path is
 * finished it becomes the path itself. Restart stays a quiet tertiary link.
 *
 * Below the actions, the cards answered incorrectly, each reopening its explanation. No
 * score: on a teaching card the explanation was already on screen above the check, so a
 * number would measure attention, not knowledge. A missed card is worth revisiting; a
 * count isn't. Nothing missed, nothing shown.
 */
export function EndOfLesson({
  lessonOrder,
  hasNext,
  nextTopic,
  missed,
  onNext,
  onRestart,
  onPath,
}: {
  lessonOrder: number
  hasNext: boolean
  nextTopic: string | null
  missed: Missed[]
  onNext: () => void
  onRestart: () => void
  onPath: () => void
}) {
  return (
    <section className="end">
      <div className="end-kicker">
        {copy.lessonLabel} {lessonOrder} · {copy.endDone}
      </div>
      <h2 className="end-title">{copy.endTitle}</h2>
      {hasNext && nextTopic && (
        <div className="end-next">
          <span className="end-next-kicker">{copy.endNextKicker}</span>
          <span className="end-next-topic">{nextTopic}</span>
        </div>
      )}
      <div className="end-actions">
        {hasNext ? (
          <>
            <button type="button" className="primary" onClick={onNext}>
              {copy.endNext}
            </button>
            <button type="button" className="secondary" onClick={onPath}>
              {copy.pathBack}
            </button>
          </>
        ) : (
          <button type="button" className="primary" onClick={onPath}>
            {copy.pathBack}
          </button>
        )}
        <button type="button" className="tertiary" onClick={onRestart}>
          {copy.restart}
        </button>
      </div>

      {missed.length > 0 && (
        <div className="end-missed">
          <h3 className="end-missed-title">{copy.endMissedTitle}</h3>
          <ul className="end-missed-list">
            {missed.map((m) => (
              <li key={m.questionId}>
                <details className="end-missed-item">
                  <summary className="end-missed-q">{m.title}</summary>
                  <p className="end-missed-explanation">{m.explanation}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
