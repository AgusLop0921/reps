# ADR-0026: Google-only authentication for progress sync

- **Status:** Accepted
- **Date:** 2026-09-08
- **Amends:** ADR-0020, ADR-0021

## Context

The optional sync feature offered Google OAuth and email magic links. Maintaining two providers
made the account surface and provider configuration larger than needed. The product now needs
one consistent sign-in path, and the Google OAuth configuration must be explicit enough to
avoid an invalid redirect request.

## Decision

We decided that Google OAuth is the only account sign-in method for optional progress sync.
The app continues to offer local-only use without an account, so this does not make signing in
mandatory.

We removed magic-link initiation and every email sign-in control from the client. Supabase Email
authentication must be disabled. Supabase continues to own the OAuth exchange: Google must
authorize the project's exact Supabase callback URI, while Supabase must allow the deployed app
URL and the local development URL as post-auth redirects.

## Consequences

- There is one provider to configure and one account action to explain in the UI.
- Existing users who signed in only with an email magic link cannot use that method after Email
  authentication is disabled. Google sign-in creates or uses its Google identity; this decision
  does not add identity-linking or progress migration.
- A bad Google OAuth callback remains a deployment configuration error, not a client-side
  fallback. The setup instructions record the exact URI required for this Supabase project.
- IndexedDB remains the source of truth, and no storage schema, Supabase migration, or sync
  protocol changes are required.
