# ADR-0023: Source-driven multi-track content architecture

- **Status:** Accepted
- **Date:** 2026-09-08
- **Amends:** ADR-0004, ADR-0005, ADR-0007, ADR-0008, ADR-0011, ADR-0017, ADR-0020

## Context

Reps began with one React curriculum imported from midudev. The runtime therefore loaded one
global `Curriculum`, and local and remote progress were keyed only by question or lesson id.
We now need an AI Engineering learning path and expect future paths to draw from several kinds
of source. We must add that seam without replacing the stable lesson, section, scheduler, or
adapter abstractions.

A source is not a learning track. A source records where knowledge came from; a track is the
ordered learning experience Reps presents. One track may use several sources, and the same
source may contribute to several tracks.

## Decision

We introduced `Track` above the existing `Curriculum`, with canonical display metadata for a
generic selector. `Section` remains the module-equivalent, and a lesson remains an ordered
group of questions. The existing `Question` teaching content and optional `Check` remain the
exercise model. We did not add parallel module or exercise entities.

Sources are validated domain data with a generic type, author, URL, license, and attribution.
A track holds one or more `SourceReference` values. References require only `sourceId` today
and can later add a source URL, path, or revision without changing Source identity or teaching
components. Question-level `sourceId` plus the upstream slug remains the current fine-grained
provenance contract.

The runtime loads a validated content catalog containing sources, tracks, questions, and
checks. Catalog validation rejects duplicate identities and unresolved source, question,
lesson, or check references before the UI renders. The React generated files and all their
existing identifiers remain unchanged; the loader wraps their curriculum as the `react`
track.

AI Engineering initially contains one intentionally small editorial lesson. It is attributed
to the `reps-manual` source, not to Microsoft. The Microsoft Generative AI for Beginners
repository is registered and associated with the track, but no repository content is fetched,
copied, or represented as the source of the editorial seed.

Progress is explicitly scoped by `trackId`. IndexedDB uses compound keys
`[trackId+questionId]` and `[trackId+lessonId]`; Supabase uses equivalent three-column keys
including `user_id`. The browser migration copies every pre-track row to `trackId = react`
without changing its question or lesson id, box, due date, history, completion, or timestamps.
Export version 3 carries track ids; versions 1 and 2 still import and are assigned to React.

## Future ingestion boundary

Future source ingestion will live outside runtime content consumption and will produce the
same canonical Reps catalog. Its stages are:

1. Register a source and pass an explicit source-policy and licensing check.
2. Fetch approved source material.
3. Normalize it into documents with source references and metadata.
4. Analyze concepts, prerequisites, difficulty, relationships, and examples.
5. Generate a candidate track, sections, and lesson ordering.
6. Generate grounded lesson material with evidence references.
7. Generate exercises separately from source-authored material.
8. Validate grounding, answer support, duplicates, difficulty, attribution, and schema.
9. Review the candidate and publish an immutable/versioned content artifact.

Source documents, never an AI generator, remain the source of truth. Generated content does
not become production content automatically. A future lifecycle may use `draft`, `reviewed`,
and `published` states, but those states and a CMS are outside this decision.

Public availability is not permission to ingest or republish. Every source, including a
user-provided repository, course, document, or URL, must pass policy and license review before
fetching or generation. We record metadata; we do not perform automated legal interpretation.

## Alternatives considered

- **One curriculum per source** — conflates provenance with the product path and prevents a
  track from combining sources.
- **Parallel Module and Exercise models** — duplicate Section, Question, and Check without
  adding capability needed today.
- **Rely on source-derived content ids for isolation** — works accidentally until one source
  contributes the same question to two tracks, then shares review progress incorrectly.
- **Add generic ingestion or an LLM abstraction now** — adds speculative infrastructure with
  no current runtime need.

## Consequences

The app has an explicit track-selection home and all lesson/review state is selected within a
track. Existing React users keep their complete local and synchronized state after migration.
Deployments using Supabase must apply migration `0002_track_progress.sql` before deploying the
new frontend, because new upserts use track-qualified conflict keys.

The AI Engineering seed proves the runtime path but is not a substantive curriculum. Microsoft
content still requires a dedicated, licensed adapter/import and review before it can replace
the editorial seed.
