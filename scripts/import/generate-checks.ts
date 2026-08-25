/**
 * SPIKE (build-time, one-off): generate one multiple-choice comprehension check per
 * question using the Anthropic API, then critique each with an independent second pass.
 * The corpus has no MCQ content, so these are generated — they are OURS, not the source's:
 * each check links to its question by `questionId` but carries no `sourceId` attribution
 * and never touches the imported `answerMd`.
 *
 * BYOK: reads ANTHROPIC_API_KEY from the environment (the maintainer's key). The key is
 * never written to disk, logged, or committed. Runs on the Principiante path only.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-... pnpm tsx scripts/import/generate-checks.ts
 *
 * Two passes per question: one to write the check, a second (independent, not told it
 * wrote the check) to judge whether exactly one option is defensible and the distractors
 * are real misconceptions — that critique is the suitability signal, not model self-report.
 *
 * Departs from CLAUDE.md's "never invent content" rule. Deliberately isolated and un-wired
 * (no UI, no import into answerMd) pending an ADR to be written once the output is judged.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { EXCLUDED_SLUGS } from '../../src/content/order'
import { questionsFileSchema, type Question } from '../../src/content/schema'

const MODEL = 'claude-opus-4-8'
const SECTION = 'Principiante'
const CONCURRENCY = 4
const LETTERS = ['A', 'B', 'C', 'D']

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

const genOutputSchema = z.object({
  stem: z.string().min(1),
  correct: z.string().min(1),
  distractors: z.array(z.string()), // 1–3 genuine misconceptions; fewer is fine, never padded
  explanation: z.string().min(1),
})

const GEN_JSON_SCHEMA = {
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

const critiqueOutputSchema = z.object({
  correct: z.string(), // the letter the critic thinks is the single best-supported option
  multipleDefensible: z.boolean(),
  implausible: z.array(z.string()), // letters of options no real developer would pick
  notes: z.string(),
})

const CRITIQUE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['correct', 'multipleDefensible', 'implausible', 'notes'],
  properties: {
    correct: { type: 'string' },
    multipleDefensible: { type: 'boolean' },
    implausible: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
} as const

const GEN_SYSTEM = [
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
  '  written React would dismiss instantly, and NEVER use invalid or nonsensical syntax',
  '  (no "un archivo de configuración de rutas" for "what is a component"; no "<key={id}>").',
  '- Strongly prefer distractors that are TRUE statements about a DIFFERENT thing — a',
  '  correct description of useMemo offered as the answer about useEffect; a correct',
  '  description of state offered as the answer about props. These are hard because nothing',
  '  in them is false.',
  '- Exactly ONE option may be defensibly correct. If two options could be argued correct,',
  '  the item is broken (ambiguity, not difficulty) — fix it until only one is defensible.',
  '- All options must match in length (within ~20%) and in specificity. The correct one',
  '  must NOT be the longest, most detailed, or most hedged.',
  '',
  'No padding. If the reference answer supports fewer than three genuine misconceptions,',
  'return one or two distractors rather than padding with weak or invented options.',
  '',
  'explanation: 2–4 sentences that teach — why the correct option is right, and where it',
  'helps, why a tempting distractor is wrong.',
  '',
  'Only assert what the reference answer supports. Write a standalone exercise: never refer',
  'to "the reference answer", the source, or these instructions. Never emit control tokens,',
  'role markers, apologies, HTML tags, or meta-commentary about formatting.',
].join('\n')

const CRITIQUE_SYSTEM = [
  'You are reviewing a multiple-choice question for a React course. You did NOT write it —',
  'review it critically. Treat the REFERENCE ANSWER as ground truth. Report, as JSON:',
  '- correct: the letter of the single best-supported option.',
  '- multipleDefensible: true if more than one option could be defended as correct given',
  '  the reference answer (that is a flaw, not difficulty).',
  '- implausible: letters of any options no real React developer would pick because they',
  '  are obviously wrong, nonsensical, or invalid syntax. A good distractor is a real',
  '  misconception, not something instantly dismissable.',
  '- notes: one short line on any problem (English is fine).',
  'Be strict; this gates whether the question ships.',
].join('\n')

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Denylist of known-bad shapes (kept on top of positive validation below). */
const MALFORMED: Array<[RegExp, string]> = [
  [/<\||\|>/, 'control-token marker'],
  [/im_start|im_end|<\/?s>/i, 'chat control token'],
  [/\bassistant\b/i, 'literal role marker "assistant"'],
  [/\bsorry\b|i made a|formatting error|lo siento|me disculp|error de formato/i, 'apologetic meta-text'],
  [/respuesta de referencia|reference answer|seg[úu]n (la|el) (respuesta|texto|documento)/i, 'meta-reference to the source'],
]

