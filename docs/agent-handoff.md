# Agent Handoff

Operational context for the next coding agent. This is not canonical architecture; code,
tests, ADRs, and canonical documentation take precedence.

## Current branch

`feat/grounded-source-analysis`

## Goal

Analyze validated normalized source documents into provider-neutral concepts, conservative
relationships, exact evidence, and coverage without generating or publishing curriculum.

## Current status

The grounded source-analysis feature is implemented and committed. PR #32 is open. A live
Microsoft analysis was not run because `ANTHROPIC_API_KEY` is unavailable; no analysis
artifact was invented.

## Latest implementation commit

`12db12f93a4b68fd49e5a32d08b9fcdc656a6ff3`

## Important decisions

- ADR-0025 defines grounded source analysis as a separate, non-runtime pipeline stage.
- Canonical `SourceAnalysis` is provider-neutral. Provider, exact model id, prompt version,
  and analyzer version live in separate artifact run metadata.
- Evidence is an exact normalized-document excerpt plus an optional exact Markdown heading.
  Invalid evidence fails both extraction and final validation; consolidation cannot introduce
  evidence that did not pass extraction validation.
- Concept ids are the first 12 hexadecimal characters of
  `SHA-256("concept:v1:" + normalizedName)`. Renames change identity; duplicate normalized
  names and hash collisions fail loudly.
- The initial provider is direct Anthropic Messages API HTTP with exact model id
  `claude-opus-4-8`; there is no new dependency and nothing enters the browser bundle.
- Microsoft output is revision-scoped below `scripts/import/generated/analysis/` and is not
  loaded by runtime content code.

## Changes completed

- Provider-neutral Zod contracts for semantic analysis and separate run metadata.
- Per-document extraction, hard evidence validation, consolidation evidence containment, and
  deterministic finalization.
- Stable concept ids, sorting, relationship resolution, and coverage derived from evidence.
- Build-time Anthropic analyzer and `pnpm content:analyze:microsoft` command.
- Deterministic JSON and Markdown report output paths, written only after validation.
- Fixture-provider tests that exercise the production path, provider-boundary tests, and the
  real normalized Microsoft snapshot contract test.
- ADR, architecture, source documentation, command, and roadmap updates.

## Verification

- TypeScript passed through the installed local binary.
- ESLint passed through the installed local binary.
- 131/131 tests passed without external model access.
- Production build passed with the pre-existing large-chunk warning.
- `git diff --check` and staged diff checks passed.
- The no-credential command path exited non-zero before writing an artifact.
- `pnpm verify` itself could not start because pnpm attempted to replace the modules directory
  and aborted without a TTY; its underlying local typecheck, lint, and test commands passed.

## Known limitations

- No live provider output has been assessed for concept quality, granularity, completeness,
  token limits, or operating cost.
- Deterministic finalization does not make model inference deterministic; generated analysis
  remains a review artifact.
- Concept identity is intentionally lexical. A rename changes identity, and future
  multi-source semantic collisions may require a new versioned strategy.
- Exact evidence validates support and catches source drift, but it cannot prove pedagogical
  quality or completeness.
- No Microsoft questions, checks, lessons, curriculum, or runtime content are generated.
- The predecessor handoff's SHA-only edit remains isolated in the named local Git stash
  `preexisting handoff SHA edit before Microsoft adapter`; it remains untouched.

## Next recommended task

Run `pnpm content:analyze:microsoft` with an approved maintainer credential, review the
generated concept/evidence report, and fix any prompt or validation defects as analysis work.
After a reviewed analysis is accepted, begin a separate curriculum-candidate stage. Do not
publish analysis directly or modify the editorial seed as part of that stage.
