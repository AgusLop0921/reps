# ADR-0001: Record decisions with ADRs

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

This project is built largely with a coding agent. The agent starts every session with
no memory of previous reasoning: if decisions are not written down, it re-makes them
differently, or silently reverts them.

The repository will also be shared publicly, so the "why" carries as much value as the
code.

## Decision

Every structural decision gets a short ADR in `docs/adr/`, numbered sequentially.
`CLAUDE.md` requires the agent to write the ADR before the code.

## Alternatives considered

- **A single architecture document** — goes stale and leaves no record of what was
  rejected or why.
- **Nothing, just commit messages** — the context gets lost across hundreds of commits
  and does not fit in the agent's context window.

## Consequences

Each decision costs a few extra minutes of writing. In exchange, any new agent session
(or any person landing on the repo) starts with the reasoning loaded, and settled
questions do not get re-litigated.

Accepted ADRs are not edited, they are superseded. The history is deliberately long.
