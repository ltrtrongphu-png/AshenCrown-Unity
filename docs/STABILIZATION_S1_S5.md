# S1–S5 stabilization audit

Audit started: 2026-10-27. Scope: merged PRs #76–#81 and the current browser-demo, save, auth/cloud-save, RLS test, DOM security, performance, and CI paths. This is a source/CI audit; live Supabase behavior and Unity Editor runtime are separate environment-dependent checks.

## Sprint coverage

| Sprint | Main outcome | Current verification | Important limit |
|---|---|---|---|
| S1 — safe saves and performance harness | AES-GCM local-save v5 migration, verified backup/recovery, import/export, browser performance tooling | Web unit tests and browser save migration/export-import job pass on the current stabilization PR | This audit found a gap: decrypted encrypted primary saves were not validated against v5. The fix and regression tests are in the stabilization PR. |
| S2 — browser DOM/XSS | Saved item/journal text is sanitized/escaped at DOM sinks; Chromium regression | XSS E2E passes on the current stabilization PR | Does not validate Unity UI or all third-party scripts. |
| S3 — cloud-save reliability | Account-bound in-memory queue, retry/backoff, v5 cloud contract, conflict backup, account-switch guards | Cloud queue unit coverage and static checks are in Web CI; local browser journey passes | Live cross-account behavior is unverified without an active isolated staging project and two dedicated test accounts. |
| S4 — Supabase verification | Local pgTAP RLS suite and guarded two-account staging probe | The stabilization PR adds checks that authenticated users have no TRUNCATE/REFERENCES/TRIGGER privileges; local pgTAP is triggered by the migration/test diff | Live RLS/API isolation is not verified. The connected project is inactive; do not activate or write to it as part of this audit. |
| S5 — WebGL soak guardrails | Analyze sustained geometry/texture growth and produce diagnostic artifacts | Ordinary PRs run short smoke; stabilization PRs run three 60-second baselines plus the ten-minute soak | Actual baseline/soak outcome is being collected for this stabilization pass; no result is assumed in advance. |

## Regression found and fix

readEncryptedLocalSave previously accepted any decrypted JSON object in the encrypted-primary branch. Plaintext migration and cloud restore validate isValidSaveV5, but a ciphertext whose authentication tag was valid and whose payload had an unsupported schema/version could be passed into the game instead of entering recovery. The stabilization PR now checks the decrypted value against v5, preserves the primary bytes, offers a valid recovery backup where available, and sets recovery mode. It also validates the encrypted backup slot before treating it as a last-known-good v5 save, while preserving the explicit ashen-crown-recovery-v1 backup format used by import rollback.

Regression coverage includes an unsupported encrypted primary, a good encrypted v5 backup, repairing a schema-invalid encrypted backup, and preserving opaque import-recovery bytes.

The S4 privilege audit also found that revoking only DELETE could leave old direct or PUBLIC grants on TRUNCATE/REFERENCES/TRIGGER if a table already existed. The migration now revokes all table privileges from PUBLIC, anon, and authenticated, then grants only SELECT/INSERT/UPDATE to authenticated. The pgTAP plan is expanded from 18 to 21 assertions to cover the extra forbidden privileges.

## Gameplay verification

The existing browser workflow intentionally skips the ten-chapter campaign test on normal PRs. To make this stabilization actually exercise the campaign without making every PR pay that cost, the full campaign now runs on stabilization/* branches as well as scheduled/manual runs. The performance workflow on stabilization branches also runs three repeatable 60-second baselines plus the full ten-minute soak. The test covers all ten objective/warden/choice cycles, a Chapter 1 reload/death recovery edge, merchant purchase/equip, final save persistence after reload, browser exceptions, console errors, and same-origin request failures.

A campaign pass will show that the scripted browser path works under CI's software WebGL renderer; it is not a substitute for human playtesting, a hardware GPU run, Unity Editor tests, or live cloud account switching.

## Known environment-dependent work still open

- Live S4 two-account staging probe and Supabase migration/RLS verification; requires a separate active staging project and two dedicated test-only credentials.
- Full ten-minute WebGL soak and three repeatable baselines; this stabilization branch runs them while ordinary PRs retain the short smoke.
- Unity 2021.3 LTS compile/EditMode/PlayMode; the current GitHub Unity job skips actual Editor execution if UNITY_LICENSE is absent.
- Production deployment status and hardware/browser performance/Lighthouse.
