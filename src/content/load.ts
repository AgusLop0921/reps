import checksErroresJson from './data/checks-errores-típicos-en-react.json'
import checksExpertoJson from './data/checks-experto.json'
import checksIntermedioJson from './data/checks-intermedio.json'
import checksPrincipianteJson from './data/checks-principiante.json'
import curriculumJson from './data/curriculum.json'
import questionsJson from './data/questions.json'
import {
  checksFileSchema,
  curriculumSchema,
  questionsFileSchema,
  type Check,
  type Curriculum,
  type Question,
} from './schema'

/**
 * The generated content, validated at the boundary (ADR-0004). If the committed JSON ever
 * drifts from the schema, this throws at startup rather than feeding bad data to the app.
 */
export const curriculum: Curriculum = curriculumSchema.parse(curriculumJson)

const questionsFile = questionsFileSchema.parse(questionsJson)

export const questionsById: ReadonlyMap<string, Question> = new Map(
  questionsFile.questions.map((q) => [q.id, q]),
)

/**
 * Generated checks (ADR-0017), indexed by questionId. Unlike questions/curriculum, these
 * are best-effort: a malformed or missing checks file is skipped with a warning rather than
 * crashing — a question without a check still teaches (read, continue).
 */
function loadChecks(): ReadonlyMap<string, Check> {
  const map = new Map<string, Check>()
  const files: unknown[] = [
    checksPrincipianteJson,
    checksIntermedioJson,
    checksExpertoJson,
    checksErroresJson,
  ]
  for (const raw of files) {
    const parsed = checksFileSchema.safeParse(raw)
    if (!parsed.success) {
      console.warn('[reps] skipping a malformed checks file:', parsed.error.message)
      continue
    }
    for (const check of parsed.data.checks) map.set(check.questionId, check)
  }
  return map
}

export const checksByQuestionId: ReadonlyMap<string, Check> = loadChecks()
