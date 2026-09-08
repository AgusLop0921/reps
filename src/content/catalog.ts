import { z } from 'zod'
import {
  checkSchema,
  questionSchema,
  sourceSchema,
  trackSchema,
  type Check,
  type Question,
  type Lesson,
  type Section,
  type Source,
  type Track,
} from './schema'

const catalogInputSchema = z.object({
  sources: z.array(sourceSchema).min(1),
  tracks: z.array(trackSchema).min(1),
  questions: z.array(questionSchema).min(1),
  checks: z.array(checkSchema),
})

export type ContentCatalog = {
  sources: Source[]
  tracks: Track[]
  questions: Question[]
  checks: Check[]
}

/** Resolve a lesson only inside its owning track; ids in another track never leak through. */
export function findLesson(
  track: Track,
  lessonId: string | null,
): { lesson: Lesson; section: Section } | null {
  for (const section of track.curriculum.sections) {
    const lesson = section.lessons.find((candidate) => candidate.id === lessonId)
    if (lesson) return { lesson, section }
  }
  return null
}

/** Validate identifiers and every cross-reference before content reaches the runtime. */
export function createContentCatalog(input: unknown): ContentCatalog {
  const catalog = catalogInputSchema.parse(input)
  const sourceIds = uniqueIds(catalog.sources, 'source', (source) => source.id)
  uniqueIds(catalog.tracks, 'track', (track) => track.id)
  const questionIds = uniqueIds(catalog.questions, 'question', (question) => question.id)
  uniqueIds(catalog.checks, 'check', (check) => check.questionId)

  for (const question of catalog.questions) {
    requireReference(sourceIds, question.sourceId, `question ${question.id} source`)
  }

  for (const track of catalog.tracks) {
    const trackSourceIds = new Set(track.sourceReferences.map((ref) => ref.sourceId))
    for (const reference of track.sourceReferences) {
      requireReference(sourceIds, reference.sourceId, `track ${track.id} source`)
    }

    const sectionIds = new Set<string>()
    const lessonIds = new Set<string>()
    for (const section of track.curriculum.sections) {
      addUnique(sectionIds, section.id, `section in track ${track.id}`)
      requireReference(sourceIds, section.sourceId, `section ${section.id} source`)
      requireReference(trackSourceIds, section.sourceId, `section ${section.id} track source`)
      for (const lesson of section.lessons) {
        addUnique(lessonIds, lesson.id, `lesson in track ${track.id}`)
        for (const questionId of lesson.questionIds) {
          requireReference(questionIds, questionId, `lesson ${lesson.id} question`)
          const question = catalog.questions.find((candidate) => candidate.id === questionId)
          if (question) {
            requireReference(
              trackSourceIds,
              question.sourceId,
              `question ${questionId} track source`,
            )
          }
        }
      }
    }
  }

  for (const check of catalog.checks) {
    requireReference(questionIds, check.questionId, `check ${check.questionId} question`)
  }

  return catalog
}

function uniqueIds<T>(
  values: T[],
  kind: string,
  getId: (value: T) => string,
): Set<string> {
  const ids = new Set<string>()
  for (const value of values) addUnique(ids, getId(value), kind)
  return ids
}

function addUnique(ids: Set<string>, id: string, kind: string): void {
  if (ids.has(id)) throw new Error(`Duplicate ${kind} id: ${id}`)
  ids.add(id)
}

function requireReference(ids: Set<string>, id: string, kind: string): void {
  if (!ids.has(id)) throw new Error(`Unknown ${kind}: ${id}`)
}
