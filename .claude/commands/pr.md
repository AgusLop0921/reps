---
description: Commit the current work atomically and open a pull request
argument-hint: [optional: PR title]
allowed-tools: Bash(git:*), Bash(gh pr:*), Bash(pnpm verify)
---

Suggested title: $ARGUMENTS

1. Confirm we are not on `main`. If we are, create the right branch first
   (`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`) and move the changes onto it.
2. Run `pnpm verify`. Do not continue on red.
3. Propose the commit split before staging anything: one commit per concern, each one
   leaving the tree green. Generated files under `src/content/data/` always get their own
   commit. Show me the list and wait for my confirmation.
4. Commit with Conventional Commits messages in English, imperative mood. Where the *why*
   is not obvious, put it in the commit body.
5. Push and open the PR with `gh pr create`, filling the template: what changed, why, the
   related ADR, and anything you deliberately left out.
6. Report the PR URL. **Do not merge it.**
