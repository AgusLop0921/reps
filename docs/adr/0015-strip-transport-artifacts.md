# ADR-0015: Strip transport artifacts, not content

- **Status:** Accepted
- **Date:** 2026-08-24
- **Amends:** ADR-0007

## Context

ADR-0007 states that imported answers are never edited. The midudev source is a single
scrollable README, and every answer ends with navigation chrome added to serve that
format: a back-to-index link, `**[⬆ Volver a índice](#índice)**`, followed by a `---`
horizontal rule separating it from the next question.

That chrome is transport — an artifact of publishing the corpus as one long document — not
part of the answer. Imported verbatim, it renders as a dead in-page anchor and a stray
rule on every single card.

There is a real tension with ADR-0007: the rule against editing answers exists to keep
content traceable and to respect the authors. Removing the wrapping the source added for
its own layout does not touch the content; leaving it in degrades every card.

## Decision

Distinguish transport from content. The adapter strips a fixed, source-specific set of
**known** artifacts, and only at the **end** of an answer:

- the back-to-index link (`**[⬆ Volver a índice](#índice)**`), and
- a trailing `---` horizontal rule.

Exact known patterns only — no generic markdown cleanup. If such a pattern appears
**mid-answer** rather than at the end, the import **fails loudly** instead of deleting it:
a mid-answer match means the format assumption broke, and silently dropping content is
exactly what ADR-0007 forbids.

## Alternatives considered

- **Import verbatim (ADR-0007 unamended)** — navigation noise on every card.
- **Generic cleanup: strip all trailing links / rules** — destroys real content (many
  answers legitimately end in a link or a rule) and is unverifiable.
- **Strip in the UI at render time** — pushes source-specific quirks into the UI, and
  leaves the stored data dirty for search and any other consumer.

## Consequences

ADR-0007's "answers are never edited" is refined to: **content is never edited; the
transport wrapping a source adds for its own layout may be removed.** The distinction is
narrow and must stay narrow.

Each artifact pattern is source-specific, lives in that source's adapter, and is covered
by a test — including a test that a mid-answer occurrence throws. Adding a source may add
patterns. If upstream restructures so an artifact appears mid-answer, the import fails
rather than corrupting content; that is the intended behavior.
