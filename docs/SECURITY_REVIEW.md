# Ashen Crown Security Review

Review target: browser story demo, browser save handling, Unity Supabase auth/cloud saves, Supabase migrations, and Vercel static deployment.

## Current source protections

- Browser inventory/journal paths use escaping/sanitization for player-controlled strings, but the remaining `play.js` `innerHTML` assignments still require an item-by-item source-to-sink review and regression tests.
- Browser save state is client-controlled. The local key `ashen-crown-3d` and save version 5 are preserved.
- Browser cloud-save client targets `player_web_saves`; migration `002_player_web_saves.sql` defines a row keyed by `auth.users.id`, JSONB payload size bound, version, and RLS policies limited to authenticated select/insert/update of the current user's row.
- Unity C# client still targets the separate `player_saves` table defined by migration 001, with both `save_json` and `save_text` for the current client contract.
- Browser code uses only the Supabase publishable key. Do not put `service_role`, `sb_secret_*`, user passwords, refresh tokens, or OpenAI API keys in source/bundles.
- Existing CSP/security headers in `vercel.json` were not relaxed by the full-upgrade changes.
- The browser build now requires `assets/ashen-crown-logo.svg` at the canonical lowercase path and no longer hides a missing source file behind a generated fallback.

## Unity authentication changes and remaining gap

The Unity auth client has request timeouts, safer mapped error messages, correct handling for signup requiring email confirmation, typed JSON for the existing Unity cloud-save schema, and an in-memory refresh flow.

**The refresh token is still kept in memory only.** Session restore after application restart requires a separate platform-specific secure storage abstraction (Windows DPAPI / Keychain / Keystore) and has not been implemented or verified here. There is no claim that the current in-memory refresh token is securely persisted.

## Trust boundary

A player can edit localStorage or submit a fabricated save for their own account. RLS can isolate rows between user IDs; it cannot certify a player's level, loot, quest completion, or currency. Do not treat client-reported game data as authoritative for leaderboards, competitive play, trading, purchases, or real-money rewards without server-side validation.

The repository has a `server/` directory with a package script but no `src/index.js`. This pass did not create an invented API endpoint or delete that directory. Decide whether it should be completed or removed before using it in production.

## Verification status for this branch

### Verified from source or CI metadata

- Static review identified the Unity and web table names and the matching migration fields.
- Migration 002 source includes current-user RLS predicates and no explicit DELETE policy, plus UTF-8 client size limits below the database JSONB bound.
- GitHub Actions reported the Unity workflow as successful for commit `fc6daffbbf728f22032f3d0d0e341954f8c4c49e`, but the actual EditMode test step was **skipped** because the Unity license secret is not configured. This is not a Unity compile/test pass.
- A real web build and browser/Supabase journey have not yet been confirmed in the available execution environment.

### Not yet verified

- Whether migration 002 applies cleanly to the real Supabase project and its existing tables/policies.
- Two-user RLS isolation, signup/email confirmation, sign-in/out, password reset, save, restore on a clean profile, simultaneous sessions, and cloud-save conflict behavior.
- Unity Editor compilation, generated sandbox scene behavior, PlayMode/EditMode tests, or persistent secure token storage.
- Full `innerHTML` sink audit, XSS regression test, and browser performance/memory soak.
- Production HTTP headers and real deployment network trace.

## Release checklist

1. Inspect and apply migration 002 in a staging Supabase project before production. Confirm there is no pre-existing incompatible table/policy and verify RLS with two distinct authenticated users.
2. Confirm Supabase Auth URL Configuration and production email confirmation/reset redirect URLs.
3. Test registration, email confirmation, sign-in, sign-out, password reset, saving, restore on a clean profile, and simultaneous sessions.
4. Verify a failed cloud save does not falsely report a successful sync; verify local save remains available when offline.
5. Open the Unity project in Unity 2021.3 LTS; run tests after configuring a valid Unity license for CI.
6. Before any competitive online feature, move progression/reward validation to a trusted server or database function.
