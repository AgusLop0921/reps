import { describe, expect, it } from 'vitest'
import { reconcile } from './reconcile'

type Row = { id: string; updatedAt: number }
const key = (r: Row) => r.id
const row = (id: string, updatedAt: number): Row => ({ id, updatedAt })

describe('reconcile (last-write-wins per row)', () => {
  it('pulls a row the local side is missing', () => {
    expect(reconcile([], [row('a', 5)], key)).toEqual({ toPush: [], toPull: [row('a', 5)] })
  })

  it('pushes a row the remote side is missing', () => {
    expect(reconcile([row('a', 5)], [], key)).toEqual({ toPush: [row('a', 5)], toPull: [] })
  })

  it('pulls when the remote is newer', () => {
    const { toPush, toPull } = reconcile([row('a', 5)], [row('a', 9)], key)
    expect(toPull).toEqual([row('a', 9)])
    expect(toPush).toEqual([])
  })

  it('pushes when the local is newer', () => {
    const { toPush, toPull } = reconcile([row('a', 9)], [row('a', 5)], key)
    expect(toPush).toEqual([row('a', 9)])
    expect(toPull).toEqual([])
  })

  it('does nothing when timestamps are equal', () => {
    expect(reconcile([row('a', 5)], [row('a', 5)], key)).toEqual({ toPush: [], toPull: [] })
  })

  it('partitions a mixed set independently per key', () => {
    const local = [row('same', 5), row('local-new', 9), row('remote-new', 1), row('local-only', 3)]
    const remote = [row('same', 5), row('local-new', 4), row('remote-new', 8), row('remote-only', 2)]

    const { toPush, toPull } = reconcile(local, remote, key)

    expect(toPush.map(key).sort()).toEqual(['local-new', 'local-only'])
    expect(toPull.map(key).sort()).toEqual(['remote-new', 'remote-only'])
  })
})