/** An HTML/XML tag, e.g. `<br/>`, `</br>`, `<div>`, or the invalid `<key={id}>`. */
const HTML_TAG = /<\/?[a-zA-Z][^>]*>/

/**
 * Positive validation: learner-facing text must be Spanish prose plus inline code. Anything
 * outside this set (foreign scripts, control chars, box-drawing, replacement chars, stray
 * markup) is rejected — a denylist of known-bad patterns keeps losing to novel shapes.
 */
const ALLOWED_CHARS =
  /^[A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:()\[\]{}¿?¡!"'«»“”‘’…/\\=+*_$&|%#@<>`~^°ªº–—-]+$/u

/** Returns a reason string if learner-facing `text` is bad, else null. */
function fieldIssue(text: string): string | null {
  for (const [re, reason] of MALFORMED) if (re.test(text)) return reason
  if ((text.match(/{/g)?.length ?? 0) !== (text.match(/}/g)?.length ?? 0)) return 'unbalanced braces'
  if (HTML_TAG.test(text)) return 'HTML tag'
  if (!ALLOWED_CHARS.test(text)) {
    const bad = [...text].find((ch) => !ALLOWED_CHARS.test(ch))
    return `unexpected character ${JSON.stringify(bad)}`
  }
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

function extractText(raw: unknown): string {
  const res = responseSchema.parse(raw)
  if (res.stop_reason === 'refusal') throw new Error('model refused')
  return res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim()
}

const wordCount = (s: string): number => s.trim().split(/\s+/).length

/** True if `correct` is the single longest option (the pickable-by-length tell). */
function correctIsLongest(correct: string, distractors: string[]): boolean {
  const lens = [correct, ...distractors].map(wordCount)
  const max = Math.max(...lens)
  return wordCount(correct) === max && lens.filter((l) => l === max).length === 1
}

type GenResult =
  | { ok: true; check: Check; misconceptions: number }
  | { ok: false; questionId: string; kind: 'length' | 'malformed'; reason: string }

async function generateOne(question: Question): Promise<GenResult> {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: GEN_JSON_SCHEMA } },
    system: GEN_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `QUESTION: ${question.question}\n\nREFERENCE ANSWER:\n${question.answerMd}`,
      },
    ],
  }

  let malformed = ''
  let sawValidButLong = false
  for (let attempt = 0; attempt < 3; attempt++) {
    let out: z.infer<typeof genOutputSchema>
    try {
      out = genOutputSchema.parse(JSON.parse(extractText(await callApi(body))))
    } catch (err) {
      malformed = `bad response: ${String(err)}`
      continue
    }

    const correct = out.correct.trim()
    const distractors = [...new Set(out.distractors.map((d) => d.trim()))]
      .filter((d) => d && d !== correct)
      .slice(0, 3)
    if (distractors.length < 1) {
      malformed = 'no usable distractors'
      continue
    }

    const stem = out.stem.trim()
    const explanation = out.explanation.trim()
    const issue = [stem, explanation, correct, ...distractors].map(fieldIssue).find(Boolean)
    if (issue) {
      malformed = `malformed content (${issue})`
      continue
    }

    if (correctIsLongest(correct, distractors)) {
      sawValidButLong = true
      continue // retry for a length-balanced set
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

  // Length imbalance is a quality miss — report, don't write (per instruction). A genuine
  // malformed/leak that survived 3 retries is a hard defect (nonzero exit in main).
  return sawValidButLong
    ? { ok: false, questionId: question.id, kind: 'length', reason: 'correct option is the single longest' }
    : { ok: false, questionId: question.id, kind: 'malformed', reason: malformed || 'unknown' }
}

/** FNV-1a, for a stable per-question option shuffle so the critic never sees correct-first. */
function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

type Verdict =
  | { ran: true; sound: boolean; agreedOnCorrect: boolean; multipleDefensible: boolean; implausibleTexts: string[]; notes: string }
  | { ran: false }

async function critiqueOne(question: Question, check: Check): Promise<Verdict> {
  const order = check.options
    .map((_, i) => i)
    .sort((a, b) => hashString(question.id + check.options[a].text) - hashString(question.id + check.options[b].text))
  const shown = order.map((idx, pos) => ({ letter: LETTERS[pos], option: check.options[idx] }))
  const expected = shown.find((s) => s.option.correct)?.letter ?? '?'
  const optionsText = shown.map((s) => `${s.letter}) ${s.option.text}`).join('\n')

  const body = {
    model: MODEL,
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: CRITIQUE_JSON_SCHEMA } },
    system: CRITIQUE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `QUESTION: ${question.question}\n\nREFERENCE ANSWER:\n${question.answerMd}\n\nCANDIDATE ITEM\nStem: ${check.stem}\nOptions:\n${optionsText}`,
      },
    ],
  }

  try {
    const out = critiqueOutputSchema.parse(JSON.parse(extractText(await callApi(body))))
    const byLetter = new Map(shown.map((s) => [s.letter, s.option.text]))
    const picked = out.correct.trim().toUpperCase()
    const implausibleTexts = out.implausible
      .map((s) => byLetter.get(s.trim().toUpperCase()))
      .filter((t): t is string => Boolean(t))
    const agreedOnCorrect = picked === expected
    const sound = agreedOnCorrect && !out.multipleDefensible && implausibleTexts.length === 0
    return {
      ran: true,
      sound,
      agreedOnCorrect,
      multipleDefensible: out.multipleDefensible,
      implausibleTexts,
      notes: out.notes.trim(),
    }
  } catch {
    return { ran: false }
  }
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

