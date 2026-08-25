import { copy } from './copy'

export function EndOfLesson({
  lessonOrder,
  onRestart,
  onPath,
}: {
  lessonOrder: number
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
        <button type="button" className="primary" onClick={onRestart}>
          {copy.restart}
        </button>
        <button type="button" className="secondary" onClick={onPath}>
          {copy.pathBack}
        </button>
      </div>
    </section>
  )
}
