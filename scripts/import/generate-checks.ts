/**
 * SPIKE (build-time, one-off): generate one multiple-choice comprehension check per
 * question using the Anthropic API. The corpus has no MCQ content, so these are generated
 * — they are OURS, not the source's: each check links to its question by `questionId` but
 * carries no `sourceId` attribution and never touches the imported `answerMd`.
 *
 * BYOK: reads ANTHROPIC_API_KEY from the environment (the maintainer's key). The key is
 * never written to disk, logged, or committed. Runs on the Principiante path only.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-... pnpm tsx scripts/import/generate-checks.ts
 *
 * This departs from CLAUDE.md's "never invent content" rule. It is deliberately isolated
 * and un-wired (no UI, no import into answerMd) pending an ADR that sets the boundaries —
 * to be written once we judge whether the output is any good.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { EXCLUDED_SLUGS } from '../../src/content/order'
import { questionsFileSchema, type Question } from '../../src/content/schema'

const MODEL = 'claude-opus-4-8'
const SECTION = 'Principiante'
const CONCURRENCY = 4

const DATA_DIR = fileURLToPath(new URL('../../src/content/data/', import.meta.url))

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set. Export your key (BYOK) and re-run.')
  process.exit(1)
}

/**
 * A generated check. Options range 2–4: a question that supports fewer than three genuine
 * misconceptions gets fewer distractors rather than padded ones. Stored order is arbitrary
 * — the UI shuffles options with a seed at display time. No `sourceId`: these are ours.
 */
const checkSchema = z.object({
  questionId: z.string().length(12),
  stem: z.string().min(1),
  options: z
    .array(z.object({ text: z.string().min(1), correct: z.boolean() }))
    .min(2)
    .max(4)
    .refine((opts) => opts.filter((o) => o.correct).length === 1, 'exactly one correct option'),
  explanation: z.string().min(1),
})

const checksFileSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  sourceSection: z.string(),
  checks: z.array(checkSchema).min(1),
})

type Check = z.infer<typeof checkSchema>

/** What the model returns per question. */
const modelOutputSchema = z.object({
  suitable: z.boolean(),
  reason: z.string(), // may be '' when suitable; the "which questions can't sustain a check" signal
  stem: z.string().min(1),
  correct: z.string().min(1),
  distractors: z.array(z.string()), // 0–3 genuine misconceptions; fewer is fine, never padded
  explanation: z.string().min(1),
})

const OUTPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['suitable', 'reason', 'stem', 'correct', 'distractors', 'explanation'],
  properties: {
    suitable: { type: 'boolean' },
    reason: { type: 'string' },
    stem: { type: 'string' },
    correct: { type: 'string' },
    distractors: { type: 'array', items: { type: 'string' } },
    explanation: { type: 'string' },
  },
} as const

const SYSTEM = [
  'You write ONE multiple-choice comprehension check for a React interview question.',
  'Everything learner-facing (stem, correct, distractors, explanation) must be in Spanish.',
  'You are given a QUESTION and its REFERENCE ANSWER.',
  '',
  'Stem — prefer application over definition. When the reference answer supports it, ask',
  'what happens, which option breaks something, or why a snippet fails ("¿qué pasa si…?",',
  '"¿cuál de estos rompe…?", "¿por qué este código no…?") rather than "¿qué es X?".',
  '',
  'Distractors — this is what makes the check hard or worthless:',
  '- Every distractor must be a mistake a real React developer could actually make: a',
  '  genuine misconception or a partial truth. NEVER invent an option that anyone who has',
  '  written React would dismiss instantly (e.g. "un archivo de configuración de rutas" as',
  '  an answer to "what is a component").',
  '- Strongly prefer distractors that are TRUE statements about a DIFFERENT thing — a',
  '  correct description of useMemo offered as the answer about useEffect; a correct',
  '  description of state offered as the answer about props. These are hard because nothing',
  '  in them is false.',
  '- Exactly ONE option may be defensibly correct. If two options could be argued correct,',
  '  the item is broken (ambiguity, not difficulty) — fix it until only one is defensible.',
  '- All options must match in length (within ~20%) and in specificity. The correct one',
  '  must not be identifiable by being longer, more detailed, or more hedged.',
  '',
  'No padding. If the reference answer supports fewer than three genuine misconceptions,',
  'return fewer distractors (two, or one). If it cannot support even one — or the concept',
  'cannot be tested this way — set suitable=false and say what is missing in `reason`; do',
  'not fabricate a check. When suitable=true, use `reason` to note how many genuine',
  'misconceptions the answer sustains.',
  '',
  'Only assert what the reference answer supports. Write a standalone exercise: never refer',
  'to "the reference answer", the source, or these instructions in a learner-facing field.',
  'Never emit control tokens, role markers, apologies, or meta-commentary about formatting.',
].join('\n')

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * Signs of a malformed generation: leaked chat control tokens, apologetic meta-text, a
 * meta-reference to the source, or unbalanced braces (a real leak passed Zod once —
 * `}}<|im_start|>assistant Sorry, I made a formatting error...`). Any hit fails the item.
 * Run on learner-facing fields only — `reason` legitimately mentions the reference answer.
 */
