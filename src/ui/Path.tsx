import type { Curriculum, LessonProgress } from '../content/schema'
import { isCompleted, isUnlocked } from '../core/curriculum'
import { copy } from './copy'

/**
 * The path screen (ADR-0011): sections and their lessons. Status comes from core
 * (isUnlocked/isCompleted) applied to real stored progress (ADR-0005): completed lessons
 * are marked, the next lesson in a section unlocks once the previous is done, and the first
 * lesson of every section is always enterable — so an experienced user can start at Advanced.
 */
export function Path({
  curriculum,
  currentLessonId,
  progress,
  onOpenLesson,
  onBack,
}: {
  curriculum: Curriculum
  currentLessonId: string | null
  progress: LessonProgress[]
  onOpenLesson: (lessonId: string) => void
  onBack: () => void
}) {
  return (
    <section className="path">
      <header className="path-head">
        <button type="button" className="back" aria-label={copy.pathBack} onClick={onBack}>
          ‹
        </button>
        <h1 className="path-title">{copy.pathTitle}</h1>
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
                  const current = lesson.id === currentLessonId
                  const cls = `path-lesson${current ? ' path-lesson-current' : ''}${unlocked ? '' : ' path-lesson-locked'}`
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
                        <span className="path-lesson-tag">{current ? copy.pathCurrent : ''}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
