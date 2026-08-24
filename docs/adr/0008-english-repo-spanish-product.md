# ADR-0008: English repository, Spanish product

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The maintainer works in Spanish, but the code, the ecosystem and the intended audience
for the repository are English-speaking. Meanwhile the imported content is Spanish and
the app's users are Spanish speakers.

Mixed-language repositories degrade in a predictable way: identifiers end up half
translated (`getPreguntas`, `sesionBuilder`), and a coding agent picks whichever
language the surrounding file happens to use.

Spanish also costs roughly 15–30% more tokens than English for equivalent text, which
matters marginally for files an agent reads on every session.

## Decision

- Repository in English: code, identifiers, comments, docs, ADRs, commit messages, PR
  descriptions, test names.
- Product in Spanish: every user-facing string, collected in `src/ui/copy.ts`.
- Imported content stays in its original language and is never translated.

## Alternatives considered

- **Everything in Spanish** — inconsistent with the code itself and with the ecosystem;
  makes the repository harder to share.
- **Everything in English, UI included** — the content is Spanish, so the interface
  would be speaking a different language than the questions it displays.
- **No policy** — the mixed-language drift described above. This is the default outcome
  and the reason this ADR exists.

## Consequences

There is one boundary to police: `src/ui/copy.ts`. Anything Spanish outside that file
is a bug, and anything English inside it is a bug. Reviews check this.

Domain vocabulary is English (`question`, `deck`, `session`, `box`) even though the
product speaks Spanish, which means a small mental translation when discussing features
in Spanish. Accepted as the cost of a single consistent codebase.

If the app is ever localized, `copy.ts` is the seam an i18n library would plug into —
but i18n remains a non-goal for v1.
