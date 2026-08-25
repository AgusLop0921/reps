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
 * Philosophy: flag, don't drop. Everything usable is written with flags for review; the
 * only hard drop is a generation that never produced a usable, leak-free check after
 * retries. Legitimate JSX in an option (the exercise is about markup) is content, not a
 * defect.
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
  distractors: z.array(z.string()),
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
  correct: z.string(),
  multipleDefensible: z.boolean(),
  implausible: z.array(z.string()),
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
  '  written React would dismiss instantly, and NEVER use invalid or nonsensical syntax.',
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
  'JSX/HTML in an option is fine when the question is about markup — wrap code in backticks',
  'when practical. Only assert what the reference answer supports. Write a standalone',
  'exercise: never refer to "the reference answer", the source, or these instructions.',
  'Never emit control tokens, role markers, apologies, or meta-commentary about formatting.',
].join('\n')

const CRITIQUE_SYSTEM = [
  'You are reviewing a multiple-choice question for a React course. You did NOT write it —',
  'review it critically. Treat the REFERENCE ANSWER as ground truth. Report, as JSON:',
  '- correct: the letter of the single best-supported option.',
  '- multipleDefensible: true if more than one option could be defended as correct given',
  '  the reference answer (that is a flaw, not difficulty).',
  '- implausible: letters of any options that are obviously wrong, nonsensical, or invalid',
  '  syntax (advisory — a good distractor is a real misconception, not instantly dismissable).',
  '- notes: one short line on any problem. When you mention an option, QUOTE ITS TEXT, not',
  '  its letter. English is fine.',
].join('\n')

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Genuine machinery leaks — a check containing any of these is broken, not just flawed. */
const LEAK: Array<[RegExp, string]> = [
  [/<\||\|>/, 'control-token marker'],
  [/im_start|im_end|<\/?s>/i, 'chat control token'],
  [/\bassistant\b/i, 'literal role marker "assistant"'],
  [/\bsorry\b|i made a|formatting error|lo siento|me disculp|error de formato/i, 'apologetic meta-text'],
]

/** Referring to the source breaks the exercise, but the check still works — a flag, not a drop. */
const META_REF = /respuesta de referencia|reference answer|seg[úu]n (la|el) (respuesta|texto|documento)/i

function leakIssue(text: string): string | null {
  for (const [re, reason] of LEAK) if (re.test(text)) return reason
  return null
}

/**
 * Strip what the exercise legitimately teaches — inline code, JSX/HTML tags, and JSX
 * expressions — then the residue should be plain Spanish prose. Anything left outside that
 * set is stray markup (e.g. a `<br/>` rendered into non-markup prose), not taught code.
 */
