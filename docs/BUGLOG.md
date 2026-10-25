# AshenCrown Bug Hunt Log

Scope: source analysis and targeted fixes for the uploaded BUG-HUNT / STABILIZE / SMOOTHNESS prompt. “Fixed in source” is not a claim that Unity, a real browser or a live service has been run.

| ID | Severity | Area | Finding | Root cause / evidence | Fix commit | Regression test | Status / verification |
|---|---|---|---|---|---|---|---|
| B-001 | P1 | Unity time scale | Hit-stop owners could capture/restore each other's global scale. | Independent combat scripts wrote Time.timeScale. | 2b9281b, 9be9e47, 4427f02 | TimeScaleServiceTests; Web CI source scan forbids writes outside the service. | Fixed in source; Unity overlap/pause/destroy-owner runtime tests still needed. |
| B-002 | P1 | Unity numeric safety | Invalid Inspector values could produce NaN/Infinity or division by zero. | Normalized stamina/ultimate and movement/boss timing used unvalidated values. | c6b1519 | NumericSafetyTests | Guards and validation added; run tests in Unity Editor. |
| B-003 | P1 | Unity static lifecycle | Static registries/events may persist across scene/play-mode transitions. | PlayerRegistry, EnemyFSM, BossController and GameplayEventBridge already reset key statics; not every singleton is covered by a uniform policy. | Existing resets; no blanket rewrite | RegistryLifecycleTests exists | Partly covered by existing code; repeated scene reload and Enter Play Mode options tests not run. |
| B-004 | P1 | Unity event lifecycle | StatBlock could stop updating after disable/re-enable. | Unsubscribed in OnDisable but only subscribed in Start, which runs once. | bed5075 | Unity runtime test still needed | Fixed in source; broader event/lambda symmetry audit remains. |
| B-005 | P1 | Periodic hitch / saves | Browser interval saved even when payload was unchanged; repeated save errors could spam diagnostics. | No stable payload comparison; Unity file/checksum work remains synchronous. GameplayEventBridge is already event-driven rather than using a 1-second scene-wide search. | e0a5897, 1a04397 | save-utils tests | Browser portion fixed in source with comparison and idle scheduling. Unity needs Profiler evidence before changing its synchronous API. |
| B-006 | P1 | Three.js resources | Defeated enemy fallback resources had no encounter cleanup path. | Encounter root was detached without disposing owned geometries/materials. | e81d5d8 | gameplay-safety source regression test | Encounter fallback path fixed; 10-minute renderer.info memory soak and full effect audit not run. |
| B-007 | P2 | Browser listeners | Possible listener multiplication when reopening UI. | Static scan found 22 listener call sites; inspected sites were at startup, delegated, or part of one-time touch-control setup. No repeated registration was confirmed. | None | Playwright smoke not run | Not reproduced statically; still needs real browser open/close 20× test. |
| B-008 | P2 | Browser timestep | Negative/non-finite elapsed time could leak into simulation. | Existing frame loop capped raw dt at 50 ms and simulation dt at 33 ms, but lacked explicit finite/non-negative validation. | be15b05 | gameplay-safety test | Fixed in source; synthetic long-frame collision test not run in browser. |
| B-009 | P1 | Local/cloud saves | Login could replace local progress with cloud progress without explicit confirmation. | Timestamp selection could silently discard offline progress. | e7fec08, 4f9c2bf, e22a1ed, d2c83aa, a9ab796 | save-utils tests; CloudSaveConflictTests | Both clients now prompt on mismatched or ambiguous saves and back up local data before cloud restore. Browser and Unity end-to-end tests remain pending. |
| B-010 | P1 | Unity Supabase auth | A server-side 401 could leave cloud operations failing; signup confirmation needed a non-null user. | Refresh/retry and signup response validation were incomplete. | 2f3dda6 | Mock HTTP tests not added | Refresh token used in memory; save/load retry once after 401; timeout/error mapping is present. Secure persistence, backoff and live Supabase tests remain. |
| B-011 | P1 | Web Supabase table/RLS | Browser schema could disagree with deployed database. | Current code/migration use player_web_saves; migration 002 defines the browser table and owner policies. Unity uses its separate player_saves contract. | Existing migration 002 | No live two-account RLS test | No source mismatch found; must apply migration and verify RLS against a real/local database. |
| B-012 | P2 | Debug shortcuts | Debug shortcut could change weekly contracts in a release build. | EquipmentHUD's L key was already gated; F10 refresh in LongTermEngagementSystem was not. | f554584 | Source inspection; no Release build | F10 gated to Editor/Development; re-scan keys and test Release build. |
| B-013 | P2 | server/ | package start script refers to a missing server/src/index.js. | GitHub contents lookup returned 404 while package manifest still references that path. | None | No server test | Deferred exactly as the prompt requires: no server purpose/endpoints are specified, so neither an API nor a deletion was invented. |
| B-014 | P3 | Browser logo | Case-sensitive path mismatch could force fallback logo. | Current build tool checks lowercase assets/ashen-crown-logo.svg. | Existing logo-path fix | Web build asset assertion | Source appears aligned; verify dist artifact in CI and live deployment separately. |
| B-015 | P2 | Unity test infrastructure | Unity tests require project/package/assembly scaffolding and a licensed runner. | ProjectSettings, Packages/manifest.json, runtime/EditMode asmdefs and tests exist; CI skips execution without license secrets. | Existing scaffolding; new tests in 2b9281b, c6b1519, e22a1ed | Unity workflow conditional on secrets | Infrastructure present; compilation and test execution not verified here. |
| B-016 | P2 | IMGUI / GC | Several HUDs still use OnGUI. | Source confirms IMGUI remains; no Profiler capture is available. | None | No before/after Profiler capture | Deferred until allocation measurements exist; no UI framework migration was made. |

