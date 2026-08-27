# ADR-0020: Cross-device progress sync with Supabase, local-first

- **Status:** Accepted
- **Date:** 2026-08-27
- **Supersedes:** the "no backend / no cross-device sync" decision of ADR-0003
- **Amends:** ADR-0005

## Context

Progress lives in one browser's IndexedDB (ADR-0005). The same person on a laptop and a
phone has two disconnected states, and ADR-0003 accepted that for v1 with JSON
export/import as the only mitigation. But the product is used across exactly those two
devices — dead minutes on a phone, sometimes a desk (ADR-0010) — so per-browser progress
is a real limitation, not a theoretical one. Shuffling a JSON file between devices is not
sync.

We want to fix this without losing what defines the app: it opens in ~2 seconds, works
one-handed in a queue, and — critically — works offline (ADR-0010). It must also stay fully
usable for someone who never signs in. `CLAUDE.md` lists backend, accounts, and sync as v1
non-goals; per its own rule ("propose an ADR — do not act on it"), this is that proposal,
scoped to progress sync only.

## Decision

Add **optional, local-first cloud sync** of progress, backed by **Supabase** (hosted
Postgres + Auth). Four commitments hold the line on everything above.

### 1. Account optional — the app is fully usable without one

No sign-in is required. With no account the app behaves exactly as today: IndexedDB is the
store, export/import is the backup, nothing degrades and nothing nags (ADR-0010, ADR-0018).
An anonymous user never contacts Supabase at all. Signing in is purely additive: it turns
sync on.

**Auth: passwordless email magic link only** (Supabase Auth OTP). No passwords for us to
store, leak, or reset; no OAuth, so no client secrets and one provider fewer to trust — a
single user does not need it. The only personal data collected is an email address, and only
from those who opt in. Anonymous Supabase sessions are deliberately not used — they don't
link two devices, which is the whole point.

The no-account path must **never degrade** into a funnel toward signing in (ADR-0018).
Beyond one affordance on the path screen, there is no nag, no banner, no
"sincronizá tu progreso" prompt, no red dot. Sync is an option the user can reach for, not a
state the app pushes them toward; someone who never signs in should not be able to tell the
feature exists except by looking for it.

### 2. Local-first — IndexedDB stays the source of truth

Every read and write in the app goes to IndexedDB, synchronously, as it does today.
Supabase is a **sync target**, never in the path of answering a card. A background process
pushes local changes up and pulls remote changes down, reconciling into IndexedDB. If
Supabase is unreachable — offline, down, or signed out — the app is unaffected: writes
accumulate locally (they already do) and flush when connectivity and a session return. This
is what preserves ADR-0010's offline requirement. All remote access lives inside
`src/storage/`, keeping ADR-0005's single-module rule intact.

### 3. Conflict resolution — last-write-wins per row

Each `Progress` and `LessonProgress` row carries an `updatedAt` timestamp, stamped on every
local write. When a remote row and a local row for the same key differ, the newer
`updatedAt` wins, wholesale.

**What it loses, concretely:** it picks a winner row and discards the loser — it does not
merge. If you review the *same* question on two devices while both are offline, the later
sync overwrites the earlier, and **one review is dropped from that question's Leitner
`history`** — along with the box and due date it produced. For *distinct* questions there is
no conflict: different keys, both survive. The only real failure is narrow — the same card
reviewed on two offline devices before either syncs — and for one user that is rare. We take
that over a per-field merge (unioning `history`, replaying the scheduler to recompute
box/dueAt), which is the right answer for multiple people on one account — a case that does
not exist today and may never. If it ever bites, the upgrade is a history-union merge, and
it gets its own ADR.

### 4. Data model and access

Supabase tables `progress` and `lesson_progress` mirror the Zod schemas plus `user_id`
(= `auth.uid()`) and `updated_at`, keyed by `(user_id, question_id)` and
`(user_id, lesson_id)`. **Row-Level Security is mandatory**: every policy restricts rows to
`auth.uid() = user_id`. The public anon key is safe *only* because RLS is on; the
service-role key never reaches the frontend. Adding `updatedAt` to the local schemas is the
first real IndexedDB migration (Dexie v2), backfilling existing rows.

What is stored is **progress only** — box, due date, grade history, and lesson position,
plus the account email. No content, no question or answer text, no free text of any kind
ever leaves the device; the corpus stays static and client-side (ADR-0004). The UI states
this plainly next to the sign-in affordance.

### 5. Deleting an account ships with the feature, not after

If we hold someone's data, "delete my account and everything in it" is part of the same
release — one `SECURITY DEFINER` SQL function that removes the user's rows and their auth
record, behind one button. Not a follow-up, not a support email.

## Alternatives considered

- **Status quo — local-only + export/import (ADR-0003/0005)** — zero infra, zero data
  custody, but the actual two-device use is unserved and file-shuffling is not sync.
- **Our own backend (Node + Postgres)** — full control, and a server to run, secure, and
  pay for. Supabase gives Postgres + Auth + RLS managed: the smallest step off "no backend".
- **Serverless functions + our own database** — more glue than Supabase for the same result.
- **Per-field / history-union merge instead of LWW** — loses nothing in a conflict, but
  needs scheduler replay and more moving parts than one user warrants now.
- **Remote as source of truth (sync-first)** — breaks offline use and slows every read;
  contradicts ADR-0010.
- **OAuth-only sign-in** — more friction and third-party config than a magic link.

## Consequences

- **No longer a pure static deploy.** The frontend stays static, but the product now
  depends on an external managed backend: a Supabase project to run and monitor,
  availability that is no longer just the CDN's, and cost that is zero at small scale but no
  longer *structurally* zero. ADR-0003's "zero infrastructure cost" no longer holds.
- **Credentials to manage.** `VITE_SUPABASE_URL` and the anon key ship in the frontend env
  (public, RLS-protected); the service-role key is server-only and never committed. RLS
  policies become security-critical code, versioned in the repo (`supabase/`) and reviewed
  like any other.
- **We now hold other people's data.** The moment a second person signs in, our project
  stores their email and progress — a custody responsibility we did not have. It brings RLS
  correctness, the self-service account-deletion path above, a plain-language UI note on what
  is stored (progress only, no content or answer text) and where, and breach exposure that
  did not exist when all data lived in the user's own browser. Kept deliberately small:
  storing only derived progress, never content, limits what a breach could expose. This is
  the storage-shaped version of the risk ADR-0013's BYOK avoided, taken on and scoped tight.
- **Two modes to maintain.** Local-only and synced both have to keep working; the local path
  must not rot because the synced path gets the attention.
- **ADR-0013 (BYOK) is unaffected.** The LLM key still goes browser→provider; Supabase syncs
  progress only and is never in the model's path. "No backend" is now false in general, but
  stays true for the interview feature's credentials.