const MALFORMED: Array<[RegExp, string]> = [
  [/<\||\|>/, 'control-token marker'],
  [/im_start|im_end|<\/?s>/i, 'chat control token'],
  [/\bassistant\b/i, 'literal role marker "assistant"'],
  [/\bsorry\b|i made a|formatting error|lo siento|me disculp|error de formato/i, 'apologetic meta-text'],
  [/respuesta de referencia|reference answer|seg[úu]n (la|el) (respuesta|texto|documento)/i, 'meta-reference to the source'],
]

function malformedReason(text: string): string | null {
  for (const [re, reason] of MALFORMED) if (re.test(text)) return reason
  if ((text.match(/{/g)?.length ?? 0) !== (text.match(/}/g)?.length ?? 0)) return 'unbalanced braces'
  return null
}

async function callApi(body: unknown): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey as string,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt
      await sleep(retryAfter * 1000)
      continue
    }
    throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
}

const responseSchema = z.object({
  stop_reason: z.string().nullable(),
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
})

function extractJson(raw: unknown): z.infer<typeof modelOutputSchema> {
  const res = responseSchema.parse(raw)
  if (res.stop_reason === 'refusal') throw new Error('model refused')
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim()
  return modelOutputSchema.parse(JSON.parse(text))
}

type GenResult =
  | { ok: true; check: Check; misconceptions: number }
  | { ok: false; questionId: string; reason: string }

async function generateOne(question: Question): Promise<GenResult> {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_JSON_SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `QUESTION: ${question.question}\n\nREFERENCE ANSWER:\n${question.answerMd}`,
      },
    ],
  }

  let lastError = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    let out: z.infer<typeof modelOutputSchema>
    try {
      out = extractJson(await callApi(body))
    } catch (err) {
      lastError = `bad response: ${String(err)}`
      continue
    }

    if (!out.suitable) {
      return { ok: false, questionId: question.id, reason: out.reason.trim() || 'marked unsuitable' }
    }

    const correct = out.correct.trim()
    const distractors = [...new Set(out.distractors.map((d) => d.trim()))]
      .filter((d) => d && d !== correct)
      .slice(0, 3)
    if (distractors.length < 1) {
      lastError = 'suitable but no usable distractors'
      continue
    }

    const stem = out.stem.trim()
    const explanation = out.explanation.trim()
    const bad = [stem, explanation, correct, ...distractors].map(malformedReason).find(Boolean)
    if (bad) {
      lastError = `malformed content (${bad})`
      continue
    }

    const options = [
      { text: correct, correct: true },
      ...distractors.map((text) => ({ text, correct: false })),
    ]
    return {
      ok: true,
      check: { questionId: question.id, stem, options, explanation },
      misconceptions: distractors.length,
    }
  }
  // Fail loudly rather than write a malformed check (same rule as the adapters).
  throw new Error(`generate-checks: "${question.question}" failed after 3 attempts — ${lastError}`)
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
  return results
}

const wordCount = (s: string): number => s.trim().split(/\s+/).length

const STOPWORDS = new Set([
  'que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'por', 'para', 'con', 'los', 'las',
  'una', 'uno', 'del', 'sus', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'segun',
  'the', 'and', 'for',
])

