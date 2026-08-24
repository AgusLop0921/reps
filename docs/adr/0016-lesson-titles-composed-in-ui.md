# ADR-0016: Lesson titles are composed in the UI

- **Status:** Accepted
- **Date:** 2026-08-24
- **Amends:** ADR-0008

## Context

Lessons are positional chunks of a section (ADR-0011); their composition shifts whenever
upstream inserts or removes questions. A lesson therefore has no natural, stable title
coming from the content.

`lessonSchema` had a required `title`. Generating one leaves two bad options: bake a bare
number into the data, or write Spanish prose ("Lección 3", "Fundamentos de JSX") into
`curriculum.json`. ADR-0008 says every user-facing Spanish string lives in
`src/ui/copy.ts`; a title in generated data puts Spanish outside that file and freezes it
at generation time, where it cannot follow a shifting chunk.

## Decision

`lessonSchema` has **no `title`**. The UI composes the visible label from `copy.ts` — a
template applied to `lesson.order` (e.g. "Lección {n}") plus its section context.

Hand-named lessons are the one exception: `LESSON_TITLES` in `src/content/order.ts` maps a
lesson id to an explicit, human-curated title. Those values are Spanish, and this is the
**documented exception to ADR-0008**: `order.ts` is curation data written by a person, not
generated output, and `LESSON_TITLES` is the single sanctioned place for Spanish outside
`copy.ts`.

Section `title` is unaffected — it stays in the data as the imported upstream heading
(ADR-0014), which is content in its original language, not UI chrome.

## Alternatives considered

- **Keep generated titles in the data** — Spanish outside `copy.ts`, frozen at generation
  time, and attached to a chunk that moves.
- **Titles in `copy.ts` keyed by lesson id** — lesson ids are positional and unstable, so
  the keys would rot on every re-import.
- **No titles anywhere** — the path screen needs a label for each lesson.

## Consequences

The UI owns lesson labelling; `copy.ts` holds the template and the review checks that no
other Spanish leaks in. `LESSON_TITLES` is a narrow, named exception that a reviewer must
recognize as legitimate rather than flag.

Removing `title` from `lessonSchema` updates the existing `core/` tests, which built
lessons with a title. No runtime logic in `core/curriculum.ts` read it.
