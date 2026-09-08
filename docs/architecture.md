# Architecture

Living document: how the system looks today. The *why* lives in [`docs/adr/`](adr/).

## Data flow

```
approved sources (repositories today; more source types later)
        │
        ├── multi-document source normalization (build time, outside runtime)
        │        │
        │        ▼
        │   scripts/import/generated/       provenance-rich documents for later review
        │                                  never loaded as published curriculum
        │
        │  pnpm content:import   (build time, offline)
        ▼
scripts/import/sources/*.ts      one adapter per source
        │  parse() → Question[]
        ▼
curriculum generation            chunk into lessons, apply src/content/order.ts
        │
        ▼
Zod (src/content/schema.ts)      validates or fails the build
        │
        ▼
src/content/data/                imported React questions + curriculum
        │                        generated, committed, never edited by hand
        ├──────────┐
        │          │ reviewed editorial seed
        ▼          ▼
validated content catalog        Source != Track; Track wraps Curriculum
        │
        ▼
src/core/
   curriculum.ts ──── path position, unlocking, lesson deck
   scheduler.ts  ──── when a card comes back
        │
        ├──────────► src/storage/ (Dexie)   progress keyed by track + content id
        ▼
src/ui/                                     React
```

Content enters at build time or as reviewed editorial seed; progress lives in the browser and
optionally syncs. They meet in `core/`, selected by `trackId` and joined by `questionId` and
`lessonId`.

## Tracks and sources

A `Track` owns one existing `Curriculum`; its sections and lessons keep the original path
model. A track references one or more `Source` records, but source identity never determines
track identity. Questions retain fine-grained attribution through `sourceId` and slug. The
catalog rejects unresolved and duplicate references at startup.

The runtime consumes only this canonical Reps model. Multi-document sources can first emit
validated `NormalizedDocument` snapshots outside the runtime, then provider-neutral,
evidence-grounded `SourceAnalysis` artifacts. The Microsoft snapshot and any analysis output
are revision-pinned under `scripts/import/generated/`; neither is a curriculum and nothing in
`src/content/load.ts` imports them. Human review and publication remain separate stages. See
ADR-0023, ADR-0024, and ADR-0025.

## The two progress models

There are deliberately two, and conflating them is the mistake to avoid:

- **`LessonProgress`** — where you are on one track's path. Drives unlocking and the "next
  lesson" landing. Advances forward only.
- **`Progress`** — spaced repetition state per track/question. Drives which review cards open a
  lesson. Moves in both directions.

A card only gets `Progress` once it has actually been answered (ADR-0012). Scrolling past
something changes nothing.

## Layers

| Layer | Responsibility | May import from |
|---|---|---|
| `content/` | schema, types, generated data, curation overrides | nothing in the project |
| `core/` | path logic and scheduling | `content/` |
| `storage/` | persistence and migrations | `content/` |
| `ui/` | rendering and interaction | all of the above |

`core/` knows nothing about React, the DOM or the clock: `now` is always a parameter.
That is what makes the logic exhaustively testable without mocking time, and it is the
rule most easily broken by accident. The `reviewer` subagent checks it.

## Content decisions

A `Question` is immutable and traceable: `sourceId` + `slug` say where it came from, and
`id` is a hash of both (ADR-0004). Lesson membership, by contrast, is positional and can
shift when upstream inserts questions — which is why `LessonProgress` stores answered
question ids rather than a completion flag.

`format` (`open` | `mcq`) exists because sources are not homogeneous. The UI picks the
exercise component from that field, not from the source.

## Language boundary

Code and docs are English; the interface is Spanish (ADR-0008). Every user-facing string
lives in `src/ui/copy.ts`, so the boundary is one file rather than a judgement call in
every component.

## What is missing

Microsoft's Spanish lesson documents are normalized with provenance and have a grounded
analysis command. A reviewed analysis artifact, curriculum generation, review, and
publication are not yet complete. AI Engineering still has one editorial seed lesson, not an
imported curriculum.

Interview simulation (ADR-0013) is v2 and shares only the corpus — it does not touch the
path, the scheduler or either progress model.
