# Resource Pack Model Path Contract

This document records the case-sensitive source, build-output, module, and runtime paths used by the browser game's production character pack. It is intended to prevent the kind of silent fallback that can happen when the game canvas renders but a GLB or one of the loader modules fails to load.

## Character assets

The source files are checked into the Unity project and copied unchanged into the static browser build:

| Purpose | Repository source | Built URL |
| --- | --- | --- |
| Player Sentinel | `Assets/Models/Characters/AshenSentinel.glb` | `/Assets/Models/Characters/AshenSentinel.glb` |
| Warden / Regent | `Assets/Models/Bosses/AshenRegent.glb` | `/Assets/Models/Bosses/AshenRegent.glb` |

The path casing is intentional. GitHub Actions and the Vercel build run on case-sensitive Linux file systems, so `assets/models/`, `Assets/models/`, and `Assets/Models/` are not interchangeable.

## How the runtime pack is made

1. `tools/build-web.mjs` owns the web deployment allow-list. It copies the two GLBs to the same case-sensitive relative paths under `dist/`, then generates `dist/resource-pack.json` with a content-derived version and exact byte sizes.
2. The generated manifest's `files[].url` values are absolute same-origin URLs. `play.js` fetches `./resource-pack.json`, downloads/caches both GLBs under `ashen-resource-pack-<version>`, and verifies each downloaded byte count before parsing.
3. The Sentinel GLB is parsed at startup. The Regent GLB is retained as a buffer and parsed when a Warden encounter starts. Both GLBs contain their model materials/textures; the runtime does not need separate loose texture URLs for these characters.
4. Model loading uses the pinned Three.js version (`0.186.1`) from local build files. `play.js` imports `./vendor/GLTFLoader.js`; that loader and its helper utilities are rewritten to use local modules:
   - `vendor/GLTFLoader.js`
   - `utils/BufferGeometryUtils.js`
   - `utils/SkeletonUtils.js`
   - `vendor/three.module.js` and `vendor/three.core.js`
5. `sw.js` precaches the local loader modules and shell. The GLB paths are intentionally handled by the versioned resource-pack Cache API, separate from the app-shell cache.
6. `Assets/ashen-crown-logo.svg` is a compatibility alias generated from the existing lowercase `assets/ashen-crown-logo.svg` source because the page contains an uppercase path reference. Keep both the build allow-list mapping and this source mapping if that reference remains.

## Required validation

Run these from the repository root:

```sh
npm install --ignore-scripts --no-audit --no-fund
npm run check:refs
npm test
node tools/build-web.mjs
```

For the real-browser gameplay capture, install Playwright/Chromium and serve the built directory:

```sh
npm install --no-save --package-lock=false playwright@1.56.0
npx playwright install chromium
python3 -m http.server 4173 --directory dist
ASHEN_SMOKE_URL=http://127.0.0.1:4173 node tests/e2e/game-smoke.mjs
```

The smoke test must assert that the game rendered, the production Sentinel GLB loaded, the production Regent GLB loaded and is attached to the live encounter, and a real player attack reduces the Warden's health. It saves screenshots and a JSON diagnostics report under `artifacts/game-smoke/`. A successful JavaScript boot or a non-empty canvas alone is not enough to claim the production model paths work.

The smoke-only hooks are enabled only when `?e2e=1` is used on localhost/127.0.0.1/::1; they are not enabled on the deployed public host.


## NPC character roster

- Source and built path: `Assets/Models/NPC/AshenNPCRoster.glb` → `/Assets/Models/NPC/AshenNPCRoster.glb`.
- The NPC roster is one compact GLB containing 56 named roots (`NPCMODEL_<id>`) with different archetype silhouettes and per-character PBR material factors. It shares the same four embedded 1024x1024 PBR maps inside a single GLB, so the runtime downloads one roster file rather than 56 separate multi-megabyte files.
- `play.js` parses the roster once and keeps the named prototype roots off-scene; Lyra/Orren/The Seer and villagers receive clones of their assigned production prototype. Their old procedural meshes remain hidden as a fallback only if pack loading fails.
- The smoke test confirms that the roster loaded, narrative NPCs and villagers received production-model clones, and the screenshot shows the live scene after those attachments.
