import { createHash } from 'node:crypto'
import {
  normalizedDocumentSchema,
  type NormalizedDocument,
} from '../normalized-document'

export const SOURCE_ID = 'microsoft-generative-ai-for-beginners'
export const SOURCE_REVISION = '645f932514e9f22f688c8feb3e49a7a7f2eb6f1b'
export const SOURCE_REPOSITORY_URL =
  'https://github.com/microsoft/generative-ai-for-beginners'

export type ApprovedLesson = {
  path: string
  order: number
}

/**
 * Approved inputs at SOURCE_REVISION: the Spanish teaching lessons only.
 * Course setup, code, notebooks, images, root docs, English originals, and other
 * translations are intentionally outside this adapter's ingestion boundary.
 */
export const APPROVED_LESSONS: readonly ApprovedLesson[] = [
  { order: 1, path: 'translations/es/01-introduction-to-genai/README.md' },
  { order: 2, path: 'translations/es/02-exploring-and-comparing-different-llms/README.md' },
  { order: 3, path: 'translations/es/03-using-generative-ai-responsibly/README.md' },
  { order: 4, path: 'translations/es/04-prompt-engineering-fundamentals/README.md' },
  { order: 5, path: 'translations/es/05-advanced-prompts/README.md' },
  { order: 6, path: 'translations/es/06-text-generation-apps/README.md' },
  { order: 7, path: 'translations/es/07-building-chat-applications/README.md' },
  { order: 8, path: 'translations/es/08-building-search-applications/README.md' },
  { order: 9, path: 'translations/es/09-building-image-applications/README.md' },
  { order: 10, path: 'translations/es/10-building-low-code-ai-applications/README.md' },
  { order: 11, path: 'translations/es/11-integrating-with-function-calling/README.md' },
  { order: 12, path: 'translations/es/12-designing-ux-for-ai-applications/README.md' },
  { order: 13, path: 'translations/es/13-securing-ai-applications/README.md' },
  { order: 14, path: 'translations/es/14-the-generative-ai-application-lifecycle/README.md' },
  { order: 15, path: 'translations/es/15-rag-and-vector-databases/README.md' },
  { order: 16, path: 'translations/es/16-open-source-models/README.md' },
  { order: 17, path: 'translations/es/17-ai-agents/README.md' },
  { order: 18, path: 'translations/es/18-fine-tuning/README.md' },
  { order: 19, path: 'translations/es/19-slm/README.md' },
  { order: 20, path: 'translations/es/20-mistral/README.md' },
  { order: 21, path: 'translations/es/21-meta/README.md' },
]

export type SourceFile = {
  path: string
  content: string
}

/** Stable across revisions; the source reference records which snapshot supplied content. */
export function makeDocumentId(path: string): string {
  return createHash('sha256').update(`${SOURCE_ID}:${path}`).digest('hex').slice(0, 12)
}

export function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/${SOURCE_REVISION}/${path}`
}

function sourceUrl(path: string): string {
  return `${SOURCE_REPOSITORY_URL}/blob/${SOURCE_REVISION}/${path}`
}

function extractTitle(content: string, path: string): string {
  const firstLine = content.split(/\r?\n/u).find((line) => line.trim().length > 0) ?? ''
  if (/^#\s+\S/u.test(firstLine)) return firstLine.replace(/^#\s+/u, '').trim()

  // Pinned Spanish lessons 16 and 17 omit H1s and start with their banner markup.
  const bannerTitle = /^\[!\[([^\]]+)\]\([^\n]+\)\]\([^\n]+\)/u.exec(firstLine)?.[1]?.trim()
  if (bannerTitle) return bannerTitle

  throw new Error(`[${SOURCE_ID}] missing level-one title or leading banner title in ${path}`)
}

export function normalizeLesson(
  lesson: ApprovedLesson,
  content: string,
): NormalizedDocument {
  if (content.trim().length === 0) {
    throw new Error(`[${SOURCE_ID}] empty approved lesson: ${lesson.path}`)
  }

  return normalizedDocumentSchema.parse({
    id: makeDocumentId(lesson.path),
    title: extractTitle(content, lesson.path),
    contentMd: content,
    sourceReference: {
      sourceId: SOURCE_ID,
      sourcePath: lesson.path,
      sourceRevision: SOURCE_REVISION,
      sourceUrl: sourceUrl(lesson.path),
    },
    metadata: { order: lesson.order, language: 'es' },
  })
}

/** Validate the exact allowlist, then return documents in approved numeric order. */
export function normalize(files: readonly SourceFile[]): NormalizedDocument[] {
  const byPath = new Map<string, string>()
  for (const file of files) {
    if (byPath.has(file.path)) {
      throw new Error(`[${SOURCE_ID}] duplicate source file: ${file.path}`)
    }
    byPath.set(file.path, file.content)
  }

  const approvedPaths = new Set(APPROVED_LESSONS.map((lesson) => lesson.path))
  const unexpected = [...byPath.keys()].filter((path) => !approvedPaths.has(path))
  if (unexpected.length > 0) {
    throw new Error(`[${SOURCE_ID}] unapproved source file: ${unexpected.join(', ')}`)
  }

  return APPROVED_LESSONS.map((lesson) => {
    const content = byPath.get(lesson.path)
    if (content === undefined) {
      throw new Error(`[${SOURCE_ID}] missing approved source file: ${lesson.path}`)
    }
    return normalizeLesson(lesson, content)
  })
}
