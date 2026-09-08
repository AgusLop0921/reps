import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LessonProgress, Progress } from '../content/schema'
import { db, RepsDb } from './db'
import {
  clearAll,
  exportData,
  getAllLessonProgress,
  getAllProgress,
  getLessonProgressForTrack,
  getProgressForTrack,
  importData,
  putLessonProgress,
  putProgress,
} from './repository'

const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)
const qid = (n: number) => String(n).padStart(12, 'q')

const progress = (questionId: string): Progress => ({
  trackId: 'react',
  questionId,
  box: 2,
  dueAt: NOW,
  history: [{ at: NOW, score: 3 }],
  updatedAt: NOW,
})

const lessonProgress = (lessonId: string): LessonProgress => ({
  trackId: 'react',
  lessonId,
  answeredQuestionIds: [qid(1)],
  completedAt: NOW,
  updatedAt: NOW,
})

beforeEach(async () => {
  await clearAll()
})

describe('progress round-trip', () => {
  it('writes and reads back an equal, validated record', async () => {
    await putProgress(progress(qid(1)))
    expect(await getAllProgress()).toEqual([progress(qid(1))])
  })

  it('put overwrites by track and question id', async () => {
    await putProgress(progress(qid(1)))
    await putProgress({ ...progress(qid(1)), box: 5 })
    const all = await getAllProgress()
    expect(all).toHaveLength(1)
    expect(all[0].box).toBe(5)
  })
})

describe('lessonProgress round-trip', () => {
  it('writes and reads back an equal, validated record', async () => {
    await putLessonProgress(lessonProgress('lesson-1'))
    expect(await getAllLessonProgress()).toEqual([lessonProgress('lesson-1')])
  })
})

describe('track isolation', () => {
  it('keeps the same question and lesson ids independent across tracks', async () => {
    await putProgress(progress(qid(1)))
    await putProgress({ ...progress(qid(1)), trackId: 'ai-engineering', box: 5 })
    await putLessonProgress(lessonProgress('lesson-1'))
    await putLessonProgress({ ...lessonProgress('lesson-1'), trackId: 'ai-engineering' })

    expect(await getProgressForTrack('react')).toEqual([progress(qid(1))])
    expect(await getProgressForTrack('ai-engineering')).toEqual([
      { ...progress(qid(1)), trackId: 'ai-engineering', box: 5 },
    ])
    expect(await getLessonProgressForTrack('react')).toHaveLength(1)
    expect(await getLessonProgressForTrack('ai-engineering')).toHaveLength(1)
  })
})

