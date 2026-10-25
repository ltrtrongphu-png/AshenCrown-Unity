# Performance Before/After

No Unity Editor, browser session with CPU throttling, Performance panel, Memory Profiler, or live Supabase instance was available to this source-editing pass. Therefore no numerical performance result is claimed. Source-level improvements are not a substitute for the target measurements in the prompt.

| Metric | Scenario | Before (median) | After (median) | Delta | Machine/build | Notes |
|---|---|---:|---:|---:|---|---|
| Unity frame p50/p99 | Mid-range PC, 10 enemies + 1 boss, 60 s combat × 3 | Not measured | Not measured | N/A | Unity runtime not executed | Target p50 ≤ 8.3 ms and p99 ≤ 16.7 ms. |
| Unity frames > 33 ms | Same combat scene, 10-minute run | Not measured | Not measured | N/A | Not executed | Target zero after warm-up; record actual spikes. |
| Unity GC bytes/frame | Stable combat segment | Not measured | Not measured | N/A | Not executed | No claim of 0 B/frame. |
| Browser frame p95 | Chrome /play.html, CPU throttle 4×, fixed map/encounter, 60 s × 3 | Not measured | Not measured | N/A | Browser profiling not run | Target ≤ 22 ms. |
| Browser long tasks > 50 ms | Same scenario | Not measured | Not measured | N/A | Not executed | Exclude loading/map transition only as prompt specifies. |
| Browser geometries/textures | 10-minute skill/encounter soak; sample renderer.info.memory each 30 s | Not measured | Not measured | N/A | Not executed | Encounter cleanup has a source regression test, not a memory-soak result. |
| Save writes with no gameplay change | Idle/static browser state for 60 s | Not measured | Not measured | N/A | Node tests only | Comparison unit test covers timestamp-only changes; no real browser I/O instrumentation ran. |
| Local/cloud conflict recovery | Local offline save + divergent cloud save, both choices | Not run | Not run | N/A | Supabase not available | Source logic and unit-test source added; live save restore remains required. |

## Source-level changes (not measured results)

- Browser autosave compares the save payload excluding savedAt and schedules periodic writes during idle time.
- Unity TimeScaleService reuses a removal buffer and iterates active requests directly instead of allocating lists each frame.
- Defeated fallback encounter geometry/material resources are disposed without disposing shared world materials or the cached production boss GLB.
- Browser elapsed time is forced finite and non-negative before existing raw/simulation delta caps.

## Reproducible measurement checklist

1. Record machine, OS, Unity version/build, browser version, quality settings, VSync state and seed.
2. Warm up shader/model paths before timing. Run the same map/encounter script three times.
3. Record every run's p50/p95/p99, max frame time, >33 ms spike count, GC bytes/frame, long-task count, and renderer geometry/texture counts.
4. Publish samples and median here. Do not infer performance gains from source changes alone.

## Reproducible browser harness (added Sprint 1)

The Playwright harness is `tools/perf/web-perf.mjs` and is exposed as `npm run perf:web`. It requires the pinned Playwright package and an installed Chromium browser.

Pull requests run a short 15-second instrumented encounter to validate the harness. Scheduled/manual runs execute three 60-second runs at 4× CPU throttle and a separate 10-minute soak; JSON, Markdown tables and screenshots are uploaded as workflow artifacts. The soak fails if post-warmup geometry or texture counts increase strictly at every sample, or if uncaught page errors occur.

Manual reproduction after building the allow-listed web artifact:

```sh
node tools/build-web.mjs
python3 -m http.server 4173 --directory dist
# In a second terminal, with Playwright + Chromium installed:
ASHEN_PERF_URL=http://127.0.0.1:4173 ASHEN_PERF_MODE=baseline \
  ASHEN_PERF_RUNS=3 ASHEN_PERF_DURATION_MS=60000 ASHEN_PERF_CPU_THROTTLE=4 \
  ASHEN_PERF_ARTIFACT_DIR=artifacts/perf/baseline npm run perf:web
```

No benchmark numbers are recorded in this source change. Populate the tables above only from uploaded results with the machine/browser/build and per-run samples attached; the three-run median is the comparison point, not an assumed improvement.