function proseResidue(text: string): string {
  return text
    .replace(/`[^`]*`/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
}

const PROSE_ALLOWED = /^[A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:()¿?¡!"'«»“”‘’…–—-]*$/u

function strayMarkup(text: string): boolean {
  return !PROSE_ALLOWED.test(proseResidue(text))
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

function correctIsLongest(correct: string, distractors: string[]): boolean {
  const lens = [correct, ...distractors].map(wordCount)
  const max = Math.max(...lens)
  return wordCount(correct) === max && lens.filter((l) => l === max).length === 1
}

type GenResult =
  | { ok: true; check: Check; misconceptions: number; flags: string[] }
  | { ok: false; questionId: string; reason: string }

/** Quality flags on an otherwise-usable check. Written and reported, never dropped. */
function softFlags(stem: string, correct: string, distractors: string[], explanation: string): string[] {
  const fields = [stem, explanation, correct, ...distractors]
  const flags: string[] = []
  if (correctIsLongest(correct, distractors)) flags.push('length: correct is longest')
  if (fields.some((f) => META_REF.test(f))) flags.push('meta-reference to source')
  if (fields.some(strayMarkup)) flags.push('stray markup in prose')
  return flags
}

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

  let hardReason = ''
  let best: { check: Check; misconceptions: number; flags: string[] } | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    let out: z.infer<typeof genOutputSchema>
    try {
      out = genOutputSchema.parse(JSON.parse(extractText(await callApi(body))))
    } catch (err) {
      hardReason = `bad response: ${String(err)}`
      continue
    }

    const correct = out.correct.trim()
    const distractors = [...new Set(out.distractors.map((d) => d.trim()))]
      .filter((d) => d && d !== correct)
      .slice(0, 3)
    if (distractors.length < 1) {
      hardReason = 'no usable distractors'
      continue
    }

    const stem = out.stem.trim()
    const explanation = out.explanation.trim()
    const leak = [stem, explanation, correct, ...distractors].map(leakIssue).find(Boolean)
    if (leak) {
      hardReason = `leak (${leak})`
      continue
    }

    const flags = softFlags(stem, correct, distractors, explanation)
    const check: Check = {
      questionId: question.id,
      stem,
      options: [{ text: correct, correct: true }, ...distractors.map((text) => ({ text, correct: false }))],
      explanation,
    }
    if (flags.length === 0) return { ok: true, check, misconceptions: distractors.length, flags }
    // Usable but flagged — keep the least-flagged candidate and retry for a clean one.
    if (!best || flags.length < best.flags.length) best = { check, misconceptions: distractors.length, flags }
  }

  if (best) return { ok: true, ...best } // flag, don't drop
  return { ok: false, questionId: question.id, reason: hardReason || 'unknown' }
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
    const implausibleTexts = out.implausible
      .map((s) => byLetter.get(s.trim().toUpperCase()))
      .filter((t): t is string => Boolean(t))
    const agreedOnCorrect = out.correct.trim().toUpperCase() === expected
    // Gate only on wrong-answer or ambiguity. Implausible distractors are advisory.
    const sound = agreedOnCorrect && !out.multipleDefensible
    return { ran: true, sound, agreedOnCorrect, multipleDefensible: out.multipleDefensible, implausibleTexts, notes: out.notes.trim() }
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

const correctText = (check: Check): string => check.options.find((o) => o.correct)?.text ?? ''

function verdictLabel(v: Verdict): string {
  if (!v.ran) return 'critique n/a'
  const gate: string[] = []
  if (!v.agreedOnCorrect) gate.push('critic chose a different answer')
  if (v.multipleDefensible) gate.push('multiple defensible')
  const advisory: string[] = []
  if (v.implausibleTexts.length) {
    advisory.push(`weak distractor(s): ${v.implausibleTexts.map((t) => `"${t}"`).join('; ')}`)
  }
  if (v.notes) advisory.push(v.notes)
  const head = gate.length ? `UNSOUND — ${gate.join('; ')}` : 'sound'
  return advisory.length ? `${head}; note: ${advisory.join('; ')}` : head
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
      console.log(`DROPPED (broken) — ${r.reason}`)
      return
    }
    console.log(`P: ${r.check.stem}   (misconceptions: ${r.misconceptions})`)
    r.check.options.forEach((o, j) => console.log(`  ${LETTERS[j]}) ${o.text}${o.correct ? '  [✓]' : ''}`))
    console.log(`  → ${r.check.explanation}`)
    if (r.flags.length) console.log(`  ⚑ ${r.flags.join('; ')}`)
    console.log(`  [${verdictLabel(verdicts.get(qid) ?? { ran: false })}]`)
  })
}

function reportStats(results: GenResult[], verdicts: Map<string, Verdict>): void {
  const ok = results.filter((r): r is Extract<GenResult, { ok: true }> => r.ok)
  const dropped = results.filter((r): r is Extract<GenResult, { ok: false }> => !r.ok)

  console.log(`\nwritten: ${ok.length}/${results.length}; dropped (broken): ${dropped.length}`)
  for (const r of dropped) console.log(`  DROPPED ${r.questionId}: ${r.reason}`)

  const reviewed = ok.map((r) => ({ r, v: verdicts.get(r.check.questionId) ?? ({ ran: false } as Verdict) }))
  const sound = reviewed.filter(({ v }) => v.ran && v.sound).length
  console.log(`\ncritique: ${sound}/${ok.length} sound (gate: wrong-answer or ambiguity only)`)
  for (const { r, v } of reviewed) {
    if (!v.ran || !v.sound) console.log(`  "${r.check.stem}" — ${verdictLabel(v)}`)
  }

  const flagCount = (needle: string): number => ok.filter((r) => r.flags.some((f) => f.startsWith(needle))).length
  console.log(
    `\nflags: ${flagCount('length')} length, ${flagCount('meta-reference')} meta-reference, ` +
      `${flagCount('stray markup')} stray-markup`,
  )
  console.log(
    `\nmisconceptions: ${ok.filter((r) => r.misconceptions === 3).length} sustain 3, ` +
      `${ok.filter((r) => r.misconceptions === 2).length} sustain 2, ` +
      `${ok.filter((r) => r.misconceptions === 1).length} sustain 1`,
  )

  const longest = ok.filter((r) => correctIsLongest(correctText(r.check), r.check.options.filter((o) => !o.correct).map((o) => o.text))).length
  const pct = ok.length ? Math.round((100 * longest) / ok.length) : 0
  console.log(`\ncorrect option is the single longest: ${longest}/${ok.length} (${pct}%) — target ~25%`)

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

  const dropped = results.filter((r) => !r.ok).length
  if (dropped > 0) {
    console.error(`\n${dropped} generation(s) genuinely broken after retries — failing loudly.`)
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
