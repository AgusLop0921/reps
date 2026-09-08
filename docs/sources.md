# Content sources

Third-party questions and answers belong to their original authors. Reps either imports that
material unchanged or labels separately reviewed editorial material with a manual source.

## midudev-react

- **Author:** midudev (Miguel Ángel Durán)
- **Repository:** https://github.com/midudev/preguntas-entrevista-react
- **Site:** https://reactjs.wiki
- **License:** MIT — full text in `licenses/midudev-react.txt`
- **Content:** React, Spanish, open questions grouped by level
- **Adapter:** `scripts/import/sources/midudev-react.ts`

## microsoft-generative-ai-for-beginners

- **Author:** Microsoft
- **Repository:** https://github.com/microsoft/generative-ai-for-beginners
- **License:** MIT — full text in `licenses/microsoft-generative-ai-for-beginners.txt`
- **Pinned revision:** `645f932514e9f22f688c8feb3e49a7a7f2eb6f1b`
- **Adapter:** `scripts/import/sources/microsoft-generative-ai-for-beginners.ts`
- **Normalized artifact:** `scripts/import/generated/microsoft-generative-ai-for-beginners.es.json`
- **Status:** Spanish lessons 01–21 are normalized for future review; none are published in
  the runtime curriculum

The approved input set excludes lesson 00 (course setup), English originals, other
translations, code, notebooks, images, presentations, and repository documentation. Run
`pnpm content:check:microsoft` to verify the pinned revision and allowlist, or
`pnpm content:normalize:microsoft` to reproduce the normalized artifact. Normalization does
not generate or publish questions, checks, lessons, or a track.

## reps-manual

- **Author:** Reps
- **Type:** Manual/editorial
- **License:** MIT (the project license)
- **Content:** The intentionally small AI Engineering architecture-proof seed

The seed is attributed to Reps, not Microsoft. Registering a source on a track does not claim
that every lesson in that track was derived from it; question-level provenance remains
authoritative.

## Adding a source

See ADR-0007 and ADR-0023. Short version: source-policy and license review first, adapter
second, and attribution goes on each question card — not hidden in a footer. Public or
user-provided material is not automatically approved for ingestion or republication.
