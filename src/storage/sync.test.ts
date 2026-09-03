import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Progress } from '../content/schema'

/**
 * Guards the two data-loss windows in the sync layer (ADR-0020):
 *
 *  1. A mid-sync answer must not be clobbered by an older remote row. Reconcile decides what
 *     to pull from a snapshot read before the network round trip; if the user answers a
 *     question while that fetch is in flight, applying the pulled row must not overwrite the
 *     fresher local one.
 *  2. `online` / `focus` / `visibilitychange` commonly fire together, so several `syncNow`
 *     calls land at once. Overlapping cycles would race their reads and writes against the
 *     same stores; only one cycle may run at a time, and a call that arrives mid-cycle
 *     coalesces onto it and schedules exactly one follow-up so its trigger is not lost.
 *
 * Supabase is mocked (a controllable in-memory table); the repository and IndexedDB are real
 * (fake-indexeddb), so the pull path is exercised end to end.
 */

const h = vi.hoisted(() => ({
  state: {
    // Rows the fake server returns, keyed by table name, in Supabase's `{ data }` row shape.
    remote: { progress: [], lesson_progress: [] } as Record<string, { data: unknown }[]>,
    // Optional hook run inside a `select`, used to inject a concurrent local write.
    onSelect: null as ((table: string) => Promise<void>) | null,
    // When set, every `select` awaits this before resolving — lets a test hold cycles open.
    gate: null as Promise<void> | null,
    // How many times the `progress` table was selected — one per started cycle.
    progressSelects: 0,
    upserts: [] as { table: string; rows: unknown[] }[],
  },
}))

vi.mock('./supabaseClient', () => ({
  isSyncConfigured: true,
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: async () => {
          if (table === 'progress') h.state.progressSelects++
          if (h.state.onSelect) await h.state.onSelect(table)
          if (h.state.gate) await h.state.gate
          return { data: h.state.remote[table] ?? [], error: null }
        },
      }),
      upsert: async (rows: unknown[]) => {
        h.state.upserts.push({ table, rows })
        return { error: null }
      },
    }),
  },
}))

import { getAllProgress, clearAll, putProgress } from './repository'
import { syncNow } from './sync'

const qid = (n: number) => String(n).padStart(12, 'q')

const progressAt = (questionId: string, updatedAt: number): Progress => ({
  questionId,
  box: 2,
  dueAt: updatedAt,
  history: [{ at: updatedAt, score: 3 }],
  updatedAt,
})

const flush = () => new Promise((r) => setTimeout(r, 0))

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

beforeEach(async () => {
  await clearAll()
  h.state.remote = { progress: [], lesson_progress: [] }
  h.state.onSelect = null
  h.state.gate = null
  h.state.progressSelects = 0
  h.state.upserts = []
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mid-sync write is not clobbered by an older remote row', () => {
  it('keeps a local answer written while the remote fetch was in flight', async () => {
    // Local starts behind the remote, so reconcile decides to pull the remote row.
    await putProgress(progressAt(qid(1), 100))
    h.state.remote.progress = [{ data: progressAt(qid(1), 200) }]

    // The user answers the same question during the round trip: fires after the local
    // snapshot is read (which reconcile uses) but before the pulled row is applied.
    h.state.onSelect = async (table) => {
      if (table !== 'progress') return
      h.state.onSelect = null
      await putProgress(progressAt(qid(1), 300))
    }

    await syncNow('user-1')

    const stored = await getAllProgress()
    expect(stored).toHaveLength(1)
    // The fresher local answer (300) must survive the older remote row (200).
    expect(stored[0].updatedAt).toBe(300)
  })
})

describe('single-flight: overlapping triggers do not run overlapping cycles', () => {
  it('coalesces a concurrent call and reruns exactly once afterward', async () => {
    const d = deferred()
    h.state.gate = d.promise

    const p1 = syncNow('user-1')
    const p2 = syncNow('user-1')

    // Let both calls reach the point where they would start (or coalesce onto) a cycle.
    await flush()
    await flush()

    // Only one cycle may be in flight; the second call must coalesce, not start its own.
    const startedBeforeRelease = h.state.progressSelects

    d.resolve()
    await Promise.all([p1, p2])
    h.state.gate = null

    expect(startedBeforeRelease).toBe(1)
    // The coalesced trigger is not dropped: it schedules exactly one follow-up cycle.
    expect(h.state.progressSelects).toBe(2)
  })
})
