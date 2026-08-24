# ADR-0011: A linear lesson path as the primary structure

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The imported corpus is a flat list of independent questions, contributed by a community
and ordered by whoever merged them. That is fine for a reference site with a search box,
and useless as something to open every day: there is no sense of position, no "what now",
no way to tell progress from browsing.

We considered a feed — infinite, algorithmically ordered. It was rejected: it reproduces
the exact mechanic the product exists to replace, and an experience with no end cannot
give a feeling of completion.

## Decision

Content is organized as an ordered path of **lessons**. A lesson is a small group of
questions (about five). Lessons are grouped into **sections** matching the source levels
(basic, intermediate, advanced, expert).

Progression rules:

- Finishing a lesson unlocks the next one in its section.
- The first lesson of every section is always unlocked, so an experienced user can enter
  at Advanced without grinding through Basic.
- Order is enforced within a section, not across sections.

The curriculum is generated during import by chunking each section's questions in
upstream order. Curation overrides live in `src/content/order.ts`, applied on top of the
generated order, so the sequence can be hand-tuned without touching adapters or
re-parsing.

## Alternatives considered

- **A feed** — see above. The thing we are replacing.
- **Free browsing with search** — already exists upstream (reactjs.wiki); adds nothing.
- **Grouping lessons by topic rather than by position** — better pedagogically, but the
  corpus has no topic metadata. Inferring it would mean generating content-derived data we
  cannot verify. The override file leaves the door open for doing it by hand later.
- **Hard-locking every section behind the previous one** — punishes the experienced user,
  who is the most likely early adopter.

## Consequences

Lesson boundaries are arbitrary at first: five consecutive community-contributed
questions are not a designed lesson, and some will group awkwardly. Accepted for v1, with
`order.ts` as the escape hatch.

Chunking is positional, so inserting a question upstream shifts lesson membership for
everything after it. Question ids stay stable (ADR-0004), so per-question progress
survives; lesson composition does not. Lesson progress therefore stores which questions
were answered, not just which lesson was completed.

Sections inherit the source's level labels, which are conceptual difficulty, not
seniority. They are not a claim about who the material is for.
