# Backlog from the full upgrade pass

This file distinguishes code changes completed in this branch from work still requiring larger architectural changes or real test environments. Items below are not claimed complete merely because docs or CI scaffolding exists.

## Completed in this pass

- Canonical lower-case logo path is used by the homepage, build allow-list, and service-worker precache; the build now fails for missing required files instead of silently emitting a fallback logo.
- The web build syntax-checks `auth.js` and `auth-config.js` in addition to the prior script list.
- The Unity loot-test key L is gated to Editor/Development builds.
- Transient skill-ring effects are removed from the scene and dispose their generated geometry/material in the game tick instead of using a timeout with no disposal.
- Added additive migration 002 for `player_web_saves` with RLS select/insert/update own-row policies, no anonymous/delete policy, a JSONB size limit, and a version field. The browser upsert was aligned to this schema.
- Added minimal Unity project/package/assembly scaffolding, web/security workflows, and a manual licensed Unity EditMode workflow.
- Updated repo setup/deployment docs and source-derived system/controls status.

## Remaining engineering work

### Unity and architecture
- Open/compile in Unity 2021.3 LTS; resolve errors/warnings, test static reset/lifecycle, and create a real sandbox scene with navigation and configured combat/boss encounter.
- Split the single runtime assembly only after a dependency graph is created and any cycles are identified.
- Replace `GameplayEventBridge` periodic `FindObjectsOfType` polling with registries/events and add scene reload subscription tests.
- Replace remaining IMGUI HUDs with a selected UI framework after migration/accessibility review; cache UI values and measure GC before/after.
- Implement animation presentation controller, combat feedback/time-scale reset, controller assets, and timing tests. Do not claim missing animation clips exist.
- Pool projectile/effect/floating-text objects, audit all singleton static cleanup, and measure Unity performance with Profiler/Memory Profiler.

### Save, authentication, and online safety
- Keep existing save schema v5. A future v6 requires user-approved schema, a v5 fixture, migration code, and round-trip/corruption tests.
- Add secure refresh-token/session renewal, cancellation, timeout/retry, friendly error mapping, and mock HTTP tests to the Unity Supabase client.
- Test migration 002 against a real/local Supabase environment, especially two-user row isolation, size limits, and browser cloud-restore behavior. Do not infer RLS runtime behavior from SQL source alone.
- Decide explicitly whether online leaderboards/trading exist. Client saves must not be trusted as authoritative competitive state.
- Decide whether `server/` should be completed or removed; this branch does not silently delete it or invent an OpenAI endpoint.

### Browser gameplay
- Extend transient-effect lifecycle fixes to all dynamic effect creation sites, including map changes, spawned enemies, wildlife and sanctuary construction.
- Split `play.js` into modules only after behavior tests cover save, equipment, quests, collision and combat. Preserve save key `ashen-crown-3d`, save version 5, `ashen:game-ready`, `ashen:game-init-error`, `window.ASHEN_CAMPAIGN`, and `window.AshenAuth.queueSave`.
- Audit all dynamic `innerHTML` sinks and add XSS/sanitization regression tests. Static count alone does not prove exploitability.
- Replace DOM text-replacement localization with key-based dictionaries only after translation-key coverage across all five languages exists.
- Complete touch/gamepad/remappable controls, focus management, reduced-motion checks, offline update UX, and 10-minute memory soak test.

### Baseline/CI/release
- Web CI/security workflows must run successfully on GitHub; review any dependency audit or secret-scan findings.
- Unity CI requires valid Unity license secrets; current workflow clearly skips when no license is configured.
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
