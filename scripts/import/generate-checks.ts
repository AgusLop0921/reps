/**
 * SPIKE (build-time, one-off): generate one multiple-choice comprehension check per
 * question using the Anthropic API. The corpus has no MCQ content, so these are generated
 * — they are OURS, not the source's: each check links to its question by `questionId` but
 * carries no `sourceId` attribution and never touches the imported `answerMd`.
 *
 * BYOK: reads ANTHROPIC_API_KEY from the environment (the maintainer's key). The key is
 * never written to disk, logged, or committed. Runs on the Principiante section only.
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

/** A generated check. Note: no `sourceId` — generated checks are ours (see file header). */
const checkSchema = z.object({
  questionId: z.string().length(12),
  stem: z.string().min(1),
  options: z
    .array(z.object({ text: z.string().min(1), correct: z.boolean() }))
    .length(4)
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

/** What the model returns per question: the correct option and three distractors, unmixed. */
const modelOutputSchema = z.object({
  stem: z.string().min(1),
  correct: z.string().min(1),
  distractors: z.array(z.string().min(1)),
  explanation: z.string().min(1),
})

const OUTPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['stem', 'correct', 'distractors', 'explanation'],
  properties: {
    stem: { type: 'string' },
    correct: { type: 'string' },
    distractors: { type: 'array', items: { type: 'string' } },
    explanation: { type: 'string' },
  },
} as const

const SYSTEM = [
  'You write ONE multiple-choice comprehension check for a React interview question.',
  'Everything you output (stem, correct, distractors, explanation) must be in Spanish.',
  'You are given a QUESTION and its REFERENCE ANSWER. Produce:',
  '- stem: a clear question testing whether the learner understood the key point. It may',
  '  rephrase the original but must be answerable from the reference answer.',
  '- correct: the correct option, concise.',
  '- distractors: exactly three incorrect options. Each must be plausible and tempting —',
  '  grounded in common React misconceptions or partial understanding — similar in length',
  '  and register to the correct option, and not trivially eliminable. No "all of the',
  '  above", no joke answers, no near-duplicates of the correct option.',
  '- explanation: one sentence saying why the correct option is right.',
  'Only assert what the reference answer supports. Do not invent facts beyond it.',
  '',
  'Hard requirements:',
  '- All four options must be within ~20% of each other in length and match in level of',
  '  detail and specificity. The correct option must NOT be the longest, most detailed, or',
  '  most hedged — it must not be identifiable by length or wording alone.',
  '- Write a standalone exercise. Never refer to "the reference answer", the source, the',
  '  question author, or these instructions (no "según la respuesta de referencia" etc.).',
  '- Output only the requested fields. Never emit control tokens, role markers, apologies,',
  '  or meta-commentary about your own formatting.',
].join('\n')

/**
 * Signs of a malformed generation: leaked chat control tokens, apologetic meta-text, a
 * meta-reference to the source, or unbalanced braces (a real leak passed Zod once —
 * `}}<|im_start|>assistant Sorry, I made a formatting error...`). Any hit fails the item.
 */
const MALFORMED: Array<[RegExp, string]> = [
  [/<\||\|>/, 'control-token marker'],
  [/im_start|im_end|<\/?s>/i, 'chat control token'],
  [/\bassistant\b/i, 'literal role marker "assistant"'],
  [/\bsorry\b|i made a|formatting error|lo siento|me disculp|error de formato/i, 'apologetic meta-text'],
  [/respuesta de referencia|reference answer|seg[úu]n (la|el) (respuesta|texto|documento)/i, 'meta-reference to the source'],
]

/** Returns a reason string if `text` looks malformed, else null. */
function malformedReason(text: string): string | null {
  for (const [re, reason] of MALFORMED) if (re.test(text)) return reason
  if ((text.match(/{/g)?.length ?? 0) !== (text.match(/}/g)?.length ?? 0)) return 'unbalanced braces'
  return null
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Deterministic correct-option position from the questionId, so it is not always first. */
function correctIndex(questionId: string): number {
  let sum = 0
  for (const ch of questionId) sum += ch.charCodeAt(0)
  return sum % 4
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

async function generateOne(question: Question): Promise<Check> {
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

    const correct = out.correct.trim()
    const distractors = [...new Set(out.distractors.map((d) => d.trim()))].filter(
      (d) => d && d !== correct,
    )
    if (distractors.length < 3) {
      lastError = `only ${distractors.length} usable distractors`
      continue
    }

    const stem = out.stem.trim()
    const explanation = out.explanation.trim()
    const fields = [stem, explanation, correct, ...distractors.slice(0, 3)]
    const bad = fields.map(malformedReason).find(Boolean)
    if (bad) {
      lastError = `malformed content (${bad})`
      continue
    }

    const idx = correctIndex(question.id)
    let d = 0
    const options = Array.from({ length: 4 }, (_, pos) =>
      pos === idx ? { text: correct, correct: true } : { text: distractors[d++], correct: false },
    )
    return { questionId: question.id, stem, options, explanation }
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

function printChecks(checks: Check[], questionById: Map<string, Question>): void {
  const letter = ['A', 'B', 'C', 'D']
  checks.forEach((check, i) => {
    const q = questionById.get(check.questionId)
    const ref = (q?.answerMd ?? '').replace(/\s+/g, ' ').trim()
    console.log(`\n=== ${i + 1}/${checks.length} — ${q?.question} ===`)
    console.log(`Ref: ${ref.slice(0, 400)}${ref.length > 400 ? '…' : ''}`)
    console.log(`P: ${check.stem}`)
    check.options.forEach((o, j) => console.log(`  ${letter[j]}) ${o.text}${o.correct ? '  [✓]' : ''}`))
    console.log(`  → ${check.explanation}`)
  })
}

const wordCount = (s: string): number => s.trim().split(/\s+/).length

const STOPWORDS = new Set([
  'que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'por', 'para', 'con', 'los', 'las',
  'una', 'uno', 'del', 'sus', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'segun',
  'the', 'and', 'for',
])

/** Content-word token set for a stem, accent- and stopword-stripped. */
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

/** The mechanical checks: length tell + near-duplicate stems. Reported, not enforced. */
function reportStats(checks: Check[]): void {
  // How often the correct option is the single longest (the pickable-by-length tell).
  let correctLongest = 0
  for (const c of checks) {
    const lens = c.options.map((o) => wordCount(o.text))
    const max = Math.max(...lens)
    const correctLen = wordCount(c.options.find((o) => o.correct)?.text ?? '')
    if (correctLen === max && lens.filter((l) => l === max).length === 1) correctLongest++
  }
  const pct = Math.round((100 * correctLongest) / checks.length)
  console.log(
    `\ncorrect option is the single longest: ${correctLongest}/${checks.length} (${pct}%) — target ~25%`,
  )

  // Near-duplicate stems across the section.
  const tokens = checks.map((c) => stemTokens(c.stem))
  const pairs: Array<{ i: number; j: number; sim: number }> = []
  for (let i = 0; i < checks.length; i++) {
    for (let j = i + 1; j < checks.length; j++) {
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
      console.log(`  [${sim.toFixed(2)}] #${i + 1} "${checks[i].stem}"`)
      console.log(`         #${j + 1} "${checks[j].stem}"`)
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
  console.error(`Generating ${questions.length} checks for "${SECTION}" with ${MODEL}...`)

  const checks = await mapPool(questions, CONCURRENCY, generateOne)

  const file = checksFileSchema.parse({
    generatedAt: new Date().toISOString(),
    model: MODEL,
    sourceSection: SECTION,
    checks,
  })
  writeFileSync(`${DATA_DIR}checks-principiante.json`, `${JSON.stringify(file, null, 2)}\n`)

  printChecks(checks, new Map(questions.map((q) => [q.id, q])))
  reportStats(checks)
  console.error(`\nWrote ${checks.length} checks -> src/content/data/checks-principiante.json`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
