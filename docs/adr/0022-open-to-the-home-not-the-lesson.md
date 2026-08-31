# ADR-0022: Open to the home, not straight into a lesson

- **Status:** Accepted
- **Date:** 2026-08-31
- **Amends:** ADR-0010, ADR-0021

## Context

ADR-0010 had the app open directly on the current lesson's card, to compete with the
two-second scroll reflex, and ADR-0021 had the landing shown once and then the app booting
straight to the card forever. In practice this is disorienting: you open the app and you are
already inside some card, mid-lesson, with no sense of where you are on the path. There is no
"home" to return to on open — you are dropped into content.

## Decision

Opening the app **never drops you into a lesson**. It lands on the **home**:

- **Signed in → the path** (el camino).
- **Not signed in → the landing.**

The card is reached only by an explicit action: "Empezar" on the landing (which goes to the
path, not a lesson) or tapping a node on the trail. First-run onboarding is unchanged
(landing → account choice), and it now ends on the **path** rather than a card.

This reverses ADR-0010's "opens directly on the current lesson" and ADR-0021's "landing once,
then straight to the card": the landing now reappears on every open for signed-out users, as
their home. Auth must resolve before routing (a brief loading state for configured returning
users) so the home is chosen correctly without a flicker.

Two smaller UI changes ride along: the theme control becomes a single toggle showing the
theme you'd switch to (sun in dark, moon in light), and export/import is removed from the path
footer — cross-device sync (ADR-0020) is now the backup, so the manual JSON mitigation
ADR-0005 shipped is no longer surfaced.

## Alternatives considered

- **Keep ADR-0010 (open into the current card)** — fastest to content, but the disorientation
  it causes is exactly what this ADR fixes.
- **Always the landing, signed in or not** — simpler, but a signed-in returning user does not
  need the intro every open; the path is a more useful home for them.
- **"Empezar" resumes the current lesson directly** — one tap to content, but it reintroduces
  "straight into a lesson", so the landing sends you to the path instead.

## Consequences

- One extra tap to reach a lesson on open (home → node / Empezar → card). We trade ADR-0010's
  two-second reflex into content for orientation — a deliberate reversal of that ADR's premise.
- Signed-out users see the landing on every open. It is their home, not a nag (ADR-0018), and
  it is the only place the intro lives now that the "ver la introducción" link is gone.
- Removing export/import from the UI leaves sync (ADR-0020) as the only progress backup; a
  local-only user has no manual export anymore. Revisit if that bites.
- ADR-0010's mobile-first, offline, no-nag core still stands; only its "open into the card"
  behaviour is replaced.
