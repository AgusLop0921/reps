# ADR-0017: Multiple-choice checks are generated at build time

- **Status:** Accepted
- **Date:** 2026-08-25
- **Amends:** the "never invent content" rule (CLAUDE.md) and the "No AI calls" non-goal

## Context

The lesson runner needs a **check** to advance a card: a new card teaches (explanation and
examples up front) and the learner proves understanding by answering, and a review card is
a check without the teaching. That means multiple-choice questions.

The imported corpus has none. It is open Q&A (a question and a prose answer), with no MCQ
stems, options, or distractors, and no metadata from which they could be honestly derived.
"Never invent content" (CLAUDE.md) and "no hand-written questions" (non-goal) were written
for the *imported* corpus — answers must stay traceable to their source and must never be
filled in from our own knowledge. Checks are a different kind of artifact: they are not
someone else's content we are reproducing, they are exercises we build on top of it.

## Decision

Generate one multiple-choice check per path question **at build time** with the Anthropic
API (`claude-opus-4-8`), via `scripts/import/generate-checks.ts`, and commit the output as
data under `src/content/data/checks-<section>.json`.

- **Generated checks are ours.** Each check links to its question by `questionId` (ADR-0004)
  and carries **no `sourceId`** — it is not attributed to the source. It is **never** merged
  into `answerMd` or any imported field. Imported content and generated content stay in
  separate files and are never confused for one another.
- **BYOK at build time.** The script reads the maintainer's `ANTHROPIC_API_KEY` from the
  environment; the key is never written to disk, logged, or committed, and the app ships
  only the static generated JSON. This is distinct from ADR-0013's *runtime* BYOK, where a
  learner pastes their own key in the browser for the v2 interview simulation. Here there is
  no runtime AI call and no learner key — the app has no backend and makes no model
  requests (ADR-0003 survives intact).
- **Generation is defended, then reviewed.** The script writes a check, then critiques it in
  an independent second pass, and runs mechanical checks (length parity, near-duplicate
  detection, positive validation of learner-facing text, hard rejection of leaked control
  tokens). A human reads the output before the data file is committed.

## Alternatives considered

- **Hand-write the checks** — the non-goal that rejects hand-written *questions* applies;
  it also does not scale to the whole corpus.
- **Derive checks from the corpus mechanically** — impossible; there is no MCQ metadata to
  derive from, and inferring it is exactly the "fill it in from your own knowledge" the rule
  forbids.
- **Generate at runtime, BYOK like ADR-0013** — every learner would need an API key for the
  core path, which must work with no credential at all (ADR-0013 is explicit that the path
  stays usable without one). It would also add a runtime dependency, cost, and latency to
  the one thing that has to be dependable.

## Consequences

- **These checks were reviewed once and are not continuously validated.** There is no
  automated correctness gate: a check can carry a subtle error, an arguable distractor, or
  dated advice, and nothing at runtime will catch it. Treat them as curated-once generated
  content, not as authoritative truth. Fixes are ours to make.
- **Errors are our responsibility, not the source's.** The source's attribution on a card
  must never read as an endorsement of our checks.
- **Regeneration is non-deterministic** — re-running changes the output and discards the one
  human review. The committed files are the source of truth; regenerate deliberately, not
  casually, and re-review.
- **A build-time dependency on the Anthropic API and a maintainer key** now exists, but only
  for this occasional step. `pnpm content:import` (the lesson-path build) does not depend on
  it; check generation is separate.
- The generator and the generated data are committed separately (ADR-0009): the script is
  code, the JSON is generated content.
