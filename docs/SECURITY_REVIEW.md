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

- Local pgTAP tests for migration 002 are authored to cover grants, RLS, two-user row isolation, owner-only writes, and DELETE denial; the CI workflow runs them against a disposable local Supabase stack.
- Live two-user RLS/API save-readback probe and a manual-only workflow are authored, with explicit project-ref allowlisting and a fail-closed preflight that refuses to overwrite unmarked saves. The live probe has not run because the connected Supabase project is inactive and no separate active staging environment has been configured.
- Signup/email confirmation, password reset delivery, browser conflict prompts and restore, simultaneous tabs, and concurrent account-switch browser behavior remain unverified live. Unit tests do not substitute for these environment-dependent checks.
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




## Browser DOM source-to-sink audit

- See WEB_DOM_SECURITY.md for the review of browser HTML sinks and the Chromium regression.
- Saved item metadata is normalized before UI use and escaped at HTML-string sinks. Saved journal entries are capped to 80 lines and 1,000 characters each, then escaped at render time.
- The XSS regression seeds hostile text into a v5 local save and checks inventory/equipment, journal and archive views. This does not certify Unity UI, live Supabase responses, or third-party scripts.

## Browser local-save encryption

- New local writes use Web Crypto AES-256-GCM with a fresh random 96-bit IV per write. The non-extractable key is stored in IndexedDB, separately from the localStorage ciphertext envelope; write/read-back verification is required.
- The rollout deliberately deletes plaintext v5 local saves and their rolling backups rather than carrying old cleartext forward. Failed authentication/decryption of an existing envelope also clears that envelope and its local backups. There is no plaintext fallback when Web Crypto or IndexedDB is unavailable.
- This protects casual inspection of localStorage, not against same-origin script compromise or a player controlling their own browser: code running in the same origin may request the IndexedDB key and decrypt the save. Encryption is not server-side anti-cheat.
- Optional signed-in cloud backup still sends the in-memory save object to the existing Supabase table; this patch encrypts the browser's localStorage representation, not the Supabase JSONB payload. The current version remains client-trusted.


## Sprint 3 — cloud-save reliability

- The browser cloud-write queue binds each queued snapshot to the authenticated user ID, keeps the newest pending same-account snapshot, and retries failed writes with bounded exponential backoff. A stale queued snapshot is not moved to another account after an account switch.
- Cloud-save status events distinguish pending, syncing, saved, retrying, rejected, signed-out and idle states; the game UI no longer presents a cloud write failure as a successful cloud sync.
- Cloud restore only accepts the documented v5 save contract. Account identity is checked before applying a remote restore, and the original primary/encrypted-backup bytes are restored if identity changes during the write where storage permits.
- Cloud-conflict backups use `ashen-crown-3d.cloud-conflict.backup.*`, outside the legacy migration scanner's namespace. This prevents encrypted conflict snapshots from being mistaken for unknown legacy plaintext backups at startup.
- Unit tests cover queue account isolation, retry behavior, newest-save precedence, v5 validation, and conflict-backup namespace behavior. Live Supabase RLS/account tests remain unverified: they must run in a staging project with two controlled accounts.


## Sprint 4 — Supabase verification harness

- Added `supabase/tests/player_web_saves_rls.test.sql` for pgTAP grants/policy assertions, with synthetic users and saves rolled back per test.
- Added a local-only Supabase CLI configuration and a GitHub Actions workflow that runs `supabase start` + `supabase test db` without linking a remote project.
- Added a manual-only live staging workflow and `tests/integration/supabase-cloud-save.mjs`. It uses only a publishable/anon key, requires explicit confirmation and an exact project-ref allowlist, refuses to overwrite unmarked saves, and tests two distinct authenticated users.
- The configured `AshenCrownUnity` project is inactive. No reactivation, live migration, or live data write was attempted; live RLS therefore remains unverified pending a separately active staging project and dedicated test accounts.
