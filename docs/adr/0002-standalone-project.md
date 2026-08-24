# ADR-0002: Standalone project, not a section of an existing site

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

We already run a personal technical content site built with Astro, with a domain and
deployment in place. The tempting move was to add this as another section and save the
infrastructure work.

## Decision

Its own repository, domain and deployment.

## Alternatives considered

- **A section inside the existing content site** — the topic does not match (that site
  is about AI in software development, this is about React/JS/TS), Astro is optimized
  for content rather than a stateful app with local persistence, and it would add many
  low-value routes that dilute the domain's focus.

## Consequences

One more repo and one more deployment to maintain. In exchange, the app can grow — more
sources, more exercise types, eventually a backend — without negotiating against the
constraints of a content site, and it stands on its own as a portfolio project.

The two projects link to each other; they share no code.
