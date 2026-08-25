/**
 * Sanity-check a source adapter against its real upstream document.
 *
 * Fetches the raw source, runs the adapter's `parse()`, and prints a breakdown so a human
 * can confirm the format assumptions still hold before trusting an import. Every source
 * should be checkable the same way; add its adapter to `SOURCES` below.
 *
 * Usage: pnpm tsx scripts/import/check-source.ts
 */
import type { Question, Section } from '../../src/content/schema'
import { EXCLUDED_SLUGS, LESSON_SIZE_BY_SECTION, PINNED_FIRST } from '../../src/content/order'
import { buildSections } from './curriculum'
import * as midudevReact from './sources/midudev-react'

type SourceModule = {
  SOURCE_META: { id: string; rawUrl: string }
  parse: (markdown: string) => Question[]
}

const SOURCES: SourceModule[] = [midudevReact]

/**
 * Question substrings worth watching per source: ones whose parsing was fragile. Kept here
 * so a regression (an answer collapsing back to near-empty) is visible in the report.
 */
const WATCHED_SUBSTRINGS = ['JavaScript necesito', 'implementarías para evitar']

function countBy(questions: Question[], key: (q: Question) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const q of questions) counts.set(key(q), (counts.get(key(q)) ?? 0) + 1)
  return counts
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

function p90(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(0.9 * s.length) - 1))]
}

function report(id: string, questions: Question[]): void {
  console.log(`\n=== ${id}: ${questions.length} questions ===`)

  console.log('\nby sourceSection:')
  for (const [section, n] of countBy(questions, (q) => q.sourceSection)) {
    console.log(`  ${String(n).padStart(4)}  ${section}`)
  }

  console.log('\nby level:')
  for (const [level, n] of countBy(questions, (q) => q.level ?? 'null')) {
    console.log(`  ${String(n).padStart(4)}  ${level}`)
  }

  console.log('\nwatched answers (length in chars):')
  for (const needle of WATCHED_SUBSTRINGS) {
    const match = questions.find((q) => q.question.includes(needle))
    const detail = match
      ? `${String(match.answerMd.length).padStart(6)}  "${match.question}"`
      : `     ?  (no question matching "${needle}")`
    console.log(`  ${detail}`)
  }
}

function reportCurriculum(sections: Section[]): void {
  const total = sections.reduce((n, s) => n + s.lessons.length, 0)
  console.log(`\ncurriculum: ${sections.length} sections, ${total} lessons`)
  for (const s of sections) {
    const sizes = s.lessons.map((l) => l.questionIds.length)
    console.log(
      `  ${String(s.lessons.length).padStart(3)} lessons  [${sizes.join(', ')}]  ${s.title}`,
    )
  }
}

/**
 * The real question when choosing LESSON_SIZE is how much text a lesson is, not how many
 * cards. Report per section: median/p90 answer length per question, and median/max total
 * characters per lesson; plus the longest questions that land on the path.
 */
function reportLessonText(sections: Section[], questions: Question[]): void {
  const lenById = new Map(questions.map((q) => [q.id, q.answerMd.length]))
  const len = (id: string): number => lenById.get(id) ?? 0

  console.log('\nlesson text size (answerMd chars):')
  console.log(
    `  ${'section'.padEnd(26)}${'q-med'.padStart(8)}${'q-p90'.padStart(8)}` +
      `${'lesson-med'.padStart(12)}${'lesson-max'.padStart(12)}`,
  )
  for (const s of sections) {
    const qLens = s.lessons.flatMap((l) => l.questionIds.map(len))
    const lessonTotals = s.lessons.map((l) => l.questionIds.reduce((n, id) => n + len(id), 0))
    console.log(
      `  ${s.title.padEnd(26)}${String(median(qLens)).padStart(8)}` +
        `${String(p90(qLens)).padStart(8)}${String(median(lessonTotals)).padStart(12)}` +
        `${String(Math.max(...lessonTotals)).padStart(12)}`,
    )
  }

  const pathIds = new Set(sections.flatMap((s) => s.lessons.flatMap((l) => l.questionIds)))
  const longest = questions
    .filter((q) => pathIds.has(q.id))
    .sort((a, b) => b.answerMd.length - a.answerMd.length)
    .slice(0, 5)
  console.log('\nfive longest questions on the path (answerMd chars):')
  for (const q of longest) {
    console.log(`  ${String(q.answerMd.length).padStart(6)}  "${q.question}"`)
  }
}

async function main(): Promise<void> {
  for (const source of SOURCES) {
    const { id, rawUrl } = source.SOURCE_META
    const res = await fetch(rawUrl)
    if (!res.ok) throw new Error(`failed to fetch ${rawUrl} for ${id}: ${res.status}`)
    const questions = source.parse(await res.text())
    report(id, questions)

    const sections = buildSections(questions, {
      excludedSlugs: EXCLUDED_SLUGS,
      pinnedFirst: PINNED_FIRST,
      lessonSizeBySection: LESSON_SIZE_BY_SECTION,
    })
    reportCurriculum(sections)
    reportLessonText(sections, questions)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
