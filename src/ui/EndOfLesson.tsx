import { copy } from './copy'

export function EndOfLesson({
  lessonOrder,
  onRestart,
}: {
  lessonOrder: number
  onRestart: () => void
}) {
  return (
    <section className="end">
      <div className="end-kicker">
        {copy.lessonLabel} {lessonOrder} · {copy.endDone}
      </div>
      <h2 className="end-title">{copy.endTitle}</h2>
      <p className="end-subtitle">{copy.endSubtitle}</p>
      <button type="button" className="primary" onClick={onRestart}>
        {copy.restart}
      </button>
    </section>
  )
}
