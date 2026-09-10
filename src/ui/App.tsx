import { useEffect, useMemo, useState } from 'react'
import { checksByQuestionId, questionsById, tracks, tracksById } from '../content/load'
import { findLesson } from '../content/catalog'
import type { LessonProgress, Progress, Score, Track } from '../content/schema'
import { orderedOptions, scoreForCheck } from '../core/checks'
import {
  buildLessonDeck,
  type DeckCard,
  lessonAfter,
  nextLesson,
  pathQuestionCount,
} from '../core/curriculum'
import { SOURCES } from '../content/sources'
import {
  advanceFromLanding,
  type FirstRunStep,
  initialStep,
  screenForStep,
  shouldOfferAccountChoice,
} from '../core/firstRun'
import { hasOnboarded, markOnboarded } from '../storage/onboarding'
import { Card } from './Card'
import { Account } from './Account'
import { AccountControl } from './AccountControl'
import { copy } from './copy'
import { EndOfLesson } from './EndOfLesson'
import { ErrorBoundary } from './ErrorBoundary'
import { Landing } from './Landing'
import { Onboarding } from './Onboarding'
import { Path } from './Path'
import repsIcon from './reps-icon.svg'
import { ThemeControl } from './ThemeControl'
import { TrackSelector } from './TrackSelector'
import { useAuth } from './useAuth'
import { useProgress } from './useProgress'
import { useSync } from './useSync'
import { useTheme } from './useTheme'

/** Questions actually on the path (not the raw import total), for the landing's scale line. */
const reactTrack = tracksById.get('react')
if (!reactTrack) throw new Error('missing React track')
const REACT_PATH_QUESTION_COUNT = pathQuestionCount(reactTrack.curriculum)
const PENDING_TRACK_ID_KEY = 'reps:pending-track-id'
type AccountReturnScreen = 'tracks' | 'path' | 'card'

/** A card answered incorrectly, kept so the end screen can resurface its explanation. */
type MissedCard = { questionId: string; title: string; explanation: string }

/** The deck for a lesson, built from progress at the moment it opens (not on every answer). */
function deckFor(
  track: Track,
  lessonId: string | null,
  progress: Progress[],
  lessonProgress: LessonProgress[],
  now: number,
): DeckCard[] {
  const located = findLesson(track, lessonId)
  if (!located) return []
  const lp = lessonProgress.find((l) => l.lessonId === located.lesson.id) ?? null
  return buildLessonDeck({ lesson: located.lesson, progress, lessonProgress: lp, now })
}

/**
 * The screens (ADR-0022): opening the app never drops you into a lesson. It lands on the home
 * — track selection when signed in, the landing otherwise — and a card is reached only by
 * choosing a track and tapping a trail node. Progress loads per track and is written back on
 * every answer (ADR-0005, ADR-0023). Business logic stays in core/.
 */
