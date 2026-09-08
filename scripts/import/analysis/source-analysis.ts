import { z } from 'zod'
import { sourceReferenceSchema } from '../../../src/content/schema'
import {
  normalizedDocumentsFileSchema,
  type NormalizedDocumentsFile,
} from '../normalized-document'

export const difficultyHintSchema = z.enum(['introductory', 'intermediate', 'advanced'])
export const relationshipTypeSchema = z.enum([
  'prerequisite_of',
  'related_to',
  'part_of',
  'contrasts_with',
])

export const evidenceReferenceSchema = z.object({
  documentId: z.string().length(12),
  heading: z.string().min(1).optional(),
  excerpt: z.string().min(1).max(500),
})

const conceptDetailSchema = z.object({
  kind: z.enum(['example', 'distinction']),
  summary: z.string().min(1),
  evidence: z.array(evidenceReferenceSchema).min(1),
})

export const conceptCandidateSchema = z.object({
  id: z.string().length(12),
  name: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.array(evidenceReferenceSchema).min(1),
  difficultyHint: difficultyHintSchema.optional(),
  details: z.array(conceptDetailSchema).optional(),
})

export const conceptRelationshipSchema = z.object({
  type: relationshipTypeSchema,
  fromConceptId: z.string().length(12),
  toConceptId: z.string().length(12),
  evidence: z.array(evidenceReferenceSchema).min(1),
})

const sourceSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  sourceRevision: z.string().min(1),
})

const analyzedDocumentSchema = z.object({
  documentId: z.string().length(12),
  title: z.string().min(1),
  sourceReference: sourceReferenceSchema,
})

const documentCoverageSchema = z.object({
  documentId: z.string().length(12),
  conceptIds: z.array(z.string().length(12)),
})

function allEvidence(
  analysis: z.infer<typeof sourceAnalysisShapeSchema>,
): Array<{ evidence: z.infer<typeof evidenceReferenceSchema>[]; path: (string | number)[] }> {
  const groups: Array<{
    evidence: z.infer<typeof evidenceReferenceSchema>[]
    path: (string | number)[]
  }> = []
  analysis.concepts.forEach((concept, conceptIndex) => {
    groups.push({ evidence: concept.evidence, path: ['concepts', conceptIndex, 'evidence'] })
    concept.details?.forEach((detail, detailIndex) => {
      groups.push({
        evidence: detail.evidence,
        path: ['concepts', conceptIndex, 'details', detailIndex, 'evidence'],
      })
    })
  })
  analysis.relationships.forEach((relationship, relationshipIndex) => {
    groups.push({
      evidence: relationship.evidence,
      path: ['relationships', relationshipIndex, 'evidence'],
    })
  })
  return groups
}

const sourceAnalysisShapeSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(sourceSnapshotSchema).min(1),
  documents: z.array(analyzedDocumentSchema).min(1),
  concepts: z.array(conceptCandidateSchema).min(1),
  relationships: z.array(conceptRelationshipSchema),
  coverage: z.object({ documents: z.array(documentCoverageSchema).min(1) }),
})

/** Provider-neutral semantic analysis with all internal references validated. */
export const sourceAnalysisSchema = sourceAnalysisShapeSchema.superRefine((analysis, context) => {
  const sourceIds = new Set<string>()
  for (const [index, source] of analysis.sources.entries()) {
    if (sourceIds.has(source.sourceId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate source id: ${source.sourceId}`,
        path: ['sources', index, 'sourceId'],
      })
    }
    sourceIds.add(source.sourceId)
  }

  const documentIds = new Set<string>()
  for (const [index, document] of analysis.documents.entries()) {
    if (documentIds.has(document.documentId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate document id: ${document.documentId}`,
        path: ['documents', index, 'documentId'],
      })
    }
    documentIds.add(document.documentId)
    const source = analysis.sources.find(
      (candidate) => candidate.sourceId === document.sourceReference.sourceId,
    )
    if (!source || source.sourceRevision !== document.sourceReference.sourceRevision) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `document source snapshot does not resolve: ${document.documentId}`,
        path: ['documents', index, 'sourceReference'],
      })
    }
  }

  const conceptIds = new Set<string>()
  for (const [index, concept] of analysis.concepts.entries()) {
    if (conceptIds.has(concept.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate concept id: ${concept.id}`,
        path: ['concepts', index, 'id'],
      })
    }
    conceptIds.add(concept.id)
  }

  for (const group of allEvidence(analysis)) {
    group.evidence.forEach((evidence, index) => {
      if (!documentIds.has(evidence.documentId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `evidence document does not resolve: ${evidence.documentId}`,
          path: [...group.path, index, 'documentId'],
        })
      }
    })
  }

  analysis.relationships.forEach((relationship, index) => {
    if (!conceptIds.has(relationship.fromConceptId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `relationship source concept does not resolve: ${relationship.fromConceptId}`,
        path: ['relationships', index, 'fromConceptId'],
      })
    }
    if (!conceptIds.has(relationship.toConceptId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `relationship target concept does not resolve: ${relationship.toConceptId}`,
        path: ['relationships', index, 'toConceptId'],
      })
    }
    if (relationship.fromConceptId === relationship.toConceptId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'self-referential relationship',
        path: ['relationships', index],
      })
    }
  })

  const coverageDocumentIds = new Set<string>()
  analysis.coverage.documents.forEach((coverage, index) => {
    if (coverageDocumentIds.has(coverage.documentId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate coverage document: ${coverage.documentId}`,
        path: ['coverage', 'documents', index, 'documentId'],
      })
    }
    coverageDocumentIds.add(coverage.documentId)
    if (!documentIds.has(coverage.documentId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `coverage document does not resolve: ${coverage.documentId}`,
        path: ['coverage', 'documents', index, 'documentId'],
      })
    }
    coverage.conceptIds.forEach((conceptId, conceptIndex) => {
      if (!conceptIds.has(conceptId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `coverage concept does not resolve: ${conceptId}`,
          path: ['coverage', 'documents', index, 'conceptIds', conceptIndex],
        })
      }
    })

    const expectedConceptIds = analysis.concepts
      .filter((concept) =>
        [
          ...concept.evidence,
          ...(concept.details?.flatMap((detail) => detail.evidence) ?? []),
        ].some((evidence) => evidence.documentId === coverage.documentId),
      )
      .map((concept) => concept.id)
      .sort()
    const actualConceptIds = [...coverage.conceptIds].sort()
    if (JSON.stringify(actualConceptIds) !== JSON.stringify(expectedConceptIds)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `coverage does not match concept evidence: ${coverage.documentId}`,
        path: ['coverage', 'documents', index, 'conceptIds'],
      })
    }
  })
  for (const documentId of documentIds) {
    if (!coverageDocumentIds.has(documentId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `missing document coverage: ${documentId}`,
        path: ['coverage', 'documents'],
      })
    }
  }
})

