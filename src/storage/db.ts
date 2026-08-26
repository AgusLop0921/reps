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
    // v1 is the first schema. When it changes, add `.version(2).upgrade(...)`; never edit
    // this line (ADR-0005: the schema history is the migration path).
    this.version(1).stores({
      progress: 'questionId, dueAt',
      lessonProgress: 'lessonId',
    })
  }
}

export const db = new RepsDb()
