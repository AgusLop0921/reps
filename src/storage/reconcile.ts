/**
 * Last-write-wins reconciliation (ADR-0020). Pure: given the local and remote rows for a
 * store, it decides which side is stale, with no clock and no IO — the sync engine applies
 * the result. The rule is per row, by `updatedAt`: the newer timestamp wins, wholesale.
 *
 * Equal timestamps are treated as already in sync. That is the documented loss: if the same
 * row was written on two devices in the same millisecond (or backfilled to the same value),
 * we cannot tell them apart and do not merge — one review can be dropped from a question's
 * Leitner history. For a single user this is vanishingly rare.
 */
export type Timestamped = { updatedAt: number }

export type Reconciliation<T> = {
  /** Local rows the remote is missing or older on — upsert these to the server. */
  toPush: T[]
  /** Remote rows the local is missing or older on — write these into IndexedDB. */
  toPull: T[]
}

export function reconcile<T extends Timestamped>(
  local: T[],
  remote: T[],
  key: (row: T) => string,
): Reconciliation<T> {
  const localByKey = new Map(local.map((row) => [key(row), row]))
  const remoteByKey = new Map(remote.map((row) => [key(row), row]))

  const toPush: T[] = []
  const toPull: T[] = []

  for (const k of new Set([...localByKey.keys(), ...remoteByKey.keys()])) {
    const l = localByKey.get(k)
    const r = remoteByKey.get(k)

    if (l && !r) toPush.push(l)
    else if (r && !l) toPull.push(r)
    else if (l && r) {
      if (r.updatedAt > l.updatedAt) toPull.push(r)
      else if (l.updatedAt > r.updatedAt) toPush.push(l)
      // equal → in sync, nothing to do
    }
  }

  return { toPush, toPull }
}
