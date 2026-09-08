import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnthropicSourceAnalyzer, ANTHROPIC_ANALYSIS_MODEL } from './anthropic'

const document = {
  id: 'aaaaaaaaaaaa',
  title: 'Documento',
  contentMd: '# Documento\n\nTexto.',
  sourceReference: { sourceId: 'source', sourceRevision: 'revision' },
}

afterEach(() => vi.unstubAllGlobals())

describe('Anthropic source analyzer', () => {
  it('pins the exact model and requests schema-constrained output', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        model: string
        output_config: { format: { type: string } }
      }
      expect(request.model).toBe(ANTHROPIC_ANALYSIS_MODEL)
      expect(request.output_config.format.type).toBe('json_schema')
      return new Response(
        JSON.stringify({
          model: ANTHROPIC_ANALYSIS_MODEL,
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: '{"documentId":"aaaaaaaaaaaa","concepts":[]}' }],
        }),
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(new AnthropicSourceAnalyzer('test-key').extractDocument(document)).resolves.toEqual({
      documentId: 'aaaaaaaaaaaa',
      concepts: [],
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('rejects a response produced by a different model revision', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            model: 'claude-other',
            stop_reason: 'end_turn',
            content: [{ type: 'text', text: '{}' }],
          }),
          { status: 200 },
        ),
      ),
    )

    await expect(
      new AnthropicSourceAnalyzer('test-key').extractDocument(document),
    ).rejects.toThrow(/Anthropic model mismatch/)
  })
})