const STOPWORDS = new Set([
  'que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'por', 'para', 'con', 'los', 'las',
  'una', 'uno', 'del', 'sus', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'segun',
  'the', 'and', 'for',
])

function tokens(text: string): Set<string> {
  const words = text
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

function correctText(check: Check): string {
  return check.options.find((o) => o.correct)?.text ?? ''
}

function verdictLabel(v: Verdict): string {
  if (!v.ran) return 'critique n/a'
  if (v.sound) return 'sound'
  const issues: string[] = []
  if (!v.agreedOnCorrect) issues.push('critic disagreed on the correct answer')
  if (v.multipleDefensible) issues.push('multiple defensible')
  if (v.implausibleTexts.length) {
    issues.push(`implausible: ${v.implausibleTexts.map((t) => `"${t}"`).join('; ')}`)
  }
  if (v.notes) issues.push(v.notes)
  return `UNSOUND — ${issues.join('; ')}`
}

function printResults(
  results: GenResult[],
  verdicts: Map<string, Verdict>,
  questionById: Map<string, Question>,
): void {
  results.forEach((r, i) => {
    const qid = r.ok ? r.check.questionId : r.questionId
    const q = questionById.get(qid)
    const ref = (q?.answerMd ?? '').replace(/\s+/g, ' ').trim()
    console.log(`\n=== ${i + 1}/${results.length} — ${q?.question} ===`)
    console.log(`Ref: ${ref.slice(0, 400)}${ref.length > 400 ? '…' : ''}`)
    if (!r.ok) {
      console.log(`SKIPPED (${r.kind}) — ${r.reason}`)
      return
    }
    console.log(`P: ${r.check.stem}   (misconceptions: ${r.misconceptions})`)
    r.check.options.forEach((o, j) => console.log(`  ${LETTERS[j]}) ${o.text}${o.correct ? '  [✓]' : ''}`))
    console.log(`  → ${r.check.explanation}`)
    console.log(`  [${verdictLabel(verdicts.get(qid) ?? { ran: false })}]`)
  })
}

function reportStats(results: GenResult[], verdicts: Map<string, Verdict>): void {
  const ok = results.filter((r): r is Extract<GenResult, { ok: true }> => r.ok)
  const lengthSkips = results.filter((r) => !r.ok && r.kind === 'length')
  const malformedSkips = results.filter((r) => !r.ok && r.kind === 'malformed')

  // Independent critique — the real suitability signal.
  const reviewed = ok.map((r) => ({ r, v: verdicts.get(r.check.questionId) ?? ({ ran: false } as Verdict) }))
  const sound = reviewed.filter(({ v }) => v.ran && v.sound).length
  console.log(`\ncritique: ${sound}/${ok.length} sound`)
  for (const { r, v } of reviewed) {
    if (!v.ran || !v.sound) console.log(`  "${r.check.stem}" — ${verdictLabel(v)}`)
  }

  // Coverage: how many misconceptions each question sustains.
  console.log(
    `\nmisconceptions: ${ok.filter((r) => r.misconceptions === 3).length} sustain 3, ` +
      `${ok.filter((r) => r.misconceptions === 2).length} sustain 2, ` +
      `${ok.filter((r) => r.misconceptions === 1).length} sustain 1`,
  )
  if (lengthSkips.length) console.log(`length-skipped (correct was longest): ${lengthSkips.length}`)
  if (malformedSkips.length) {
    console.log(`MALFORMED (hard failures): ${malformedSkips.length}`)
    for (const r of malformedSkips) if (!r.ok) console.log(`  ${r.questionId}: ${r.reason}`)
  }

  // Length tell across what we kept (should now be ~0 since it's enforced pre-write).
  const longest = ok.filter((r) => correctIsLongest(correctText(r.check), r.check.options.filter((o) => !o.correct).map((o) => o.text))).length
  const pct = ok.length ? Math.round((100 * longest) / ok.length) : 0
  console.log(`\ncorrect option is the single longest: ${longest}/${ok.length} (${pct}%) — target ~25%`)

  // Near-duplicates: max of stem similarity and correct-option similarity.
  const pairs: Array<{ i: number; j: number; sim: number; via: string }> = []
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      const stemSim = jaccard(tokens(ok[i].check.stem), tokens(ok[j].check.stem))
      const ansSim = jaccard(tokens(correctText(ok[i].check)), tokens(correctText(ok[j].check)))
      const sim = Math.max(stemSim, ansSim)
      if (sim >= 0.45) pairs.push({ i, j, sim, via: stemSim >= ansSim ? 'stem' : 'answer' })
    }
  }
  pairs.sort((a, b) => b.sim - a.sim)
  if (pairs.length === 0) {
    console.log('near-duplicate stems/answers: none above 0.45 Jaccard')
  } else {
    console.log(`near-duplicates (Jaccard ≥ 0.45, max of stem/answer): ${pairs.length}`)
    for (const { i, j, sim, via } of pairs) {
      console.log(`  [${sim.toFixed(2)} via ${via}] "${ok[i].check.stem}"`)
      console.log(`         "${ok[j].check.stem}"`)
    }
  }
}

