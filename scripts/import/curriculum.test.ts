import { describe, expect, it } from 'vitest'
import type { Question, Section } from '../../src/content/schema'
import { buildSections } from './curriculum'

let counter = 0
const q = (slug: string, sourceSection: string, sourceId = 'src'): Question => ({
  id: String(++counter).padStart(12, '0'),
  sourceId,
  slug,
  sourceSection,
  tech: 'react',
  lang: 'es',
  level: null,
  topic: null,
  format: 'open',
  question: slug,
  answerMd: 'a',
})

/** `n` questions in one section, slugs `${title}-1..n`, in order. */
const many = (title: string, n: number, sourceId = 'src'): Question[] =>
  Array.from({ length: n }, (_, i) => q(`${title}-${i + 1}`, title, sourceId))

const NO_OVERRIDES = { excludedSlugs: [], pinnedFirst: {} }
const sizes = (s: Section): number[] => s.lessons.map((l) => l.questionIds.length)

describe('buildSections: sections', () => {
  it('groups by sourceSection in first-appearance order', () => {
    const questions = [
      q('a', 'Principiante'),
      q('b', 'Intermedio'),
      q('c', 'Principiante'),
    ]
    const sections = buildSections(questions, NO_OVERRIDES)
    expect(sections.map((s) => s.title)).toEqual(['Principiante', 'Intermedio'])
    expect(sections[0].lessons[0].questionIds).toHaveLength(2) // a and c
  })

  it('gives each section a source-scoped id and the verbatim heading as title', () => {
    const [section] = buildSections([q('a', 'Errores Típicos en React', 'midudev-react')], NO_OVERRIDES)
    expect(section.id).toBe('midudev-react:errores-típicos-en-react')
    expect(section.title).toBe('Errores Típicos en React')
    expect(section.sourceId).toBe('midudev-react')
  })

  it('numbers lessons from 1 per section with ids ${sectionId}:${order}', () => {
    const [section] = buildSections(many('Principiante', 12), NO_OVERRIDES)
    expect(section.lessons.map((l) => l.order)).toEqual([1, 2])
    expect(section.lessons.map((l) => l.id)).toEqual([
      'src:principiante:1',
      'src:principiante:2',
    ])
  })
})

describe('buildSections: chunking', () => {
  it('chunks into lessons of five', () => {
    expect(sizes(buildSections(many('S', 10), NO_OVERRIDES)[0])).toEqual([5, 5])
  })

  it('keeps a trailing remainder of three or more as its own lesson', () => {
    expect(sizes(buildSections(many('S', 8), NO_OVERRIDES)[0])).toEqual([5, 3])
    expect(sizes(buildSections(many('S', 13), NO_OVERRIDES)[0])).toEqual([5, 5, 3])
  })

  it('merges a trailing remainder of one or two into the previous lesson', () => {
    expect(sizes(buildSections(many('S', 7), NO_OVERRIDES)[0])).toEqual([7])
    expect(sizes(buildSections(many('S', 6), NO_OVERRIDES)[0])).toEqual([6])
    expect(sizes(buildSections(many('S', 12), NO_OVERRIDES)[0])).toEqual([5, 7])
    expect(sizes(buildSections(many('S', 11), NO_OVERRIDES)[0])).toEqual([5, 6])
  })

  it('leaves a section smaller than a lesson as one lesson', () => {
    expect(sizes(buildSections(many('S', 3), NO_OVERRIDES)[0])).toEqual([3])
    expect(sizes(buildSections(many('S', 1), NO_OVERRIDES)[0])).toEqual([1])
  })
})

describe('buildSections: order.ts overrides', () => {
  it('drops excluded slugs from the path', () => {
    const questions = [q('keep-1', 'S'), q('drop', 'S'), q('keep-2', 'S')]
    const [section] = buildSections(questions, { excludedSlugs: ['drop'], pinnedFirst: {} })
    expect(section.lessons[0].questionIds).toHaveLength(2)
  })

  it('omits a section whose questions are all excluded (no empty section)', () => {
    const questions = [q('a', 'Principiante'), q('only', 'Errores')]
    const sections = buildSections(questions, { excludedSlugs: ['only'], pinnedFirst: {} })
    expect(sections.map((s) => s.title)).toEqual(['Principiante'])
  })

  it('pins slugs to the front of their section, in order, keyed by section id', () => {
    const questions = [q('a', 'S'), q('b', 'S'), q('c', 'S'), q('d', 'S')]
    const [section] = buildSections(questions, {
      excludedSlugs: [],
      pinnedFirst: { 'src:s': ['c', 'a'] },
    })
    const bySlug = new Map(questions.map((x) => [x.id, x.slug]))
    expect(section.lessons[0].questionIds.map((id) => bySlug.get(id))).toEqual([
      'c',
      'a',
      'b',
      'd',
    ])
  })

  it('applies pins only to the keyed section, leaving others in document order', () => {
    const questions = [q('a1', 'A'), q('a2', 'A'), q('b1', 'B'), q('b2', 'B')]
    const [a, b] = buildSections(questions, {
      excludedSlugs: [],
      pinnedFirst: { 'src:b': ['b2'] },
    })
    const bySlug = new Map(questions.map((x) => [x.id, x.slug]))
    expect(a.lessons[0].questionIds.map((id) => bySlug.get(id))).toEqual(['a1', 'a2'])
    expect(b.lessons[0].questionIds.map((id) => bySlug.get(id))).toEqual(['b2', 'b1'])
  })
})
