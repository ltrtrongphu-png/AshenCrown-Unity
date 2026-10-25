# Backlog from the full upgrade pass

This file distinguishes code changes completed in this branch from work still requiring larger architectural changes or real test environments. Items below are not claimed complete merely because docs or CI scaffolding exists.

## Completed in this pass

- Canonical lower-case logo path is used by the homepage, build allow-list, and service-worker precache; the build now fails for missing required files instead of silently emitting a fallback logo.
- The web build syntax-checks `auth.js`, `auth-config.js`, and the shared `save-utils.js` module in addition to the existing browser scripts; static ref checking now verifies local module imports against the deployment allow-list.
- The Unity loot-test key L is gated to Editor/Development builds.
- Skill-ring effects reuse prewarmed meshes/geometries/materials; the pulse effect now expires in the game tick and disposes its transient child resources instead of using a timeout with no disposal.
- Added six Node tests for HTML escaping and save-record normalization; GitHub Web CI passed these tests, the allow-list checks, and a 21-file Vercel artifact build on the last verified run.
- `GameplayEventBridge` no longer polls `FindObjectsOfType` every second: player/boss lifecycle events now drive subscriptions, with PlayerRegistry and BossController cleanup/reset handling.
- Added an EditMode test source for player and boss registry lifecycle. It has not run in Unity because the GitHub workflow has no configured Unity license.
- Added additive migration 002 for `player_web_saves` with RLS select/insert/update own-row policies, no anonymous/delete policy, a JSONB size limit, and a version field. The browser upsert was aligned to this schema.
- Added minimal Unity project/package/assembly scaffolding, web/security workflows, and a manual licensed Unity EditMode workflow.
- Updated repo setup/deployment docs and source-derived system/controls status.

## Remaining engineering work

### Unity and architecture
- Open/compile in Unity 2021.3 LTS; resolve errors/warnings, test static reset/lifecycle, and create a real sandbox scene with navigation and configured combat/boss encounter.
- Split the single runtime assembly only after a dependency graph is created and any cycles are identified.
- Run `RegistryLifecycleTests` and add scene reload/unload subscription tests in Unity Editor; static lifecycle refactor is in place, but not runtime-tested.
- Replace remaining IMGUI HUDs only after a framework/migration decision; this pass adds safe scale/alpha controls for feedback toasts but does not claim the entire HUD suite has migrated. Cache UI values and measure GC before/after.
- `AnimatorSafe`, `AnimationPresentationController`, and the legacy `CharacterAnimationController` compatibility facade now share cached state checks, bounded locomotion/playback values, action de-duplication, and optional integration in player movement/combat. `CombatPresentationFeedback` owns shared hit-stop, hooks player hit/parry/perfect-dodge events, and respects reduced motion. HUD alpha/scale settings are exposed and applied to feedback toasts. Remaining: run Unity EditMode tests, author/verify real Animator Controllers/clips, add camera/animation integration PlayMode tests, and confirm state timing against the actual GLB rig.
- Pool projectile/effect/floating-text objects, audit all singleton static cleanup, and measure Unity performance with Profiler/Memory Profiler.

### Save, authentication, and online safety
- Keep existing save schema v5. A future v6 requires user-approved schema, a v5 fixture, migration code, and round-trip/corruption tests.
- Add platform-specific secure refresh-token persistence/session restoration, request cancellation/backoff/retry policy, and mock HTTP tests to the Unity Supabase client. Timeout and friendly error mapping, correct email-confirmation handling, and in-memory refresh are now in source.
- Run migration 002 against a real/local Supabase environment, especially two-user row isolation, size limits, account switches during restore, and cloud-save retries. Client queue/conflict regression tests exist, but do not infer live RLS/runtime behavior from SQL source or unit tests alone.
- Decide explicitly whether online leaderboards/trading exist. Client saves must not be trusted as authoritative competitive state.
- Decide whether `server/` should be completed or removed; this branch does not silently delete it or invent an OpenAI endpoint.

### Browser gameplay
- Continue auditing remaining dynamic Three.js geometry/material/texture ownership, especially spawned enemies, wildlife, map creation/disposal and resource-pack replacement. The skill ring and pulse effect paths were fixed, but this is not a whole-renderer leak audit.
- Split `play.js` into modules only after behavior tests cover save, equipment, quests, collision and combat. Preserve save key `ashen-crown-3d`, save version 5, `ashen:game-ready`, `ashen:game-init-error`, `window.ASHEN_CAMPAIGN`, and `window.AshenAuth.queueSave`.
- Finish the item-by-item `innerHTML` source-to-sink review and browser XSS regression test. Six unit tests now cover `escapeHtml` and `sanitizeItemRecord`, but they do not exercise the full browser DOM or prove every sink safe.
- Replace DOM text-replacement localization with key-based dictionaries only after translation-key coverage across all five languages exists.
- Complete touch/gamepad/remappable controls, focus management, reduced-motion checks, offline update UX, and 10-minute memory soak test.

### Baseline/CI/release
- Web CI, npm audit, Gitleaks and CodeQL passed on PR head `5d90156ddbf50e33441d694b3df5b0116cd8ba21`. Re-run or inspect the latest workflow status if another commit is pushed before merge. Unity EditMode execution remains skipped without a license.
- Unity CI requires valid Unity license secrets; the workflow intentionally skips EditMode execution when the license is absent. Several new animation/combat/HUD test sources are authored but have not run in a Unity Editor.
- Capture real browser performance numbers, gzip/Brotli sizes, 404/console traces, and Lighthouse before/after.
- Finish `ARCHITECTURE.md`, `SAVE_FORMAT.md`, a full system status review, release checklist, and decision on project LICENSE.
- Branch protection currently was reported disabled during Phase 0; enable required checks after CI stabilizes.

## Choices deliberately not made implicitly

- Complete or remove `server/`.
- Move web code to `web/` or enable Git LFS.
- Choose UGUI versus UI Toolkit, URP, or a GLB importer.
- Approve save schema v6.
- Add online leaderboard/server-authoritative economy.
- Choose esbuild versus Vite, production source-map policy, or Draco/meshopt/KTX2 asset pipeline.
- Choose project license.

These choices are documented because wrong defaults can break integration, save compatibility, asset import, or deployment.
