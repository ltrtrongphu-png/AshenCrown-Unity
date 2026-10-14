# Changelog

## Unreleased — full upgrade pass

### Fixed
- Standardized the browser logo path to `assets/ashen-crown-logo.svg`; the web build now fails if a required source asset is missing instead of hiding the issue behind a fallback SVG.
- Restricted the Unity loot-test key L to Editor/Development builds.
- Replaced timeout-only removal of browser skill-ring effects with game-loop expiry and geometry/material disposal.
- Aligned the browser cloud-save payload with the additive `player_web_saves` schema and removed its obsolete `save_text` field.

### Added
- Unity project version/package scaffolding and runtime/EditMode assembly definitions.
- A reproducible Editor menu command to generate a combat sandbox scene and navigation data.
- Web build CI, production dependency audit/secret scan, and a manual Unity EditMode workflow (requires Unity licensing secrets).
- Supabase migration 002 for user-isolated browser save rows and RLS policies.
- Initial setup, controls, deployment, save-format, architecture, systems-status, and contributor documentation.

### Not yet verified
- Unity Editor compile, generated scene playability and NavMesh/AI behavior.
- Web build and GitHub Actions outcomes at the time this changelog was authored.
- Browser FPS/heap/GPU soak metrics, Lighthouse and real deployment 404s.
- Migration 002 applied against a live/local Supabase instance and two-user RLS isolation.
- All legacy browser `innerHTML` sinks, all transient Three.js resource creation sites, and all endgame systems end-to-end.
