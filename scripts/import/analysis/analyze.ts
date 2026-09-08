import { normalizedDocumentsFileSchema, type NormalizedDocument } from '../normalized-document'
import { validateDocumentExtraction } from './finalize'
import { finalizeSourceAnalysis } from './finalize'
import { consolidationOutputSchema, type DocumentExtraction } from './model-output'
import {
  sourceAnalysisArtifactSchema,
  validateSourceAnalysis,
  type AnalysisRunMetadata,
  type SourceAnalysisArtifact,
} from './source-analysis'

/** Provider boundary. Implementations may use an LLM or a deterministic analyzer. */
export interface SourceAnalyzer {
  readonly runMetadata: AnalysisRunMetadata
  extractDocument(document: NormalizedDocument): Promise<unknown>
  consolidate(extractions: readonly DocumentExtraction[]): Promise<unknown>
}

function evidenceKey(documentId: string, heading: string, excerpt: string): string {
  return JSON.stringify([documentId, heading.trim(), excerpt.trim()])
}

function validateConsolidationEvidence(
  input: unknown,
  extractions: readonly DocumentExtraction[],
): unknown {
  const consolidation = consolidationOutputSchema.parse(input)
  const extractedEvidence = new Set<string>()
  for (const extraction of extractions) {
    for (const concept of extraction.concepts) {
      for (const evidence of concept.evidence) {
        extractedEvidence.add(evidenceKey(extraction.documentId, evidence.heading, evidence.excerpt))
      }
      for (const detail of concept.details) {
        for (const evidence of detail.evidence) {
          extractedEvidence.add(evidenceKey(extraction.documentId, evidence.heading, evidence.excerpt))
        }
      }
    }
  }

  const consolidatedEvidence = [
    ...consolidation.concepts.flatMap((concept) => [
      ...concept.evidence,
      ...concept.details.flatMap((detail) => detail.evidence),
    ]),
    ...consolidation.relationships.flatMap((relationship) => relationship.evidence),
  ]
  for (const evidence of consolidatedEvidence) {
    if (!extractedEvidence.has(evidenceKey(evidence.documentId, evidence.heading, evidence.excerpt))) {
      throw new Error(
        `consolidation introduced unvalidated evidence for document ${evidence.documentId}`,
      )
    }
  }
  return consolidation
}

/** Run extraction, hard grounding validation, consolidation, and deterministic finalization. */
export async function analyzeNormalizedSource(
  snapshotInput: unknown,
  analyzer: SourceAnalyzer,
): Promise<SourceAnalysisArtifact> {
  const snapshot = normalizedDocumentsFileSchema.parse(snapshotInput)
  const extractions: DocumentExtraction[] = []

  // Deliberately stable and sequential: source order is review order and providers may rate-limit.
  for (const document of snapshot.documents) {
    const rawExtraction = await analyzer.extractDocument(document)
    extractions.push(validateDocumentExtraction(rawExtraction, document))
  }

  const consolidation = validateConsolidationEvidence(
    await analyzer.consolidate(extractions),
    extractions,
  )
  const analysis = finalizeSourceAnalysis(snapshot, consolidation)
  validateSourceAnalysis(analysis, [snapshot])
  return sourceAnalysisArtifactSchema.parse({ analysis, run: analyzer.runMetadata })
}
