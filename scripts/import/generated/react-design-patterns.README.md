# React Design Patterns V2 — pedagogical recompile

## Why V2 exists

The first integrated track validated the content model, but the real path UI exposed two pedagogical problems:

1. the path was too sparse: 21 large lessons appeared as only 3–5 nodes per section;
2. the track started immediately with `Composition over Prop Explosion` without first explaining what a design pattern is or how the learner should reason about patterns.

V2 changes **granularity and onboarding**, not the core architecture.

## V2 counts

- 7 sections
- 68 path nodes / lessons
- 94 questions
- 94 checks
- 84 original questions preserved unchanged, including their stable IDs
- 10 new foundation questions/checks
- no new source
- no schema change required

## New opening section

### Design Patterns Foundations

1. ¿Qué es un design pattern? — 2 reps
2. El problema viene antes que el patrón — 2 reps
3. Patterns ≠ reglas — 2 reps
4. Cómo pensar una decisión — 2 reps
5. Primer desafío de diseño — 2 reps

This establishes the track's mental model before introducing specific React patterns.

## Recompiled granularity

Every original conceptual lesson had 4 questions. V2 preserves those exact questions but recompiles each conceptual lesson into three shorter path nodes:

- node A: 2 related reps
- node B: 1 rep
- node C: 1 rep

That transforms the original 21 conceptual lessons into 63 short path nodes. Together with the 5 foundation nodes, the track has 68 nodes.

The learner therefore sees a denser progression while each visit remains short.

## Section density

- Design Patterns Foundations: 5 nodes
- Component API Design: 9 nodes
- State Ownership: 12 nodes
- Behavioral Architecture: 15 nodes
- Flexible Components: 9 nodes
- Async UI Patterns: 9 nodes
- Senior Design Decisions: 9 nodes

## Important preservation rule

All 84 V1 questions are preserved as exact JSON objects. Their IDs, slugs, wording, answerMd, source metadata and checks remain unchanged.

The only structural change to V1 material is which Lesson groups each question.

## Product insight

The track is no longer framed primarily as a catalog of patterns.

Its learning objective is:

> Aprendé a tomar mejores decisiones de diseño en React.

Patterns are the vocabulary and tools used to practice that skill.

The learner should repeatedly practice:

```text
Problem → Constraints → Options → Trade-offs → Decision
```

## Known UI limitation

The current `Lesson` schema has no title field, so the path can still display generic labels such as `Lección 1`.

V2 deliberately does **not** change the schema or UI. That should be evaluated as a separate product/UI change after validating the denser path.

A future improvement could add an optional lesson label/title so nodes can display names such as:

- ¿Qué es un pattern?
- Problem first
- Prop explosion
- Controlled vs uncontrolled
- Effect Events

Do not bundle that UI/schema change into the V2 content replacement unless explicitly approved.

## Integration intent

This file should replace the V1 React Design Patterns runtime content, not create a second track.

Codex should:

- preserve track ID `react-design-patterns`
- preserve all existing V1 question IDs
- add only the 10 new foundation IDs
- replace the V1 curriculum grouping with the V2 grouping
- keep `reps-manual`
- avoid storage/Supabase migrations
- validate existing progress remains valid because all V1 question IDs remain present
- update focused counts/tests from 6/21/84/84 to 7/68/94/94
