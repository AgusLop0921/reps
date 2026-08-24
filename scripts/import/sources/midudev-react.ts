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

/** Heading depth that marks a section. Upstream uses `###`, not `##`. */
const LEVEL_HEADING = 3
/** Heading depth that marks a question. */
const QUESTION_HEADING = 4

/** Upstream headings are Spanish; our levels are English (ADR-0008). */
const LEVEL_BY_KEYWORD: Array<[RegExp, Level]> = [
  [/principiant|b[áa]sic/i, 'basic'],
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

/**
 * Splits markdown into sections, ignoring fenced code blocks.
 *
 * Only headings at or above the question depth are section boundaries. Deeper headings
 * (`#####` and beyond) are sub-headings *inside* an answer and stay in the body verbatim —
 * otherwise an answer would be silently truncated at its first sub-heading, which for a
 * few questions drops the entire answer.
 */
function splitByHeadings(markdown: string): RawSection[] {
  const lines = markdown.split('\n')
  const sections: RawSection[] = []
  let current: RawSection | null = null
  let inFence = false

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence

    const match = !inFence ? /^(#{1,6})\s+(.*)$/.exec(line) : null
    if (match && match[1].length <= QUESTION_HEADING) {
      if (current) sections.push(current)
      current = { depth: match[1].length, title: match[2].trim(), body: '' }
      continue
    }
    if (current) current.body += `${line}\n`
  }
  if (current) sections.push(current)
  return sections
}

/**
 * Navigation chrome the source adds because the README is one scrollable document
 * (ADR-0015): a back-to-index link, and the rule separating one question from the next.
 */
/** Back-to-index link, e.g. `**[⬆ Volver a índice](#índice)**`. Never authored content. */
const BACK_TO_INDEX = /^\*\*\[⬆[^\]]*\]\(#índice\)\*\*$/
/** A horizontal rule. Transport at the end of an answer, but plausible content mid-answer. */
const HORIZONTAL_RULE = /^-{3,}$/

/** Marks every line inside a fenced code block, delimiters included. */
function fencedLines(lines: string[]): boolean[] {
  let inFence = false
  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return true
    }
    return inFence
  })
}

/**
 * Removes transport artifacts from the end of an answer only (ADR-0015). Fenced code is
 * never transport, so a `---` inside a code block is left alone. A back-to-index link
 * surviving mid-answer means the format assumption broke — fail loudly rather than delete
 * content; a bare rule mid-answer is plausible authored content and is kept.
 */
function stripTransport(body: string, questionTitle: string): string {
  const lines = body.trim().split('\n')
  const fenced = fencedLines(lines)

  let end = lines.length
  while (end > 0) {
    const i = end - 1
    const line = lines[i].trim()
    const isTrailingArtifact =
      !fenced[i] && (BACK_TO_INDEX.test(line) || HORIZONTAL_RULE.test(line))
    if (line === '' || isTrailingArtifact) end--
    else break
  }

  for (let i = 0; i < end; i++) {
    if (!fenced[i] && BACK_TO_INDEX.test(lines[i].trim())) {
      throw new Error(
        `[${SOURCE_ID}] transport artifact mid-answer in "${questionTitle}"`,
      )
    }
  }

  return lines.slice(0, end).join('\n').trim()
}

export function parse(markdown: string): Question[] {
  const sections = splitByHeadings(markdown)
  const questions: Question[] = []
  let level: Level | null = null
  let sourceSection: string | null = null

  for (const section of sections) {
    if (section.depth === LEVEL_HEADING) {
      sourceSection = section.title
      // null when the heading is not a known level; never inherited (ADR-0014).
      level = detectLevel(section.title)
      continue
    }
    if (section.depth !== QUESTION_HEADING) continue

    if (sourceSection === null) {
      throw new Error(
        `[${SOURCE_ID}] question before any section heading: "${section.title}"`,
      )
    }

    const answerMd = stripTransport(section.body, section.title)
    if (!answerMd) {
      throw new Error(`[${SOURCE_ID}] question with no answer: "${section.title}"`)
    }

    const slug = slugify(section.title)
    questions.push({
      id: makeId(SOURCE_ID, slug),
      sourceId: SOURCE_ID,
      slug,
      sourceSection,
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
