# Changelog

## Unreleased — bug hunt, stabilize and smoothness pass

### Fixed in this pass
- Centralized Unity hit-stop writes in TimeScaleService; overlapping requests compose, pause takes precedence, owners can release requests, and expiry is driven by unscaled time. The MonoBehaviour driver has its own matching source file and the steady-state path avoids per-frame list allocations.
- Guarded invalid/zero stamina and ultimate maxima, sprint speed, forced movement values, and boss speed multipliers; added EditMode regression-test sources.
- Restored StatBlock event subscriptions after disable/enable and retained exact source references for symmetric unsubscribe.
- Avoided redundant browser save writes; idle-scheduled periodic saves use a stable payload comparison excluding only savedAt.
- Added explicit local/cloud save conflict decisions in browser and Unity clients. Local data is backed up and verified before an overwrite; browser keeps three rolling raw-save backups; equal timestamps with different payloads also prompt.
- Disposed owned Three.js resources for defeated fallback encounters while retaining shared materials and cached production boss assets.
- Added finite/non-negative elapsed-time protection to the browser frame loop, rate-limited save failure diagnostics, and gated the F10 contract-refresh debug shortcut to Editor/Development builds.
- Added a bounded 1-second realtime retry for Unity cloud save/load after transient network, 429 or 5xx failures; 401 continues to trigger a forced refresh and a single retry.
- Added Node built-in regression tests and wired syntax checking into Web CI without adding runtime dependencies.


### Fixed
- Standardized the browser logo path to `assets/ashen-crown-logo.svg`; the web build now fails if a required source asset is missing instead of hiding the issue behind a fallback SVG.
- Restricted the Unity loot-test key L to Editor/Development builds.
- Replaced per-use allocation for skill-ring feedback with prewarmed reusable effects; moved pulse expiry into the game tick and dispose transient child resources.
- Added the missing production-boss attachment helper used when the GLB pack loads.
- Aligned the browser cloud-save payload with the additive `player_web_saves` schema and removed its obsolete `save_text` field.

### Added
- Unity project version/package scaffolding and runtime/EditMode assembly definitions.
- A reproducible Editor menu command to generate a combat sandbox scene and navigation data.
- Web build CI, production dependency audit/secret scan, and a manual Unity EditMode workflow (requires Unity licensing secrets).
- Supabase migration 002 for user-isolated browser save rows and RLS policies.
- Initial setup, controls, deployment, save-format, architecture, systems-status, and contributor documentation.

### Not yet verified
- Unity Editor compile, generated scene playability and NavMesh/AI behavior.
- Latest observed Web CI passed reference checks, 6/6 web utility tests, JavaScript syntax checks, artifact assertions, whitespace checks and built 21 browser files (~9.90 MiB). Security checks (npm audit/Gitleaks) also passed. CodeQL passed on the current PR head, as of 2026-10-14.
- Browser FPS/heap/GPU soak metrics, Lighthouse and real deployment 404s.
- Migration 002 applied against a live/local Supabase instance and two-user RLS isolation.
- Unity Editor compile, generated sandbox playability, and the newly authored animation/feedback/HUD EditMode test sources.
- All legacy browser `innerHTML` sinks, all transient Three.js resource creation sites, and all endgame systems end-to-end.

### Verification status for this pass
- The GitHub Actions Web CI run on the bug-fix PR is the source of truth for Node tests, reference checks, syntax checks and the web artifact build; see PR checks before merging.
- Unity EditMode tests, real browser interactions, 10/30-minute soak tests, measured frame-time/GC data, and live Supabase/RLS tests remain unverified unless the relevant environment is configured and its run output is green.
