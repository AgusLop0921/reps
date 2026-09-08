import { sourceSchema, type Source } from './schema'

/** Validated attribution metadata, independent from the tracks that reference it. */
export const sources: Source[] = sourceSchema.array().parse([
  {
    id: 'midudev-react',
    type: 'github_repository',
    name: 'Preguntas de entrevista de React',
    author: 'midudev (Miguel Ángel Durán)',
    url: 'https://github.com/midudev/preguntas-entrevista-react',
    license: 'MIT',
    attribution: 'Copyright (c) 2022 Miguel Ángel Durán',
  },
  {
    id: 'microsoft-generative-ai-for-beginners',
    type: 'github_repository',
    name: 'Generative AI for Beginners',
    author: 'Microsoft',
    url: 'https://github.com/microsoft/generative-ai-for-beginners',
    license: 'MIT',
    attribution: 'Copyright (c) Microsoft Corporation',
  },
  {
    id: 'reps-manual',
    type: 'manual',
    name: 'Reps',
    author: 'Reps',
    license: 'MIT',
    attribution: 'Editorial content authored by Reps.',
  },
])

export const SOURCES: Readonly<Record<string, Source>> = Object.fromEntries(
  sources.map((source) => [source.id, source]),
)
