import {
  type LessonProgress,
  lessonProgressSchema,
  type Progress,
  progressSchema,
} from '../content/schema'
import { reconcile } from './reconcile'
import {
  getAllLessonProgress,
  getAllProgress,
  pullLessonProgress,
  pullProgress,
} from './repository'
import { supabase } from './supabaseClient'

/**
 * Two-way progress sync (ADR-0020). IndexedDB stays the source of truth; this reconciles it
 * with Supabase by last-write-wins and writes the winners to both sides. Rows are stored in
 * a single `data` JSONB column (the validated domain object) plus `updated_at` for conflict
 * comparison, so the table shape does not move when the domain schema does. Row-Level
 * Security scopes every query to the signed-in user; `user_id` is set on write.
 *
 * Best-effort by design: with no client (local-only build) it is a no-op, and any network
 * failure throws to the caller, which simply retries on the next trigger. A pulled row is
 * applied only if it still beats the current local row (`pullProgress`), so an answer written
 * during the round trip is never clobbered — local stays consistent even mid-sync.
 */

// Single-flight guard. `online` / `focus` / `visibilitychange` commonly fire together, so
// several syncNow calls arrive at once; running their read→reconcile→write cycles in parallel
// would race the same stores. Only one cycle runs at a time. A call that arrives while a cycle
// is in flight coalesces onto it and requests exactly one follow-up, so a trigger carrying
// fresh local data the running cycle already snapshotted is flushed on the next cycle rather
// than lost — without ever overlapping.
let inFlight: Promise<void> | null = null
let rerunRequested = false

export async function syncNow(userId: string): Promise<void> {
  if (!supabase) return
  if (inFlight) {
    rerunRequested = true
    return inFlight
  }
  inFlight = runCycle(userId)
  try {
    await inFlight
  } finally {
    inFlight = null
  }
  if (rerunRequested) {
    rerunRequested = false
    await syncNow(userId)
  }
}

async function runCycle(userId: string): Promise<void> {
  await Promise.all([syncProgress(userId), syncLessonProgress(userId)])
}

async function syncProgress(userId: string): Promise<void> {
  if (!supabase) return
  const local = await getAllProgress()

  const { data, error } = await supabase.from('progress').select('data').eq('user_id', userId)
  if (error) throw error
  const remote: Progress[] = []
  for (const row of data ?? []) {
    const parsed = progressSchema.safeParse(row.data)
    if (parsed.success) remote.push(parsed.data)
  }

  const { toPush, toPull } = reconcile(local, remote, (p) => p.questionId)
  for (const p of toPull) await pullProgress(p)
  if (toPush.length > 0) {
    const rows = toPush.map((p) => ({
      user_id: userId,
      question_id: p.questionId,
      updated_at: p.updatedAt,
      data: p,
    }))
    const { error: upsertError } = await supabase
      .from('progress')
      .upsert(rows, { onConflict: 'user_id,question_id' })
    if (upsertError) throw upsertError
  }
}

async function syncLessonProgress(userId: string): Promise<void> {
  if (!supabase) return
  const local = await getAllLessonProgress()

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('data')
    .eq('user_id', userId)
  if (error) throw error
  const remote: LessonProgress[] = []
  for (const row of data ?? []) {
    const parsed = lessonProgressSchema.safeParse(row.data)
    if (parsed.success) remote.push(parsed.data)
  }

  const { toPush, toPull } = reconcile(local, remote, (l) => l.lessonId)
  for (const l of toPull) await pullLessonProgress(l)
  if (toPush.length > 0) {
    const rows = toPush.map((l) => ({
      user_id: userId,
      lesson_id: l.lessonId,
      updated_at: l.updatedAt,
      data: l,
    }))
    const { error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert(rows, { onConflict: 'user_id,lesson_id' })
    if (upsertError) throw upsertError
  }
}
