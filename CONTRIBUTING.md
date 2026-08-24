# Contributing

## Language

The repository is in English — code, comments, docs, commits, PRs. User-facing UI
strings are in Spanish and live in `src/ui/copy.ts`. See ADR-0008.

## Branches

`main` is always releasable. Never commit to it directly.

```
feat/leitner-scheduler
fix/duplicate-question-ids
docs/adr-content-sources
chore/bump-vitest
refactor/extract-deck-builder
```

One branch, one concern. If you cannot name the branch without "and", it is two branches.

## Commits

Atomic: one commit does one thing, and the tree is green at every commit. A reviewer
should be able to read the history and follow the reasoning without opening the diff.

[Conventional Commits](https://www.conventionalcommits.org/), imperative mood:

```
feat(core): add leitner scheduler
fix(import): reject duplicate slugs in midudev adapter
test(core): cover streak edge cases
docs(adr): record spaced repetition decision
chore(content): regenerate midudev-react data
```

Rules that matter more than the format:

- Never mix a refactor with a behavior change. Two commits.
- Generated files (`src/content/data/`) go in their own commit, always.
- Never mix formatting-only changes with anything else.
- If a commit needs a paragraph to explain *why*, write that paragraph in the body.
  The subject line says what, the body says why.

## Pull requests

- One PR per branch, small enough to review in one sitting. If the diff is over ~400
  lines of hand-written code, it is probably two PRs.
- The description explains the *why* and links the relevant ADR. The *what* is the diff.
- CI must be green: `pnpm verify` runs typecheck, lint and tests.
- Squash on merge, so `main` keeps one commit per shipped change.

## Architecture decisions

Anything structural — a new dependency, a data model change, a new content source, a
change to the review algorithm — needs an ADR in `docs/adr/` before the code. See
`docs/adr/README.md`.

## Content

Third-party content is never edited, translated or "improved". If an answer is wrong,
report it in the source repository. See ADR-0007.
