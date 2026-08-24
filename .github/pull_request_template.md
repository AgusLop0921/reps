## What

One or two sentences. The diff says what changed line by line; this says what changed
conceptually.

## Why

The reasoning. If there is an ADR, link it and keep this short.

- ADR:

## Deliberately not included

Anything adjacent you chose not to do, so the reviewer does not flag it as an omission.

## Checklist

- [ ] `pnpm verify` green
- [ ] Atomic commits; generated data committed separately
- [ ] ADR written if this was a structural decision
- [ ] No Spanish outside `src/ui/copy.ts` and imported content (ADR-0008)
- [ ] Imported content untouched (ADR-0007)
