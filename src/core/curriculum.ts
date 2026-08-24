import type { Curriculum, Lesson, LessonProgress, Progress, Section } from '../content/schema'
import { isDue } from './scheduler'

/**
 * The lesson path (ADR-0011) and how review folds into it (ADR-0012).
 * Pure: `now` is always a parameter.
 */

/** Review cards shown at the start of a lesson. Overflow is dropped, never queued. */
export const REVIEW_CARDS_PER_LESSON = 3

export function isCompleted(lesson: Lesson, progress: LessonProgress[]): boolean {
  return progress.some((p) => p.lessonId === lesson.id && p.completedAt !== null)
}

/**
 * A lesson is unlocked if it opens a section — so an experienced user can start at
 * Advanced — or if the previous lesson in the same section is done.
 */
export function isUnlocked(
  lesson: Lesson,
  section: Section,
  progress: LessonProgress[],
): boolean {
  if (lesson.order === 1) return true
  const previous = section.lessons.find((l) => l.order === lesson.order - 1)
  return previous ? isCompleted(previous, progress) : false
}

/** The lesson the user lands on when opening the app: first unlocked, not completed. */
export function nextLesson(
  curriculum: Curriculum,
  progress: LessonProgress[],
): Lesson | null {
  for (const section of curriculum.sections) {
    for (const lesson of section.lessons) {
      if (isCompleted(lesson, progress)) continue
      if (isUnlocked(lesson, section, progress)) return lesson
    }
  }
  return null
}

export type DeckCard =
  | { kind: 'review'; questionId: string }
  | { kind: 'new'; questionId: string }

/**
 * Builds what the user actually sees: up to three due cards from earlier lessons,
 * then the lesson's own questions. Cards already answered in this lesson are skipped,
 * so leaving and coming back resumes instead of restarting.
 */
export function buildLessonDeck({
  lesson,
  progress,
  lessonProgress,
  now,
}: {
  lesson: Lesson
  progress: Progress[]
  lessonProgress: LessonProgress | null
  now: number
}): DeckCard[] {
  const answered = new Set(lessonProgress?.answeredQuestionIds ?? [])
  const inLesson = new Set(lesson.questionIds)

  const review = progress
    .filter((p) => !inLesson.has(p.questionId) && isDue(p, now))
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, REVIEW_CARDS_PER_LESSON)
    .map((p): DeckCard => ({ kind: 'review', questionId: p.questionId }))

  const fresh = lesson.questionIds
    .filter((id) => !answered.has(id))
    .map((id): DeckCard => ({ kind: 'new', questionId: id }))

  return [...review, ...fresh]
}

/** Ratio of completed lessons, for the path screen. */
export function sectionCompletion(section: Section, progress: LessonProgress[]): number {
  const done = section.lessons.filter((l) => isCompleted(l, progress)).length
  return done / section.lessons.length
}