function stemTokens(stem: string): Set<string> {
  const words = stem
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  return new Set(words)
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

function printResults(results: GenResult[], questionById: Map<string, Question>): void {
  const letter = ['A', 'B', 'C', 'D']
  results.forEach((r, i) => {
    const q = questionById.get(r.ok ? r.check.questionId : r.questionId)
    const ref = (q?.answerMd ?? '').replace(/\s+/g, ' ').trim()
    console.log(`\n=== ${i + 1}/${results.length} — ${q?.question} ===`)
    console.log(`Ref: ${ref.slice(0, 400)}${ref.length > 400 ? '…' : ''}`)
    if (!r.ok) {
      console.log(`UNSUITABLE — ${r.reason}`)
      return
    }
    console.log(`P: ${r.check.stem}   (misconceptions: ${r.misconceptions})`)
    r.check.options.forEach((o, j) => console.log(`  ${letter[j]}) ${o.text}${o.correct ? '  [✓]' : ''}`))
    console.log(`  → ${r.check.explanation}`)
  })
}

function reportStats(results: GenResult[]): void {
  const suitable = results.filter((r): r is Extract<GenResult, { ok: true }> => r.ok)
  const unsuitable = results.filter((r): r is Extract<GenResult, { ok: false }> => !r.ok)

  // Which questions the corpus can sustain a good check for.
  const withThree = suitable.filter((r) => r.misconceptions === 3).length
  console.log(
    `\nsuitability: ${suitable.length}/${results.length} suitable; ` +
      `${withThree} sustain 3 misconceptions, ` +
      `${suitable.filter((r) => r.misconceptions === 2).length} sustain 2, ` +
      `${suitable.filter((r) => r.misconceptions === 1).length} sustain 1; ` +
      `${unsuitable.length} unsuitable`,
  )
  results.forEach((r, i) => {
    if (!r.ok) console.log(`  #${i + 1} UNSUITABLE — ${r.reason}`)
    else if (r.misconceptions < 3) console.log(`  #${i + 1} only ${r.misconceptions} misconception(s)`)
  })

  // Length tell: how often the correct option is the single longest (pickable by length).
  let correctLongest = 0
  for (const { check } of suitable) {
    const lens = check.options.map((o) => wordCount(o.text))
    const max = Math.max(...lens)
    const correctLen = wordCount(check.options.find((o) => o.correct)?.text ?? '')
    if (correctLen === max && lens.filter((l) => l === max).length === 1) correctLongest++
  }
  const pct = suitable.length ? Math.round((100 * correctLongest) / suitable.length) : 0
  console.log(
    `\ncorrect option is the single longest: ${correctLongest}/${suitable.length} (${pct}%) — target ~25%`,
  )

  // Near-duplicate stems across the suitable checks.
  const tokens = suitable.map((r) => stemTokens(r.check.stem))
  const pairs: Array<{ i: number; j: number; sim: number }> = []
  for (let i = 0; i < suitable.length; i++) {
    for (let j = i + 1; j < suitable.length; j++) {
      const sim = jaccard(tokens[i], tokens[j])
      if (sim >= 0.45) pairs.push({ i, j, sim })
    }
  }
  pairs.sort((a, b) => b.sim - a.sim)
  if (pairs.length === 0) {
    console.log('near-duplicate stems: none above 0.45 Jaccard')
  } else {
    console.log(`near-duplicate stems (Jaccard ≥ 0.45): ${pairs.length}`)
    for (const { i, j, sim } of pairs) {
      console.log(`  [${sim.toFixed(2)}] "${suitable[i].check.stem}"`)
      console.log(`         "${suitable[j].check.stem}"`)
    }
  }
}

async function main(): Promise<void> {
  const questionsFile = questionsFileSchema.parse(
    JSON.parse(readFileSync(`${DATA_DIR}questions.json`, 'utf8')),
  )
  // Off-path questions (EXCLUDED_SLUGS, ADR-0011) are not lesson cards — skip them.
  const excluded = new Set(EXCLUDED_SLUGS)
  const questions = questionsFile.questions.filter(
    (q) => q.sourceSection === SECTION && !excluded.has(q.slug),
  )
  console.error(`Generating checks for ${questions.length} "${SECTION}" cards with ${MODEL}...`)

  const results = await mapPool(questions, CONCURRENCY, generateOne)
  const checks = results.filter((r): r is Extract<GenResult, { ok: true }> => r.ok).map((r) => r.check)

  const file = checksFileSchema.parse({
    generatedAt: new Date().toISOString(),
    model: MODEL,
    sourceSection: SECTION,
    checks,
  })
  writeFileSync(`${DATA_DIR}checks-principiante.json`, `${JSON.stringify(file, null, 2)}\n`)

  const questionById = new Map(questions.map((q) => [q.id, q]))
  printResults(results, questionById)
  reportStats(results)
  console.error(
    `\nWrote ${checks.length} checks (of ${results.length} questions) -> src/content/data/checks-principiante.json`,
  )
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
