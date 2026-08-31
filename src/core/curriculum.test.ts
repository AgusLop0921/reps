import { describe, expect, it } from 'vitest'
import type { Curriculum, Lesson, LessonProgress, Section } from '../content/schema'
import {
  buildLessonDeck,
  isCompleted,
  isUnlocked,
  lessonAfter,
  nextLesson,
  nodeState,
  sectionCompletion,
} from './curriculum'
import { initialProgress } from './scheduler'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)

const qid = (n: number) => String(n).padStart(12, 'q')

const lesson = (id: string, order: number, questionIds: string[]): Lesson => ({
  id,
  order,
  questionIds,
})

const section = (id: string, lessons: Lesson[]): Section => ({
  id,
  title: id,
  sourceId: 'test',
  lessons,
})

const done = (lessonId: string): LessonProgress => ({
  lessonId,
  answeredQuestionIds: [],
  completedAt: NOW,
  updatedAt: NOW,
})

describe('nodeState', () => {
  const basic = section('basic', [
    lesson('b1', 1, [qid(1)]),
    lesson('b2', 2, [qid(2)]),
    lesson('b3', 3, [qid(3)]),
  ])

  it('marks completed lessons done, the next actionable one current, the rest locked', () => {
    const progress = [done('b1')]
    expect(nodeState(basic.lessons[0], basic, progress)).toBe('done')
    expect(nodeState(basic.lessons[1], basic, progress)).toBe('current')
    expect(nodeState(basic.lessons[2], basic, progress)).toBe('locked')
  })

  it('makes the first lesson current in a fresh section', () => {
    expect(nodeState(basic.lessons[0], basic, [])).toBe('current')
    expect(nodeState(basic.lessons[1], basic, [])).toBe('locked')
  })

  it('has no current node once the section is complete', () => {
    const all = [done('b1'), done('b2'), done('b3')]
    expect(basic.lessons.map((l) => nodeState(l, basic, all))).toEqual(['done', 'done', 'done'])
  })
})

describe('isUnlocked', () => {
  const basic = section('basic', [
    lesson('b1', 1, [qid(1)]),
    lesson('b2', 2, [qid(2)]),
    lesson('b3', 3, [qid(3)]),
  ])

  it('always unlocks the first lesson of a section', () => {
    expect(isUnlocked(basic.lessons[0], basic, [])).toBe(true)
  })

  it('keeps later lessons locked until the previous one is done', () => {
    expect(isUnlocked(basic.lessons[1], basic, [])).toBe(false)
    expect(isUnlocked(basic.lessons[1], basic, [done('b1')])).toBe(true)
  })

  it('does not unlock two lessons ahead', () => {
    expect(isUnlocked(basic.lessons[2], basic, [done('b1')])).toBe(false)
  })
})

describe('nextLesson', () => {
  const curriculum: Curriculum = {
    generatedAt: '2026-08-24',
    sections: [
      section('basic', [lesson('b1', 1, [qid(1)]), lesson('b2', 2, [qid(2)])]),
      section('advanced', [lesson('a1', 1, [qid(3)])]),
    ],
  }

  it('starts at the very first lesson', () => {
    expect(nextLesson(curriculum, [])?.id).toBe('b1')
  })

  it('advances within a section', () => {
    expect(nextLesson(curriculum, [done('b1')])?.id).toBe('b2')
  })

  it('lets an experienced user skip ahead: advanced is reachable from the start', () => {
    const advanced = curriculum.sections[1]
    expect(isUnlocked(advanced.lessons[0], advanced, [])).toBe(true)
  })

  it('moves to the next section once the previous one is finished', () => {
    expect(nextLesson(curriculum, [done('b1'), done('b2')])?.id).toBe('a1')
  })

  it('returns null when the whole path is complete', () => {
    expect(nextLesson(curriculum, [done('b1'), done('b2'), done('a1')])).toBeNull()
  })
})

