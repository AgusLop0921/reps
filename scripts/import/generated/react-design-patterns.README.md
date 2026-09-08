# React Design Patterns — Reps editorial artifact

Status: **approved editorial artifact for Codex integration**  
Generated: `2026-09-08T21:03:00.000Z`  
Track ID: `react-design-patterns`  
Editorial source: `reps-manual`

## What this artifact contains

- 6 sections
- 21 lessons
- 84 questions
- 84 multiple-choice checks
- Spanish explanations with React terminology kept in English
- Stable deterministic 12-character question IDs
- Runtime-compatible fields only: `track`, `questions`, and `checks`

The JSON intentionally matches the current Reps content model:

- `Track` owns a `Curriculum`
- `Section` owns ordered `Lesson[]`
- `Lesson` only groups `questionIds`
- rich editorial content lives in `Question.answerMd`
- one `Check` is provided for every question
- all questions use `format: "open"` because the current runtime renders the separate `Check`

## Editorial model

Each of the 21 conceptual lessons contains four reps. Across the track, the checks deliberately mix:

- decision making
- diagnosis
- trade-off reasoning
- refactor choices

The goal is not definition recall. The learner should recognize a React design problem and choose an appropriate response.

## Curriculum

1. Component API Design
   - Composition over Prop Explosion
   - Children as Inversion of Control
   - Compound Components

2. State Ownership
   - Put State Where It Belongs
   - Controlled vs Uncontrolled
   - Design State, Don’t Accumulate It
   - Identity, Keys & State Reset

3. Behavioral Architecture
   - Custom Hooks as Behavioral APIs
   - Reducers for Complex Transitions
   - Context Is a Boundary, Not a Store
   - You Probably Don’t Need That Effect
   - Effect Events

4. Flexible Components
   - Headless Components
   - Slots, asChild & Polymorphism
   - Refs Are Escape Hatches

5. Async UI Patterns
   - Actions & Pending State
   - Optimistic UI Is a Product Decision
   - Async Boundaries, Not Loading Flags Everywhere

6. Senior Design Decisions
   - React Compiler Changes Memoization
   - Avoid Premature Abstractions
   - Legacy Pattern Literacy

## Stable IDs

Question IDs are generated as:

```text
sha256("reps-manual:" + slug).slice(0, 12)
```

Do not regenerate IDs using array positions. Existing IDs must remain stable once integrated because progress is keyed by `trackId + questionId`.

Lesson IDs are deterministic and track-scoped:

```text
react-design-patterns:<section-id>:<lesson-order>
```

## Provenance

All runtime questions are attributed to `reps-manual` because the prose, scenarios, examples and checks are original Reps editorial content.

Official documentation was used as technical grounding and is linked inside relevant `answerMd` entries. The content should not be re-attributed to those documentation providers because it is not copied/imported source text.

Primary technical references include:

- React documentation — state, Effects, custom hooks, reducers, Context, refs, Actions, Suspense, transitions and React Compiler
- React 19.2 documentation for `useEffectEvent`
- Radix Primitives documentation for composition, `asChild`, and `Slot`

## Important integration rules for Codex

1. Treat `react-design-patterns.json` as approved editorial content.
2. Do not rewrite, shorten, translate or stylistically normalize the questions or answers.
3. Do not change question IDs.
4. Do not silently drop content that fails validation.
5. Do not introduce a new content architecture.
6. Reuse the existing `Track`, `Curriculum`, `Section`, `Lesson`, `Question`, and `Check` schemas.
7. Reuse the existing `reps-manual` Source.
8. No IndexedDB or Supabase migration is expected.
9. Register the track, questions, and checks explicitly through the existing catalog load boundary.
10. If a runtime limitation requires content transformation, report it before changing editorial semantics.

## Recommended repository placement

Place the approved external artifact at:

```text
scripts/import/generated/react-design-patterns.json
```

The repository currently has no canonical generic third-track JSON loader. Codex should choose the smallest integration compatible with the existing architecture rather than inventing a generic pipeline unless one is genuinely necessary.

## Validation already performed on this artifact

The generated JSON was checked for:

- exactly 6 sections
- exactly 21 lessons
- exactly 84 questions
- exactly 84 checks
- globally unique 12-character question IDs within this artifact
- one check per question
- exactly one correct option per check
- 2–4 options per check
- contiguous lesson ordering inside every section
- every lesson question reference resolves inside the artifact
- all questions use `sourceId: "reps-manual"`
- all sections use `sourceId: "reps-manual"`

Codex must still validate against the complete repository catalog to detect collisions with existing question IDs.
