import { useEffect, useState } from 'react'
import type { LessonProgress, Progress, Score } from '../content/schema'
import { initialProgress, review } from '../core/scheduler'
import {
  getAllLessonProgress,
  getAllProgress,
  putLessonProgress,
  putProgress,
} from '../storage/repository'

/**
 * One answered card. `score` is null when the card had no check — there is no grading
 * signal, so it counts toward lesson completion but never schedules a review (ADR-0019).
 * `isLessonQuestion` is false for review cards, which reschedule but don't advance the
 * lesson's own completion.
 */
type AnswerInput = {
  lessonId: string
  lessonQuestionIds: string[]
  questionId: string
  isLessonQuestion: boolean
  score: Score | null
  now: number
}

/**
 * Loads progress from storage at boot and writes it back on every answer, so reloading
 * resumes where the user left off (ADR-0005). The clock stays out of `core`: the caller
 * passes `now` in, and the scheduler (`review`) is pure. This hook is the seam between the
 * pure domain and IndexedDB.
 */
export function useProgress() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])

  useEffect(() => {
    let active = true
    void (async () => {
      const [p, lp] = await Promise.all([getAllProgress(), getAllLessonProgress()])
      if (!active) return
      setProgress(p)
      setLessonProgress(lp)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  async function reload(): Promise<{ progress: Progress[]; lessonProgress: LessonProgress[] }> {
    const [p, lp] = await Promise.all([getAllProgress(), getAllLessonProgress()])
    setProgress(p)
    setLessonProgress(lp)
    return { progress: p, lessonProgress: lp }
  }

  async function answer(input: AnswerInput): Promise<void> {
    const { lessonId, lessonQuestionIds, questionId, isLessonQuestion, score, now } = input

    if (score !== null) {
      const current =
        progress.find((p) => p.questionId === questionId) ?? initialProgress(questionId, now)
      const updated = review(current, score, now)
      await putProgress(updated)
      setProgress((prev) => [...prev.filter((p) => p.questionId !== questionId), updated])
    }

    if (isLessonQuestion) {
      const lp = lessonProgress.find((l) => l.lessonId === lessonId) ?? {
        lessonId,
        answeredQuestionIds: [],
        completedAt: null,
        updatedAt: now,
      }
      const answeredQuestionIds = lp.answeredQuestionIds.includes(questionId)
        ? lp.answeredQuestionIds
        : [...lp.answeredQuestionIds, questionId]
      const done = lessonQuestionIds.every((id) => answeredQuestionIds.includes(id))
      const updated: LessonProgress = {
        ...lp,
        answeredQuestionIds,
        completedAt: done ? (lp.completedAt ?? now) : lp.completedAt,
        updatedAt: now,
      }
      await putLessonProgress(updated)
      setLessonProgress((prev) => [...prev.filter((l) => l.lessonId !== lessonId), updated])
    }
  }

  return { loading, progress, lessonProgress, answer, reload }
}
