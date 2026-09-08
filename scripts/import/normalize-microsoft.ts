import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { normalizedDocumentsFileSchema } from './normalized-document'
import {
  APPROVED_LESSONS,
  SOURCE_ID,
  SOURCE_REVISION,
  normalize,
  rawUrl,
  type SourceFile,
} from './sources/microsoft-generative-ai-for-beginners'

const OUTPUT_DIR = fileURLToPath(new URL('./generated/', import.meta.url))
const OUTPUT_FILE = `${OUTPUT_DIR}microsoft-generative-ai-for-beginners.es.json`
const API_BASE = 'https://api.github.com/repos/microsoft/generative-ai-for-beginners'

const commitResponseSchema = z.object({ sha: z.string() })
const treeResponseSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(z.object({ path: z.string(), type: z.string() })),
})

async function fetchOrThrow(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'reps-content-import' },
  })
  if (!response.ok) {
    throw new Error(`[${SOURCE_ID}] fetch failed (${response.status}): ${url}`)
  }
  return response
}

async function verifyPinnedRevision(): Promise<void> {
  const response = await fetchOrThrow(`${API_BASE}/git/commits/${SOURCE_REVISION}`)
  const commit = commitResponseSchema.parse(await response.json())
  if (commit.sha !== SOURCE_REVISION) {
    throw new Error(
      `[${SOURCE_ID}] revision mismatch: expected ${SOURCE_REVISION}, received ${commit.sha}`,
    )
  }
}

/**
 * Compare the allowlist with every Spanish numbered lesson README in the pinned tree.
 * This fails when a maintainer updates the revision but forgets to review source selection.
 */
async function verifyApprovedLessonSet(): Promise<void> {
  const response = await fetchOrThrow(`${API_BASE}/git/trees/${SOURCE_REVISION}?recursive=1`)
  const tree = treeResponseSchema.parse(await response.json())
  if (tree.truncated) throw new Error(`[${SOURCE_ID}] GitHub returned a truncated source tree`)

  const lessonPattern = /^translations\/es\/(\d{2})[^/]*\/README\.md$/u
  const upstreamPaths = tree.tree
    .filter((entry) => entry.type === 'blob' && lessonPattern.test(entry.path))
    .map((entry) => entry.path)
    .filter((path) => !path.startsWith('translations/es/00-'))
    .sort()
  const approvedPaths = APPROVED_LESSONS.map((lesson) => lesson.path).sort()

  if (JSON.stringify(upstreamPaths) !== JSON.stringify(approvedPaths)) {
    const approved = new Set(approvedPaths)
    const upstream = new Set(upstreamPaths)
    const missingApproval = upstreamPaths.filter((path) => !approved.has(path))
    const missingUpstream = approvedPaths.filter((path) => !upstream.has(path))
    throw new Error(
      `[${SOURCE_ID}] approved lesson set does not match revision ${SOURCE_REVISION}; ` +
        `unreviewed upstream: ${missingApproval.join(', ') || 'none'}; ` +
        `missing upstream: ${missingUpstream.join(', ') || 'none'}`,
    )
  }
}

async function fetchApprovedLessons(): Promise<SourceFile[]> {
  return Promise.all(
    APPROVED_LESSONS.map(async (lesson) => ({
      path: lesson.path,
      content: await (await fetchOrThrow(rawUrl(lesson.path))).text(),
    })),
  )
}

export async function fetchAndNormalizeMicrosoftSource() {
  await verifyPinnedRevision()
  await verifyApprovedLessonSet()
  return normalizedDocumentsFileSchema.parse({
    schemaVersion: 1,
    sourceId: SOURCE_ID,
    sourceRevision: SOURCE_REVISION,
    documents: normalize(await fetchApprovedLessons()),
  })
}

async function main(): Promise<void> {
  const result = await fetchAndNormalizeMicrosoftSource()
  if (process.argv.includes('--check')) {
    console.log(
      `verified ${result.documents.length} approved documents at ${result.sourceRevision}`,
    )
    return
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`)
  console.log(`normalized ${result.documents.length} documents -> ${OUTPUT_FILE}`)
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
