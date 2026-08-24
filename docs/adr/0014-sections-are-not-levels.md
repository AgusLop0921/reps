# ADR-0014: Sections are structural, not difficulty levels

- **Status:** Accepted
- **Date:** 2026-08-24
- **Supersedes:** the section/level coupling in ADR-0011

## Context

ADR-0011 organized the path as sections that map one-to-one to source difficulty
levels (`basic → intermediate → advanced → expert`). Fetching the real midudev README
showed the assumption does not hold:

- The source has three level headings — **Principiante**, **Intermedio**, **Experto** —
  and no `avanzado`. Coupling sections to the four-value level enum produces a phantom
  empty `advanced` section, which also fails `sectionSchema` (a section needs ≥1 lesson).
- The source has a fourth top-level heading, **"Errores Típicos en React"**, which is
  real content but not a difficulty tier. Mapping section to level has no place for it,
  and the old adapter would silently file its questions under whatever level it saw last.
- Level headings are one source's convention. Other planned sources group differently.
  Section identity cannot be the level enum and generalize.

Separately, the old adapter inherited `level` across headings (`detectLevel(title) ?? level`).
That fall-through is what silently mislabels content — it should not survive into the new
structure.

## Decision

Sections are structural groupings taken from the upstream section headings, in document
order, independent of difficulty. `sectionSchema` becomes `{ id, title, sourceId, lessons }`.

`level` is **per-question metadata only**, and **nullable**:

- The adapter sets `level` only when a heading maps to a known level
  (`Principiante → basic`, `Intermedio → intermediate`, `Experto → expert`).
- Otherwise `level` is `null`. It is **never inherited** from a previous heading.
  "Errores Típicos en React" questions get `level: null`.
- The phantom `advanced` section disappears with no special case: sections come from
  headings that exist, and there is no `avanzado` heading to produce one.

`lessonSchema` drops `level`: it was redundant with per-question metadata and re-coupled
what this ADR decouples. (Dropping the lesson `title` is ADR-0016.)

**Upstream document order is a contract.** Curriculum section order and positional lesson
chunking (ADR-0011) depend on adapters returning questions in the order they appear in
the source. This is stated as a comment on `questionSchema` and asserted by an adapter
test. Each question carries `sourceSection` (the verbatim upstream heading) so curriculum
generation groups questions into sections without re-parsing the source markdown — the
adapter contract stays `parse(markdown): Question[]` (ADR-0004).

## Alternatives considered

- **Keep section = level (ADR-0011 as written)** — phantom empty sections, no home for
  non-level headings, the inheritance bug, and it does not survive the second source.
- **Infer level from answer content** — unverifiable generated data; ADR-0011 already
  rejected the same move for topics.
- **Default unmapped headings to the nearest level (the old fall-through)** — this is the
  original defect. `null` is honest; a wrong label is worse than no label.
- **Adapters return sections directly** — breaks the `parse(): Question[]` contract of
  ADR-0004. `sourceSection` on each question keeps the contract and still lets curriculum
  generation reconstruct sections.

## Consequences

`level` is nullable everywhere it is read. The UI must render a question with no
difficulty label, and any filtering by level must treat `null` as its own case.

Section `id` must be unique per source; once there is more than one source it derives from
`sourceId` plus the heading slug, not the slug alone.

Section `title` stays in generated data because it is an imported heading, traceable to the
source (like the question text) — not UI chrome. This is consistent with ADR-0008, which
allows imported content in its original language.

Upstream reordering still shifts section and lesson composition, as ADR-0011 already
accepted; question ids stay stable, so per-question progress survives. A source whose
headings match no known level simply yields sections of `null`-level questions, which is
fine.
