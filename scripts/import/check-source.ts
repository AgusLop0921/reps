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
import { EXCLUDED_SLUGS, PINNED_FIRST } from '../../src/content/order'
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

async function main(): Promise<void> {
  for (const source of SOURCES) {
    const { id, rawUrl } = source.SOURCE_META
    const res = await fetch(rawUrl)
    if (!res.ok) throw new Error(`failed to fetch ${rawUrl} for ${id}: ${res.status}`)
    const questions = source.parse(await res.text())
    report(id, questions)

    // Mirror index.ts: level-keyed pins flatten to a slug list (placement is by section).
    const pinnedFirst = Object.values(PINNED_FIRST)
      .flat()
      .filter((slug): slug is string => typeof slug === 'string')
    reportCurriculum(buildSections(questions, { excludedSlugs: EXCLUDED_SLUGS, pinnedFirst }))
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
