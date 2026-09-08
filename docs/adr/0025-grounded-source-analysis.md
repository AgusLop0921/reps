# ADR-0025: Ground source analysis in exact normalized-document evidence

- **Status:** Accepted
- **Date:** 2026-09-08
- **Amends:** ADR-0023, ADR-0024

## Context

ADR-0023 named source analysis as a pipeline stage and ADR-0024 defined its normalized input,
but neither specified the semantic output or the boundary between an analysis provider and
canonical Reps data. The first implementation analyzes the pinned Microsoft Spanish lesson
snapshot with Anthropic. The contract must remain usable with OpenAI, a local model, or a
future deterministic analyzer, and unsupported generated claims must never pass silently.

## Decision

We introduced a provider-neutral `SourceAnalysis` contract. It records analyzed source
snapshots and documents, concept candidates, conservative typed relationships, and derived
document coverage. Concepts contain a name, summary, optional difficulty hint, optional
source-supported examples or distinctions, and exact evidence references. An evidence
reference names a normalized document, optionally names an exact Markdown heading, and
contains a contiguous excerpt copied exactly from that document.

Provider execution metadata is not part of the semantic contract. A generated artifact is an
envelope containing `analysis: SourceAnalysis` and separate `run` metadata with provider,
exact model id, prompt version, and analyzer version. Provider-specific intermediate schemas
also remain outside the canonical contract.

Analysis runs in two passes: extraction for each document followed by consolidation across
validated extractions. Every extraction is schema-validated and its excerpts and headings
are resolved against the normalized document before consolidation. Final output is validated
again against the complete normalized snapshot. Invalid or unsupported output fails the run;
it is never repaired, omitted, or published partially.

Concept identity is explicitly lexical and versioned. We normalize the concept name by
decomposing Unicode, removing diacritics, lowercasing, trimming, and replacing non-ASCII
alphanumeric runs with hyphens. The id is the first 12 hexadecimal characters of
`SHA-256("concept:v1:" + normalizedName)`. A rename intentionally changes identity. Duplicate
normalized names and hash collisions fail loudly. A later ADR may evolve identity if
multi-source analysis demonstrates semantic collisions; this implementation does not infer
semantic identity.

The first provider calls the Anthropic Messages API at build/import time using the exact
model id `claude-opus-4-8` and JSON-schema structured output. It is isolated under
`scripts/import/` and receives a maintainer-provided key from the environment. No provider
code is imported by browser or runtime code. Fixture analyzers use the identical validation
and finalization path in tests.

Successful Microsoft artifacts are revision-scoped below
`scripts/import/generated/analysis/microsoft-generative-ai-for-beginners/<revision>/`.
Transient per-document extractions are not committed. The final JSON and deterministic review
report are generated only after all hard validation succeeds; nothing in this location is
loaded as a published curriculum.

## Alternatives considered

- **Put Anthropic fields on `SourceAnalysis`** — makes provider choice a domain requirement
  and invalidates otherwise equivalent analysis from another implementation.
- **Use model-assigned concept ids** — makes reruns unstable and permits accidental identity
  duplication.
- **Fuzzy evidence matching or dropping invalid claims** — conceals unsupported output and
  weakens the review boundary.
- **One whole-corpus model request** — makes failures harder to locate and grounding harder to
  validate before consolidation.
- **Commit every per-document response** — creates review noise without improving the
  canonical result or reproducibility contract.

## Consequences

Source analysis is deterministic after provider output: concept ids, ordering, coverage, and
reports do not depend on response ordering or wall-clock time. Model inference itself may
vary, so generated artifacts remain review inputs rather than published learning content.
Exact evidence detects fabrication and upstream drift, but cannot establish pedagogical
quality or that the model found every important concept. Curriculum generation, lesson
writing, exercises, review workflow, and publication remain later stages.
