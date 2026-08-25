import type { Check } from '../content/schema'

/**
 * Display order for a check's options (ADR-0017). Deterministic in `(questionId,
 * reviewCount)`, so the stored order never matters and a re-review reshuffles. Pure — no
 * clock, no Math.random — which is what keeps `core` exhaustively testable.
 */

/** FNV-1a → 32-bit unsigned. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32: a small seeded PRNG giving the same sequence for the same seed. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function orderedOptions(check: Check, reviewCount: number): Check['options'] {
  const rng = mulberry32(hash(`${check.questionId}:${reviewCount}`))
  const opts = [...check.options]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = opts[i]
    opts[i] = opts[j]
    opts[j] = tmp
  }
  return opts
}
