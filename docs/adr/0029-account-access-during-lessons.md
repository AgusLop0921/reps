# ADR-0029: Keep account access available during lessons

- **Status:** Accepted
- **Date:** 2026-09-09
- **Amends:** ADR-0027

## Context

ADR-0027 kept Cuenta out of lessons to avoid interrupting practice. In use, that made account
and sync unavailable precisely while someone was actively using the product. The lesson shell
also used a narrower maximum width than every other top-level application screen.

## Decision

We decided to use the shared application width for every top-level app screen, including the
lesson runner. When optional sync is configured, its lesson header now includes the same quiet
Cuenta control used by the track selector and path.

The control shows the signed-in provider photo when available, otherwise deterministic initials
derived from the provider display name or email. Provider metadata remains normalized at the
authentication boundary; Reps does not create or persist a profile.

## Consequences

- Learners can inspect or manage their account without abandoning a lesson, and returning from
  Cuenta resumes the active card.
- The lesson content has more horizontal room on larger displays; its card remains a single
  focused reading and answering surface.
- A remote avatar is optional, HTTPS-only, and presentation-only. Missing metadata falls back
  to initials without changing the auth or storage contracts.
