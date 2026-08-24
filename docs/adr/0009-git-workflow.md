# ADR-0009: Branch, commit and PR workflow

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

This is a solo project built mostly with a coding agent, which changes what the version
control history is for. An agent can produce a large, coherent-looking diff in one shot;
without structure, `main` becomes a series of giant "implement feature" commits that are
impossible to review, bisect or revert.

The repository is also meant to be shown to other people, and history is part of what
gets read.

## Decision

Trunk-based with short-lived branches:

- `main` is always releasable; no direct commits.
- One branch per concern, prefixed `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`.
- Atomic commits in Conventional Commits format, English, imperative mood. Every commit
  leaves the tree green.
- Generated files committed separately from hand-written code.
- One PR per branch, CI green before merge, squash on merge.

CI runs `pnpm verify` (typecheck, lint, tests) on every PR.

## Alternatives considered

- **Committing straight to `main`** — faster, and exactly what makes agent-written
  history unreviewable.
- **Git Flow with `develop` and release branches** — ceremony with no payoff for a solo
  project with no release trains.
- **One commit per PR, no atomicity rule** — squash-on-merge already gives a clean
  `main`, but during review the intermediate commits are what make a large change
  readable. The rule earns its keep before the merge, not after.

## Consequences

More friction per change: a branch, a PR and CI for every piece of work, including
one-line fixes. That is the point — it forces changes to stay small.

The agent must be told explicitly not to commit to `main` and not to merge its own PRs.
Both instructions live in `CLAUDE.md`, because an agent that can run `git` will
otherwise do the convenient thing.

`git bisect` and per-commit revert stay useful, which is the practical payoff when a
regression appears in code you did not type yourself.
