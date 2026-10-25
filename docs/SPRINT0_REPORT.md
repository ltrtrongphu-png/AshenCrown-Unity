# Sprint 0 — Baseline refresh and decision records

**Date:** 2026-10-25  
**Repository:** `ltrtrongphu-png/AshenCrown-Unity`  
**Reviewed ref:** `main` @ `cd34e5ec2f0442238040a32e2c40ef258f4b987e`  
**Purpose:** complete Sprint 0 of `AshenCrown_MASTER_SYNTHESIS_Prompt_v2.md`; this is a source/metadata audit, not a runtime verification.

## Verification boundary

### ĐÃ XÁC MINH (remote source / GitHub metadata)
- Latest commit is `cd34e5ec2f0442238040a32e2c40ef258f4b987e`, titled “Fix and verify the full 10-chapter /play campaign”.
- The commit's combined status endpoint reports the Vercel check as **success**. This endpoint did not return the complete GitHub Actions run matrix.
- `.github/workflows/game-smoke.yml` defines Chromium smoke and a 10-chapter campaign Playwright run, with a 35-minute timeout.
- `.github/workflows/unity.yml` skips EditMode execution when `UNITY_LICENSE` is unset; a green workflow summary alone is not proof that Unity tests ran.
- `vercel.json` still permits script CDNs (`cdn.jsdelivr.net`, `esm.sh`, `unpkg.com`) and `style-src 'unsafe-inline'`.
- `auth.js` imports the Supabase client from jsDelivr and configures persistent browser auth storage.
- `docs/SAVE_FORMAT.md` explicitly documents that the first encrypted-save rollout deletes plaintext `ashen-crown-3d` data and legacy `ashen-crown-3d.backup.*` keys rather than migrating them. It also documents IndexedDB keyring loss as unrecoverable for local-only saves.
- `play.js` contains a hard-coded owner email check and QA helper functions; the owner controls are client-side and must not be trusted for server-side rewards.
- `server/package.json` starts `node src/index.js`; a direct lookup of `server/src/index.js` on `main` returned 404.
- Save contracts remain web `localStorage['ashen-crown-3d']`, schema v5, and Unity `AshenSaveData.version = 5`; no schema change is proposed in this sprint.

### CHƯA XÁC MINH
- A clean local checkout could not be made in this environment: `git clone https://github.com/ltrtrongphu-png/AshenCrown-Unity.git` failed because DNS resolution for `github.com` was unavailable. Therefore `npm ci`, `npm test`, `npm run check:syntax`, `npm run check:refs`, `npm run check:build-cache`, and `node tools/build-web.mjs` were **not run here**.
- The full latest Actions run/job/step matrix, especially `game-smoke`, was not returned by the available commit-run lookup. Only the Vercel combined status above is confirmed.
- No local Playwright/browser execution, Lighthouse, FPS/heap/renderer soak, Unity Editor compile/EditMode/PlayMode test, or live Supabase two-account RLS test was run.
- GLB sizes, mesh/material/triangle counts and total `dist/` size from the prompt remain **prompt-reported static measurements**, not independently recalculated during this pass.

## N-1…N-13 triage

| Finding | Sprint 0 assessment | Evidence / next proof |
|---|---|---|
| N-1 — encrypted local save rollout may delete old progress | **Confirmed in documentation; P0** | `docs/SAVE_FORMAT.md` describes intentional deletion of plaintext and old backup keys. Inspect exact migration/boot code, then add migrate-verify-backup and plaintext-v5 regression fixtures before changing behavior. |
| N-2 — Owner/QA controls are client-trusted and email is hard-coded | **Partly confirmed; P1** | `play.js` checks a hard-coded owner email and contains QA helpers. Production exposure and whether any helper is attached to `window` still require a full bundle/browser test. |
| N-3 — GLB roster/bundle/GPU overhead | **Risk plausible; measurements not independently re-run; P1** | Prompt reports roster/model counts and bundle growth. Recompute from GLB/build artifacts, then use the Sprint 1 profiler before optimizing. |
| N-4 — CSP permits unnecessary script CDNs and inline styles | **CSP policy confirmed; removing origins not yet safe; P2** | `vercel.json` allows three script CDNs; `auth.js` currently imports Supabase from jsDelivr. Self-host/replace that dependency before tightening directives. |
| N-5 — `play.js` monolith, HTML sinks, listener cleanup | **Maintainability risk; counts/runtime behavior not fully verified; P1/P2** | Prompt reports 3,745 lines/~263 KB. Recalculate exact sink/listener counts from current source; audit every HTML sink with source-to-sink tests before modularization. |
| N-6 — Unity project not runtime-verified | **Confirmed as a verification gap; P1** | Unity workflow is license-gated. Must run Unity 2021.3.45f1 compile/EditMode and a reproducible sandbox; workflow configuration alone is not test evidence. |
| N-7 — no actual performance baseline | **Confirmed in `docs/PERF_BEFORE_AFTER.md`; P1** | Metrics remain “Not measured”; create the repeatable harness before performance changes. |
| N-8 — audio/VFX gap | **Prompt-reported source gap; runtime/art review pending; P2** | Audit `AudioSource`/audio pipeline and Web Audio paths; any licensed asset requires a recorded license. |
| N-9 — factual counts may disagree across docs | **Potential drift; P3** | Add a deterministic docs-facts checker only after deriving counts from artifacts, not hard-coded assumptions. |
| N-10 — repeated listeners/timers | **Not reproduced; P2** | Static source inspection cannot prove repeated UI lifecycle safety; add open/close-20-times Playwright test and verify one action per click. |
| N-11 — Unity/web gameplay systems diverge | **Architecture risk; P2** | Confirm the shared-data scope and mapping before creating `data/`; no migration is made in Sprint 0. |
| N-12 — Unity cloud refresh-token persistence/backoff | **Known gap in `docs/BUGLOG.md`; P2** | Secure storage and mock HTTP tests require platform-specific design and Unity verification. |
| N-13 — server entry point absent | **Confirmed by source lookup; decision required; P3** | `server/package.json` points to `src/index.js`, which returned 404. Do not invent an API or delete the folder until the product purpose is chosen. |

