import { copy } from './copy'

/**
 * End of lesson (ADR-0010): a finished lesson leads forward, not back into itself. The
 * primary action is the next lesson in the path; when the path is finished it becomes the
 * path itself. Restart stays as a quiet tertiary link — cheap, but never the main action.
 */
export function EndOfLesson({
  lessonOrder,
  hasNext,
  onNext,
  onRestart,
  onPath,
}: {
  lessonOrder: number
  hasNext: boolean
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
    </section>
  )
}
