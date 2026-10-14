# Vercel deployment

The Vercel target is the browser demo only. Unity sources, Supabase migrations, backend scaffolding, design documents, and source textures are not part of the deployed artifact.

## Build locally

Requires Node.js 22 or a compatible current Node runtime.

```sh
npm install --ignore-scripts --no-audit --no-fund
node tools/build-web.mjs
```

The build script checks JavaScript syntax, validates local HTML resource references against its allow-list, fails when a required source file is missing, generates `resource-pack.json`, fingerprints the service-worker shell cache, and writes `dist/`.

The script's console output reports the final number of files and total uncompressed artifact size. It does not measure Brotli/gzip transfer size, browser FPS, heap/GPU allocations, or Lighthouse.

## Vercel settings

Connect the repository root and let `vercel.json` define:

- Install: `npm install --ignore-scripts --no-audit --no-fund`
- Build: `node tools/build-web.mjs`
- Output: `dist`

Do not commit `dist/`, `node_modules/`, Unity `Library/`, or Vercel build output. The existing CSP/security headers are intentionally not relaxed by this setup.

## Verification

The GitHub Actions Web CI workflow installs dependencies, runs the allow-listed build, asserts core artifact files exist, and checks patch whitespace. Actual deployment URL, browser Network 404s, offline behavior, and Lighthouse scores still require an environment where CI/browser execution succeeds.
