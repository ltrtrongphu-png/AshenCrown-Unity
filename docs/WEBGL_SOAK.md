# WebGL resource soak guardrails

The browser performance workflow runs a 10-minute soak on scheduled and manually dispatched runs. It warms the scene by loading the production player/NPC models and a fixed boss encounter, then repeatedly performs light combat and opens/closes Settings. PRs run only the short performance smoke.

## What is measured

The harness captures renderer geometry/texture counts and the available Chromium JavaScript heap counter at regular intervals. The first renderer snapshot is treated as a warm-up baseline and excluded from sustained-growth analysis. JSON and Markdown reports, screenshots, and the static-server log are uploaded even when the soak fails.

The automated leak sentinel checks for **sustained post-warm-up growth**, rather than failing on every one-sample increase:

- Geometry count: at least 6 valid samples, net growth of 12 or more, and increases in at least 75% of adjacent sample intervals.
- Texture count: at least 6 valid samples, net growth of 8 or more, and increases in at least 75% of adjacent sample intervals.
- JavaScript heap: reported with start/end delta and growth rate for diagnosis, but not used alone to fail the soak because garbage collection makes heap samples noisy.
- Uncaught page errors still fail soak mode.

The thresholds are regression sentinels for a stable, repeatable scene, not universal performance budgets and not a proof that the renderer is leak-free. Review the sample series alongside gameplay changes, especially when adding new resource types or intentionally caching assets. A suspected-growth failure should be investigated in the source-to-resource ownership path; do not simply increase thresholds to silence it.

## Run locally

Requirements: Node.js 22, the project dependencies, Playwright 1.56.0, Chromium, and a working WebGL-capable Chromium.

```sh
npm install --ignore-scripts --no-audit --no-fund
npm install --no-save --package-lock=false playwright@1.56.0
npx playwright install chromium
node tools/build-web.mjs
python3 -m http.server 4173 --directory dist
```

In a second terminal:

```sh
ASHEN_PERF_URL=http://127.0.0.1:4173 \
ASHEN_PERF_MODE=soak \
ASHEN_PERF_DURATION_MS=600000 \
ASHEN_PERF_SAMPLE_INTERVAL_MS=30000 \
ASHEN_PERF_RENDERER=native \
ASHEN_PERF_ARTIFACT_DIR=artifacts/perf/local-soak \
node tools/perf/web-perf.mjs
```

Use the native renderer for a local hardware profile. The CI workflow deliberately uses software rendering for repeatability, so its frame timings are diagnostic and must not be represented as hardware-GPU performance. Compare baselines only when the browser, machine, build, scene, and throttle settings match.
