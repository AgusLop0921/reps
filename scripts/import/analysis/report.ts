import type { SourceAnalysisArtifact } from './source-analysis'

export function renderAnalysisReport(artifact: SourceAnalysisArtifact): string {
  const { analysis, run } = artifact
  const covered = analysis.coverage.documents.filter((document) => document.conceptIds.length > 0)
  const relationshipCounts = new Map<string, number>()
  for (const relationship of analysis.relationships) {
    relationshipCounts.set(relationship.type, (relationshipCounts.get(relationship.type) ?? 0) + 1)
  }
  const zeroCoverage = analysis.coverage.documents
    .filter((document) => document.conceptIds.length === 0)
    .map((document) => analysis.documents.find((candidate) => candidate.documentId === document.documentId)?.title)
    .filter((title): title is string => Boolean(title))
  const evidenceDocuments = (concept: (typeof analysis.concepts)[number]): Set<string> =>
    new Set([
      ...concept.evidence.map((evidence) => evidence.documentId),
      ...(concept.details?.flatMap((detail) =>
        detail.evidence.map((evidence) => evidence.documentId),
      ) ?? []),
    ])
  const multiDocumentConcepts = analysis.concepts.filter(
    (concept) => evidenceDocuments(concept).size > 1,
  )
  const singleEvidenceConcepts = analysis.concepts.filter(
    (concept) =>
      concept.evidence.length +
        (concept.details?.reduce((count, detail) => count + detail.evidence.length, 0) ?? 0) ===
      1,
  )

  const lines = [
    '# Source analysis report',
    '',
    `- Sources: ${analysis.sources.length}`,
    `- Documents: ${analysis.documents.length}`,
    `- Documents with concept coverage: ${covered.length}`,
    `- Concepts: ${analysis.concepts.length}`,
    `- Concepts supported by multiple documents: ${multiDocumentConcepts.length}`,
    `- Concepts with one evidence reference: ${singleEvidenceConcepts.length}`,
    `- Relationships: ${analysis.relationships.length}`,
    `- Provider: ${run.provider}`,
    `- Model: ${run.model}`,
    `- Prompt version: ${run.promptVersion}`,
    `- Analyzer version: ${run.analyzerVersion}`,
    '',
    '## Relationship counts',
    '',
    ...(relationshipCounts.size
      ? [...relationshipCounts].sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => `- ${type}: ${count}`)
      : ['- None']),
    '',
    '## Documents without concept coverage',
    '',
    ...(zeroCoverage.length ? zeroCoverage.map((title) => `- ${title}`) : ['- None']),
    '',
    '## Concepts per document',
    '',
    ...analysis.coverage.documents.map((coverage) => {
      const document = analysis.documents.find(
        (candidate) => candidate.documentId === coverage.documentId,
      )
      return `- ${document?.title ?? coverage.documentId}: ${coverage.conceptIds.length}`
    }),
    '',
    '## Concepts supported by multiple documents',
    '',
    ...(multiDocumentConcepts.length
      ? multiDocumentConcepts.map((concept) => `- ${concept.name}`)
      : ['- None']),
    '',
  ]
  return lines.join('\n')
}
