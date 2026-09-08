# ADR-0024: Normalize approved source documents before curriculum generation

- **Status:** Accepted
- **Date:** 2026-09-08
- **Amends:** ADR-0004, ADR-0023

## Context

ADR-0004 assumed that a source adapter could directly convert one upstream document into
canonical `Question[]`. The Microsoft Generative AI for Beginners source is a course made of
many lesson documents. ADR-0023 introduced a staged ingestion boundary, but did not define
the artifact passed from source ingestion to later analysis and curriculum generation.

That boundary must preserve source material and provenance without encoding GitHub concepts
in the document model or making unreviewed content available to the runtime.

## Decision

We introduced `NormalizedDocument` as the smallest intermediate contract needed by later
pipeline stages. It contains a stable id, title, Markdown content, a generic source reference,
and optional order and language metadata. Repository path, immutable revision, and source URL
live in `SourceReference`; the document contract has no repository-specific fields.

Document ids are the first 12 hexadecimal characters of SHA-256 over `sourceId:path`. They
remain stable when a source file changes, while `sourceRevision` identifies the exact content
snapshot. Normalized snapshot files contain no generation timestamp, so identical upstream
input produces byte-identical output.

The Microsoft adapter pins an exact commit and uses an explicit allowlist of Spanish lesson
READMEs. It verifies that the commit exists and that every numbered Spanish lesson in that
snapshot is either approved or deliberately excluded. For this source, lesson 00 (course
setup), English originals, other translations, code, notebooks, images, presentations, and
repository documentation are not approved inputs.

Titles come from each lesson's leading level-one heading. Pinned Spanish lessons 16 and 17
omit that heading, so their existing leading banner alt text is the only accepted fallback;
the adapter does not derive, correct, or translate a replacement title.

Normalized artifacts are written below `scripts/import/generated/`. Nothing under that path
is imported by `src/content/load.ts`; normalization is not publication. Turning these
documents into questions, checks, sections, lessons, or a track remains a separate grounded
and reviewed process.

## Alternatives considered

- **Extend `Question` with document fields** — conflates source preservation with published
  learning material and makes unreviewed inputs look production-ready.
- **Put GitHub owner, repository, and commit fields on `NormalizedDocument`** — prevents the
  boundary from serving approved non-GitHub sources later.
- **Hash content into the document id** — invalidates identity on every upstream correction;
  revision already identifies the snapshot.
- **Write normalized files under `src/content/data/`** — risks accidental runtime publication.

## Consequences

Multi-document sources may normalize before they generate canonical questions. Existing
direct-to-question adapters remain valid; no speculative generic fetch framework is added.
The intermediate artifact is intentionally not usable by the runtime, and a later task must
define grounded analysis, review, and publication before Microsoft content enters a track.
