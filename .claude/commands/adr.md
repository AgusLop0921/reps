---
description: Write a new ADR for a decision that was made
argument-hint: [decision in one sentence]
---

Decision to record: $ARGUMENTS

Use the `adr-writer` subagent.

Before delegating, check whether this conversation already makes clear the context, the
alternatives we weighed and why we rejected them. If any of the three is missing, ask me
first — I do not want an ADR with invented reasoning.

The ADR goes on its own `docs/` branch and its own PR unless it is part of the change it
describes, in which case it is the first commit on that branch.
