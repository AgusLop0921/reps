# ADR-0003: Vite + React + TypeScript, no backend

- **Status:** Accepted — partially superseded by ADR-0010, and by ADR-0020 (the "no backend"
  clause)
- **Date:** 2026-08-24

## Context

This is a stateful SPA with local persistence and no need for search indexing: the
useful screens are private by definition (your progress). Content is static and known
at build time.

## Decision

Vite + React + TypeScript, fully client-side, no server of our own. Static deployment.

## Alternatives considered

- **Next.js** — SSR and API routes we do not need; more surface to maintain.
- **Astro** — excellent for content, awkward for an app sharing state across routes.
- **React Native / Expo** — this app is used at a desk while preparing for an
  interview, not on the bus. Can be revisited later.

## Consequences

Without a backend there are no accounts, no cross-device sync and no leaderboard:
progress lives in one browser and is lost if site data is cleared. We accept that for
v1 and ship JSON export/import as mitigation.

Zero infrastructure cost and trivial deployment.
