import type { Lesson, Question, Section } from '../../src/content/schema'

/**
 * Curriculum generation (ADR-0011, ADR-0014): turn a source's questions, in upstream
 * document order, into an ordered path of sections and lessons.
 *
 * Pure and side-effect free. Overrides are injected rather than read from `order.ts`, so
 * the transformation is testable in isolation; `index.ts` supplies the real overrides.
 */

/**
 * Default questions per lesson. Chosen so a lesson stays under ~4,000 characters given
 * midudev answers of ~870 chars (median); sections with much longer answers override it
 * via `lessonSizeBySection` (ADR-0011).
 */
export const DEFAULT_LESSON_SIZE = 3

/**
 * A trailing lesson smaller than this is merged into the previous one, so no lesson is a
 * lone card. This merges a remainder of 1 or 2 — but only when the section's lessons hold
 * more than one card (see chunk()).
 */
const MIN_TRAILING_LESSON = 3

export type Overrides = {
  /** Slugs to drop from the path entirely (still importable/searchable). */
  excludedSlugs: readonly string[]
  /** Section id -> slugs to move to the front of that section, in this order. */
  pinnedFirst: Readonly<Record<string, readonly string[]>>
  /** Section id -> lesson size; sections not listed use DEFAULT_LESSON_SIZE. */
  lessonSizeBySection: Readonly<Record<string, number>>
}

/** Section id component from the upstream heading. Same rules the adapter uses for slugs. */
function sectionSlug(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

/**
 * Chunk ids into lessons of `size`, then fold a trailing remainder of 1 or 2 cards into
 * the previous lesson. With size 1 every card is its own lesson and there is no remainder
 * to merge.
 */
function chunk(questionIds: readonly string[], size: number): string[][] {
  const lessons: string[][] = []
  for (let i = 0; i < questionIds.length; i += size) {
    lessons.push(questionIds.slice(i, i + size))
  }
  if (size > 1 && lessons.length > 1) {
    const last = lessons[lessons.length - 1]
    if (last.length < MIN_TRAILING_LESSON) {
      lessons[lessons.length - 2].push(...last)
      lessons.pop()
    }
  }
  return lessons
}

/** Move pinned slugs to the front, in the given order; the rest keep document order. */
function applyPinned(questions: Question[], pinnedFirst: readonly string[]): Question[] {
  if (pinnedFirst.length === 0) return questions
  const rank = new Map(pinnedFirst.map((slug, i) => [slug, i]))
  const pinned = questions
    .filter((q) => rank.has(q.slug))
    .sort((a, b) => (rank.get(a.slug) ?? 0) - (rank.get(b.slug) ?? 0))
  const rest = questions.filter((q) => !rank.has(q.slug))
  return [...pinned, ...rest]
}

type Group = { id: string; title: string; sourceId: string; questions: Question[] }

export function buildSections(questions: Question[], overrides: Overrides): Section[] {
  const excluded = new Set(overrides.excludedSlugs)

  // Group by section in first-appearance order. A section whose questions are all excluded
  // never appears — no empty sections are emitted.
  const groups = new Map<string, Group>()
  for (const q of questions) {
    if (excluded.has(q.slug)) continue
    const id = `${q.sourceId}:${sectionSlug(q.sourceSection)}`
    const group = groups.get(id) ?? { id, title: q.sourceSection, sourceId: q.sourceId, questions: [] }
    group.questions.push(q)
    groups.set(id, group)
  }

  return [...groups.values()].map((group) => {
    const ordered = applyPinned(group.questions, overrides.pinnedFirst[group.id] ?? [])
    const size = overrides.lessonSizeBySection[group.id] ?? DEFAULT_LESSON_SIZE
    const lessons: Lesson[] = chunk(ordered.map((q) => q.id), size).map((questionIds, i) => ({
      id: `${group.id}:${i + 1}`,
      order: i + 1,
      questionIds,
    }))
    return { id: group.id, title: group.title, sourceId: group.sourceId, lessons }
  })
}
