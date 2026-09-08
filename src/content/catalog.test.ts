import { describe, expect, it } from 'vitest'
import { createContentCatalog, findLesson } from './catalog'
import { catalog, tracksById } from './load'

describe('content catalog', () => {
  it('loads the existing React track unchanged', () => {
    const react = tracksById.get('react')
    expect(react?.curriculum.sections).toHaveLength(4)
    expect(react?.curriculum.sections[0].lessons[0].id).toBe('midudev-react:principiante:1')
    expect(react?.curriculum.sections[0].lessons[0].questionIds[0]).toBe('859805c2ddb1')
  })

  it('loads the minimal AI Engineering track', () => {
    const ai = tracksById.get('ai-engineering')
    expect(ai?.curriculum.sections[0].title).toBe('Fundamentos')
    expect(ai?.curriculum.sections[0].lessons[0].questionIds).toEqual(['a8021d760393'])
  })

  it('resolves lessons only under their owning track', () => {
    const react = tracksById.get('react')
    const ai = tracksById.get('ai-engineering')
    expect(react && findLesson(react, 'ai-engineering:fundamentals:1')).toBeNull()
    expect(ai && findLesson(ai, 'ai-engineering:fundamentals:1')?.section.title).toBe(
      'Fundamentos',
    )
  })

  it('has unique track ids and resolves every declared source', () => {
    expect(new Set(catalog.tracks.map((track) => track.id)).size).toBe(catalog.tracks.length)
    const sourceIds = new Set(catalog.sources.map((source) => source.id))
    for (const track of catalog.tracks) {
      for (const reference of track.sourceReferences) {
        expect(sourceIds.has(reference.sourceId)).toBe(true)
      }
    }
  })

  it('rejects an unknown lesson question predictably', () => {
    const invalid = structuredClone(catalog)
    invalid.tracks[0].curriculum.sections[0].lessons[0].questionIds[0] = 'ffffffffffff'
    expect(() => createContentCatalog(invalid)).toThrow(
      'Unknown lesson midudev-react:principiante:1 question: ffffffffffff',
    )
  })

  it('rejects duplicate track ids predictably', () => {
    const invalid = { ...catalog, tracks: [catalog.tracks[0], catalog.tracks[0]] }
    expect(() => createContentCatalog(invalid)).toThrow('Duplicate track id: react')
  })
})
