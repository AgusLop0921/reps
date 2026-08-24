# Architecture Decision Records

An ADR documents **one** decision: what was decided, in what context, and what it costs.
It is not system documentation — it is the record of why the system is the way it is.

## When to write one

- Choosing or rejecting a library, framework or service.
- Changing the data model or a contract between layers.
- Adding a content source.
- Changing the review or scoring algorithm.
- Anything you will look at in six months and ask "why did we do this?".

No ADR needed for: variable naming, the internals of a component, refactors that do not
change contracts.

## How

1. Copy `0000-template.md` to `NNNN-kebab-case-title.md` (next number).
2. Write in past tense, first person plural ("we decided").
3. An accepted ADR is never edited. If the decision changes, write a new one that
   supersedes it and mark the old one `Superseded by ADR-NNNN`.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-decisions-with-adrs.md) | Record decisions with ADRs | Accepted |
| [0002](0002-standalone-project.md) | Standalone project, not a section of an existing site | Accepted |
| [0003](0003-vite-react-no-backend.md) | Vite + React + TS, no backend | Partially superseded by 0010 |
| [0004](0004-content-via-adapters.md) | Third-party content via adapters and a normalized schema | Accepted |
| [0005](0005-indexeddb-persistence.md) | Local persistence in IndexedDB with Dexie | Accepted |
| [0006](0006-leitner-spaced-repetition.md) | Spaced repetition with a 5-box Leitner system | Amended by 0012 |
| [0007](0007-content-licensing.md) | Content licensing and attribution | Accepted |
| [0008](0008-english-repo-spanish-product.md) | English repository, Spanish product | Accepted |
| [0009](0009-git-workflow.md) | Branch, commit and PR workflow | Accepted |
| [0010](0010-mobile-first-scroll-replacement.md) | Mobile-first, positioned against aimless scrolling | Accepted |
| [0011](0011-linear-lesson-path.md) | A linear lesson path as the primary structure | Accepted |
| [0012](0012-review-inside-lessons.md) | Review cards inside lessons | Accepted |
| [0013](0013-interview-simulation-byok.md) | Interview simulation with the user's own API key | Accepted (v2) |
