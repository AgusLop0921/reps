---
description: Run project checks and review the working tree before committing
allowed-tools: Bash(pnpm verify), Bash(pnpm content:import), Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

1. Run `pnpm verify`. If anything fails, fix it and repeat before continuing.
2. Show me `git status` and `git diff` for what changed.
3. Hand the changes to the `reviewer` subagent.
4. If nothing is blocking, propose how to split the work into atomic commits — one line
   per commit, in Conventional Commits format, English. Do not commit until I confirm.
