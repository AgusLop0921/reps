import { createHash } from 'node:crypto'
import type { Level, Question } from '../../../src/content/schema'

/**
 * Source: https://github.com/midudev/preguntas-entrevista-react  (MIT)
 *
 * The README groups questions under level headings, and each question is a deeper
 * heading followed by its answer in markdown.
 *
 * WARNING: the constants below are assumptions about the upstream format. Verify them
 * against the real README before trusting this. The source repo ships its own parser in
 * `scripts/markdownToJson.mjs` (MIT); if the format is stranger than assumed here,
 * adapting that one beats fighting with this.
 */

export const SOURCE_ID = 'midudev-react'

export const SOURCE_META = {
  id: SOURCE_ID,
  name: 'Preguntas de entrevista de React',
  author: 'midudev (Miguel Ángel Durán)',
  url: 'https://github.com/midudev/preguntas-entrevista-react',
  rawUrl:
    'https://raw.githubusercontent.com/midudev/preguntas-entrevista-react/main/README.md',
  license: 'MIT',
  tech: 'react',
  lang: 'es',
} as const

/** Heading depth that marks a level section. */
const LEVEL_HEADING = 2
/** Heading depth that marks a question. */
const QUESTION_HEADING = 4

/** Upstream headings are Spanish; our levels are English (ADR-0008). */
const LEVEL_BY_KEYWORD: Array<[RegExp, Level]> = [
  [/b[áa]sic/i, 'basic'],
  [/intermedi/i, 'intermediate'],
  [/avanzad/i, 'advanced'],
  [/expert/i, 'expert'],
]

function detectLevel(heading: string): Level | null {
  for (const [pattern, level] of LEVEL_BY_KEYWORD) {
    if (pattern.test(heading)) return level
  }
  return null
}

/** Same slug rules GitHub uses for README anchors. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

export function makeId(sourceId: string, slug: string): string {
  return createHash('sha256').update(`${sourceId}:${slug}`).digest('hex').slice(0, 12)
}

type RawSection = { depth: number; title: string; body: string }

/** Splits markdown on headings with no dependencies, ignoring fenced code blocks. */
function splitByHeadings(markdown: string): RawSection[] {
  const lines = markdown.split('\n')
  const sections: RawSection[] = []
  let current: RawSection | null = null
  let inFence = false

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence

    const match = !inFence ? /^(#{1,6})\s+(.*)$/.exec(line) : null
    if (match) {
      if (current) sections.push(current)
      current = { depth: match[1].length, title: match[2].trim(), body: '' }
      continue
    }
    if (current) current.body += `${line}\n`
  }
  if (current) sections.push(current)
  return sections
}

export function parse(markdown: string): Question[] {
  const sections = splitByHeadings(markdown)
  const questions: Question[] = []
  let level: Level = 'basic'

  for (const section of sections) {
    if (section.depth === LEVEL_HEADING) {
      level = detectLevel(section.title) ?? level
      continue
    }
    if (section.depth !== QUESTION_HEADING) continue

    const answerMd = section.body.trim()
    if (!answerMd) {
      throw new Error(`[${SOURCE_ID}] question with no answer: "${section.title}"`)
    }

    const slug = slugify(section.title)
    questions.push({
      id: makeId(SOURCE_ID, slug),
      sourceId: SOURCE_ID,
      slug,
      tech: 'react',
      lang: 'es',
      level,
      topic: null,
      format: 'open',
      question: section.title,
      answerMd,
    })
  }

  if (questions.length === 0) {
    throw new Error(
      `[${SOURCE_ID}] parsed zero questions. The upstream README format changed: ` +
        `check LEVEL_HEADING and QUESTION_HEADING.`,
    )
  }

  const ids = new Set(questions.map((q) => q.id))
  if (ids.size !== questions.length) {
    throw new Error(`[${SOURCE_ID}] duplicate slugs found`)
  }

  return questions
}
