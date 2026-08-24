# Reps

Short daily lessons on React, JavaScript and TypeScript. Built to sit where the
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

The interface is in Spanish, because the source content is in Spanish. All progress
lives in your browser (IndexedDB). No accounts, no server.

## Sources

Content belongs to its original authors and is used under their licenses.

| Source | Content | License |
|---|---|---|
| [midudev/preguntas-entrevista-react](https://github.com/midudev/preguntas-entrevista-react) | React, Spanish | MIT |

Every question shows where it came from and links back to the original repository.
Answers are never edited: errors are reported upstream.

## Stack

Vite + React + TypeScript, Dexie over IndexedDB, Vitest. Installable PWA. No backend.

## Development

```bash
pnpm install
pnpm content:import   # fetch sources and generate the curriculum
pnpm dev
```

Architecture decisions live in [`docs/adr/`](docs/adr/), working conventions in
[`CLAUDE.md`](CLAUDE.md), contribution workflow in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Roadmap

- [ ] v1 — React path (midudev), lesson runner, unlocking, review cards, local progress
- [ ] v1.1 — second content source (JavaScript)
- [ ] v1.2 — code exercises: "what does this print" and fill-the-gap
- [ ] v2 — interview simulation: a conversational mock interview at a chosen seniority,
      powered by the user's own API key (ADR-0013)

## License

Code under MIT. Imported content keeps the license of its source.
