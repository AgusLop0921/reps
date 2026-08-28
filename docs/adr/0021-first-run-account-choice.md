# ADR-0021: A one-time first-run account choice

- **Status:** Accepted
- **Date:** 2026-08-27
- **Amends:** ADR-0018, ADR-0020

## Context

ADR-0020 made sign-in purely optional and ADR-0018 forbade any prompt toward it, to protect
the newcomer from a sign-in funnel. That reasoning missed a person: the **returning user on a
new device**. Someone who already has an account, opening the app on a phone they've never
used it on, is shown lesson 1 as though they had never used it. That is not friction avoided
— it is the app misrepresenting their state. For that person sign-in is not an offer, it is
the only way the app works as promised (ADR-0020's cross-device promise).

A blanket "never prompt" serves the newcomer and fails the returning user. But the fix must
not become the funnel ADR-0018 rightly banned. The narrow thing that serves both is a single,
honest, once-ever choice at the very start.

## Decision

The first run is a **two-screen sequence, shown once, before the first card**: a **landing**
that says what the app is and credits the source, then the **account choice**. After it the
app opens straight into the current card, forever (ADR-0010); a quiet link on the path screen
reopens the landing for anyone who wants to read it again.

The landing is short — what it is (short daily React lessons that end), why (to take the place
of the scroll, not to be another feed), how (a linear path; questions return before you forget
them), a **prominent credit** to the source (ADR-0007), and a line that the generated checks
are ours, not the source's (ADR-0017). Unlike the account choice, it shows **regardless of
whether sync is configured**, because it is about the product, not accounts.

The account choice offers three options of **equal weight**:

- Continuar con Google
- Entrar con email (magic link)
- Seguir sin cuenta

The copy frames the trade honestly and symmetrically — with an account your progress is saved
and follows you across devices; without one it stays in this browser — and nothing more. **No
benefits list, no "recomendado" badge, no pre-selected option, no default.**

### The boundary (so no future feature can cite this as precedent)

- **First run only, once ever — both screens.** The sequence is recorded the moment the user
  leaves the landing ("Empezar"), so neither screen is ever shown again: not after N lessons,
  not on a timer, not on sign-out, and **not even if the user abandons between the two steps**.
  If "never again" cannot be made reliable (e.g. local storage unavailable), the sequence
  **fails closed** — not shown — rather than risk re-prompting.
- **Equal visual weight** (account screen). All three options share one size and treatment. If
  "Seguir sin cuenta" reads as the escape hatch and the other two as the real path, it is a
  funnel with better manners, and that is out of bounds.
- **After the sequence, the app opens straight into the current card, forever** (ADR-0010).
  These screens are an entry, not a recurring surface; the path link that reopens the landing
  is the only way back, and it is user-initiated.

These **two screens are the whole sanctioned first run** — a landing and a choice, shown once,
dismissible forever. **Two, and no more**: a future feature cannot add a third or re-show
these. It is a first-run *sequence*, not a nag. ADR-0018's ban on nags stands for everything
else;
ADR-0020's "no funnel" stands for every surface after this one. Ongoing sign-in stays the one
path-screen affordance (ADR-0020), and export/import moves under an "Avanzado" section there —
demoted, not removed.

### Auth surface

**Google OAuth is added alongside the magic link**, reversing ADR-0020's "magic link only". A
returning user's first instinct is often "continue with Google", and one tap beats an email
round-trip; magic link remains for those who prefer no OAuth. Both providers are configured in
Supabase.

## Alternatives considered

- **Never prompt (ADR-0020 as written)** — protects the newcomer, fails the returning user,
  who is precisely the person sync exists for.
- **Prompt repeatedly, or after some progress** — a funnel; forbidden by ADR-0018 and by the
  boundary above.
- **Pre-select or badge one option "recomendado"** — tilts a choice that must be equal.
- **Detect the returning user automatically** — impossible without an account, which is the
  very thing being offered.

## Consequences

- Two screens of first-run friction for everyone — a landing and the account choice — the
  honest cost of explaining the app and serving the returning user. Bounded to exactly two
  screens, one time.
- "Never again" now rests on a local-storage flag; a browser where that storage is unavailable
  simply never sees the sequence (fail closed), and can still sign in from the path affordance.
- The sequencing rule — which screen shows given the persisted flag, whether sync is
  configured, and the current step — is the part most likely to break silently, so it lives as
  a pure function in `core/` and is tested against each path, including abandonment.
- Two auth providers to configure (Google + email) rather than one: a Google client secret and
  provider setup in Supabase.
- A future contributor cannot cite this screen as license to prompt again. The boundary above
  is the entire permission, and it is one-time.
