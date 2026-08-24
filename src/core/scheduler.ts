import type { Box, Progress, Score } from '../content/schema'

/**
 * 5-box Leitner system (ADR-0006).
 *
 * This module only decides *when* a card comes back. Which cards make up a session is
 * `curriculum.ts`'s job (ADR-0012).
 *
 * Everything here is pure: `now` is always a parameter, the clock is never read.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Days to wait after reaching each box. */
export const INTERVALS_DAYS: Record<Box, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
}

export function nextBox(current: Box, score: Score): Box {
  if (score <= 2) return 1
  return Math.min(current + 1, 5) as Box
}

/**
 * A 4 ("perfect") skips the interval of the box just reached and uses the next one:
 * if you knew it without hesitating, you do not need to see it that soon.
 */
function intervalFor(box: Box, score: Score): number {
  const effective = score === 4 ? (Math.min(box + 1, 5) as Box) : box
  return INTERVALS_DAYS[effective]
}

export function review(progress: Progress, score: Score, now: number): Progress {
  const box = nextBox(progress.box, score)
  return {
    ...progress,
    box,
    dueAt: now + intervalFor(box, score) * DAY_MS,
    history: [...progress.history, { at: now, score }],
  }
}

export function initialProgress(questionId: string, now: number): Progress {
  return { questionId, box: 1, dueAt: now, history: [] }
}

export function isDue(progress: Progress, now: number): boolean {
  return progress.dueAt <= now
}

/** Streak in days. Breaks after more than one day without any review. */
export function currentStreak(progress: Progress[], now: number): number {
  const days = new Set(
    progress.flatMap((p) => p.history.map((h) => Math.floor(h.at / DAY_MS))),
  )
  const today = Math.floor(now / DAY_MS)
  if (!days.has(today) && !days.has(today - 1)) return 0

  let streak = 0
  let cursor = days.has(today) ? today : today - 1
  while (days.has(cursor)) {
    streak++
    cursor--
  }
  return streak
}