export const analysisRunMetadataSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  analyzerVersion: z.string().min(1),
})

/** Run metadata is deliberately outside the provider-neutral semantic payload. */
export const sourceAnalysisArtifactSchema = z.object({
  analysis: sourceAnalysisSchema,
  run: analysisRunMetadataSchema,
})

export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>
export type ConceptCandidate = z.infer<typeof conceptCandidateSchema>
export type ConceptRelationship = z.infer<typeof conceptRelationshipSchema>
export type SourceAnalysis = z.infer<typeof sourceAnalysisSchema>
export type AnalysisRunMetadata = z.infer<typeof analysisRunMetadataSchema>
export type SourceAnalysisArtifact = z.infer<typeof sourceAnalysisArtifactSchema>

type HeadingSection = { title: string; content: string }

/** Parse Markdown heading sections without treating fenced examples as document structure. */
function headingSections(content: string): HeadingSection[] {
  const lines = content.split('\n')
  const headings: Array<{ line: number; depth: number; title: string }> = []
  let inFence = false
  lines.forEach((line, index) => {
    if (/^\s*```/u.test(line)) inFence = !inFence
    const match = inFence ? null : /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line)
    if (match) headings.push({ line: index, depth: match[1].length, title: match[2].trim() })
  })

  return headings.map((heading, index) => {
    const next = headings.slice(index + 1).find((candidate) => candidate.depth <= heading.depth)
    return {
      title: heading.title,
      content: lines.slice(heading.line + 1, next?.line ?? lines.length).join('\n'),
    }
  })
}

export function validateEvidenceAgainstDocument(
  evidence: EvidenceReference,
  document: NormalizedDocumentsFile['documents'][number],
): void {
  if (!document.contentMd.includes(evidence.excerpt)) {
    throw new Error(
      `evidence excerpt does not resolve in document ${evidence.documentId}: ${JSON.stringify(evidence.excerpt)}`,
    )
  }
  if (evidence.heading) {
    const sections = headingSections(document.contentMd).filter(
      (section) => section.title === evidence.heading,
    )
    if (sections.length === 0) {
      throw new Error(
        `evidence heading does not resolve in document ${evidence.documentId}: ${evidence.heading}`,
      )
    }
    if (!sections.some((section) => section.content.includes(evidence.excerpt))) {
      throw new Error(
        `evidence excerpt is outside heading ${JSON.stringify(evidence.heading)} in document ${evidence.documentId}`,
      )
    }
  }
}

/** Validate semantic structure plus exact grounding against normalized source snapshots. */
export function validateSourceAnalysis(
  input: unknown,
  snapshotInputs: readonly unknown[],
): SourceAnalysis {
  const analysis = sourceAnalysisSchema.parse(input)
  const snapshots = snapshotInputs.map((snapshot) => normalizedDocumentsFileSchema.parse(snapshot))
  const snapshotSources = snapshots
    .map(({ sourceId, sourceRevision }) => ({ sourceId, sourceRevision }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
  const analysisSources = [...analysis.sources].sort((a, b) => a.sourceId.localeCompare(b.sourceId))
  if (JSON.stringify(snapshotSources) !== JSON.stringify(analysisSources)) {
    throw new Error('analysis sources do not match normalized source snapshots')
  }

  const normalizedDocuments = snapshots.flatMap((snapshot) => snapshot.documents)
  const byDocumentId = new Map(normalizedDocuments.map((document) => [document.id, document]))
  if (byDocumentId.size !== normalizedDocuments.length) {
    throw new Error('duplicate normalized document id across source snapshots')
  }
  const analyzedIds = new Set(analysis.documents.map((document) => document.documentId))
  if (
    analyzedIds.size !== byDocumentId.size ||
    [...byDocumentId.keys()].some((documentId) => !analyzedIds.has(documentId))
  ) {
    throw new Error('analyzed documents do not match normalized source snapshots')
  }

  for (const analyzed of analysis.documents) {
    const normalized = byDocumentId.get(analyzed.documentId)
    if (
      !normalized ||
      analyzed.title !== normalized.title ||
      JSON.stringify(analyzed.sourceReference) !== JSON.stringify(normalized.sourceReference)
    ) {
      throw new Error(`analyzed document metadata does not match source: ${analyzed.documentId}`)
    }
  }

  for (const group of allEvidence(analysis)) {
    for (const evidence of group.evidence) {
      const document = byDocumentId.get(evidence.documentId)
      if (!document) throw new Error(`evidence document does not resolve: ${evidence.documentId}`)
      validateEvidenceAgainstDocument(evidence, document)
    }
  }

  return analysis
}
