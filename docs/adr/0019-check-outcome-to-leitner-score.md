# ADR-0019: A check outcome maps to a Leitner score of 1 or 3

- **Status:** Accepted
- **Date:** 2026-08-26
- **Amends:** ADR-0006
- **Relates to:** ADR-0012, ADR-0017

## Context

ADR-0006 grades questions on a 1–4 scale (`wrong / needed help / good / perfect`) by
**self-assessment** — the model for the v2 "answer out loud" interview mode. v1 has no
self-grading. Its grading signal is the generated multiple-choice check (ADR-0017), which
is **binary**: right or wrong. The scheduler (`core/scheduler.ts`) still takes a `Score` of
1–4, so we need a mapping.

One fact about the teaching card (ADR-0010) constrains it: the explanation sits directly
above the check, on new *and* review cards alike. A correct answer therefore confirms
comprehension of material that is currently visible — it is never unaided recall. Any
mapping that reads a correct check as "knew it cold" would be lying to the scheduler.

## Decision

| Check outcome | Score |
|---|---|
| Wrong | **1** |
| Right | **3** |

Effect on scheduling (`nextBox` / `intervalFor`):

- **Wrong → 1** resets the card to box 1 (due in 1 day). `1` rather than `2` even though
  the two schedule identically: the answer was on screen and still missed, so "wrong" is
  the truthful history label, which is what a future FSRS migration would read.
- **Right → 3** promotes the card one box on the normal interval. Deliberately **not `4`**:
  `4` promotes *and* skips to the next box's interval ("perfect, no hesitation"), a claim
  the format cannot support when the answer is two lines above the check.

The 1–4 self-grading scale is **retained unchanged** for the v2 interview mode; this ADR
only fixes how v1's binary check feeds the same scheduler.

## Alternatives considered

- **Right → 4** — over-spaces a card after a single answer-visible correct. Too optimistic
  for this format.
- **New-correct → 3, review-correct → 4** — reward recall-after-a-delay. But review cards
  also show the explanation above the check, so review-correct is not unaided recall
  either; the extra signal does not exist unless we hide the explanation on review cards,
  which would be its own ADR.
- **Wrong → 2** — same schedule as `1`, less truthful history.

## Consequences

- **The honest cost of a flat 3: the due pool fills faster than it drains.** A card climbs
  one box per correct answer, so reaching box 5 takes **four correct answers**
  (box 1→2→3→4→5), and since a card only promotes when it is due, at least **~25 days**
  (3 + 7 + 14) must pass before it can enter box 5. Every new card answered correctly
  re-enters the due pool in 3 days, then 7, then 14 — so across 136 questions, new due
  cards accumulate faster than the **3 review slots per lesson** (ADR-0012) can clear them,
  most visibly early on.
- This degrades **gracefully**, not painfully: ADR-0012 already **drops** review overflow
  rather than queueing it, so the user always sees the three most-due cards and never a
  growing, guilt-inducing backlog (ADR-0010, ADR-0018). What suffers is coverage of the
  long tail, not the experience. Recognise this pattern when it appears; the levers, each
  its own ADR, are more review slots or a less conservative mapping.
- **No-check cards:** a question with no generated check has no grading signal. It counts
  toward lesson completion but creates no `Progress` and never enters review. Rare in the
  current path (the one excluded chapter, ADR-0011).
