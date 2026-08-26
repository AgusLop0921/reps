import { z } from 'zod'

/**
 * Source of truth for the content model.
 * Used by the importer (when generating) and by the app (when reading). Changing this
 * changes the contract between both ends and requires an ADR.
 */

export const techSchema = z.enum(['react', 'js', 'ts'])
export const levelSchema = z.enum(['basic', 'intermediate', 'advanced', 'expert'])
export const langSchema = z.enum(['es', 'en'])

/** `open` = open question with self-grading. `mcq` = multiple choice. */
export const formatSchema = z.enum(['open', 'mcq'])

export const optionSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
})

/**
 * A question, normalized from a source. Adapters MUST return questions in upstream
 * document order: curriculum section order and positional lesson chunking depend on it
 * (ADR-0011, ADR-0014).
 */
export const questionSchema = z
  .object({
    /** Stable hash of `${sourceId}:${slug}`. Never a positional index (ADR-0004). */
    id: z.string().length(12),
    sourceId: z.string().min(1),
    /** Original slug upstream. Used to link back to the source anchor. */
    slug: z.string().min(1),
    /** Verbatim upstream section heading this question appeared under (ADR-0014). */
    sourceSection: z.string().min(1),
    tech: techSchema,
    lang: langSchema,
    /** Difficulty when the source declares it; null when it does not (ADR-0014). */
    level: levelSchema.nullable(),
    topic: z.string().nullable(),
    format: formatSchema,
    question: z.string().min(1),
    /** Answer in markdown, exactly as upstream. Imported content is never edited. */
    answerMd: z.string().min(1),
    options: z.array(optionSchema).min(2).optional(),
  })
  .refine((q) => (q.format === 'mcq' ? q.options !== undefined : q.options === undefined), {
    message: '`mcq` requires `options`; `open` must not have them',
  })

/**
 * A lesson is a small ordered group of questions (ADR-0011).
 * Generated at import time; may be reordered by `src/content/order.ts`. It carries no
 * `title` — the UI composes the label from `copy.ts`, with `LESSON_TITLES` as the
 * exception (ADR-0016) — and no `level`, since difficulty is per-question (ADR-0014).
 */
export const lessonSchema = z.object({
  id: z.string().min(1),
  /** Position within its section, starting at 1. */
  order: z.number().int().positive(),
  questionIds: z.array(z.string().length(12)).min(1),
})

/**
 * Sections group the path and their order is the path order. A section is a structural
 * grouping taken from an upstream heading, not a difficulty level (ADR-0014).
 */
export const sectionSchema = z.object({
  /** Stable per source: derived from `sourceId` + the section heading slug. */
  id: z.string().min(1),
  /** Upstream section heading, verbatim — imported content, kept in its language. */
  title: z.string().min(1),
  sourceId: z.string().min(1),
  lessons: z.array(lessonSchema).min(1),
})

export const curriculumSchema = z.object({
  generatedAt: z.string(),
  sections: z.array(sectionSchema).min(1),
})

export const questionsFileSchema = z.object({
  generatedAt: z.string(),
  sourceId: z.string(),
  questions: z.array(questionSchema).min(1),
})

/**
 * Per-question spaced repetition state (ADR-0006). Lives in IndexedDB.
 * Only answered cards ever produce one of these (ADR-0012).
 */
export const progressSchema = z.object({
  questionId: z.string().length(12),
  box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  /** Timestamp in ms of the next review. A date in the past carries no urgency. */
  dueAt: z.number().int(),
  history: z.array(
    z.object({
      at: z.number().int(),
      score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    }),
  ),
})

/**
 * Position on the path. Stores the answered question ids rather than a bare flag,
 * because lesson composition can shift when upstream inserts questions (ADR-0011).
 */
export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  answeredQuestionIds: z.array(z.string().length(12)),
  completedAt: z.number().int().nullable(),
})

/**
 * The JSON export/import payload (ADR-0005): all local progress in one file, the only
 * mitigation for per-browser data. `version` is literal so a future schema change can
 * detect and migrate an old export on import instead of silently accepting it.
 */
export const progressExportSchema = z.object({
  version: z.literal(1),
  progress: z.array(progressSchema),
  lessonProgress: z.array(lessonProgressSchema),
})

/**
 * A generated multiple-choice check for a question (ADR-0017). Options range 2–4; the UI
 * shuffles them from a seed at display time, so stored order is arbitrary. No `sourceId`:
 * generated checks are ours, not the source's — they carry no attribution.
 */
export const checkSchema = z.object({
  questionId: z.string().length(12),
  stem: z.string().min(1),
  options: z
    .array(z.object({ text: z.string().min(1), correct: z.boolean() }))
    .min(2)
    .max(4)
    .refine((opts) => opts.filter((o) => o.correct).length === 1, 'exactly one correct option'),
  explanation: z.string().min(1),
})

/** One generated file, per section. Best-effort at load: a bad file degrades, never crashes. */
export const checksFileSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  sourceSection: z.string(),
  checks: z.array(checkSchema).min(1),
})

export type Tech = z.infer<typeof techSchema>
export type Level = z.infer<typeof levelSchema>
export type Format = z.infer<typeof formatSchema>
export type Question = z.infer<typeof questionSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type Section = z.infer<typeof sectionSchema>
export type Curriculum = z.infer<typeof curriculumSchema>
export type QuestionsFile = z.infer<typeof questionsFileSchema>
export type Progress = z.infer<typeof progressSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>
export type ProgressExport = z.infer<typeof progressExportSchema>
export type Check = z.infer<typeof checkSchema>
export type ChecksFile = z.infer<typeof checksFileSchema>
export type Box = Progress['box']
export type Score = Progress['history'][number]['score']
