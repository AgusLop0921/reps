/**
 * Attribution metadata per source, keyed by `sourceId` (ADR-0007). The UI shows this on
 * every card and links back to the original repository; a future /fuentes page reuses it.
 * The names are the sources' own (imported content), not UI copy.
 */
export type SourceInfo = {
  id: string
  name: string
  author: string
  url: string
  license: string
}

export const SOURCES: Record<string, SourceInfo> = {
  'midudev-react': {
    id: 'midudev-react',
    name: 'Preguntas de entrevista de React',
    author: 'midudev (Miguel Ángel Durán)',
    url: 'https://github.com/midudev/preguntas-entrevista-react',
    license: 'MIT',
  },
}