async function main(): Promise<void> {
  const questionsFile = questionsFileSchema.parse(
    JSON.parse(readFileSync(`${DATA_DIR}questions.json`, 'utf8')),
  )
  const excluded = new Set(EXCLUDED_SLUGS)
  const questions = questionsFile.questions.filter(
    (q) => q.sourceSection === SECTION && !excluded.has(q.slug),
  )
  const questionById = new Map(questions.map((q) => [q.id, q]))

  console.error(`Generating checks for ${questions.length} "${SECTION}" cards with ${MODEL}...`)
  const results = await mapPool(questions, CONCURRENCY, generateOne)

  const ok = results.filter((r): r is Extract<GenResult, { ok: true }> => r.ok)
  console.error(`Critiquing ${ok.length} checks (independent second pass)...`)
  const verdicts = new Map<string, Verdict>()
  await mapPool(ok, CONCURRENCY, async (r) => {
    verdicts.set(r.check.questionId, await critiqueOne(questionById.get(r.check.questionId) as Question, r.check))
  })

  const file = checksFileSchema.parse({
    generatedAt: new Date().toISOString(),
    model: MODEL,
    sourceSection: SECTION,
    checks: ok.map((r) => r.check),
  })
  writeFileSync(`${DATA_DIR}checks-principiante.json`, `${JSON.stringify(file, null, 2)}\n`)

  printResults(results, verdicts, questionById)
  reportStats(results, verdicts)
  console.error(`\nWrote ${ok.length} checks (of ${results.length} questions) -> src/content/data/checks-principiante.json`)

  const hardFailures = results.filter((r) => !r.ok && r.kind === 'malformed').length
  if (hardFailures > 0) {
    console.error(`\n${hardFailures} malformed item(s) survived retries — failing loudly.`)
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
