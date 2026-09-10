# ADR-0027: Visible account management with Google as the sync action

- **Status:** Accepted — amended by ADR-0028
- **Date:** 2026-09-09
- **Amends:** ADR-0021

## Context

The first-run account choice and the path footer were the only places to reach authentication.
After the one-time choice, a local-only user had to discover a quiet footer control to connect
their progress. That made the optional sync feature hard to find when it became useful on a
second device.

ADR-0021 deliberately gave every first-run choice equal visual weight. With Google now the
only authentication method under ADR-0026, that framing no longer helps a person understand
the concrete choice: keep progress on this device, or connect Google to keep it across devices.

## Decision

We decided to make **Cuenta** a stable, user-initiated destination on the track selector and
learning path. It is a dedicated screen that describes whether progress is local or synced and
holds sign-in, sign-out, and account deletion actions. The path footer no longer manages
authentication.

On first run, Google is the primary action because it enables the cross-device benefit. The
local-only option remains explicit, unblocked, and free of negative framing. The onboarding is
still shown once only; it does not become a recurring sign-in prompt.

## Consequences

- A user can find and manage sync without leaving their current top-level context; Cuenta
  returns to the selector or path from which it was opened.
- Google is visually prominent at first run, but accounts remain optional and local-first use
  is unchanged.
- Lessons do not gain an account control, preserving uninterrupted practice.
- No storage schema, Supabase migration, sync protocol, or content contract changes are needed.
