# ADR-0013: Interview simulation with the user's own API key

- **Status:** Accepted — scheduled for v2, not implemented
- **Date:** 2026-08-24

## Context

Alongside the lesson path we want a second, separate experience: a mock interview or
meeting at a chosen seniority (trainee through staff), where the user is asked about a
topic, answers, and gets follow-up questions and a verdict.

Two problems make this incompatible with the v1 architecture.

**The corpus lacks the metadata.** Source levels (basic → expert) describe conceptual
difficulty, not seniority. The same question is asked of a trainee and of a staff
engineer; what differs is the depth expected in the answer and the follow-ups. Seniority
cannot be derived by filtering levels, and faking it produces a simulation that feels
fake.

**A real simulation is conversational.** The value is in the follow-up ("you said the
effect runs after render — after which render?"). That requires a model at runtime, which
requires a credential, which ordinarily requires a server (ADR-0003 says there is none).

## Decision

- The simulation does not use the corpus as a question bank. It uses it as **grounding**:
  topics and reference answers are passed as context, and the model conducts the
  interview at the requested seniority. This sidesteps the missing metadata and enables
  formats a fixed bank cannot do, such as a meeting with a product manager.
- **Bring your own key.** The user pastes their own API key; it is stored in their browser
  and requests go straight from the browser to the provider. No server, no proxy, no
  credential of ours, no per-session cost to the project.
- Ships as v2, after the lesson path is being used daily.

## Alternatives considered

- **A serverless proxy with our key** — better UX, and it means paying for every stranger's
  session with no way to cap it. Also puts us in the business of handling other people's
  traffic.
- **A fixed question bank tagged by seniority** — no API key needed, no cost, and it
  requires metadata we do not have and cannot honestly produce.
- **Shipping simulation in v1** — it would delay the part of the product that stands on
  its own and works with no credential at all.

## Consequences

BYOK narrows this feature to users who have an API key, which is a small fraction. It is
a power-user feature by construction, and the lesson path must remain fully usable
without it.

The key lives in browser storage and is sent directly to the provider. That must be
stated plainly in the UI: what is stored, where it goes, and how to remove it. The key
never touches `src/content/data/`, logs, or analytics.

This is the first runtime dependency on a third party. The lesson path must keep working
when the provider is down, over quota, or the key is invalid — simulation degrades, the
course does not.

ADR-0003's "no backend" survives intact, which is the main reason BYOK won over a proxy.