export function App() {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const selectedTrack = selectedTrackId ? (tracksById.get(selectedTrackId) ?? null) : null
  const { loading, loadedTrackId, progress, lessonProgress, answer, reload } =
    useProgress(selectedTrackId)
  const auth = useAuth()
  const { theme, setTheme } = useTheme()

  // null = not navigated yet, so the app shows the home screen (see `activeScreen`).
  const [screen, setScreen] = useState<
    'card' | 'path' | 'tracks' | 'landing' | 'account' | 'account-choice' | null
  >(null)
  const [accountReturnScreen, setAccountReturnScreen] = useState<AccountReturnScreen>('tracks')
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [deck, setDeck] = useState<DeckCard[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [missed, setMissed] = useState<MissedCard[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [firstRunStep, setFirstRunStep] = useState<FirstRunStep>(() =>
    initialStep(
      hasOnboarded() || window.sessionStorage.getItem(PENDING_TRACK_ID_KEY) !== null,
    ),
  )

  // Reload progress from storage after it changes underneath us (import, sync). On the
  // initial sync after sign-in, also re-land on the resumed lesson so a device that had done
  // more elsewhere picks up there rather than at lesson 1.
  const refreshFromStorage = async (reposition: boolean): Promise<void> => {
    const { progress: p, lessonProgress: lp } = await reload()
    if (reposition && selectedTrack) {
      const id = nextLesson(selectedTrack.curriculum, lp)?.id ?? null
      setLessonId(id)
      setDeck(deckFor(selectedTrack, id, p, lp, Date.now()))
      setIndex(0)
      setPicked(null)
      setMissed([])
    }
  }

  // Two-way sync while signed in (ADR-0020). No-op with no session or no Supabase.
  useSync(auth.userId, (isInitial) => refreshFromStorage(isInitial))

  // OAuth reloads the app. Keep the chosen track through that redirect, then open it once the
  // returned session has resolved instead of making the learner choose it a second time.
  useEffect(() => {
    if (auth.loading || auth.userId === null) return
    const trackId = window.sessionStorage.getItem(PENDING_TRACK_ID_KEY)
    if (!trackId) return
    window.sessionStorage.removeItem(PENDING_TRACK_ID_KEY)
    if (!tracksById.has(trackId)) return
    if (!hasOnboarded()) markOnboarded()
    setFirstRunStep('app')
    setSelectedTrackId(trackId)
    setLessonId(null)
    setDeck([])
    setIndex(0)
    setPicked(null)
    setMissed([])
    setScreen('path')
  }, [auth.loading, auth.userId])

  const openLesson = (id: string): void => {
    if (!selectedTrack) return
    setLessonId(id)
    setDeck(deckFor(selectedTrack, id, progress, lessonProgress, Date.now()))
    setIndex(0)
    setPicked(null)
    setMissed([])
    setNotice(null)
    setScreen('card')
  }

  const openTrack = (trackId: string): void => {
    if (!tracksById.has(trackId)) return
    setSelectedTrackId(trackId)
    setLessonId(null)
    setDeck([])
    setIndex(0)
    setPicked(null)
    setMissed([])
    setNotice(null)
    setScreen('path')
  }

  const selectTrack = (trackId: string): void => {
    if (!tracksById.has(trackId)) return
    if (
      shouldOfferAccountChoice({
        hasOnboarded: hasOnboarded(),
        authConfigured: auth.configured,
        signedIn: auth.userId !== null,
      })
    ) {
      setPendingTrackId(trackId)
      setNotice(null)
      setScreen('account-choice')
      return
    }
    if (!hasOnboarded()) {
      markOnboarded()
      setFirstRunStep('app')
    }
    openTrack(trackId)
  }

  const handleGoogleSignIn = (): void => {
    setIsSigningIn(true)
    if (pendingTrackId) window.sessionStorage.setItem(PENDING_TRACK_ID_KEY, pendingTrackId)
    void (async () => {
      try {
        await auth.signInWithGoogle()
      } catch {
        setIsSigningIn(false)
        setNotice(copy.syncError)
      }
    })()
  }

  const openAccount = (returnScreen: AccountReturnScreen): void => {
    setAccountReturnScreen(returnScreen)
    setNotice(null)
    setScreen('account')
  }

  // Leaving the landing opens track selection. The one-time account choice happens only after
  // the learner gives it context by selecting a track.
  const startFromLanding = (): void => {
    const { step } = advanceFromLanding()
    setScreen('tracks')
    setFirstRunStep(step)
  }

  const finishTrackAccountChoice = (): void => {
    const trackId = pendingTrackId
    if (!trackId) {
      setScreen('tracks')
      return
    }
    markOnboarded()
    setFirstRunStep('app')
    setPendingTrackId(null)
    openTrack(trackId)
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

  const located = useMemo(
    () => (selectedTrack ? findLesson(selectedTrack, lessonId) : null),
    [selectedTrack, lessonId],
  )

  // Wait on auth too: the home depends on whether we're signed in (ADR-0022).
  if (auth.loading || (selectedTrackId !== null && (loading || loadedTrackId !== selectedTrackId))) {
    return (
      <main className="app">
        <p className="empty">{copy.loading}</p>
      </main>
    )
  }

  // First run starts on the landing. Track selection owns the later optional account decision,
  // so learners choose a subject before deciding how its progress is stored.
  const firstRunScreen = screenForStep(firstRunStep)
  if (firstRunScreen === 'landing') {
    return (
      <main className="landing-shell">
        <Landing
          source={SOURCES['midudev-react']}
          questionCount={REACT_PATH_QUESTION_COUNT}
          syncConfigured={auth.configured}
          theme={theme}
          onSetTheme={setTheme}
          onStart={startFromLanding}
        />
      </main>
    )
  }
  if (screen === 'account-choice') {
    return (
      <main className="app">
        <Onboarding
          onGoogle={handleGoogleSignIn}
          onSkip={finishTrackAccountChoice}
          isSigningIn={isSigningIn}
          notice={notice}
        />
      </main>
    )
  }

  // The home when nothing is navigated: track selection if signed in, else the landing —
  // never the card (ADR-0022, ADR-0023). Auth is resolved, so this doesn't flicker.
  const activeScreen = screen ?? (auth.email ? 'tracks' : 'landing')

  // The landing as home: "Empezar" goes to track selection, not a lesson.
  if (activeScreen === 'landing') {
    return (
      <main className="landing-shell">
        <Landing
          source={SOURCES['midudev-react']}
          questionCount={REACT_PATH_QUESTION_COUNT}
          syncConfigured={auth.configured}
          theme={theme}
          onSetTheme={setTheme}
          onStart={() => setScreen('tracks')}
        />
      </main>
    )
  }

  if (activeScreen === 'tracks') {
    return (
      <main className="app app-wide">
        <TrackSelector
          tracks={tracks}
          theme={theme}
          onSetTheme={setTheme}
          onSelect={selectTrack}
          onBack={() => setScreen('landing')}
          authConfigured={auth.configured}
          profile={auth.profile}
          onOpenAccount={() => openAccount('tracks')}
        />
      </main>
    )
  }

  if (activeScreen === 'path' && selectedTrack) {
    return (
      <main className="app app-wide">
        <Path
          curriculum={selectedTrack.curriculum}
          progress={lessonProgress}
          authConfigured={auth.configured}
          profile={auth.profile}
          onOpenLesson={openLesson}
          onOpenAccount={() => openAccount('path')}
          theme={theme}
          onSetTheme={setTheme}
          onBack={() => setScreen('tracks')}
        />
      </main>
    )
  }

  if (activeScreen === 'account') {
    return (
      <main className="app">
        <Account
          email={auth.email}
          profile={auth.profile}
          notice={notice}
          isSigningIn={isSigningIn}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
          onBack={() => setScreen(accountReturnScreen)}
        />
      </main>
    )
  }

  if (!selectedTrack || !located) {
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
        className="path-home"
        aria-label={copy.pathBack}
        onClick={() => {
          setNotice(null)
          setScreen('path')
        }}
      >
        <img className="path-home-icon" src={repsIcon} alt="" width="30" height="30" />
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
      {auth.configured && <AccountControl profile={auth.profile} onOpen={() => openAccount('card')} />}
      <ThemeControl theme={theme} onSetTheme={setTheme} />
    </header>
  )

  if (index >= deck.length) {
    const upcoming = lessonAfter(selectedTrack.curriculum, lesson.id)
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
      <ErrorBoundary
        resetKey={card.questionId}
        onReset={() => {
          setNotice(null)
          setScreen('path')
        }}
      >
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
      </ErrorBoundary>
    </main>
  )
}
