import { useMemo, useState } from 'react'
import { checksByQuestionId, curriculum, questionsById } from '../content/load'
import type { Lesson, Section } from '../content/schema'
import { buildLessonDeck, nextLesson } from '../core/curriculum'
import { Card } from './Card'
import { copy } from './copy'
import { EndOfLesson } from './EndOfLesson'
import { Path } from './Path'

/** The section a lesson belongs to, plus the lesson itself, looked up by id. */
function locate(lessonId: string | null): { lesson: Lesson; section: Section } | null {
  for (const section of curriculum.sections) {
    const lesson = section.lessons.find((l) => l.id === lessonId)
    if (lesson) return { lesson, section }
  }
  return null
}

/**
 * The screens (ADR-0010): the app opens straight into the current lesson's card and runs its
 * deck in memory. The path screen is reachable but read-only; onboarding and persistence are
 * the next stage. Business logic lives in core/; this only renders and tracks position.
 */
export function App() {
  const firstLessonId = useMemo(() => nextLesson(curriculum, [])?.id ?? null, [])

  const [screen, setScreen] = useState<'card' | 'path'>('card')
  const [lessonId, setLessonId] = useState<string | null>(firstLessonId)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const located = useMemo(() => locate(lessonId), [lessonId])
  const deck = useMemo(
    () =>
      located
        ? buildLessonDeck({ lesson: located.lesson, progress: [], lessonProgress: null, now: Date.now() })
        : [],
    [located],
  )

  const openLesson = (id: string): void => {
    setLessonId(id)
    setIndex(0)
    setPicked(null)
    setScreen('card')
  }

  if (screen === 'path') {
    return (
      <main className="app">
        <Path
          curriculum={curriculum}
          currentLessonId={lessonId}
          onOpenLesson={openLesson}
          onBack={() => setScreen('card')}
        />
      </main>
    )
  }

  if (!located) {
    return (
      <main className="app">
        <p className="empty">{copy.noLesson}</p>
      </main>
    )
  }
  const { lesson, section } = located

  const header = (
    <header className="lesson-head">
      <button type="button" className="back" aria-label={copy.pathBack} onClick={() => setScreen('path')}>
        ‹
      </button>
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
          onPath={() => setScreen('path')}
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
