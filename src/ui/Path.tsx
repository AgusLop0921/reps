import { useRef, useState } from 'react'
import type { Curriculum, LessonProgress } from '../content/schema'
import { isCompleted, isUnlocked, nextLesson } from '../core/curriculum'
import { type Theme } from '../core/theme'
import { copy } from './copy'
import { ThemeControl } from './ThemeControl'

/**
 * The path screen (ADR-0011): sections and their lessons. Status comes from core
 * (isUnlocked/isCompleted) applied to real stored progress (ADR-0005): completed lessons
 * are marked, the next lesson in a section unlocks once the previous is done, and the first
 * lesson of every section is always enterable — so an experienced user can start at Advanced.
 *
 * "acá" marks the next actionable lesson (nextLesson), not whichever lesson is open — a
 * completed lesson you are sitting on should not claim to be where the work is.
 */
export function Path({
  curriculum,
  progress,
  notice,
  authConfigured,
  authEmail,
  onOpenLesson,
  onViewIntro,
  onExport,
  onImport,
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
  onViewIntro: () => void
  onExport: () => void
  onImport: (file: File) => void
  onGoogleSignIn: () => void
  onSignIn: (email: string) => void
  onSignOut: () => void
  onDeleteAccount: () => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onBack: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const nextId = nextLesson(curriculum, progress)?.id ?? null

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) onImport(file)
    event.target.value = '' // let the same file be picked again after an error
  }

  const onSignInSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    if (email.trim()) onSignIn(email.trim())
  }

  return (
    <section className="path">
      <header className="path-head">
        <button type="button" className="back" aria-label={copy.pathBack} onClick={onBack}>
          ‹
        </button>
        <h1 className="path-title">{copy.pathTitle}</h1>
        <ThemeControl theme={theme} onSetTheme={onSetTheme} />
      </header>

      <div className="path-body">
        {curriculum.sections.map((section) => {
          const done = section.lessons.filter((l) => isCompleted(l, progress)).length
          const firstLesson = section.lessons.find((l) => l.order === 1)
          return (
            <div key={section.id} className="path-section">
              <div className="path-section-head">
                <span className="path-section-title">
                  {section.title} · {copy.sectionProgress(done, section.lessons.length)}
                </span>
                {firstLesson && (
                  <button
                    type="button"
                    className="path-enter"
                    onClick={() => onOpenLesson(firstLesson.id)}
                  >
                    {copy.sectionEnter}
                  </button>
                )}
              </div>
              <ul className="path-lessons">
                {section.lessons.map((lesson) => {
                  const unlocked = isUnlocked(lesson, section, progress)
                  const completed = isCompleted(lesson, progress)
                  const isNext = lesson.id === nextId
                  const cls = `path-lesson${isNext ? ' path-lesson-current' : ''}${unlocked ? '' : ' path-lesson-locked'}`
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={cls}
                        disabled={!unlocked}
                        onClick={() => onOpenLesson(lesson.id)}
                      >
                        <span className="path-lesson-num">{String(lesson.order).padStart(2, '0')}</span>
                        <span className="path-lesson-name">
                          {copy.lessonLabel} {lesson.order}
                        </span>
                        {completed && (
                          <span
                            className="path-lesson-done"
                            role="img"
                            aria-label={copy.lessonDoneLabel}
                          >
                            {copy.lessonDoneMark}
                          </span>
                        )}
                        <span className="path-lesson-tag">{isNext ? copy.pathCurrent : ''}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
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

        <details className="path-advanced">
          <summary className="path-advanced-summary">{copy.advanced}</summary>
          <div className="path-advanced-body">
            <button type="button" className="path-action" onClick={onExport}>
              {copy.exportProgress}
            </button>
            <button
              type="button"
              className="path-action"
              onClick={() => fileInput.current?.click()}
            >
              {copy.importProgress}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="path-file"
              onChange={onFileChange}
            />
          </div>
        </details>

        {notice && <p className="path-notice">{notice}</p>}

        <button type="button" className="path-intro-link" onClick={onViewIntro}>
          {copy.pathViewIntro}
        </button>
      </footer>
    </section>
  )
}
