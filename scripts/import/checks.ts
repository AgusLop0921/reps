/**
 * The generated-check data contract (ADR-0017) and the mechanical statistics computed
 * purely from that data — no API calls. Shared by the generator (generate-checks.ts) and
 * the report-only command (check-report.ts) so the numbers can never drift between them.
 */
import { z } from 'zod'

/**
 * A generated check. Options range 2–4. Stored order is arbitrary — the UI shuffles with a
 * seed at display time. No `sourceId`: generated checks are ours (ADR-0017).
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

export const checksFileSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  sourceSection: z.string(),
  checks: z.array(checkSchema).min(1),
})

export type Check = z.infer<typeof checkSchema>

/** Referring to the source breaks the exercise — a flag, not a defect. */
const META_REF = /respuesta de referencia|reference answer|seg[úu]n (la|el) (respuesta|texto|documento)/i

/** Strip what the exercise teaches (fenced + inline code, JSX/HTML tags, JSX expressions). */
function proseResidue(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
}

// `/`, arrows (→ ← ↔), and `+` are ordinary prose here (X/Y, data-flow diagrams, "0+1"),
// not markup. None can mask a real leak — control tokens (<|…) and foreign scripts still fail.
const PROSE_ALLOWED = /^[A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:()¿?¡!\/→←↔+"'«»“”‘’…–—-]*$/u

export function strayMarkup(text: string): boolean {
  return !PROSE_ALLOWED.test(proseResidue(text))
}

const wordCount = (s: string): number => s.trim().split(/\s+/).length

export const correctText = (check: Check): string => check.options.find((o) => o.correct)?.text ?? ''
const distractorTexts = (check: Check): string[] =>
  check.options.filter((o) => !o.correct).map((o) => o.text)

export function correctIsLongest(correct: string, distractors: string[]): boolean {
  const lens = [correct, ...distractors].map(wordCount)
  const max = Math.max(...lens)
  return wordCount(correct) === max && lens.filter((l) => l === max).length === 1
}

/** Quality flags computed from a stored check: length tell, meta-reference, stray markup. */
export function flagsForCheck(check: Check): string[] {
  const correct = correctText(check)
  const distractors = distractorTexts(check)
  const fields = [check.stem, check.explanation, correct, ...distractors]
  const flags: string[] = []
  if (correctIsLongest(correct, distractors)) flags.push('length: correct is longest')
  if (fields.some((f) => META_REF.test(f))) flags.push('meta-reference to source')
  if (fields.some(strayMarkup)) flags.push('stray markup in prose')
  return flags
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

/** The mechanical report, computed only from committed check data (no generation, no API). */
export function reportMechanical(sourceSection: string, checks: Check[]): void {
  console.log(`\n=== ${sourceSection}: ${checks.length} checks (mechanical, from data) ===`)

  const count = (needle: string): number =>
    checks.filter((c) => flagsForCheck(c).some((f) => f.startsWith(needle))).length
  console.log(
    `flags: ${count('length')} length, ${count('meta-reference')} meta-reference, ${count('stray markup')} stray-markup`,
  )

  const mis = (n: number): number => checks.filter((c) => c.options.length - 1 === n).length
  console.log(`misconceptions: ${mis(3)} sustain 3, ${mis(2)} sustain 2, ${mis(1)} sustain 1`)

  const longest = checks.filter((c) => correctIsLongest(correctText(c), distractorTexts(c))).length
  const pct = checks.length ? Math.round((100 * longest) / checks.length) : 0
  console.log(`correct option is the single longest: ${longest}/${checks.length} (${pct}%) — target ~25%`)

  const pairs: Array<{ i: number; j: number; sim: number; via: string }> = []
  for (let i = 0; i < checks.length; i++) {
    for (let j = i + 1; j < checks.length; j++) {
      const stemSim = jaccard(tokens(checks[i].stem), tokens(checks[j].stem))
      const ansSim = jaccard(tokens(correctText(checks[i])), tokens(correctText(checks[j])))
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
      console.log(`  [${sim.toFixed(2)} via ${via}] "${checks[i].stem}"`)
      console.log(`         "${checks[j].stem}"`)
    }
  }

  const stray = checks.filter((c) => flagsForCheck(c).includes('stray markup in prose'))
  if (stray.length) {
    console.log(`\nstray-markup items (${stray.length}) — eyeball these:`)
    for (const c of stray) {
      const field = [c.stem, c.explanation, correctText(c), ...distractorTexts(c)].find(strayMarkup) ?? ''
      console.log(`  "${c.stem}"`)
      console.log(`     raw:     "${field.trim().slice(0, 200)}"`)
      console.log(`     residue: "${proseResidue(field).trim().replace(/\s+/g, ' ').slice(0, 200)}"`)
    }
  }
}
