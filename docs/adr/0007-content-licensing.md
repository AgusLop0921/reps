# ADR-0007: Content licensing and attribution

- **Status:** Accepted — amended by ADR-0015
- **Date:** 2026-08-24

## Context

This app is built on content written by other people. The first source is MIT licensed,
which permits use but requires preserving the copyright notice. Future sources may carry
different licenses — several popular collections use Creative Commons with
non-commercial clauses.

Beyond the legal side there is a matter of respect: the content is 90% of the value here.

## Decision

- No source is added without verifying its license first.
- Each license text is stored in `licenses/<source-id>.txt`.
- Every question carries `sourceId`; the UI shows attribution on the card itself and
  links to the original repository.
- A `/fuentes` page lists authors, licenses and links.
- Imported answers are never edited. Errors are reported upstream.

## Alternatives considered

- **Attribution in the footer only** — meets the legal minimum and hides the authors.
- **Rewriting answers with AI to sidestep licensing** — degrades good content, breaks
  traceability, and is ethically worse than citing properly.

## Consequences

The UI must reserve space for attribution on every card. Adding a source includes a
manual verification step that cannot be automated.

If a source's license is incompatible with our use, we do not import it — we link to it.
