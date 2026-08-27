import Dexie, { type Table } from 'dexie'
import type { LessonProgress, Progress } from '../content/schema'

/**
 * The IndexedDB database (ADR-0005). This module and `repository.ts` are the only code
 * that touches Dexie; everything else goes through the repository, so swapping the engine
 * stays a single-module change.
 *
 * Two stores: per-question Leitner state (`Progress`, keyed by questionId, indexed by
 * `dueAt` for the "due before now" query) and path position (`LessonProgress`, keyed by
 * lessonId).
 */
export class RepsDb extends Dexie {
  progress!: Table<Progress, string>
  lessonProgress!: Table<LessonProgress, string>

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
  }
}

export const db = new RepsDb()
