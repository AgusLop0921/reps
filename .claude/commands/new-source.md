---
description: Add a new content source end to end
argument-hint: [repository url]
---

Proposed source: $ARGUMENTS

Full sequence, stopping at every decision point:

1. **License first.** Find the repository's license file and tell me what it is and
   whether it permits this use. If it does not, or it is ambiguous, stop here.
2. **Format.** Fetch the markdown and show me its real structure: which heading depth
   marks questions, whether they are grouped by level or by topic, whether they are open
   or multiple choice. Show me two verbatim examples.
3. **Branch.** `feat/source-<id>`.
4. **ADR.** Write the source adoption ADR (use `/adr`). First commit on the branch.
5. **Adapter.** Delegate to the `content-adapter` subagent. Adapter and its test in one
   commit.
6. **Integration.** Register the source, store its license in `licenses/`, update the
   README table and `docs/sources.md`. Run `pnpm content:import` and commit the generated
   data **separately**.
7. **PR.** Use `/pr`.
8. **Report.** How many questions landed, their distribution by level, and what breaks if
   upstream changes.
