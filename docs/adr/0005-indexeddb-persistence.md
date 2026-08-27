# ADR-0005: Local persistence in IndexedDB with Dexie

- **Status:** Accepted — amended by ADR-0020
- **Date:** 2026-08-24

## Context

We need to store per-question progress (current box, next due date, grade history) for
hundreds of questions, and query "due before now" at the start of every session.

## Decision

IndexedDB through Dexie, with all access encapsulated in `src/storage/`. Data read back
is validated with Zod before entering the domain.

## Alternatives considered

- **localStorage** — synchronous, low size limit, and forces serializing all progress
  on every write. It would work today and hurt in six months.
- **Raw IndexedDB** — awkward API with no benefit over Dexie at this scale.

## Consequences

One more dependency, in exchange for real indexes (querying by `dueAt`) and no
migration later.

Data is per-browser: clearing site data clears progress. Mitigation is JSON
export/import, in scope for v1.

Everything goes through `src/storage/`. No component touches Dexie directly, so
replacing the persistence engine stays a single-module change.
