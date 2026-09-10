# Supabase — progress sync

Cross-device progress sync (ADR-0020). Optional: with no Supabase project configured the app
runs local-only, exactly as before.

## Setup

1. Create a Supabase project.
2. Run every migration in order — either `supabase db push`, or apply the SQL files through
   the project's SQL editor. `0001` creates progress sync; `0002` scopes it by track and maps
   every existing row to React. Apply `0002` before deploying a frontend built after ADR-0023.
3. **Authentication → Providers**: enable **Google** with the OAuth client ID and secret from
   Google Cloud, and disable **Email**. Google is the only sign-in method offered by the app
   (ADR-0026).
4. In **Authentication → URL Configuration**, set the Site URL to
   `https://aguslop0921.github.io/reps/` and add it to Redirect URLs. Add
   `http://localhost:5173/` for local development.
5. In the Google OAuth client's **Authorized redirect URIs**, add exactly
   `https://oxmazwgnucyzqttbqqvv.supabase.co/auth/v1/callback`. This is Supabase's callback;
   adding the GitHub Pages URL here instead causes Google's `redirect_uri_mismatch` error.
6. Copy `.env.example` to `.env` and fill in from **Project Settings → API**:
   - `VITE_SUPABASE_URL` — the project URL
   - `VITE_SUPABASE_ANON_KEY` — the public anon key
7. In your deploy set the same two variables as build env vars. This project ships to GitHub
   Pages (`.github/workflows/deploy.yml`), so add them as repo secrets `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`; leave them unset to deploy local-only.

The `service_role` key is never needed by the app and must never be put in the frontend or
committed.

## What is stored

Progress only: track id, box, due date, grade history, lesson position, and the account email.
No content, no question or answer text — the corpus stays static and client-side (ADR-0004).

## Security notes

- The anon key is public and safe **only** because RLS is enabled on both tables; every
  policy restricts rows to `auth.uid() = user_id`. Don't disable RLS.
- `delete_account()` is `SECURITY DEFINER` with a pinned `search_path` and is executable only
  by the `authenticated` role. It deletes the caller's rows and their auth user.
