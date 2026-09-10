# ADR-0028: Choose local or Google progress after selecting a track

- **Status:** Accepted
- **Date:** 2026-09-09
- **Amends:** ADR-0021, ADR-0027

## Context

The initial account choice appeared before track selection. At that point, a learner had not yet
chosen what they wanted to train, so the storage decision arrived without context.

## Decision

We decided to show the one-time Google-or-local choice immediately after a new, signed-out
learner selects their first track. The selected track is retained while they choose. Continuing
locally opens that track immediately; Google OAuth retains the track through its redirect and
opens it when the session returns.

The choice is not repeated after either path is chosen. Cuenta remains the voluntary place to
connect Google later. The landing still introduces the product, but it no longer records the
first-run choice by itself.

## Consequences

- The account decision has a concrete purpose: how to store progress for a chosen training path.
- Closing the app before selecting a storage mode leaves first run incomplete, so the landing is
  shown again on the next visit.
- OAuth redirect handling uses session-scoped UI state only; it does not change progress storage
  or any persisted domain schema.
