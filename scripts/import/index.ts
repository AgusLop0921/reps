import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { curriculumSchema, questionsFileSchema } from '../../src/content/schema'
import { EXCLUDED_SLUGS, PINNED_FIRST } from '../../src/content/order'
import { buildSections } from './curriculum'
import * as midudevReact from './sources/midudev-react'

/**
 * Content import pipeline (`pnpm content:import`, ADR-0004):
 *   fetch source markdown -> adapter.parse() -> validate questions
 *                         -> buildSections() -> validate curriculum
 *                         -> write src/content/data/*.json
 * Validation failures throw, so a bad import fails the command instead of writing
 * corrupt data. The generated files are committed (ADR-0009), never edited by hand.
 */

const DATA_DIR = fileURLToPath(new URL('../../src/content/data/', import.meta.url))

async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`)
  return res.text()
}

async function writeJson(name: string, value: unknown): Promise<void> {
  await writeFile(`${DATA_DIR}${name}`, `${JSON.stringify(value, null, 2)}\n`)
}

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString()
  const source = midudevReact

  const questions = source.parse(await fetchMarkdown(source.SOURCE_META.rawUrl))

  const questionsFile = questionsFileSchema.parse({
    generatedAt,
    sourceId: source.SOURCE_ID,
    questions,
  })

  // order.ts pins are keyed by level (a pre-ADR-0014 shape); placement is by the question's
  // actual section, so only the slug list matters here. Flatten it.
  const pinnedFirst = Object.values(PINNED_FIRST)
    .flat()
    .filter((slug): slug is string => typeof slug === 'string')

  const curriculum = curriculumSchema.parse({
    generatedAt,
    sections: buildSections(questions, { excludedSlugs: EXCLUDED_SLUGS, pinnedFirst }),
  })

  await mkdir(DATA_DIR, { recursive: true })
  await writeJson('questions.json', questionsFile)
  await writeJson('curriculum.json', curriculum)

  const lessons = curriculum.sections.reduce((n, s) => n + s.lessons.length, 0)
  console.log(
    `imported ${questions.length} questions into ${curriculum.sections.length} sections, ` +
      `${lessons} lessons -> src/content/data/`,
  )
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
