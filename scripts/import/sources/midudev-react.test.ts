import { describe, expect, it } from 'vitest'
import { parse } from './midudev-react'

describe('parse: answer sub-headings', () => {
  it('keeps content under a sub-heading instead of truncating the answer', () => {
    const md = [
      '## Básico',
      '#### ¿Qué es X?',
      'Antes de la subsección.',
      '##### Un detalle',
      'Después de la subsección.',
    ].join('\n')

    const [question] = parse(md)
    expect(question.answerMd).toContain('Antes de la subsección.')
    expect(question.answerMd).toContain('##### Un detalle')
    expect(question.answerMd).toContain('Después de la subsección.')
  })

  it('does not treat a question whose whole answer sits under sub-headings as empty', () => {
    const md = [
      '## Básico',
      '#### Un capítulo',
      '##### Sección',
      'Todo el contenido vive aquí.',
    ].join('\n')

    expect(() => parse(md)).not.toThrow()
    const [question] = parse(md)
    expect(question.answerMd).toContain('Todo el contenido vive aquí.')
  })
})
