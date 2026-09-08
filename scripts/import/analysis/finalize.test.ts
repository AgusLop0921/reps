import { describe, expect, it } from 'vitest'
import type { NormalizedDocumentsFile } from '../normalized-document'
import { finalizeSourceAnalysis, makeConceptId, normalizeConceptName } from './finalize'
import { sourceAnalysisSchema } from './source-analysis'

const snapshot: NormalizedDocumentsFile = {
  schemaVersion: 1,
  sourceId: 'source',
  sourceRevision: 'revision',
  documents: [{
    id: '123456789abc',
    title: 'Título',
    contentMd: '# Título\n\nEvidencia exacta.\n',
    sourceReference: { sourceId: 'source', sourceRevision: 'revision' },
  }],
}

const concept = {
  name: 'Generación aumentada por recuperación',
  summary: 'Un concepto apoyado por la fuente.',
  difficultyHint: 'unknown' as const,
  evidence: [{ documentId: '123456789abc', heading: 'Título', excerpt: 'Evidencia exacta.' }],
  details: [],
}

describe('deterministic source analysis finalization', () => {
  it('uses the documented, versioned lexical concept identity', () => {
    expect(normalizeConceptName('  Generación aumentada  ')).toBe('generacion-aumentada')
    expect(makeConceptId('Generación aumentada')).toMatch(/^[a-f0-9]{12}$/u)
    expect(makeConceptId('Generación aumentada')).toBe(makeConceptId('generacion-aumentada'))
  })

  it('rejects duplicate normalized names instead of silently merging them', () => {
    expect(() =>
      finalizeSourceAnalysis(snapshot, {
        concepts: [concept, { ...concept, name: 'GENERACION AUMENTADA POR RECUPERACION' }],
        relationships: [],
      }),
    ).toThrow(/duplicate normalized concept name/)
  })

  it('rejects canonical coverage that disagrees with grounded concept evidence', () => {
    const analysis = finalizeSourceAnalysis(snapshot, { concepts: [concept], relationships: [] })
    expect(() =>
      sourceAnalysisSchema.parse({
        ...analysis,
        coverage: { documents: [{ documentId: '123456789abc', conceptIds: [] }] },
      }),
    ).toThrow(/coverage does not match concept evidence/)
  })

  it('rejects duplicate concept ids and unresolved relationship targets', () => {
    const analysis = finalizeSourceAnalysis(snapshot, { concepts: [concept], relationships: [] })
    expect(() =>
      sourceAnalysisSchema.parse({
        ...analysis,
        concepts: [...analysis.concepts, analysis.concepts[0]],
      }),
    ).toThrow(/duplicate concept id/)
    expect(() =>
      sourceAnalysisSchema.parse({
        ...analysis,
        relationships: [{
          type: 'related_to',
          fromConceptId: analysis.concepts[0].id,
          toConceptId: '000000000000',
          evidence: analysis.concepts[0].evidence,
        }],
      }),
    ).toThrow(/relationship target concept does not resolve/)
  })

  it('sorts equivalent provider output deterministically', () => {
    const other = { ...concept, name: 'Agentes' }
    const forward = finalizeSourceAnalysis(snapshot, {
      concepts: [concept, other],
      relationships: [],
    })
    const reversed = finalizeSourceAnalysis(snapshot, {
      concepts: [other, concept],
      relationships: [],
    })
    expect(reversed).toEqual(forward)
  })
})
