import { describe, expect, it } from 'vitest'
import { currentStreak, initialProgress, isDue, nextBox, review } from './scheduler'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)

describe('nextBox', () => {
  it('drops back to box 1 on failure', () => {
    expect(nextBox(4, 1)).toBe(1)
    expect(nextBox(5, 2)).toBe(1)
  })

  it('promotes one box on success', () => {
    expect(nextBox(1, 3)).toBe(2)
    expect(nextBox(3, 4)).toBe(4)
  })

  it('never goes past box 5', () => {
    expect(nextBox(5, 4)).toBe(5)
  })
})

describe('review', () => {
  it('reschedules to one day on failure, regardless of the box', () => {
    const progress = { ...initialProgress('abc123abc123', NOW), box: 5 as const }
    const after = review(progress, 1, NOW)
    expect(after.box).toBe(1)
    expect(after.dueAt).toBe(NOW + DAY)
  })

  it('uses the next box interval on a perfect score', () => {
    const progress = initialProgress('abc123abc123', NOW)
    // box 1 -> 2 with score 4: uses the box 3 interval (7 days)
    expect(review(progress, 4, NOW).dueAt).toBe(NOW + 7 * DAY)
    // box 1 -> 2 with score 3: uses the box 2 interval (3 days)
    expect(review(progress, 3, NOW).dueAt).toBe(NOW + 3 * DAY)
  })

  it('appends to history without mutating the input', () => {
    const progress = initialProgress('abc123abc123', NOW)
    const after = review(progress, 3, NOW)
    expect(after.history).toHaveLength(1)
    expect(progress.history).toHaveLength(0)
  })
})

describe('isDue', () => {
  it('treats a brand new question as due immediately', () => {
    expect(isDue(initialProgress('abc123abc123', NOW), NOW)).toBe(true)
  })
})

describe('currentStreak', () => {
  const withReviews = (dayOffsets: number[]) => [
    {
      ...initialProgress('a'.repeat(12), NOW),
      history: dayOffsets.map((d) => ({ at: NOW - d * DAY, score: 3 as const })),
    },
  ]

  it('counts consecutive days up to today', () => {
    expect(currentStreak(withReviews([0, 1, 2]), NOW)).toBe(3)
  })

  it('breaks on a gap', () => {
    expect(currentStreak(withReviews([0, 1, 3]), NOW)).toBe(2)
  })

  it('stays alive when yesterday was reviewed but today has not been yet', () => {
    expect(currentStreak(withReviews([1, 2]), NOW)).toBe(2)
  })

  it('is zero after more than one day without reviews', () => {
    expect(currentStreak(withReviews([2, 3]), NOW)).toBe(0)
  })
})
