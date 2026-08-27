import { useEffect, useMemo, useState } from 'react'
import { checksByQuestionId, curriculum, questionsById } from '../content/load'
import type { Lesson, LessonProgress, Progress, Score, Section } from '../content/schema'
import { orderedOptions, scoreForCheck } from '../core/checks'
import { buildLessonDeck, type DeckCard, lessonAfter, nextLesson } from '../core/curriculum'
import { exportData, importData } from '../storage/repository'
import { Card } from './Card'
import { copy } from './copy'
import { EndOfLesson } from './EndOfLesson'
import { Path } from './Path'
import { useAuth } from './useAuth'
import { useProgress } from './useProgress'
import { useSync } from './useSync'

/** A card answered incorrectly, kept so the end screen can resurface its explanation. */
type MissedCard = { questionId: string; title: string; explanation: string }

/** The section a lesson belongs to, plus the lesson itself, looked up by id. */
function locate(lessonId: string | null): { lesson: Lesson; section: Section } | null {
  for (const section of curriculum.sections) {
    const lesson = section.lessons.find((l) => l.id === lessonId)
    if (lesson) return { lesson, section }
  }
  return null
}

/** The deck for a lesson, built from progress at the moment it opens (not on every answer). */
function deckFor(
  lessonId: string | null,
  progress: Progress[],
  lessonProgress: LessonProgress[],
  now: number,
): DeckCard[] {
  const located = locate(lessonId)
  if (!located) return []
  const lp = lessonProgress.find((l) => l.lessonId === located.lesson.id) ?? null
  return buildLessonDeck({ lesson: located.lesson, progress, lessonProgress: lp, now })
}

/**
 * The screens (ADR-0010): the app opens straight into the current lesson's card. Progress is
 * loaded from storage at boot and written back on every answer (ADR-0005), so reloading
 * resumes where the user left off. Business logic lives in core/; this renders, tracks
 * position, and passes `now` into the pure domain.
 */
export function App() {
  const { loading, progress, lessonProgress, answer, reload } = useProgress()
  const auth = useAuth()

  const [booted, setBooted] = useState(false)
  const [screen, setScreen] = useState<'card' | 'path'>('card')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [deck, setDeck] = useState<DeckCard[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [missed, setMissed] = useState<MissedCard[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  // Reload progress from storage after it changes underneath us (import, sync). On the
  // initial sync after sign-in, also re-land on the resumed lesson so a device that had done
  // more elsewhere picks up there rather than at lesson 1.
  const refreshFromStorage = async (reposition: boolean): Promise<void> => {
    const { progress: p, lessonProgress: lp } = await reload()
    if (reposition) {
      const id = nextLesson(curriculum, lp)?.id ?? null
      setLessonId(id)
      setDeck(deckFor(id, p, lp, Date.now()))
      setIndex(0)
      setPicked(null)
      setMissed([])
    }
  }

  // Two-way sync while signed in (ADR-0020). No-op with no session or no Supabase.
  useSync(auth.userId, (isInitial) => refreshFromStorage(isInitial))

  // Once storage has loaded, land on the resumed lesson and build its deck a single time.
  useEffect(() => {
    if (loading || booted) return
    const id = nextLesson(curriculum, lessonProgress)?.id ?? null
    setLessonId(id)
    setDeck(deckFor(id, progress, lessonProgress, Date.now()))
    setBooted(true)
  }, [loading, booted, lessonProgress, progress])

  const openLesson = (id: string): void => {
    setLessonId(id)
    setDeck(deckFor(id, progress, lessonProgress, Date.now()))
    setIndex(0)
    setPicked(null)
    setMissed([])
    setNotice(null)
    setScreen('card')
  }

  const handleExport = (): void => {
    void (async () => {
      const json = await exportData()
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'reps-progress.json'
      link.click()
      URL.revokeObjectURL(url)
    })()
  }

  // Replace all progress with an imported file, then re-land on the resumed lesson.
  const handleImport = (file: File): void => {
    void (async () => {
      try {
        await importData(await file.text())
      } catch {
        setNotice(copy.importError)
        return
      }
      await refreshFromStorage(true)
      setNotice(copy.importDone)
    })()
  }

  const handleSignIn = (email: string): void => {
    void (async () => {
      try {
        await auth.signIn(email)
        setNotice(copy.syncCheckEmail)
      } catch {
        setNotice(copy.syncError)
      }
    })()
  }

  const handleSignOut = (): void => {
    void auth.signOut()
  }

  // "Delete my account and everything in it" (ADR-0020): remote rows, auth user, and local.
  const handleDeleteAccount = (): void => {
    if (!window.confirm(copy.deleteConfirm)) return
    void (async () => {
      try {
        await auth.deleteAccount()
        await refreshFromStorage(true)
        setNotice(copy.accountDeleted)
      } catch {
        setNotice(copy.syncError)
      }
    })()
  }

  const located = useMemo(() => locate(lessonId), [lessonId])

  if (loading || !booted) {
    return (
      <main className="app">
        <p className="empty">{copy.loading}</p>
      </main>
    )
  }

  if (screen === 'path') {
    return (
      <main className="app">
        <Path
          curriculum={curriculum}
          progress={lessonProgress}
          notice={notice}
          authConfigured={auth.configured}
          authEmail={auth.email}
          onOpenLesson={openLesson}
          onExport={handleExport}
          onImport={handleImport}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
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
      <button
        type="button"
        className="back"
        aria-label={copy.pathBack}
        onClick={() => {
          setNotice(null)
          setScreen('path')
        }}
      >
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
    const upcoming = lessonAfter(curriculum, lesson.id)
    // The next lesson has no title (ADR-0016); its first question is its topic. Announcing
    // it lets curiosity, not a generic label, pull the next tap (ADR-0018).
    const nextTopic = upcoming
      ? (questionsById.get(upcoming.questionIds[0])?.question ?? null)
      : null
    return (
      <main className="app">
        {header}
        <EndOfLesson
          lessonOrder={lesson.order}
          hasNext={upcoming !== null}
          nextTopic={nextTopic}
          missed={missed}
          onNext={() => upcoming && openLesson(upcoming.id)}
          onRestart={() => {
            setIndex(0)
            setPicked(null)
            setMissed([])
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
  const reviewCount = progress.find((p) => p.questionId === card.questionId)?.history.length ?? 0
  const isLast = index === deck.length - 1
  const advanceLabel = isLast ? copy.finishLesson : copy.nextCard(index + 2, deck.length)

  const advance = (): void => {
    const now = Date.now()
    let score: Score | null = null
    if (check !== null && picked !== null) {
      const correct = orderedOptions(check, reviewCount)[picked].correct
      score = scoreForCheck(correct)
      if (!correct) {
        setMissed((m) => [
          ...m,
          { questionId: question.id, title: question.question, explanation: check.explanation },
        ])
      }
    }
    // Grade the card and record the answer; persistence is optimistic (ADR-0005).
    void answer({
      lessonId: lesson.id,
      lessonQuestionIds: lesson.questionIds,
      questionId: card.questionId,
      isLessonQuestion: card.kind === 'new',
      score,
      now,
    })
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
        reviewCount={reviewCount}
        picked={picked}
        onPick={setPicked}
        onAdvance={advance}
        advanceLabel={advanceLabel}
      />
    </main>
  )
}
