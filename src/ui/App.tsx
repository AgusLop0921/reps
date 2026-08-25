import { useMemo, useState } from 'react'
import { checksByQuestionId, curriculum, questionsById } from '../content/load'
import { buildLessonDeck, nextLesson } from '../core/curriculum'
import { Card } from './Card'
import { copy } from './copy'
import { EndOfLesson } from './EndOfLesson'

/**
 * The one screen (ADR-0010): boot straight into the current lesson and run its deck in
 * memory. No stored progress yet (Stage 3 grading is in memory; persistence is next), so a
 * reload restarts the lesson. Business logic lives in core/ and the shuffle in core/checks.
 */
export function App() {
  const lesson = useMemo(() => nextLesson(curriculum, []), [])
  const section = useMemo(
    () => curriculum.sections.find((s) => s.lessons.some((l) => l.id === lesson?.id)) ?? null,
    [lesson],
  )
  const deck = useMemo(
    () =>
      lesson ? buildLessonDeck({ lesson, progress: [], lessonProgress: null, now: Date.now() }) : [],
    [lesson],
  )

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  if (!lesson || !section) {
    return (
      <main className="app">
        <p className="empty">{copy.noLesson}</p>
      </main>
    )
  }

  const header = (
    <header className="lesson-head">
      <div className="segments">
        {deck.map((_, k) => {
          const done = k < index || (k === index && picked !== null)
          const current = k === index && picked === null
          return <span key={k} className={`seg${done ? ' seg-done' : current ? ' seg-current' : ''}`} />
        })}
      </div>
      {index < deck.length && (
        <span className="card-count">{copy.cardCount(index + 1, deck.length)}</span>
      )}
    </header>
  )

  if (index >= deck.length) {
    return (
      <main className="app">
        {header}
        <EndOfLesson
          lessonOrder={lesson.order}
          onRestart={() => {
            setIndex(0)
            setPicked(null)
          }}
        />
      </main>
    )
  }

  const card = deck[index]
  const question = questionsById.get(card.questionId)
  if (!question) {
    // A deck id with no question should never happen post-validation; skip rather than crash.
    return (
      <main className="app">
        {header}
        <p className="empty">{copy.noLesson}</p>
      </main>
    )
  }

  const check = checksByQuestionId.get(card.questionId) ?? null
  const isLast = index === deck.length - 1
  const advanceLabel = isLast ? copy.finishLesson : copy.nextCard(index + 2, deck.length)

  const advance = (): void => {
    setPicked(null)
    setIndex((i) => i + 1)
  }

  return (
    <main className="app">
      {header}
      <Card
        key={card.questionId}
        question={question}
        check={check}
        sectionTitle={section.title}
        lessonOrder={lesson.order}
        isReview={card.kind === 'review'}
        reviewCount={0}
        picked={picked}
        onPick={setPicked}
        onAdvance={advance}
        advanceLabel={advanceLabel}
      />
    </main>
  )
}
