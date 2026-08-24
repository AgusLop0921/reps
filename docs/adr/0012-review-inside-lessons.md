# ADR-0012: Review cards inside lessons

- **Status:** Accepted
- **Date:** 2026-08-24
- **Amends:** ADR-0006

## Context

ADR-0006 made spaced repetition the organizing principle: the app would build a daily
deck of due cards. ADR-0011 replaced that with a lesson path, which raises the obvious
question of what happens to review — a course that only ever moves forward teaches you
things you forget three weeks later.

There is a tension. A due-card deck is optimal for retention and terrible as a daily
destination: some days it is empty, some days it is ninety cards, and neither gives a
sense of progress.

## Decision

Spaced repetition stays, subordinated to the path. Every lesson opens with up to three
due cards from earlier lessons, then continues with its own new questions.

- Only answered cards move between boxes. Skipping or exiting a lesson changes nothing.
- Overflow is dropped, not deferred into a backlog: if fourteen cards are due, the lesson
  shows three and the rest wait. The user is never shown a debt counter.
- A user who finishes the path still gets review-only lessons, which is the point where
  ADR-0006's scheduler becomes the whole experience again.

`scheduler.ts` keeps the Leitner logic unchanged; only deck construction moves to
`curriculum.ts`.

## Alternatives considered

- **Pure spaced repetition** (the original ADR-0006) — better retention, no sense of
  progression, and empty days.
- **No review at all** — simplest, and it makes the product a content reader.
- **A separate "review" screen next to the path** — a second destination the user has to
  choose to visit, which in practice means never. Folding review into the lesson makes it
  free.

## Consequences

Retention is worse than an optimal scheduler would give: capping at three per lesson
means overdue cards can stay overdue for a long time if the user does one lesson a day.
That is the deliberate trade for a predictable, finite daily session.

Because overflow is dropped rather than queued, `dueAt` in the past is normal and carries
no urgency. Nothing in the UI should surface "cards overdue" as a number — it recreates
the debt anxiety this product is supposed to be free of.
