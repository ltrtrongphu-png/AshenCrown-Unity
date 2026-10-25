# S4 — Supabase RLS and cloud-save staging verification

Sprint 4 adds repeatable local database policy tests and a separate, opt-in live staging probe. It does **not** activate, migrate, or write to the configured inactive Supabase project by default.

## Local pgTAP regression

Requirements: Docker and the Supabase CLI.

```sh
supabase start
npm run test:supabase:rls
supabase stop --no-backup
```

The SQL test seeds two synthetic `auth.users` rows inside a rolled-back test transaction and verifies:

- `player_web_saves` exists and RLS is enabled.
- `anon` has no table privileges and cannot read rows.
- Each authenticated identity can see only their own save.
- Cross-account upsert and owner reassignment are rejected.
- Authenticated users cannot delete saves.
- An owner can update their own save and the other user's record remains unchanged.

GitHub Actions runs this against a disposable local Supabase stack when files under `supabase/` change. It does not link to the remote project.

## Live two-account staging test

The workflow `Supabase isolated staging integration` is manual-only. It requires two pre-created, confirmed **test-only** accounts, the publishable/anon key for an isolated staging project, and repository Actions secrets:

- `ASHEN_S4_SUPABASE_URL`: `https://<project-ref>.supabase.co`
- `ASHEN_S4_SUPABASE_PUBLISHABLE_KEY`: publishable key or legacy anon JWT; never a service-role/secret key
- `ASHEN_S4_ALLOWED_PROJECT_REF`: the exact staging project ref expected in the URL
- `ASHEN_S4_USER_A_EMAIL`, `ASHEN_S4_USER_A_PASSWORD`
- `ASHEN_S4_USER_B_EMAIL`, `ASHEN_S4_USER_B_PASSWORD`

To run: open Actions → **Supabase isolated staging integration** → Run workflow, then deliberately select **YES - isolated staging only**. The code independently checks the URL project ref against the allowed ref and refuses to make any network request without its explicit confirmation phrase.

### Data safety behavior

Before writing, the live probe reads both accounts' existing cloud row. If either row contains a save that is not explicitly marked as an S4 fixture, the test stops without overwriting it. The test writes a small valid v5 fixture only to dedicated test accounts, checks own-row save/readback, cross-account reads, cross-account upsert/update attempts, and DELETE denial. It restores the marked test fixtures through each account at the end and **does not delete rows** (the product intentionally denies client-side DELETE).

Do not use these accounts to play the game. The test leaves marked fixture saves in place. Clean them up only through a deliberate administrative action in the isolated staging project after reviewing the rows; no service-role key is used by the test script.

## What the live probe does not prove

The live API probe establishes account-level row isolation and basic save/readback through Supabase Auth and the Data API. It does not certify every browser UI path, email confirmation/reset delivery, offline retries, or simultaneous tabs. The existing unit suite covers cloud-save conflict decisions; a separate browser/session walkthrough should still validate conflict prompts, restore on a clean browser profile, account switching during restore, and production Auth redirect configuration.

## Current environment limitation

The connected `AshenCrownUnity` Supabase project is currently `INACTIVE`, and schema/migration inspection timed out. S4 intentionally does not reactivate it or run writes against it. The live workflow should only be configured with a separate active staging project. Until that workflow completes successfully, live RLS remains **unverified**.
