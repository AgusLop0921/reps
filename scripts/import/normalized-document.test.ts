import { describe, expect, it } from 'vitest'
import { normalizedDocumentSchema, normalizedDocumentsFileSchema } from './normalized-document'

const document = {
  id: '123456789abc',
  title: 'A source document',
  contentMd: '# Source\n',
  sourceReference: { sourceId: 'source', sourceRevision: 'revision' },
}

describe('NormalizedDocument', () => {
  it('keeps repository locators optional at the source-agnostic boundary', () => {
    expect(normalizedDocumentSchema.parse(document)).toEqual(document)
  })

  it('requires every document to belong to the snapshot source and revision', () => {
    const snapshot = {
      schemaVersion: 1,
      sourceId: 'source',
      sourceRevision: 'revision',
      documents: [document],
    }
    expect(normalizedDocumentsFileSchema.parse(snapshot)).toEqual(snapshot)

    expect(() =>
      normalizedDocumentsFileSchema.parse({
        ...snapshot,
        documents: [
          { ...document, sourceReference: { sourceId: 'other', sourceRevision: 'revision' } },
        ],
      }),
    ).toThrow(/document source does not match snapshot source/)
  })

  it('rejects duplicate document identities in one snapshot', () => {
    expect(() =>
      normalizedDocumentsFileSchema.parse({
        schemaVersion: 1,
        sourceId: 'source',
        sourceRevision: 'revision',
        documents: [document, document],
      }),
    ).toThrow(/duplicate document id/)
  })
})
