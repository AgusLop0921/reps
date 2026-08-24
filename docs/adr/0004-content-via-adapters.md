# ADR-0004: Third-party content via adapters and a normalized schema

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The content is not ours: it comes from open source repositories. The first source is
midudev/preguntas-entrevista-react, a ~5,000 line README where questions are headings.
We plan to add JavaScript and TypeScript sources, which are structured differently —
some already ship as multiple choice with explanations.

Sources get updated: content must be regenerable without losing user progress.

## Decision

One module per source under `scripts/import/sources/`, each exporting
`parse(markdown): Question[]`. Output is validated with Zod against a single schema and
written to `src/content/data/`. Each question `id` is a stable hash of
`sourceId + slug`, never a positional index.

## Alternatives considered

- **One script with per-source branching** — unmaintainable by the third format.
- **Copying content into the repo and editing it by hand** — impossible to update and
  questionable under the source licenses.
- **Parsing at runtime from GitHub** — depends on the network, on rate limits, and on
  upstream not changing format while someone is mid-session.

## Consequences

Adding a source is one file plus one test, touching nothing else. The schema has to be
general enough for different formats: hence `format: 'open' | 'mcq'` rather than
assuming open questions.

Stable ids mean that if upstream renames a question, progress for it is orphaned. That
is acceptable, and better than positional ids, which would corrupt on every insertion.

Adapters must fail loudly: zero questions parsed, or an empty answer, fails the import.
Missing content is never filled in.