## DR-1…DR-10 — recommendations for owner decision

| DR | Recommendation | Why / risk |
|---|---|---|
| DR-1 Product focus | **Web first for public playable release; Unity brought to compile + sandbox parity in parallel.** | Web currently has the playable campaign and browser workflow; Unity runtime is not yet evidenced. |
| DR-2 `server/` | **Defer deletion; decide after confirming no intended endpoint.** | The start target is absent, but deletion is irreversible product-scope cleanup. |
| DR-3 web split / LFS | **Use Git LFS for large binary assets before the next major asset wave; defer `web/` relocation.** | Avoid a large path migration during save/perf stabilization. |
| DR-4 Unity UI/rendering | **UGUI for combat HUD; evaluate URP only with a working scene and profiler baseline.** | Avoid renderer migration before Unity can compile and run. |
| DR-5 save v6 | **Keep v5.** | First repair safe v5 migration/export/import; no demonstrated need for schema v6. |
| DR-6 online scope | **Single-player + authenticated cloud save only; no leaderboard/reward authority on client saves.** | Client state and Owner tools are tamperable. |
| DR-7 bundler/assets | **esbuild, meshopt + KTX2, no public production source maps, but benchmark each change.** | Fits the existing static allow-list build while preserving measurement discipline. |
| DR-8 license/business | **Choose license and monetization before Release Gate; no loot-box/pay-to-win.** | Needed for release/legal clarity; owner decision required. |
| DR-9 asset sources | **CC0/explicit commercial license; log every model/texture/font/audio in `docs/ASSET_LICENSES.md`; no AI music without approval.** | Prevents unclear redistribution rights. |
| DR-10 Owner/QA tools | **Preview/dev only; remove hard-coded personal email and production QA hooks.** | Client-side checks are not authorization and disclose personal information. |

## Sprint 1 ticket plan (estimates)

1. **S1-A — Save migration safety (L, P0):** inventory the actual encryption loader; add plaintext-v5 and encrypted-v5 fixtures; migrate → encrypt → read/decrypt/compare → retain encrypted backup → only then remove old copies; add explicit export/import and local-only warning. Do not alter the public key/schema.
2. **S1-B — Browser perf harness (L, P1):** pinned Playwright Chromium, fixed encounter script, frame percentiles, long tasks, renderer memory/calls/triangles, heap where supported, game-ready time, network bytes and localStorage writes; JSON output.
3. **S1-C — Three-run baseline (M, P1):** run each scenario at least three times, report median and machine/runtime details; fill `docs/PERF_BEFORE_AFTER.md` only with observed data.
4. **S1-D — Debug overlay (M, P2):** `?debug=1` only; keep off by default in production; verify overlay does not materially change the measurement.
5. **S1-E — nightly soak (M/L, P1):** 10-minute map/menu/skill cycle; fail on monotonic geometry/texture growth and unexpected exceptions.
6. **S1-F — Unity PerfRecorder (L, blocked by Unity runtime):** implement only after the Unity Editor/license path is available; report as blocked rather than fabricating numbers.

**Sprint 1 acceptance:** old v5 progress survives upgrade with a regression test; export/import works; browser measurements have ≥3 runs and medians; Unity metrics are explicitly marked blocked if no real Unity runtime is available. No new gameplay content in this sprint.
