import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  APPROVED_LESSONS,
  SOURCE_ID,
  SOURCE_REVISION,
  makeDocumentId,
  normalize,
  normalizeLesson,
} from './microsoft-generative-ai-for-beginners'

const fixtureUrl = new URL(
  './fixtures/microsoft-generative-ai-for-beginners/01-introduction.md',
  import.meta.url,
)

describe('Microsoft Generative AI for Beginners adapter', () => {
  it('preserves fixture Markdown and attaches revision-pinned provenance', async () => {
    const content = await readFile(fixtureUrl, 'utf8')
    const lesson = APPROVED_LESSONS[0]
    const document = normalizeLesson(lesson, content)

    expect(document).toMatchObject({
      id: makeDocumentId(lesson.path),
      title: 'Introducción a la IA Generativa',
      contentMd: content,
      sourceReference: {
        sourceId: SOURCE_ID,
        sourcePath: lesson.path,
        sourceRevision: SOURCE_REVISION,
      },
      metadata: { order: 1, language: 'es' },
    })
    expect(document.sourceReference.sourceUrl).toContain(`blob/${SOURCE_REVISION}/`)
  })

  it('produces stable source-and-path ids independent of content', () => {
    expect(makeDocumentId(APPROVED_LESSONS[0].path)).toBe('4d2475ba2e3b')
  })

  it('returns all documents in approved order regardless of input order', () => {
    const files = APPROVED_LESSONS.map((lesson) => ({
      path: lesson.path,
      content: `# Lección ${lesson.order}\n`,
    })).reverse()

    expect(normalize(files).map((document) => document.metadata?.order)).toEqual(
      APPROVED_LESSONS.map((lesson) => lesson.order),
    )
  })

  it('fails loudly for missing, duplicate, or unapproved files', () => {
    const files = APPROVED_LESSONS.map((lesson) => ({
      path: lesson.path,
      content: `# Lección ${lesson.order}\n`,
    }))

    expect(() => normalize(files.slice(1))).toThrow(/missing approved source file/)
    expect(() => normalize([...files, files[0]])).toThrow(/duplicate source file/)
    expect(() => normalize([...files, { path: 'README.md', content: '# Root' }])).toThrow(
      /unapproved source file/,
    )
  })

  it('fails loudly when a lesson has no level-one title or no content', () => {
    expect(() => normalizeLesson(APPROVED_LESSONS[0], '## Subheading only')).toThrow(
      /missing level-one title or leading banner title/,
    )
    expect(() => normalizeLesson(APPROVED_LESSONS[0], '   ')).toThrow(
      /empty approved lesson/,
    )
  })

  it('uses the pinned lesson banner title when the source omits its H1', () => {
    const content = '[![Modelos de Código Abierto](banner.webp)](video-url)\n\n## Introducción\n'
    expect(normalizeLesson(APPROVED_LESSONS[15], content).title).toBe(
      'Modelos de Código Abierto',
    )
  })
})
