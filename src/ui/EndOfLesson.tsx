import { copy } from './copy'

export function EndOfLesson({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="end">
      <h2 className="end-title">{copy.endTitle}</h2>
      <p className="end-subtitle">{copy.endSubtitle}</p>
      <button className="primary" onClick={onRestart}>
        {copy.restart}
      </button>
    </section>
  )
}
