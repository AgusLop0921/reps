import { useState } from 'react'
import type { Curriculum, Lesson, LessonProgress, Section } from '../content/schema'
import { isCompleted, nextLesson, nodeState, type NodeState } from '../core/curriculum'
import { type Theme } from '../core/theme'
import { copy } from './copy'
import { ThemeControl } from './ThemeControl'

/** A checkmark for done nodes — an inline SVG shape, no icon library. */
function Check() {
  return (
    <svg className="trail-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A star for the section-complete node — the one celebratory shape. */
function Star() {
  return (
    <svg className="trail-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.7 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.3 19.6l1.4-6.3L2.9 9l6.4-.6z"
        fill="currentColor"
      />
    </svg>
  )
}

/** The zigzag: nodes wave center → right → center → left as they descend (learning-path Phase 1). */
const OFFSETS = [0, 1, 0, -1]

function TrailNode({
  lesson,
  state,
  onOpen,
}: {
  lesson: Lesson
  state: NodeState
  onOpen: (id: string) => void
}) {
  const offset = OFFSETS[(lesson.order - 1) % OFFSETS.length]
  return (
    <li className="trail-item" style={{ transform: `translateX(${offset * 56}px)` }}>
      <button
        type="button"
        className={`trail-node trail-node-${state}`}
        disabled={state === 'locked'}
        aria-label={`${copy.lessonLabel} ${lesson.order} · ${copy.nodeStateLabel[state]}`}
        onClick={() => onOpen(lesson.id)}
      >
        {state === 'done' ? (
          <Check />
        ) : (
          <span className="trail-num">{String(lesson.order).padStart(2, '0')}</span>
        )}
      </button>
      {state === 'current' && (
        <span className="trail-label">
          {copy.lessonLabel} {lesson.order}
        </span>
      )}
    </li>
  )
}

/**
 * The learning-path trail (Phase 1): one section per screen, paged, with node states derived
 * from real progress (core/nodeState). Done = filled circle + check; current = ring + number +
 * label, the only named and animated node; locked = flat, dim number — no padlock, no grey.
 * Review stays inside lessons (ADR-0012): no stops on the trail. Titles are "Lección N"
 * (ADR-0016): named units and per-lesson titles are Phase 2, not built here.
 */
export function Path({
  curriculum,
  progress,
  notice,
  authConfigured,
  authEmail,
  onOpenLesson,
  onGoogleSignIn,
  onSignIn,
  onSignOut,
  onDeleteAccount,
  theme,
  onSetTheme,
  onBack,
}: {
  curriculum: Curriculum
  progress: LessonProgress[]
  notice: string | null
  authConfigured: boolean
  authEmail: string | null
  onOpenLesson: (lessonId: string) => void
  onGoogleSignIn: () => void
  onSignIn: (email: string) => void
  onSignOut: () => void
  onDeleteAccount: () => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onBack: () => void
}) {
  const [email, setEmail] = useState('')

  const onSignInSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    if (email.trim()) onSignIn(email.trim())
  }

  const sections = curriculum.sections
  // Open on the section holding the next actionable lesson; if the whole path is done, the last.
  const next = nextLesson(curriculum, progress)
  const activeIndex = next
    ? Math.max(
        0,
        sections.findIndex((s) => s.lessons.some((l) => l.id === next.id)),
      )
    : sections.length - 1
  const [sectionIndex, setSectionIndex] = useState(activeIndex)

  const section: Section = sections[sectionIndex]
  const doneCount = section.lessons.filter((l) => isCompleted(l, progress)).length
  const total = section.lessons.length
  const sectionComplete = doneCount === total
  const nextSection = sections[sectionIndex + 1] ?? null

  return (
    <section className="path">
      <header className="path-head">
        <button type="button" className="back" aria-label={copy.pathBack} onClick={onBack}>
          ‹
        </button>
        <ThemeControl theme={theme} onSetTheme={onSetTheme} />
      </header>

      <div className="path-body">
        <div className="trail-pager">
          <button
            type="button"
            className="trail-pager-arrow"
            aria-label={copy.prevSection}
            disabled={sectionIndex === 0}
            onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
          >
            ‹
          </button>
          <div className="trail-pager-label">
            <span className="trail-pager-name">{section.title}</span>
            <span className="trail-pager-progress">{copy.sectionProgress(doneCount, total)}</span>
          </div>
          <button
            type="button"
            className="trail-pager-arrow"
            aria-label={copy.nextSection}
            disabled={sectionIndex === sections.length - 1}
            onClick={() => setSectionIndex((i) => Math.min(sections.length - 1, i + 1))}
          >
            ›
          </button>
        </div>
        <div
          className="trail-progress"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemax={total}
        >
          <div className="trail-progress-fill" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>

        {sectionComplete ? (
          <div className="trail-complete">
            <div className="trail-trophy">
              <Star />
            </div>
            <span className="trail-complete-eyebrow">{copy.sectionDone}</span>
            <h2 className="trail-complete-title">{copy.sectionDoneTitle(section.title)}</h2>
            <p className="trail-complete-note">{copy.sectionDoneNote}</p>
            {nextSection && (
              <button
                type="button"
                className="primary"
                onClick={() => setSectionIndex((i) => i + 1)}
              >
                {copy.openNextSection(nextSection.title)}
              </button>
            )}
          </div>
        ) : (
          <ol className="trail">
            {section.lessons.map((lesson) => (
              <TrailNode
                key={lesson.id}
                lesson={lesson}
                state={nodeState(lesson, section, progress)}
                onOpen={onOpenLesson}
              />
            ))}
          </ol>
        )}
      </div>

      <footer className="path-actions">
        {authConfigured && (
          <div className="path-sync">
            {authEmail ? (
              <>
                <span className="path-note">{copy.syncedAs(authEmail)}</span>
                <div className="path-sync-row">
                  <button type="button" className="path-action" onClick={onSignOut}>
                    {copy.signOut}
                  </button>
                  <button type="button" className="path-action" onClick={onDeleteAccount}>
                    {copy.deleteAccount}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="path-note">{copy.syncTitle}</span>
                <button type="button" className="path-action" onClick={onGoogleSignIn}>
                  {copy.googleSignIn}
                </button>
                <form className="path-sync-form" onSubmit={onSignInSubmit}>
                  <div className="path-sync-row">
                    <input
                      id="sync-email"
                      type="email"
                      required
                      className="path-email"
                      placeholder={copy.syncEmailPlaceholder}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <button type="submit" className="path-action">
                      {copy.syncSend}
                    </button>
                  </div>
                </form>
              </>
            )}
            <p className="path-note">{copy.syncPrivacy}</p>
          </div>
        )}

        {notice && <p className="path-notice">{notice}</p>}
      </footer>
    </section>
  )
}