describe('read validation (ADR-0004 boundary)', () => {
  it('drops a corrupt record and warns instead of crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await putProgress(progress(qid(1)))
    // A row that never passed through the schema — e.g. an older shape missing `box`.
    await db.progress.put({ trackId: 'react', questionId: qid(2) } as unknown as Progress)

    const all = await getAllProgress()
    expect(all).toEqual([progress(qid(1))])
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('export / import', () => {
  it('round-trips all progress through a JSON string', async () => {
    await putProgress(progress(qid(1)))
    await putLessonProgress(lessonProgress('lesson-1'))
    const json = await exportData()

    await clearAll()
    await importData(json)

    expect(await getAllProgress()).toEqual([progress(qid(1))])
    expect(await getAllLessonProgress()).toEqual([lessonProgress('lesson-1')])
  })

  it('replaces existing data rather than merging', async () => {
    await putProgress(progress(qid(1)))
    const incoming = JSON.stringify({
      version: 2,
      progress: [progress(qid(2))],
      lessonProgress: [],
    })

    await importData(incoming)

    expect(await getAllProgress()).toEqual([progress(qid(2))])
  })

  it('exports a version-3 payload', async () => {
    expect(JSON.parse(await exportData()).version).toBe(3)
  })

  it('imports a v2 file as React progress without changing its state', async () => {
    const v2 = JSON.stringify({
      version: 2,
      progress: [
        {
          questionId: qid(3),
          box: 4,
          dueAt: NOW + 123,
          history: [{ at: NOW, score: 4 }],
          updatedAt: NOW,
        },
      ],
      lessonProgress: [
        {
          lessonId: 'lesson-1',
          answeredQuestionIds: [qid(3)],
          completedAt: NOW,
          updatedAt: NOW,
        },
      ],
    })

    await importData(v2)

    expect(await getAllProgress()).toEqual([
      { ...progress(qid(3)), box: 4, dueAt: NOW + 123, history: [{ at: NOW, score: 4 }] },
    ])
    expect(await getAllLessonProgress()).toEqual([
      { ...lessonProgress('lesson-1'), answeredQuestionIds: [qid(3)] },
    ])
  })

  it('imports a v1 file by backfilling updatedAt (ADR-0020)', async () => {
    const v1 = JSON.stringify({
      version: 1,
      progress: [{ questionId: qid(3), box: 2, dueAt: NOW, history: [{ at: NOW, score: 3 }] }],
      lessonProgress: [{ lessonId: 'lesson-1', answeredQuestionIds: [], completedAt: null }],
    })

    await importData(v1)

    expect(await getAllProgress()).toEqual([{ ...progress(qid(3)), updatedAt: 0 }])
    expect((await getAllLessonProgress())[0].updatedAt).toBe(0)
  })

  it('rejects a file that is not JSON, leaving data untouched', async () => {
    await putProgress(progress(qid(1)))
    await expect(importData('not json')).rejects.toThrow(/not valid JSON/)
    expect(await getAllProgress()).toEqual([progress(qid(1))])
  })

  it('rejects a foreign or unknown-version file', async () => {
    const unknown = JSON.stringify({ version: 99, progress: [], lessonProgress: [] })
    await expect(importData(unknown)).rejects.toThrow(/valid Reps progress export/)
  })
})

describe('schema persistence and migration', () => {
  it('opens at version 4 with both track-scoped stores', async () => {
    await clearAll() // forces open
    expect(db.verno).toBe(4)
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'trackLessonProgress',
      'trackProgress',
    ])
  })

  it('data survives a reopen (real IndexedDB round-trip)', async () => {
    await putProgress(progress(qid(1)))
    const reopened = new RepsDb('reps')
    await reopened.open()
    expect(await reopened.progress.toArray()).toHaveLength(1)
    reopened.close()
  })

  it('backfills updatedAt on the v1 → v2 upgrade (ADR-0020)', async () => {
    const name = 'reps-migration-test'
    await Dexie.delete(name)

    // A pre-sync database: v1 schema, rows without updatedAt.
    const old = new Dexie(name)
    old.version(1).stores({ progress: 'questionId, dueAt', lessonProgress: 'lessonId' })
    await old.open()
    await old
      .table('progress')
      .put({ questionId: qid(9), box: 3, dueAt: NOW, history: [{ at: 111, score: 3 }, { at: 222, score: 4 }] })
    await old.table('lessonProgress').put({ lessonId: 'L9', answeredQuestionIds: [], completedAt: 333 })
    old.close()

    // Reopening with the current schema runs the upgrade.
    const migrated = new RepsDb(name)
    await migrated.open()
    const migratedProgress = await migrated.progress.get(['react', qid(9)])
    const migratedLesson = await migrated.lessonProgress.get(['react', 'L9'])
    expect(migratedProgress).toMatchObject({
      trackId: 'react',
      questionId: qid(9),
      box: 3,
      dueAt: NOW,
      history: [
        { at: 111, score: 3 },
        { at: 222, score: 4 },
      ],
      updatedAt: 222,
    })
    expect(migratedLesson).toMatchObject({
      trackId: 'react',
      lessonId: 'L9',
      answeredQuestionIds: [],
      completedAt: 333,
      updatedAt: 333,
    })
    migrated.close()
    await Dexie.delete(name)
  })
})
