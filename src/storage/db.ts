import Dexie, { type Table } from 'dexie'
import type { LessonProgress, Progress } from '../content/schema'

/**
 * The IndexedDB database (ADR-0005). This module and `repository.ts` are the only code
 * that touches Dexie; everything else goes through the repository, so swapping the engine
 * stays a single-module change.
 *
 * Two current stores: per-question Leitner state and path position, both keyed by track plus
 * their content id. The older unscoped stores remain in schema history only.
 */
export class RepsDb extends Dexie {
  get progress(): Table<Progress, [string, string]> {
    return this.table('trackProgress')
  }

  get lessonProgress(): Table<LessonProgress, [string, string]> {
    return this.table('trackLessonProgress')
  }

  constructor(name = 'reps') {
    super(name)
    // The schema history IS the migration path (ADR-0005): never edit a past version, add one.
    this.version(1).stores({
      progress: 'questionId, dueAt',
      lessonProgress: 'lessonId',
    })
    // v2 adds `updatedAt` for sync (ADR-0020), indexed so a push can query rows changed since
    // a cursor. Backfill from the best timestamp each row already has — a Progress row's last
    // review, a lesson's completion — so last-write-wins is meaningful for pre-sync data too.
    this.version(2)
      .stores({
        progress: 'questionId, dueAt, updatedAt',
        lessonProgress: 'lessonId, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('progress')
          .toCollection()
          .modify((row) => {
            row.updatedAt = row.history?.length ? row.history[row.history.length - 1].at : 0
          })
        await tx
          .table('lessonProgress')
          .toCollection()
          .modify((row) => {
            row.updatedAt = row.completedAt ?? 0
          })
      })
    // Dexie cannot change a store's primary key in place. v3 copies legacy rows into new
    // compound-key stores; v4 removes the old stores after that copy has completed. Every
    // pre-track row belongs to React, and every existing value is spread through unchanged.
    this.version(3)
      .stores({
        progress: 'questionId, dueAt, updatedAt',
        lessonProgress: 'lessonId, updatedAt',
        trackProgress: '[trackId+questionId], trackId, dueAt, updatedAt',
        trackLessonProgress: '[trackId+lessonId], trackId, updatedAt',
      })
      .upgrade(async (tx) => {
        const legacyProgress = await tx.table('progress').toArray()
        const legacyLessonProgress = await tx.table('lessonProgress').toArray()
        await tx
          .table('trackProgress')
          .bulkPut(legacyProgress.map((row) => ({ ...row, trackId: 'react' })))
        await tx
          .table('trackLessonProgress')
          .bulkPut(legacyLessonProgress.map((row) => ({ ...row, trackId: 'react' })))
      })
    this.version(4).stores({
      progress: null,
      lessonProgress: null,
      trackProgress: '[trackId+questionId], trackId, dueAt, updatedAt',
      trackLessonProgress: '[trackId+lessonId], trackId, updatedAt',
    })
  }
}

export const db = new RepsDb()
