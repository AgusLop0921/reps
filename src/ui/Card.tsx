import type { Question, Score } from '../content/schema'
import { SOURCES } from '../content/sources'
import { copy } from './copy'
import { Markdown } from './Markdown'

const GRADES: Score[] = [1, 2, 3, 4]

export function Card({
  question,
  isReview,
  revealed,
  onReveal,
  onGrade,
}: {
  question: Question
  isReview: boolean
  revealed: boolean
  onReveal: () => void
  onGrade: (score: Score) => void
}) {
  const source = SOURCES[question.sourceId]

  return (
    <article className="card">
      <div className="card-body">
        {isReview && <span className="badge">{copy.reviewBadge}</span>}
        <h2 className="question">{question.question}</h2>

        {revealed && (
          <div className="answer">
            <Markdown>{question.answerMd}</Markdown>
          </div>
        )}

        {source && (
          <footer className="attribution">
            {copy.sourceLabel}:{' '}
            <a href={source.url} target="_blank" rel="noreferrer noopener">
              {source.name}
            </a>{' '}
            {copy.sourceBy} {source.author}
          </footer>
        )}
      </div>

      <div className="controls">
        {revealed ? (
          <>
            <p className="grade-prompt">{copy.gradePrompt}</p>
            <div className="grades">
              {GRADES.map((score) => (
                <button
                  key={score}
                  className={`grade grade-${score}`}
                  onClick={() => onGrade(score)}
                >
                  {copy.grades[score]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button className="primary" onClick={onReveal}>
            {copy.reveal}
          </button>
        )}
      </div>
    </article>
  )
}
