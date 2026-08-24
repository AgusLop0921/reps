# Architecture

Living document: how the system looks today. The *why* lives in [`docs/adr/`](adr/).

## Data flow

```
third-party repositories (markdown)
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
src/content/data/                questions.json + curriculum.json
        │                        generated, committed, never edited by hand
        ▼
src/core/
   curriculum.ts ──── path position, unlocking, lesson deck
   scheduler.ts  ──── when a card comes back
        │
        ├──────────► src/storage/ (Dexie)   lesson progress + per-question progress
        ▼
src/ui/                                     React
```

Content enters at build time; progress lives only in the browser. They meet in `core/`,
joined by `questionId` and `lessonId`.

## The two progress models

There are deliberately two, and conflating them is the mistake to avoid:

- **`LessonProgress`** — where you are on the path. Drives unlocking and the "next
  lesson" landing. Advances forward only.
- **`Progress`** — spaced repetition state per question. Drives which review cards open a
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

The app itself: `storage/`, `ui/`, the lesson runner and the path screen. Plus the
curriculum generation step in the importer. This scaffold defines the contract they get
built inside.

Interview simulation (ADR-0013) is v2 and shares only the corpus — it does not touch the
path, the scheduler or either progress model.
