# Supabase — progress sync

Cross-device progress sync (ADR-0020). Optional: with no Supabase project configured the app
runs local-only, exactly as before.

## Setup

1. Create a Supabase project.
2. Run `migrations/0001_progress_sync.sql` — either `supabase db push`, or paste it into the
   project's SQL editor. It creates the `progress` and `lesson_progress` tables, their
   Row-Level Security policies, and the `delete_account()` function.
3. **Authentication → Providers**: enable **Email** with "Confirm email" on (magic link), and
   **Google** (OAuth client ID + secret from Google Cloud) — both are offered at first run and
   on the path screen (ADR-0021).
4. Copy `.env.example` to `.env` and fill in from **Project Settings → API**:
   - `VITE_SUPABASE_URL` — the project URL
   - `VITE_SUPABASE_ANON_KEY` — the public anon key
5. In your deploy set the same two variables as build env vars. This project ships to GitHub
   Pages (`.github/workflows/deploy.yml`), so add them as repo secrets `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`; leave them unset to deploy local-only.

The `service_role` key is never needed by the app and must never be put in the frontend or
committed.

## What is stored

Progress only: box, due date, grade history, lesson position, and the account email. No
content, no question or answer text — the corpus stays static and client-side (ADR-0004).

## Security notes

- The anon key is public and safe **only** because RLS is enabled on both tables; every
  policy restricts rows to `auth.uid() = user_id`. Don't disable RLS.
- `delete_account()` is `SECURITY DEFINER` with a pinned `search_path` and is executable only
  by the `authenticated` role. It deletes the caller's rows and their auth user.
