# ADR-0018: Long sessions are welcome when they come from content pull

- **Status:** Accepted
- **Date:** 2026-08-26
- **Amends:** ADR-0010

## Context

ADR-0010 positioned the product against aimless scrolling and, to avoid becoming the kind
of app it replaces, rejected the engagement toolkit and stated the trade plainly: "expect
this to cost retention", "slower growth and more people who drift away". Read literally,
that framing treats a short session as the intended outcome and a long one as a warning
sign.

That is no longer what we want. A long session is a good outcome — provided it comes from
the content pulling the user forward, not from pressure the app applies. The two are
different in origin, not in duration, and ADR-0010 did not draw that line.

The end-of-lesson screen forced the issue. It read "No hay nada más que hacer acá"
(nothing more to do here) while its primary button offered the next lesson: a direct
contradiction, and a residue of the old "stop now" posture. Fixing the copy without
fixing the posture would leave the next contributor free to "restore" the contradiction
as a bugfix.

## Decision

We want long sessions, on one explicit condition: they must come from **content pull**
— the material being interesting enough to continue — never from engagement mechanics.

This **permits**, and did not before:

- **Announcing what comes next.** The end-of-lesson screen may name the upcoming lesson's
  topic, so the decision to continue is driven by curiosity about the content rather than
  a generic "next" prompt.
- **Frictionless continuation.** One tap to continue and one tap (or none) to stop, with
  no interstitial, no confirmation, and no celebration between lessons. Ending a session
  and extending it cost the same.
- Treating a session with no natural stopping point as an acceptable, even good, outcome.

It still **forbids**, unchanged and now stated as a boundary rather than a side effect:

- No streaks or streak pressure of any kind.
- No praise or reward for continuing (no "¡seguí así!", no confetti, no badges).
- No counters, progress percentages, or points presented as a score to grow.
- No urgency or artificial scarcity ("te quedan 2 minutos", "oferta de hoy").
- No guilt, nagging, or friction for leaving.

The test that separates the two lists is the **source of the next tap**: if it is the
content, it is allowed; if it is the app applying pressure, it is not.

## Alternatives considered

- **Keep ADR-0010's "accept lower retention" posture** — honest when written, but now
  inaccurate. It produced a self-contradicting screen and left content-driven engagement
  unused out of fear of resembling the apps we replace.
- **Admit we want long sessions and adopt the standard engagement toolkit** — exactly what
  ADR-0010 declined and what this amendment keeps declining. Wanting long sessions is not
  a licence for mechanics; the source test still rules them out.
- **Change only the copy, leave the ADRs alone** — the copy is downstream of a posture
  change. Recording the new copy without the new posture would not survive the next
  feature that could lengthen a session.

## Consequences

- The end screen announces the next lesson's topic and continuation is one tap; this ADR
  is the justification for that behavior and the guardrail on how far it may go.
- Every future feature that could lengthen a session must pass the source test: does it
  work by making the content more interesting, or by applying pressure? The forbidden list
  is the operational form of that test — reach for it in review.
- Harder to measure. "Content pull versus pressure" is a judgment, not a metric, and we
  deliberately do not encode a proxy metric for it — a session-length or streak metric,
  optimized, would itself become the pressure this ADR forbids.
- ADR-0010's core stands: mobile-first, boot straight into the current card, no push
  notifications, no scarcity. Only its framing that we accept — and prefer — shorter
  sessions is replaced by this ADR.
