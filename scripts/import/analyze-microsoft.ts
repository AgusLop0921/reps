import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeNormalizedSource } from './analysis/analyze'
import { AnthropicSourceAnalyzer } from './analysis/anthropic'
import { renderAnalysisReport } from './analysis/report'
import { ANALYSIS_OUTPUT_ROOT } from './analysis/paths'
import { sourceAnalysisArtifactSchema } from './analysis/source-analysis'
import { normalizedDocumentsFileSchema } from './normalized-document'
import {
  SOURCE_ID as MICROSOFT_SOURCE_ID,
  SOURCE_REVISION as MICROSOFT_SOURCE_REVISION,
} from './sources/microsoft-generative-ai-for-beginners'

export const MICROSOFT_NORMALIZED_PATH = fileURLToPath(
  new URL('./generated/microsoft-generative-ai-for-beginners.es.json', import.meta.url),
)
async function run(): Promise<void> {
  const snapshot = normalizedDocumentsFileSchema.parse(
    JSON.parse(await readFile(MICROSOFT_NORMALIZED_PATH, 'utf8')),
  )
  if (
    snapshot.sourceId !== MICROSOFT_SOURCE_ID ||
    snapshot.sourceRevision !== MICROSOFT_SOURCE_REVISION
  ) {
    throw new Error(
      `Microsoft analysis input is not the pinned ${MICROSOFT_SOURCE_ID}@${MICROSOFT_SOURCE_REVISION}`,
    )
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set; no source analysis artifact was generated')
  }

  const outputDirectory = join(ANALYSIS_OUTPUT_ROOT, snapshot.sourceId, snapshot.sourceRevision)
  const artifactPath = join(outputDirectory, 'source-analysis.json')
  let existing: unknown
  try {
    existing = JSON.parse(await readFile(artifactPath, 'utf8'))
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  }
  if (existing) {
    const artifact = sourceAnalysisArtifactSchema.parse(existing)
    const revision = artifact.analysis.sources.find(
      (source) => source.sourceId === snapshot.sourceId,
    )?.sourceRevision
    if (revision !== snapshot.sourceRevision) {
      throw new Error(`refusing to overwrite analysis from source revision ${revision ?? 'unknown'}`)
    }
  }

  const artifact = await analyzeNormalizedSource(snapshot, new AnthropicSourceAnalyzer(apiKey))
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`)
  await writeFile(join(outputDirectory, 'analysis-report.md'), renderAnalysisReport(artifact))
  console.log(`Wrote ${artifact.analysis.concepts.length} grounded concepts to ${artifactPath}`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
