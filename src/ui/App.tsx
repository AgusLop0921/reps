import { useMemo, useState } from 'react'
import { curriculum, questionsById } from '../content/load'
import type { Score } from '../content/schema'
import { buildLessonDeck, nextLesson } from '../core/curriculum'
import { Card } from './Card'
import { copy } from './copy'
import { EndOfLesson } from './EndOfLesson'

/**
 * The one screen (ADR-0010): boot straight into the current lesson and run its deck in
 * memory. No router, no home, no persistence — a reload starts the lesson over (Stage 3
 * adds storage). All business logic lives in core/; this only renders and tracks position.
 */
export function App() {
  // No stored progress yet, so this is always the first lesson of the first section.
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
  const [revealed, setRevealed] = useState(false)

  if (!lesson || !section) {
    return (
      <main className="app">
        <p className="app-tagline">{copy.noLesson}</p>
      </main>
    )
  }

  const header = (
    <header className="lesson-head">
      <span className="eyebrow">{section.title}</span>
      <h1 className="lesson-title">
        {copy.lessonLabel} {lesson.order}
      </h1>
      {index < deck.length && (
        <span className="progress">{copy.progress(index + 1, deck.length)}</span>
      )}
    </header>
  )

  if (index >= deck.length) {
    return (
      <main className="app">
        {header}
        <EndOfLesson
          onRestart={() => {
            setIndex(0)
            setRevealed(false)
          }}
        />
      </main>
    )
  }

  const card = deck[index]
  const question = questionsById.get(card.questionId)
  if (!question) {
    return (
      <main className="app">
        {header}
        <p className="app-tagline">{copy.noLesson}</p>
      </main>
    )
  }

  const onGrade = (score: Score): void => {
    // Stage 2 keeps no state: the grade only advances the deck. The scheduler (which turns
    // a Score into review timing) is wired in Stage 3 with persistence.
    void score
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  return (
    <main className="app">
      {header}
      <Card
        key={card.questionId}
        question={question}
        isReview={card.kind === 'review'}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onGrade={onGrade}
      />
    </main>
  )
}
