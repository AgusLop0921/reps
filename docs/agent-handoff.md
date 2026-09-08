# Agent Handoff

Operational context for the next coding agent. This is not canonical architecture; code,
tests, ADRs, and canonical documentation take precedence.

## Current branch

`feat/grounded-source-analysis`

## Goal

Analyze validated normalized source documents into provider-neutral concepts, conservative
relationships, exact evidence, and coverage without generating or publishing curriculum.

## Current status

The grounded source-analysis feature is implemented and committed. PR #32 is open. Live runs
were attempted with `ANTHROPIC_API_KEY`, but no complete artifact exists: strict validation
exposed two provider-prompt defects, a later run hit a transient network failure, and the final
retry is blocked because the Anthropic account has insufficient API credit.

## Latest implementation commit

`785049e0f876436510dfc9a0f44367670f46cf53`

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
  `claude-opus-4-8`; the current prompt version is `grounded-source-analysis-v3`. There is no
  new dependency and nothing enters the browser bundle.
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
- Live-run fixes: prompt instructions now require literal raw-Markdown excerpts, prefer
  plain-text excerpts with a valid/invalid link example, and define `heading` as title text
  without Markdown markers. The provider retries transient network-level fetch failures.

## Verification

- TypeScript passed through the installed local binary.
- ESLint passed through the installed local binary.
- 132/132 tests passed without external model access.
- Production build passed with the pre-existing large-chunk warning.
- `git diff --check` and staged diff checks passed.
- Live validation correctly rejected rendered Markdown-link evidence and raw heading-marker
  evidence before writing an artifact. A subsequent network failure revealed and motivated
  the bounded network retry.
- The latest live attempt stopped before analysis because Anthropic returned HTTP 400 stating
  that the account credit balance is too low. No generated artifact exists.
- `pnpm verify` itself could not start because pnpm attempted to replace the modules directory
  and aborted without a TTY; its underlying local typecheck, lint, and test commands passed.

## Known limitations

- No complete live provider output has been assessed for concept quality, granularity,
  completeness, token limits, or operating cost. Anthropic billing credit is required before
  Stage 4 can be classified as ready or not ready for Stage 5.
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

Add credit to the Anthropic account, then run `pnpm content:analyze:microsoft` with the
configured key. Review the generated concept/evidence report before deciding Stage 4 readiness.
After a reviewed analysis is accepted, begin a separate curriculum-candidate stage. Do not
publish analysis directly or modify the editorial seed as part of that stage.
