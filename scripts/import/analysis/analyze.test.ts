import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { NormalizedDocumentsFile } from '../normalized-document'
import { analyzeNormalizedSource, type SourceAnalyzer } from './analyze'
import { makeConceptId } from './finalize'

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/provider-output.json', import.meta.url)), 'utf8'),
) as {
  extractions: Record<string, unknown>
  consolidation: unknown
}

const snapshot: NormalizedDocumentsFile = {
  schemaVersion: 1,
  sourceId: 'fixture-source',
  sourceRevision: '0123456789abcdef',
  documents: [
    {
      id: 'aaaaaaaaaaaa',
      title: 'Componentes',
      contentMd: '# Componentes\n\nLas interfaces usan componentes.\n',
      sourceReference: { sourceId: 'fixture-source', sourceRevision: '0123456789abcdef' },
    },
    {
      id: 'bbbbbbbbbbbb',
      title: 'Estado',
      contentMd: '# Estado\n\nEl estado cambia con la interacción.\n\nLas propiedades llegan desde fuera.\n',
      sourceReference: { sourceId: 'fixture-source', sourceRevision: '0123456789abcdef' },
    },
  ],
}

function fixtureAnalyzer(overrides: Partial<SourceAnalyzer> = {}): SourceAnalyzer {
  return {
    runMetadata: {
      provider: 'fixture',
      model: 'recorded-output',
      promptVersion: 'test-v1',
      analyzerVersion: '1',
    },
    extractDocument: async (document) => fixture.extractions[document.id],
    consolidate: async () => fixture.consolidation,
    ...overrides,
  }
}

describe('grounded source analysis pipeline', () => {
  it('uses the production validation and finalization path with fixture provider output', async () => {
    const artifact = await analyzeNormalizedSource(snapshot, fixtureAnalyzer())

    expect(artifact.run.provider).toBe('fixture')
    expect(artifact.analysis.concepts.map((concept) => concept.name)).toEqual([
      'Componentes',
      'Estado',
    ])
    expect(artifact.analysis.concepts[0].id).toBe(makeConceptId('Componentes'))
    expect(artifact.analysis.coverage.documents).toEqual([
      { documentId: 'aaaaaaaaaaaa', conceptIds: [makeConceptId('Componentes')] },
      { documentId: 'bbbbbbbbbbbb', conceptIds: [makeConceptId('Estado')] },
    ])
  })

  it('fails immediately instead of dropping unsupported extraction evidence', async () => {
    const unsupported = structuredClone(fixture.extractions.aaaaaaaaaaaa) as {
      concepts: Array<{ evidence: Array<{ excerpt: string }> }>
    }
    unsupported.concepts[0].evidence[0].excerpt = 'Texto que no existe.'

    await expect(
      analyzeNormalizedSource(
        snapshot,
        fixtureAnalyzer({
          extractDocument: async (document) =>
            document.id === 'aaaaaaaaaaaa' ? unsupported : fixture.extractions[document.id],
        }),
      ),
    ).rejects.toThrow(/evidence excerpt does not resolve/)
  })

  it('rejects source-grounded evidence newly introduced during consolidation', async () => {
    const consolidation = structuredClone(fixture.consolidation) as {
      concepts: Array<{ evidence: Array<{ excerpt: string }> }>
    }
    consolidation.concepts[0].evidence[0].excerpt = 'estado cambia'

    await expect(
      analyzeNormalizedSource(snapshot, fixtureAnalyzer({ consolidate: async () => consolidation })),
    ).rejects.toThrow(/consolidation introduced unvalidated evidence/)
  })
})
