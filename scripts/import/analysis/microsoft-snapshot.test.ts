import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { normalizedDocumentsFileSchema } from '../normalized-document'
import { ANALYSIS_OUTPUT_ROOT } from './paths'

describe('Microsoft analysis input', () => {
  it('remains a valid normalized snapshot outside runtime publication', () => {
    const path = fileURLToPath(
      new URL('../generated/microsoft-generative-ai-for-beginners.es.json', import.meta.url),
    )
    const snapshot = normalizedDocumentsFileSchema.parse(
      JSON.parse(readFileSync(path, 'utf8')),
    )

    expect(snapshot.documents).toHaveLength(21)
    expect(path).toContain('/scripts/import/generated/')
    expect(path).not.toContain('/src/content/data/')
    expect(ANALYSIS_OUTPUT_ROOT).toContain('/scripts/import/generated/analysis/')
    expect(ANALYSIS_OUTPUT_ROOT).not.toContain('/src/content/')
  })
})
