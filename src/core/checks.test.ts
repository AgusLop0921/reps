import { describe, expect, it } from 'vitest'
import type { Check } from '../content/schema'
import { orderedOptions } from './checks'

const check: Check = {
  questionId: '00000000000a',
  stem: 'stem',
  options: [
    { text: 'a', correct: true },
    { text: 'b', correct: false },
    { text: 'c', correct: false },
    { text: 'd', correct: false },
  ],
  explanation: 'why',
}

const order = (c: Check, n: number): string => orderedOptions(c, n).map((o) => o.text).join('')

describe('orderedOptions', () => {
  it('is stable for the same (questionId, reviewCount)', () => {
    expect(order(check, 0)).toBe(order(check, 0))
    expect(order(check, 3)).toBe(order(check, 3))
  })

  it('is a permutation: same options, still exactly one correct', () => {
    const out = orderedOptions(check, 1)
    expect(out.map((o) => o.text).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(out.filter((o) => o.correct)).toHaveLength(1)
  })

  it('reshuffles across review counts', () => {
    const seen = new Set([0, 1, 2, 3, 4, 5].map((n) => order(check, n)))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('depends on the questionId, not just the count', () => {
    const other: Check = { ...check, questionId: '00000000000b' }
    // Not guaranteed different, but these two seeds land on different orders.
    expect(order(check, 0)).not.toBe(order(other, 0))
  })
})
