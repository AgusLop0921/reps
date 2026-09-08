import {
  lessonProgressSchema,
  type LessonProgress,
  type Progress,
  type ProgressExport,
  progressExportSchema,
  progressExportV1Schema,
  progressExportV2Schema,
  progressSchema,
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

export async function getProgressForTrack(trackId: string): Promise<Progress[]> {
  return (await getAllProgress()).filter((progress) => progress.trackId === trackId)
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

export async function getLessonProgressForTrack(trackId: string): Promise<LessonProgress[]> {
  return (await getAllLessonProgress()).filter((progress) => progress.trackId === trackId)
}

export async function putProgress(progress: Progress): Promise<void> {
  await db.progress.put(progress)
}

export async function putLessonProgress(lessonProgress: LessonProgress): Promise<void> {
  await db.lessonProgress.put(lessonProgress)
}

/**
 * Apply a pulled remote row only if it still wins against what IndexedDB holds *now*
 * (ADR-0020). Reconcile chose this row against a snapshot taken before the network round
 * trip; an answer written locally during that trip must not be clobbered by an older remote
 * row. The compare-then-write runs in one transaction, so no local write can slip in between
 * the read and the put. A row IndexedDB has never seen (no `updatedAt`) always loses to the
 * remote, matching reconcile's "local missing → pull".
 */
export async function pullProgress(remote: Progress): Promise<void> {
  await db.transaction('rw', db.progress, async () => {
    const current = await db.progress.get([remote.trackId, remote.questionId])
    const currentAt = current?.updatedAt ?? Number.NEGATIVE_INFINITY
    if (remote.updatedAt > currentAt) await db.progress.put(remote)
  })
}

export async function pullLessonProgress(remote: LessonProgress): Promise<void> {
  await db.transaction('rw', db.lessonProgress, async () => {
    const current = await db.lessonProgress.get([remote.trackId, remote.lessonId])
    const currentAt = current?.updatedAt ?? Number.NEGATIVE_INFINITY
    if (remote.updatedAt > currentAt) await db.lessonProgress.put(remote)
  })
}

export async function clearAll(): Promise<void> {
  await db.transaction('rw', db.progress, db.lessonProgress, async () => {
    await db.progress.clear()
    await db.lessonProgress.clear()
  })
}

/**
 * Serialize all progress to a versioned JSON string (ADR-0005) — the file a user keeps as
 * their only backup against a browser that forgets. Only validated records are exported.
 */
export async function exportData(): Promise<string> {
  const [progress, lessonProgress] = await Promise.all([
    getAllProgress(),
    getAllLessonProgress(),
  ])
  const payload: ProgressExport = { version: 3, progress, lessonProgress }
  return JSON.stringify(payload, null, 2)
}

/** Normalize exports, assigning pre-track v1/v2 data to React and backfilling v1 timestamps. */
function normalizeExport(raw: unknown): ProgressExport | null {
  const v3 = progressExportSchema.safeParse(raw)
  if (v3.success) return v3.data

  const legacyV2 = progressExportV2Schema.safeParse(raw)
  if (legacyV2.success) {
    return {
      version: 3,
      progress: legacyV2.data.progress.map((p) => ({ ...p, trackId: 'react' })),
      lessonProgress: legacyV2.data.lessonProgress.map((l) => ({ ...l, trackId: 'react' })),
    }
  }

  const v1 = progressExportV1Schema.safeParse(raw)
  if (v1.success) {
    return {
      version: 3,
      progress: v1.data.progress.map((p) => ({ ...p, trackId: 'react', updatedAt: 0 })),
      lessonProgress: v1.data.lessonProgress.map((l) => ({
        ...l,
        trackId: 'react',
        updatedAt: 0,
      })),
    }
  }
  return null
}

/**
 * Replace all progress with the contents of an export file. Validated before it touches
 * the database; a malformed or foreign file is rejected whole, never partially applied.
 * The thrown messages are for logs — the UI maps them to Spanish copy (ADR-0008).
 *
 * Note: this replaces *local* data only. While signed in, the next sync treats a row this
 * import dropped (still on the server, now missing locally) as something to pull and
 * re-downloads it, so restoring a smaller export is re-merged with remote progress — sync
 * has no deletion signal (no tombstones; see ADR-0020 "Consequences"). Deletions do not
 * propagate today; only `delete_account`, which wipes the server first, truly removes data.
 */
export async function importData(json: string): Promise<void> {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Import failed: the file is not valid JSON.')
  }
  const parsed = normalizeExport(raw)
  if (!parsed) {
    throw new Error('Import failed: the file is not a valid Reps progress export.')
  }
  const { progress, lessonProgress } = parsed
  await db.transaction('rw', db.progress, db.lessonProgress, async () => {
    await db.progress.clear()
    await db.lessonProgress.clear()
    await db.progress.bulkPut(progress)
    await db.lessonProgress.bulkPut(lessonProgress)
  })
}
