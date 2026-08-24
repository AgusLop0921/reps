# ADR-0006: Spaced repetition with a 5-box Leitner system

- **Status:** Accepted — amended by ADR-0012
- **Date:** 2026-08-24

## Context

The point of the product is improving day by day, not completing a quiz. That requires
failed questions to come back soon and known questions to space out.

## Decision

A 5-box Leitner system with fixed intervals: 1, 3, 7, 14 and 30 days. Grading is
self-assessed from 1 to 4 (wrong / needed help / good / perfect). A 1 or 2 sends the
question back to box 1; a 3 promotes it one box; a 4 promotes it and applies the next
box's interval.

The whole algorithm lives in `src/core/scheduler.ts` as pure functions that take the
current time as a parameter.

## Alternatives considered

- **SM-2 / FSRS** — more accurate, considerably more complex to implement and explain,
  and their advantage shows up with thousands of cards and years of history. Overkill
  for this.
- **No spaced repetition, random order** — does not serve the product's purpose.

## Consequences

The algorithm fits in fifty lines and can be tested exhaustively. Fixed intervals are
less adaptive than SM-2: someone who already knows the material will over-review early on.

Self-grading depends on the user's honesty. That is deliberate: the exercise is
answering out loud as in an interview, which cannot be graded automatically without AI
(see roadmap v2).

Migrating to FSRS later needs a new ADR and a progress migration, but the `Progress`
schema already stores the full grade history to make that possible.
