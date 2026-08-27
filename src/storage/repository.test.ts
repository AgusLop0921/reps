import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LessonProgress, Progress } from '../content/schema'
import { db, RepsDb } from './db'
import {
  clearAll,
  exportData,
  getAllLessonProgress,
  getAllProgress,
  importData,
  putLessonProgress,
  putProgress,
} from './repository'

const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)
const qid = (n: number) => String(n).padStart(12, 'q')

const progress = (questionId: string): Progress => ({
  questionId,
  box: 2,
  dueAt: NOW,
  history: [{ at: NOW, score: 3 }],
})

const lessonProgress = (lessonId: string): LessonProgress => ({
  lessonId,
  answeredQuestionIds: [qid(1)],
  completedAt: NOW,
})

beforeEach(async () => {
  await clearAll()
})

describe('progress round-trip', () => {
  it('writes and reads back an equal, validated record', async () => {
    await putProgress(progress(qid(1)))
    expect(await getAllProgress()).toEqual([progress(qid(1))])
  })

  it('put overwrites by questionId', async () => {
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

describe('read validation (ADR-0004 boundary)', () => {
  it('drops a corrupt record and warns instead of crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await putProgress(progress(qid(1)))
    // A row that never passed through the schema — e.g. an older shape missing `box`.
    await db.progress.put({ questionId: qid(2) } as unknown as Progress)

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
      version: 1,
      progress: [progress(qid(2))],
      lessonProgress: [],
    })

    await importData(incoming)

    expect(await getAllProgress()).toEqual([progress(qid(2))])
  })

  it('exports a version-1 payload', async () => {
    expect(JSON.parse(await exportData()).version).toBe(1)
  })

  it('rejects a file that is not JSON, leaving data untouched', async () => {
    await putProgress(progress(qid(1)))
    await expect(importData('not json')).rejects.toThrow(/not valid JSON/)
    expect(await getAllProgress()).toEqual([progress(qid(1))])
  })

  it('rejects a foreign or wrong-version file', async () => {
    const wrongVersion = JSON.stringify({ version: 2, progress: [], lessonProgress: [] })
    await expect(importData(wrongVersion)).rejects.toThrow(/valid Reps progress export/)
  })
})

describe('schema v1 persistence', () => {
  it('opens at version 1 with both stores', async () => {
    await clearAll() // forces open
    expect(db.verno).toBe(1)
    expect(db.tables.map((t) => t.name).sort()).toEqual(['lessonProgress', 'progress'])
  })

  it('data survives a reopen (real IndexedDB round-trip)', async () => {
    await putProgress(progress(qid(1)))
    const reopened = new RepsDb('reps')
    await reopened.open()
    expect(await reopened.progress.toArray()).toHaveLength(1)
    reopened.close()
  })
})
