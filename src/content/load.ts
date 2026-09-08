import checksErroresJson from './data/checks-errores-típicos-en-react.json'
import checksExpertoJson from './data/checks-experto.json'
import checksIntermedioJson from './data/checks-intermedio.json'
import checksPrincipianteJson from './data/checks-principiante.json'
import curriculumJson from './data/curriculum.json'
import questionsJson from './data/questions.json'
import reactDesignPatternsJson from './data/react-design-patterns.json'
import {
  checkSchema,
  checksFileSchema,
  curriculumSchema,
  questionSchema,
  questionsFileSchema,
  trackSchema,
  type Check,
  type Curriculum,
  type Question,
  type Track,
} from './schema'
import { createContentCatalog } from './catalog'
import {
  aiEngineeringCheck,
  aiEngineeringQuestion,
  aiEngineeringTrack,
} from './seed/ai-engineering'
import { sources } from './sources'

/**
 * The generated content, validated at the boundary (ADR-0004). If the committed JSON ever
 * drifts from the schema, this throws at startup rather than feeding bad data to the app.
 */
export const curriculum: Curriculum = curriculumSchema.parse(curriculumJson)

const questionsFile = questionsFileSchema.parse(questionsJson)
const reactDesignPatternsTrack = trackSchema.parse(reactDesignPatternsJson.track)
const reactDesignPatternsQuestions = questionSchema
  .array()
  .min(1)
  .parse(reactDesignPatternsJson.questions)
const reactDesignPatternsChecks = checkSchema.array().min(1).parse(reactDesignPatternsJson.checks)

/**
 * Generated checks (ADR-0017), indexed by questionId. Unlike questions/curriculum, these
 * are best-effort: a malformed or missing checks file is skipped with a warning rather than
 * crashing — a question without a check still teaches (read, continue).
 */
function loadChecks(): Check[] {
  const checks: Check[] = []
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
    checks.push(...parsed.data.checks)
  }
  return checks
}

const reactTrack: Track = {
  id: 'react',
  title: 'React',
  description: 'Practicá conceptos y preguntas reales de entrevista.',
  sourceReferences: [{ sourceId: questionsFile.sourceId }],
  curriculum,
}

export const catalog = createContentCatalog({
  sources,
  tracks: [reactTrack, aiEngineeringTrack, reactDesignPatternsTrack],
  questions: [
    ...questionsFile.questions,
    aiEngineeringQuestion,
    ...reactDesignPatternsQuestions,
  ],
  checks: [...loadChecks(), aiEngineeringCheck, ...reactDesignPatternsChecks],
})

export const tracks = catalog.tracks
export const tracksById: ReadonlyMap<string, Track> = new Map(
  catalog.tracks.map((track) => [track.id, track]),
)
export const questionsById: ReadonlyMap<string, Question> = new Map(
  catalog.questions.map((question) => [question.id, question]),
)
export const checksByQuestionId: ReadonlyMap<string, Check> = new Map(
  catalog.checks.map((check) => [check.questionId, check]),
)
