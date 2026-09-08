# Agent Handoff

Operational context for the next coding agent. This is not canonical architecture; code,
tests, ADRs, and canonical documentation take precedence.

## Current branch

`feat/microsoft-source-adapter`

## Goal

Normalize the approved Microsoft Generative AI for Beginners Spanish lesson documents from
an immutable upstream revision without publishing them as Reps runtime content.

## Current status

The ingestion-focused feature is implemented and committed. PR #31 is open.

## Latest implementation commit

`ca23bbb787c2fbf97be428178a82e31ba33b9494`

## Important decisions

- ADR-0024 defines the source-agnostic `NormalizedDocument` boundary.
- Document ids hash `sourceId:path`; the source revision identifies the content snapshot.
- The pinned revision is `645f932514e9f22f688c8feb3e49a7a7f2eb6f1b`.
- Approved inputs are Spanish lesson READMEs 01–21 only.
- Lesson 00, English originals, other translations, code, notebooks, images, presentations,
  and repository documentation are excluded.
- Normalized artifacts live under `scripts/import/generated/` and are not loaded at runtime.
- No LLM generation or runtime curriculum publication is part of this feature.

## Changes completed

- Validated `NormalizedDocument` and normalized snapshot schemas.
- Microsoft-specific allowlist, deterministic adapter, pinned URLs, and provenance.
- Exact revision and upstream lesson-tree verification.
- Fixture-based adapter and snapshot-contract tests.
- Reproducible 21-document Spanish snapshot.
- ADR, architecture, source documentation, commands, and roadmap updates.

## Verification

- TypeScript passed.
- ESLint passed.
- 120/120 tests passed.
- Production build passed (with the pre-existing large-chunk warning).
- `git diff --check` passed.
- Upstream sanity check passed for all 21 approved documents.
- Two successive generations produced SHA-256
  `00cf44cdee9322ccc3b48ce6a6ea5e56ca590b84c3480a6f5d714da98861fafe`.
- `pnpm verify` itself could not start because pnpm attempted a network-dependent install;
  its underlying local typecheck, lint, and test commands passed.

## Known limitations

- The snapshot is an ingestion artifact only; no Microsoft questions, checks, lessons, or
  curriculum are published.
- Pinned Spanish lessons 16 and 17 omit H1 headings. Their leading banner alt text is kept as
  the title. Lesson 17's upstream banner repeats the lesson 16 title; the adapter preserves
  that source defect rather than silently correcting imported material.
- The GitHub verification requests are unauthenticated and therefore subject to public API
  rate limits.
- The predecessor handoff's uncommitted SHA-only edit remains isolated in the named local Git
  stash `preexisting handoff SHA edit before Microsoft adapter`; it is not part of PR #31.

## Next recommended task

Review the normalized source snapshot and design the grounded, evidence-preserving
transformation into candidate Reps learning material. Do not publish generated material or
replace the editorial seed without the review and validation boundary required by ADR-0023.