describe('lessonAfter', () => {
  const curriculum: Curriculum = {
    generatedAt: '2026-08-24',
    sections: [
      section('basic', [lesson('b1', 1, [qid(1)]), lesson('b2', 2, [qid(2)])]),
      section('advanced', [lesson('a1', 1, [qid(3)])]),
    ],
  }

  it('returns the next lesson within a section', () => {
    expect(lessonAfter(curriculum, 'b1')?.id).toBe('b2')
  })

  it('crosses into the next section at a section boundary', () => {
    expect(lessonAfter(curriculum, 'b2')?.id).toBe('a1')
  })

  it('returns null at the end of the path', () => {
    expect(lessonAfter(curriculum, 'a1')).toBeNull()
  })

  it('returns null for an unknown lesson', () => {
    expect(lessonAfter(curriculum, 'nope')).toBeNull()
  })
})

describe('buildLessonDeck', () => {
  const current = lesson('b2', 2, [qid(10), qid(11), qid(12)])

  it('opens with due cards from earlier lessons, then the new ones', () => {
    const progress = [{ ...initialProgress(qid(1), NOW), dueAt: NOW - DAY }]
    const deck = buildLessonDeck({ lesson: current, progress, lessonProgress: null, now: NOW })

    expect(deck[0]).toEqual({ kind: 'review', questionId: qid(1) })
    expect(deck).toHaveLength(4)
  })

  it('caps review cards at three and drops the overflow', () => {
    const progress = [1, 2, 3, 4, 5].map((n) => ({
      ...initialProgress(qid(n), NOW),
      dueAt: NOW - n * DAY,
    }))
    const deck = buildLessonDeck({ lesson: current, progress, lessonProgress: null, now: NOW })

    expect(deck.filter((c) => c.kind === 'review')).toHaveLength(3)
  })

  it('shows the most overdue review first', () => {
    const progress = [
      { ...initialProgress(qid(1), NOW), dueAt: NOW - DAY },
      { ...initialProgress(qid(2), NOW), dueAt: NOW - 9 * DAY },
    ]
    const deck = buildLessonDeck({ lesson: current, progress, lessonProgress: null, now: NOW })

    expect(deck[0].questionId).toBe(qid(2))
  })

  it('excludes cards that are not due yet', () => {
    const progress = [{ ...initialProgress(qid(1), NOW), dueAt: NOW + DAY }]
    const deck = buildLessonDeck({ lesson: current, progress, lessonProgress: null, now: NOW })

    expect(deck.every((c) => c.kind === 'new')).toBe(true)
  })

  it('never reviews a question that belongs to the lesson itself', () => {
    const progress = [{ ...initialProgress(qid(10), NOW), dueAt: NOW - DAY }]
    const deck = buildLessonDeck({ lesson: current, progress, lessonProgress: null, now: NOW })

    expect(deck.filter((c) => c.kind === 'review')).toHaveLength(0)
  })

  it('resumes instead of restarting when the lesson was left halfway', () => {
    const deck = buildLessonDeck({
      lesson: current,
      progress: [],
      lessonProgress: { lessonId: 'b2', answeredQuestionIds: [qid(10)], completedAt: null, updatedAt: NOW },
      now: NOW,
    })

    expect(deck.map((c) => c.questionId)).toEqual([qid(11), qid(12)])
  })
})

describe('sectionCompletion', () => {
  it('reports the ratio of completed lessons', () => {
    const basic = section('basic', [
      lesson('b1', 1, [qid(1)]),
      lesson('b2', 2, [qid(2)]),
      lesson('b3', 3, [qid(3)]),
      lesson('b4', 4, [qid(4)]),
    ])
    expect(sectionCompletion(basic, [done('b1'), done('b2')])).toBe(0.5)
  })
})

describe('isCompleted', () => {
  it('does not count a lesson left halfway as completed', () => {
    const half: LessonProgress = {
      lessonId: 'b1',
      answeredQuestionIds: [qid(1)],
      completedAt: null,
      updatedAt: NOW,
    }
    expect(isCompleted(lesson('b1', 1, [qid(1)]), [half])).toBe(false)
  })
})
