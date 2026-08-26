import { copy } from './copy'

/** A card the user answered incorrectly, shown so its explanation can be revisited. */
type Missed = { questionId: string; title: string; explanation: string }

/**
 * End of lesson (ADR-0010): a finished lesson leads forward, not back into itself. The
 * primary action is the next lesson in the path; when the path is finished it becomes the
 * path itself. Restart stays as a quiet tertiary link — cheap, but never the main action.
 *
 * Below the actions, the cards answered incorrectly, each reopening its explanation. No
 * score: on a teaching card the explanation was already on screen above the check, so a
 * number would measure attention, not knowledge. A missed card is worth revisiting; a
 * count isn't. Nothing missed, nothing shown.
 */
export function EndOfLesson({
  lessonOrder,
  hasNext,
  missed,
  onNext,
  onRestart,
  onPath,
}: {
  lessonOrder: number
  hasNext: boolean
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
      <p className="end-subtitle">{copy.endSubtitle}</p>
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
