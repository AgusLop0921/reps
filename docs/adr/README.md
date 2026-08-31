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
| [0003](0003-vite-react-no-backend.md) | Vite + React + TS, no backend | Partially superseded by 0010, 0020 |
| [0004](0004-content-via-adapters.md) | Third-party content via adapters and a normalized schema | Accepted |
| [0005](0005-indexeddb-persistence.md) | Local persistence in IndexedDB with Dexie | Amended by 0020 |
| [0006](0006-leitner-spaced-repetition.md) | Spaced repetition with a 5-box Leitner system | Amended by 0012, 0019 |
| [0007](0007-content-licensing.md) | Content licensing and attribution | Amended by 0015 |
| [0008](0008-english-repo-spanish-product.md) | English repository, Spanish product | Amended by 0016 |
| [0009](0009-git-workflow.md) | Branch, commit and PR workflow | Accepted |
| [0010](0010-mobile-first-scroll-replacement.md) | Mobile-first, positioned against aimless scrolling | Amended by 0018, 0022 |
| [0011](0011-linear-lesson-path.md) | A linear lesson path as the primary structure | Partially superseded by 0014 |
| [0012](0012-review-inside-lessons.md) | Review cards inside lessons | Accepted |
| [0013](0013-interview-simulation-byok.md) | Interview simulation with the user's own API key | Accepted (v2) |
| [0014](0014-sections-are-not-levels.md) | Sections are structural, not difficulty levels | Accepted |
| [0015](0015-strip-transport-artifacts.md) | Strip transport artifacts, not content | Accepted |
| [0016](0016-lesson-titles-composed-in-ui.md) | Lesson titles are composed in the UI | Accepted |
| [0017](0017-generated-checks-build-time.md) | Multiple-choice checks are generated at build time | Accepted |
| [0018](0018-long-sessions-from-content-pull.md) | Long sessions are welcome when they come from content pull | Amended by 0021 |
| [0019](0019-check-outcome-to-leitner-score.md) | A check outcome maps to a Leitner score of 1 or 3 | Accepted |
| [0020](0020-cross-device-sync-supabase.md) | Cross-device progress sync with Supabase, local-first | Amended by 0021 |
| [0021](0021-first-run-account-choice.md) | A one-time first-run account choice | Amended by 0022 |
| [0022](0022-open-to-the-home-not-the-lesson.md) | Open to the home, not straight into a lesson | Accepted |