## Summary

- Source fixes: B-001, B-002, B-004, browser portion of B-005, encounter-fallback portion of B-006, B-008, B-009, partial B-010, B-012.
- Reviewed existing source/infrastructure: B-003, B-007, B-011, B-014, B-015.
- Still needs real environments or a product decision: Unity Editor/PlayMode/Release, browser interactions and soak, live Supabase refresh/RLS, full Unity event audit, complete renderer leak audit, and the purpose of server/.
- This log is not release certification until those verification gaps are closed.


## Master synthesis triage — 2026-10-25

This section records the Sprint 0 status of the additional N-1…N-13 findings. It does not replace existing B-xxx records. Full evidence boundaries, decision recommendations and Sprint 1 plan: [`docs/SPRINT0_REPORT.md`](SPRINT0_REPORT.md).

| ID | Severity | Status at Sprint 0 | Required next action |
|---|---|---|---|
| N-1 | P0 | Confirmed by `docs/SAVE_FORMAT.md`: legacy plaintext and backups are deleted rather than migrated. | Add v5 fixture and migrate/verify/backup before cleanup; export/import and clear local-only warning. |
| N-2 | P1 | Partly confirmed: owner email is hard-coded in `play.js`; production exposure of QA helpers is not yet browser-verified. | Remove personal email; gate preview/dev QA code; assert no production hook and mark QA-tainted state. |
| N-3 | P1 | Static asset/bundle overhead is a risk; prompt-provided counts have not been independently remeasured in this pass. | Recalculate artifact metrics, profile first, then lazy-load/optimize with before/after screenshots. |
| N-4 | P2 | Confirmed: CSP allows three script CDNs and inline styles; `auth.js` still imports Supabase from jsDelivr. | Replace/self-host the dependency before removing origins; add CSP-violation browser test. |
| N-5 | P1/P2 | Monolithic `play.js` and lifecycle risks remain; counts and repeated-menu behavior need current-source/e2e proof. | Audit HTML sinks and listeners; add XSS and repeated open/close regression tests before module split. |
| N-6 | P1 | Unity runtime verification gap remains; EditMode workflow is license-gated. | Run Unity 2021.3.45f1 compile/EditMode and deterministic sandbox test; record actual logs. |
| N-7 | P1 | Confirmed: `docs/PERF_BEFORE_AFTER.md` still reports metrics as not measured. | Build repeatable browser/Unity instrumentation; report ≥3 runs and median. |
| N-8 | P2 | Audio/VFX gap is prompt-reported; production feel and asset review not yet validated. | Audit pipelines, license sources, then implement a small measured slice. |
| N-9 | P3 | Potential documentation drift; not all counts were recalculated. | Add deterministic docs-facts check after defining artifact-derived sources of truth. |
| N-10 | P2 | Listener duplication not reproduced from static evidence; lifecycle behavior remains unverified. | Playwright test opens/closes each menu 20× and asserts one action per click. |
| N-11 | P2 | Unity/web data divergence remains an architecture risk. | Define shared-data scope and importer plan before creating/migrating `data/`. |
| N-12 | P2 | Unity refresh-token persistence/backoff/mock HTTP remain open per existing B-010 notes. | Choose platform secure-storage adapter and add mock HTTP tests; verify in Unity. |
| N-13 | P3 | Confirmed: `server/package.json` references `server/src/index.js`, which is absent on `main`. | Owner to decide whether the backend has a required purpose before implementation or deletion. |

**Verification rule:** none of these source observations is evidence of a real-browser, Unity-runtime or live-Supabase pass.
