import { createHash } from 'node:crypto'
import type { NormalizedDocumentsFile } from '../normalized-document'
import {
  consolidationOutputSchema,
  documentExtractionSchema,
  type ConsolidationOutput,
  type DocumentExtraction,
  type ModelEvidence,
} from './model-output'
import {
  sourceAnalysisSchema,
  validateEvidenceAgainstDocument,
  validateSourceAnalysis,
  type ConceptCandidate,
  type EvidenceReference,
  type SourceAnalysis,
} from './source-analysis'

export const CONCEPT_ID_VERSION = 'concept:v1'

/** Versioned lexical identity. Semantic synonym resolution remains a reviewed model task. */
export function normalizeConceptName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '')
}

export function makeConceptId(name: string): string {
  const normalized = normalizeConceptName(name)
  if (!normalized) throw new Error(`concept name has no identity characters: ${JSON.stringify(name)}`)
  return createHash('sha256')
    .update(`${CONCEPT_ID_VERSION}:${normalized}`)
    .digest('hex')
    .slice(0, 12)
}

function canonicalEvidence(
  evidence: ModelEvidence & { documentId: string },
): EvidenceReference {
  const heading = evidence.heading.trim()
  return {
    documentId: evidence.documentId,
    ...(heading ? { heading } : {}),
    excerpt: evidence.excerpt.trim(),
  }
}

function evidenceSortKey(
  evidence: EvidenceReference,
  documentOrder: ReadonlyMap<string, number>,
): string {
  return `${String(documentOrder.get(evidence.documentId) ?? Number.MAX_SAFE_INTEGER).padStart(8, '0')}:` +
    `${evidence.heading ?? ''}:${evidence.excerpt}`
}

function sortEvidence(
  evidence: EvidenceReference[],
  documentOrder: ReadonlyMap<string, number>,
): EvidenceReference[] {
  return [...evidence].sort((a, b) =>
    evidenceSortKey(a, documentOrder).localeCompare(evidenceSortKey(b, documentOrder)),
  )
}

/** Validate a provider extraction against its one source document immediately. */
export function validateDocumentExtraction(
  input: unknown,
  document: NormalizedDocumentsFile['documents'][number],
): DocumentExtraction {
  const extraction = documentExtractionSchema.parse(input)
  if (extraction.documentId !== document.id) {
    throw new Error(
      `extraction document mismatch: expected ${document.id}, received ${extraction.documentId}`,
    )
  }
  for (const concept of extraction.concepts) {
    for (const evidence of concept.evidence) {
      validateEvidenceAgainstDocument(canonicalEvidence({ ...evidence, documentId: document.id }), document)
    }
    for (const detail of concept.details) {
      for (const evidence of detail.evidence) {
        validateEvidenceAgainstDocument(
          canonicalEvidence({ ...evidence, documentId: document.id }),
          document,
        )
      }
    }
  }
  return extraction
}

export function finalizeSourceAnalysis(
  snapshot: NormalizedDocumentsFile,
  providerOutput: unknown,
): SourceAnalysis {
  const consolidated: ConsolidationOutput = consolidationOutputSchema.parse(providerOutput)
  const documentOrder = new Map(snapshot.documents.map((document, index) => [document.id, index]))
  const conceptIdByNormalizedName = new Map<string, string>()

  const concepts: ConceptCandidate[] = consolidated.concepts.map((concept) => {
    const normalizedName = normalizeConceptName(concept.name)
    const id = makeConceptId(concept.name)
    if (conceptIdByNormalizedName.has(normalizedName)) {
      throw new Error(`duplicate normalized concept name: ${normalizedName}`)
    }
    if ([...conceptIdByNormalizedName.values()].includes(id)) {
      throw new Error(`concept id collision: ${id}`)
    }
    conceptIdByNormalizedName.set(normalizedName, id)

    return {
      id,
      name: concept.name.trim(),
      summary: concept.summary.trim(),
      evidence: sortEvidence(concept.evidence.map(canonicalEvidence), documentOrder),
      ...(concept.difficultyHint === 'unknown'
        ? {}
        : { difficultyHint: concept.difficultyHint }),
      ...(concept.details.length
        ? {
            details: concept.details
              .map((detail) => ({
                kind: detail.kind,
                summary: detail.summary.trim(),
                evidence: sortEvidence(detail.evidence.map(canonicalEvidence), documentOrder),
              }))
              .sort((a, b) => `${a.kind}:${a.summary}`.localeCompare(`${b.kind}:${b.summary}`)),
          }
        : {}),
    }
  })

  concepts.sort((a, b) => normalizeConceptName(a.name).localeCompare(normalizeConceptName(b.name)))

  const relationships = consolidated.relationships
    .map((relationship) => {
      const fromConceptId = conceptIdByNormalizedName.get(
        normalizeConceptName(relationship.fromConceptName),
      )
      const toConceptId = conceptIdByNormalizedName.get(
        normalizeConceptName(relationship.toConceptName),
      )
      if (!fromConceptId) {
        throw new Error(`relationship source concept does not resolve: ${relationship.fromConceptName}`)
      }
      if (!toConceptId) {
        throw new Error(`relationship target concept does not resolve: ${relationship.toConceptName}`)
      }
      return {
        type: relationship.type,
        fromConceptId,
        toConceptId,
        evidence: sortEvidence(relationship.evidence.map(canonicalEvidence), documentOrder),
      }
    })
    .sort((a, b) =>
      `${a.fromConceptId}:${a.type}:${a.toConceptId}`.localeCompare(
        `${b.fromConceptId}:${b.type}:${b.toConceptId}`,
      ),
    )

  const coverage = snapshot.documents.map((document) => ({
    documentId: document.id,
    conceptIds: concepts
      .filter((concept) => {
        const evidence = [
          ...concept.evidence,
          ...(concept.details?.flatMap((detail) => detail.evidence) ?? []),
        ]
        return evidence.some((reference) => reference.documentId === document.id)
      })
      .map((concept) => concept.id)
      .sort(),
  }))

  const analysis = sourceAnalysisSchema.parse({
    schemaVersion: 1,
    sources: [{ sourceId: snapshot.sourceId, sourceRevision: snapshot.sourceRevision }],
    documents: snapshot.documents.map((document) => ({
      documentId: document.id,
      title: document.title,
      sourceReference: document.sourceReference,
    })),
    concepts,
    relationships,
    coverage: { documents: coverage },
  })
  return validateSourceAnalysis(analysis, [snapshot])
}
