import {
  lessonProgressSchema,
  type LessonProgress,
  progressSchema,
  type Progress,
} from '../content/schema'
import { db } from './db'

/**
 * The only API over IndexedDB (ADR-0005). Every read is validated with Zod at this
 * boundary (ADR-0004): a record that fails validation is dropped with a warning rather
 * than crashing a session — a single corrupt row must not take the app down.
 *
 * Writes take already-valid domain objects, so they are not re-validated here.
 */

export async function getAllProgress(): Promise<Progress[]> {
  const rows = await db.progress.toArray()
  const valid: Progress[] = []
  for (const row of rows) {
    const parsed = progressSchema.safeParse(row)
    if (parsed.success) valid.push(parsed.data)
    else console.warn('storage: dropping invalid progress record', parsed.error.issues)
  }
  return valid
}

export async function getAllLessonProgress(): Promise<LessonProgress[]> {
  const rows = await db.lessonProgress.toArray()
  const valid: LessonProgress[] = []
  for (const row of rows) {
    const parsed = lessonProgressSchema.safeParse(row)
    if (parsed.success) valid.push(parsed.data)
    else console.warn('storage: dropping invalid lessonProgress record', parsed.error.issues)
  }
  return valid
}

export async function putProgress(progress: Progress): Promise<void> {
  await db.progress.put(progress)
}

export async function putLessonProgress(lessonProgress: LessonProgress): Promise<void> {
  await db.lessonProgress.put(lessonProgress)
}

export async function clearAll(): Promise<void> {
  await db.transaction('rw', db.progress, db.lessonProgress, async () => {
    await db.progress.clear()
    await db.lessonProgress.clear()
  })
}
