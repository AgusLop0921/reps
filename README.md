# Reps

Short daily lessons on React and AI Engineering. Built to sit where the
mindless scrolling used to be.

> Status: work in progress.

## Why

The half hour a day that goes into Instagram, X and TikTok is not lost to lack of
discipline — those apps are just easier to open than anything worthwhile. Reps tries to
match that: open it, one lesson, done. The difference is that in a month you know more
React instead of nothing.

It is deliberately **not** a feed. No infinite scroll, no timeline, no "just one more".
A lesson ends, and ending it is the whole point.

## How it works

- A linear path of lessons ordered basic → expert.
- Start at lesson 1; finishing one unlocks the next.
- Already experienced? Jump straight into any level section and start there. Inside a
  section, order is enforced.
- Each lesson opens with a couple of review cards from earlier lessons — scheduled so
  they land right before you would have forgotten them — then moves on to new material.

The interface is in Spanish, because the source content is in Spanish. Progress lives in
your browser (IndexedDB) by default; with an optional account it syncs across your devices
(ADR-0020). The content itself always stays client-side — no server holds the questions.

## Sources

Content belongs to its original authors and is used under their licenses.

| Source | Content | License |
|---|---|---|
| [midudev/preguntas-entrevista-react](https://github.com/midudev/preguntas-entrevista-react) | React, Spanish | MIT |
| [Microsoft Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners) | Registered for AI Engineering; content not imported yet | MIT |

The current AI Engineering seed is small editorial Reps content and is not attributed to
Microsoft. Sources and learning tracks are separate: a track may eventually combine several
approved sources.

Every question shows where it came from; imported questions link back to their original
repository. Imported answers are never edited: errors are reported upstream.

## Stack

Vite + React + TypeScript, Dexie over IndexedDB, Vitest. Installable PWA. No content
backend; optional Supabase for cross-device progress sync (ADR-0020), off unless configured.

## Development

```bash
pnpm install
pnpm content:import   # fetch sources and generate the curriculum
pnpm dev
```

Architecture decisions live in [`docs/adr/`](docs/adr/), working conventions in
[`CLAUDE.md`](CLAUDE.md), contribution workflow in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Roadmap

- [ ] v1 — React path (midudev), lesson runner, unlocking, review cards, local progress,
      optional cross-device sync (Supabase accounts, ADR-0020)
- [x] Multi-track foundation — React and an editorial AI Engineering seed, isolated progress
- [ ] AI Engineering source adapter and reviewed curriculum
- [ ] v1.2 — code exercises: "what does this print" and fill-the-gap
- [ ] v2 — interview simulation: a conversational mock interview at a chosen seniority,
      powered by the user's own API key (ADR-0013)

## License

Code under MIT. Imported content keeps the license of its source.
