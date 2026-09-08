import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { RepsDb } from './db'

const QUESTION_ID = '859805c2ddb1'
const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)

describe('legacy v2 progress shape', () => {
  it('preserves the complete pre-track progress records when reopened', async () => {
    const name = 'reps-legacy-v2-shape'
    await Dexie.delete(name)

    const old = new Dexie(name)
    old.version(2).stores({
      progress: 'questionId, dueAt, updatedAt',
      lessonProgress: 'lessonId, updatedAt',
    })
    await old.open()
    await old.table('progress').put({
      questionId: QUESTION_ID,
      box: 4,
      dueAt: NOW + 1_000,
      history: [
        { at: NOW - 2_000, score: 2 },
        { at: NOW, score: 4 },
      ],
      updatedAt: NOW,
    })
    await old.table('lessonProgress').put({
      lessonId: 'midudev-react:principiante:1',
      answeredQuestionIds: [QUESTION_ID],
      completedAt: NOW - 500,
      updatedAt: NOW,
    })
    old.close()

    const reopened = new RepsDb(name)
    await reopened.open()

    expect(await reopened.progress.toArray()).toEqual([
      {
        trackId: 'react',
        questionId: QUESTION_ID,
        box: 4,
        dueAt: NOW + 1_000,
        history: [
          { at: NOW - 2_000, score: 2 },
          { at: NOW, score: 4 },
        ],
        updatedAt: NOW,
      },
    ])
    expect(await reopened.lessonProgress.toArray()).toEqual([
      {
        trackId: 'react',
        lessonId: 'midudev-react:principiante:1',
        answeredQuestionIds: [QUESTION_ID],
        completedAt: NOW - 500,
        updatedAt: NOW,
      },
    ])

    reopened.close()
    await Dexie.delete(name)
  })
})
