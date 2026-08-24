import { describe, expect, it } from 'vitest'
import { parse } from './midudev-react'

const SECTIONS = [
  '### Principiante',
  '#### ¿Qué es React?',
  'Una biblioteca.',
  '#### ¿Qué es JSX?',
  'Azúcar sintáctico.',
  '### Intermedio',
  '#### ¿Qué es un hook?',
  'Una función especial.',
  '### Experto',
  '#### ¿Qué es fiber?',
  'El reconciliador.',
].join('\n')

describe('parse: sections and levels', () => {
  it('detects sections at depth 3 and maps their keywords to levels', () => {
    const byQuestion = new Map(parse(SECTIONS).map((q) => [q.question, q.level]))
    expect(byQuestion.get('¿Qué es React?')).toBe('basic')
    expect(byQuestion.get('¿Qué es JSX?')).toBe('basic')
    expect(byQuestion.get('¿Qué es un hook?')).toBe('intermediate')
    expect(byQuestion.get('¿Qué es fiber?')).toBe('expert')
  })

  it('returns questions in upstream document order', () => {
    expect(parse(SECTIONS).map((q) => q.question)).toEqual([
      '¿Qué es React?',
      '¿Qué es JSX?',
      '¿Qué es un hook?',
      '¿Qué es fiber?',
    ])
  })

  it('tags each question with its verbatim upstream section', () => {
    const bySection = new Map(parse(SECTIONS).map((q) => [q.question, q.sourceSection]))
    expect(bySection.get('¿Qué es React?')).toBe('Principiante')
    expect(bySection.get('¿Qué es un hook?')).toBe('Intermedio')
    expect(bySection.get('¿Qué es fiber?')).toBe('Experto')
  })

  it('leaves level null for a section that maps to no known level, never inheriting', () => {
    const md = [
      '### Experto',
      '#### ¿Qué es fiber?',
      'El reconciliador.',
      '### Errores Típicos en React',
      '#### Mutar el estado directamente',
      'No lo hagas.',
    ].join('\n')

    const byQuestion = new Map(parse(md).map((q) => [q.question, q.level]))
    expect(byQuestion.get('¿Qué es fiber?')).toBe('expert')
    expect(byQuestion.get('Mutar el estado directamente')).toBeNull()
  })

  it('fails if a question appears before any section heading', () => {
    const md = ['#### ¿Qué es React?', 'Una biblioteca.'].join('\n')
    expect(() => parse(md)).toThrow(/before any section/)
  })
})

describe('parse: answer sub-headings', () => {
  it('keeps content under a sub-heading instead of truncating the answer', () => {
    const md = [
      '### Básico',
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
      '### Básico',
      '#### Un capítulo',
      '##### Sección',
      'Todo el contenido vive aquí.',
    ].join('\n')

    expect(() => parse(md)).not.toThrow()
    const [question] = parse(md)
    expect(question.answerMd).toContain('Todo el contenido vive aquí.')
  })
})

describe('parse: transport artifacts', () => {
  it('strips the trailing back-to-index link and rule, keeping the answer', () => {
    const md = [
      '### Básico',
      '#### ¿Qué es X?',
      'La respuesta real.',
      '',
      '**[⬆ Volver a índice](#índice)**',
      '',
      '---',
    ].join('\n')

    const [question] = parse(md)
    expect(question.answerMd).toBe('La respuesta real.')
  })

  it('fails loudly when a rule appears mid-answer', () => {
    const md = [
      '### Básico',
      '#### ¿Qué es X?',
      'Primera parte.',
      '',
      '---',
      '',
      'Segunda parte.',
    ].join('\n')

    expect(() => parse(md)).toThrow(/mid-answer/)
  })

  it('fails loudly when a back-to-index link appears mid-answer', () => {
    const md = [
      '### Básico',
      '#### ¿Qué es X?',
      'Primera parte.',
      '',
      '**[⬆ Volver a índice](#índice)**',
      '',
      'Segunda parte.',
    ].join('\n')

    expect(() => parse(md)).toThrow(/mid-answer/)
  })
})
