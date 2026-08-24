import type { Level } from './schema'

/**
 * Hand-curated overrides on top of the generated curriculum (ADR-0011).
 *
 * The generated order is positional: questions are chunked in the order they appear
 * upstream, which is contribution order, not a designed sequence. Anything that reads
 * badly gets fixed here rather than in the adapter, so re-importing never loses curation.
 *
 * Empty is a valid state: it means the generated order is good enough so far.
 */

/** Question slugs to place at the start of their section, in this order. */
export const PINNED_FIRST: Partial<Record<Level, string[]>> = {}

/** Question slugs to exclude from the path (still searchable, never taught). */
export const EXCLUDED_SLUGS: string[] = []

/** Explicit lesson titles, keyed by lesson id. Otherwise titles are generated. */
export const LESSON_TITLES: Record<string, string> = {}
