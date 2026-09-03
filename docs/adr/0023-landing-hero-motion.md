# ADR-0023: A subtle constellation motion behind the landing hero

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The landing (ADR-0021) is deliberately typographic and sober: an oversized serif wordmark,
mono eyebrows, generous whitespace. It reads as calm and intentional, but also as flat —
nothing on the page moves, so it can feel static rather than alive. We want a light,
always-on motion that gives the hero a pulse and rewards attention, without turning the page
into a gimmick or fighting the typography.

The motion should also *mean* something here, not be generic decoration bolted on. A
node-and-link constellation reads as a graph — echoing a component tree / element graph,
which is the mental model React is built on — so it ties the movement to what the product
teaches.

Constraints this cannot break: `prefers-reduced-motion` must be honoured (ADR-0010's respect
for the user's environment), colours come only from the theme tokens in `styles.css` so it
works in light and dark, and a perpetual animation must not cost battery or Lighthouse
points.

## Decision

Add a **decorative animated constellation** behind the landing hero only.

- A single `<canvas>` fills the hero, sits **behind** the content (`z-index: 0`,
  `pointer-events: none`, `aria-hidden`), and never intercepts input or affects layout (it is
  absolutely positioned, out of flow).
- ~30–45 nodes drift slowly and continuously; thin links connect the nearby ones, their
  opacity falling off with distance — the graph texture. Density scales with the hero's area,
  capped.
- **Mouse proximity interacts:** as the cursor passes near, nearby nodes light up and draw a
  gold link to it — the field is *illuminated* by the cursor, not disturbed by it. A gentle
  attraction toward the cursor is built in and tunable (`MOUSE_PULL`) but ships at **zero**:
  tuning against the live preview, pulling the nodes read as busier than lighting them up, so
  the interaction is the highlight alone. Node speed is clamped regardless, so the drift stays
  a calm constant.
- **Intensity: present but subtle.** Nodes and inter-node links are drawn in `--text` at low
  alpha; the motion is visible at a glance but never competes with the wordmark. Hero only —
  the "cómo funciona" section and below stay still.

### Colour and the accent rule

Nodes and links use `--text` at low opacity. The **accent** (`--accent`) appears *only* on the
transient links and nodes touched by the cursor — a momentary highlight, in the same spirit as
the token's sanctioned uses ("links, primary, current"). It is never a fill, never a block
background, and never present at rest. Colours are read from the computed theme tokens at run
time, so both themes and the theme toggle are handled with no hardcoded values.

### Performance and reduced motion

- `prefers-reduced-motion: reduce` → render **one static frame** (a still constellation, no
  animation loop, no pointer listener). The page is never blank and never moves.
- The `requestAnimationFrame` loop **pauses** when the tab is hidden (`visibilitychange`) and
  when the hero scrolls out of view (`IntersectionObserver`), and resumes on return. Device
  pixel ratio is capped at 2. Delta time is clamped so returning to a backgrounded tab does not
  jump.
- No new runtime dependency: plain canvas 2D and the platform APIs above. No new UI string
  (the layer is decorative and `aria-hidden`), so ADR-0008 is untouched.

## Alternatives considered

- **The React atom (orbiting electrons)** — the most literal nod to React's identity, but the
  logo motif is heavier and more "brand mark" than the editorial hero wants; the constellation
  is quieter and still carries the graph meaning.
- **Floating code tokens (`=>`, `{}`, `< />`)** — ties to the content, but decorative text
  risks reading as busy and brushes against the "no hardcoded strings" instinct even when
  `aria-hidden`.
- **A pure CSS animation (no canvas, no JS)** — cheapest and no rAF, but cannot do the
  per-node mouse proximity interaction that is the point of the request.
- **Whisper / full-page intensity** — rejected in favour of the middle setting: noticeable in
  the hero, absent elsewhere.

## Consequences

- A small amount of always-considered JavaScript now runs on the landing. It is contained to
  one decorative component under `src/ui/`, carries no business logic, and is inert under
  reduced motion — but the landing is no longer zero-JS-at-rest, and that is a deliberate
  trade for the page feeling alive.
- The hero gains a canvas layer; hero content is lifted to `z-index: 1` so it always sits
  above the motion. Nothing else in the layout moves.
- A perpetual animation is a battery/CPU cost by nature; the visibility and viewport pauses,
  the DPR cap, and the O(n²) link pass over a small capped node count keep it cheap, and
  reduced-motion opts out entirely. Revisit the node count if it ever shows on Lighthouse.
- The accent now has one more sanctioned appearance — a transient cursor highlight — recorded
  here so it is not read as a violation of the "accent is not decoration" rule.
