# ADR-0010: Mobile-first, positioned against aimless scrolling

- **Status:** Accepted — amended by ADR-0018
- **Date:** 2026-08-24
- **Supersedes:** the usage assumption in ADR-0003

## Context

ADR-0003 assumed this app is used at a desk while preparing for an interview, and
rejected a mobile-oriented approach on that basis. That assumption is wrong: the product
now competes with Instagram, X and TikTok for the same dead minutes of the day. Those
minutes happen on a phone, one-handed, in a queue.

Competing there sets a hard constraint: opening the app has to cost about two seconds,
the same as the habit it replaces.

## Decision

Mobile-first, delivered as an installable PWA rather than a native app. Opening the app
lands directly on the current lesson — no dashboard, no stats screen, no menu in between.
All primary controls sit within thumb reach.

We deliberately do not copy the retention mechanics of the apps we are replacing: no
push notifications, no streak that scolds you, no artificial scarcity. A streak counter
that counts days is fine; anything that makes you feel bad for missing one is not.

## Alternatives considered

- **Desktop-first web app** — the original assumption. Wrong context entirely.
- **React Native / Expo** — a real option, but the install friction works against the
  "open it as fast as the habit it replaces" requirement for a v1 nobody has heard of,
  and it costs a second codebase. A PWA is installable and keeps the existing stack.
- **Adopting the standard engagement toolkit** (notifications, aggressive streaks,
  variable rewards) — effective, and it would make this the same kind of app it is
  supposed to replace. Declined on purpose; expect this to cost retention.

## Consequences

Layout, tap targets and navigation are designed for a phone; desktop is a scaled-up
phone, not the other way round. PWA work (manifest, service worker, offline shell) enters
the v1 scope.

Rejecting the engagement toolkit means slower growth and more people who drift away. That
is the trade we are making. If the product cannot hold attention on its own merits, the
answer is better lessons, not guilt.

ADR-0003's technology choices (Vite, React, TypeScript, no backend) still stand. Only its
usage assumption is replaced.
