/**
 * Hand-curated overrides on top of the generated curriculum (ADR-0011).
 *
 * The generated order is positional: questions are chunked in the order they appear
 * upstream, which is contribution order, not a designed sequence. Anything that reads
 * badly gets fixed here rather than in the adapter, so re-importing never loses curation.
 *
 * Empty is a valid state: it means the generated order is good enough so far.
 */

/**
 * Question slugs to place at the start of a section, keyed by section id
 * (e.g. `"midudev-react:principiante"`), in the order given. Section ids are the ones in
 * the generated curriculum — sections, not levels (ADR-0014).
 */
export const PINNED_FIRST: Record<string, string[]> = {}

/** Question slugs to exclude from the path (still searchable, never taught). */
export const EXCLUDED_SLUGS: string[] = [
  // A full "JavaScript you need for React" book chapter, not a Q&A card: its answer is a
  // multi-section primer, too long to sit in a lesson. Kept importable, kept off the path.
  'qué-javascript-necesito-para-aprender-react',
]

/** Explicit lesson titles, keyed by lesson id. Otherwise titles are generated. */
export const LESSON_TITLES: Record<string, string> = {}
