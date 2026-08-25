import curriculumJson from './data/curriculum.json'
import questionsJson from './data/questions.json'
import { curriculumSchema, questionsFileSchema, type Curriculum, type Question } from './schema'

/**
 * The generated content, validated at the boundary (ADR-0004). If the committed JSON ever
 * drifts from the schema, this throws at startup rather than feeding bad data to the app.
 */
export const curriculum: Curriculum = curriculumSchema.parse(curriculumJson)

const questionsFile = questionsFileSchema.parse(questionsJson)

export const questionsById: ReadonlyMap<string, Question> = new Map(
  questionsFile.questions.map((q) => [q.id, q]),
)
