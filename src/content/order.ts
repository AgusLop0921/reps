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

/**
 * Lesson size for specific sections, keyed by section id. Sections not listed use
 * `DEFAULT_LESSON_SIZE` (3). A lesson is measured in text, not cards: the default keeps a
 * lesson under ~4,000 characters where answers run ~870 chars (median).
 *
 * "midudev-react:errores-típicos-en-react" answers are ~3× longer than the rest (median
 * 2,542 chars, p90 4,353), so even two cards blow past that ceiling. Size 1 makes it six
 * single-card lessons of ~2,500 chars — one card is the natural unit there, in line with
 * the rest of the path.
 */
export const LESSON_SIZE_BY_SECTION: Record<string, number> = {
  'midudev-react:errores-típicos-en-react': 1,
}

/** Question slugs to exclude from the path (still searchable, never taught). */
export const EXCLUDED_SLUGS: string[] = [
  // A full "JavaScript you need for React" book chapter, not a Q&A card: its answer is a
  // multi-section primer, too long to sit in a lesson. Kept importable, kept off the path.
  'qué-javascript-necesito-para-aprender-react',
]

/** Explicit lesson titles, keyed by lesson id. Otherwise titles are generated. */
export const LESSON_TITLES: Record<string, string> = {}
