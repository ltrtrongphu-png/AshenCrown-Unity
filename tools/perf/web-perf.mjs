import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_PERF_URL || process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const mode = process.env.ASHEN_PERF_MODE || 'baseline';
const runs = Math.max(1, Math.min(5, Number.parseInt(process.env.ASHEN_PERF_RUNS || (mode === 'soak' ? '1' : '3'), 10) || 1));
const durationMs = Math.max(5000, Math.min(900000, Number.parseInt(
  process.env.ASHEN_PERF_DURATION_MS || (mode === 'soak' ? '600000' : '60000'), 10
) || 60000));
const cpuThrottleRate = Math.max(1, Math.min(6, Number.parseFloat(process.env.ASHEN_PERF_CPU_THROTTLE || '4') || 4));
const sampleIntervalMs = Math.max(5000, Math.min(60000, Number.parseInt(process.env.ASHEN_PERF_SAMPLE_INTERVAL_MS || '30000', 10) || 30000));
const artifactDir = process.env.ASHEN_PERF_ARTIFACT_DIR || 'artifacts/perf';
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1))].toFixed(3));
}
function median(values) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return null;
  const mid = Math.floor(finite.length / 2);
  return Number((finite.length % 2 ? finite[mid] : (finite[mid - 1] + finite[mid]) / 2).toFixed(3));
}
function monotonicIncrease(values) {
  return values.length >= 4 && values.every((value, index) => index === 0 || value > values[index - 1]);
}

const results = [];
try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.addInitScript(() => {
      const data = {
        frameMs: [],
        longTasksMs: [],
        localSaveWrites: 0,
        gameReadyAtMs: null,
        recording: false
      };
      window.__ASHEN_PERF__ = {
        data,
        startRecording() {
          data.frameMs.length = 0;
          data.longTasksMs.length = 0;
          data.localSaveWrites = 0;
          data.recording = true;
        },
        stopRecording() { data.recording = false; },
        snapshot() {
          return {
            frameMs: [...data.frameMs],
            longTasksMs: [...data.longTasksMs],
            localSaveWrites: data.localSaveWrites,
            gameReadyAtMs: data.gameReadyAtMs
          };
        }
      };
      let previous = null;
      const recordFrame = now => {
        if (data.recording && previous !== null && data.frameMs.length < 50000) {
          const elapsed = now - previous;
          if (Number.isFinite(elapsed) && elapsed >= 0) data.frameMs.push(elapsed);
        }
        previous = now;
        requestAnimationFrame(recordFrame);
      };
      requestAnimationFrame(recordFrame);
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (data.recording && data.longTasksMs.length < 5000) data.longTasksMs.push(entry.duration);
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch {}
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === window.localStorage && (key === 'ashen-crown-3d' || key === 'ashen-crown-3d.encrypted-backup.v1')) {
          if (data.recording) data.localSaveWrites++;
        }
        return originalSetItem.call(this, key, value);
      };
      window.addEventListener('ashen:game-ready', () => {
        data.gameReadyAtMs = performance.now();
        document.documentElement.dataset.ashenGameReady = 'true';
      }, { once: true });
    });

    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottleRate });

    const navStarted = Date.now();
    await page.goto(baseUrl + '/play.html?e2e=1&debug=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true', null, { timeout: 120000 });
    await page.locator('#tutorialStart').evaluate(button => button.click());
    await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.perfSnapshot === 'function', null, { timeout: 20000 });
    await page.evaluate(() => window.__ASHEN_TEST__.prepareVisuals());
    await page.waitForFunction(() => {
      const state = window.__ASHEN_TEST__.status();
      return state.playerModelLoaded === true && state.npcRosterLoaded === true
        && state.npcProductionModelCount >= 3 && state.villagerProductionModelCount >= 10;
    }, null, { timeout: 120000 });

    const bossStarted = await page.evaluate(() => window.__ASHEN_TEST__.startBossEncounter());
    assert.equal(bossStarted, true, 'fixed encounter must start for comparable profiling');
    await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossEncounter === true, null, { timeout: 30000 });
    await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossVisualAttached === true, null, { timeout: 60000 });
    await page.evaluate(() => window.__ASHEN_TEST__.releaseBossHold());

    const initialPerf = await page.evaluate(() => window.__ASHEN_TEST__.perfSnapshot());
    const gameReadyMs = await page.evaluate(() => window.__ASHEN_PERF__.snapshot().gameReadyAtMs);
    const navigationMs = Date.now() - navStarted;
    const rendererSamples = [initialPerf];
    await page.evaluate(() => window.__ASHEN_PERF__.startRecording());
    const startedAt = Date.now();
    let nextSampleAt = startedAt + sampleIntervalMs;
    let lastMenuCycle = startedAt + 20000;
    let lastAttackAt = 0;

    while (Date.now() - startedAt < durationMs) {
      const elapsed = Date.now() - startedAt;
      if (Date.now() >= nextSampleAt) {
        rendererSamples.push(await page.evaluate(() => window.__ASHEN_TEST__.perfSnapshot()));
        nextSampleAt += sampleIntervalMs;
      }
      // Repeatable light-combat activity prevents measuring an idle/frozen simulation.
      if (Date.now() - lastAttackAt >= 1100) {
        await page.evaluate(() => window.__ASHEN_TEST__.attackOnce()).catch(() => null);
        lastAttackAt = Date.now();
      }
      if (mode === 'soak' && Date.now() >= lastMenuCycle) {
        await page.locator('#settingsButton').evaluate(button => button.click()).catch(() => {});
        await page.waitForTimeout(150);
        await page.locator('#systemClose').evaluate(button => button.click()).catch(() => {});
        lastMenuCycle += 20000;
      }
      await page.waitForTimeout(Math.min(250, Math.max(20, durationMs - elapsed)));
    }
    await page.evaluate(() => window.__ASHEN_PERF__.stopRecording());
    rendererSamples.push(await page.evaluate(() => window.__ASHEN_TEST__.perfSnapshot()));
    const collected = await page.evaluate(() => window.__ASHEN_PERF__.snapshot());
    const frames = collected.frameMs;
    const longTasks = collected.longTasksMs;
    const geometryCounts = rendererSamples.map(sample => Number(sample.geometries) || 0);
    const textureCounts = rendererSamples.map(sample => Number(sample.textures) || 0);
    const heaps = rendererSamples.map(sample => Number(sample.heapBytes)).filter(Number.isFinite);
    const sameOriginTransferBytes = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter(entry => {
        try { return new URL(entry.name).origin === location.origin; } catch { return false; }
      })
      .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0));

    const result = {
      run,
      mode,
      durationMs,
      cpuThrottleRate,
      browser: await page.evaluate(() => navigator.userAgent),
      machine: { platform: process.platform, arch: process.arch, release: os.release(), cpuCount: os.cpus().length },
      navigationMs,
      gameReadyMs,
      frames: {
        count: frames.length,
        p50Ms: percentile(frames, 0.50),
        p95Ms: percentile(frames, 0.95),
        p99Ms: percentile(frames, 0.99),
        maxMs: frames.length ? Number(Math.max(...frames.slice(0, 20000)).toFixed(3)) : null,
        over33ms: frames.filter(frame => frame > 33).length
      },
      longTasks: { countOver50ms: longTasks.filter(duration => duration > 50).length, maxMs: longTasks.length ? Number(Math.max(...longTasks).toFixed(3)) : null },
      rendererSamples,
      memoryTrend: {
        geometries: geometryCounts,
        textures: textureCounts,
        geometryStrictlyIncreasing: monotonicIncrease(geometryCounts.slice(1)),
        textureStrictlyIncreasing: monotonicIncrease(textureCounts.slice(1)),
        heapStartBytes: heaps[0] ?? null,
        heapEndBytes: heaps.at(-1) ?? null
      },
      saveWritesDuringMeasurement: collected.localSaveWrites,
      sameOriginTransferBytes,
      pageErrors,
      consoleErrors
    };
    results.push(result);
    await page.screenshot({ path: artifactDir + '/web-perf-run-' + run + '.png', fullPage: false });
    await writeFile(artifactDir + '/web-perf-run-' + run + '.json', JSON.stringify(result, null, 2));
    await context.close();
    process.stdout.write('Performance run ' + run + '/' + runs + ' complete: frame p95=' + result.frames.p95Ms +
      ' ms; long tasks >50ms=' + result.longTasks.countOver50ms + '; samples=' + rendererSamples.length + '\n');
  }
} finally {
  await browser.close();
}

const summary = {
  mode,
  baseUrl,
  runCount: results.length,
  durationMs,
  cpuThrottleRate,
  frameP50MedianMs: median(results.map(result => result.frames.p50Ms)),
  frameP95MedianMs: median(results.map(result => result.frames.p95Ms)),
  frameP99MedianMs: median(results.map(result => result.frames.p99Ms)),
  gameReadyMedianMs: median(results.map(result => result.gameReadyMs)),
  longTaskMedianCount: median(results.map(result => result.longTasks.countOver50ms)),
  geometryStrictIncreaseRuns: results.filter(result => result.memoryTrend.geometryStrictlyIncreasing).length,
  textureStrictIncreaseRuns: results.filter(result => result.memoryTrend.textureStrictlyIncreasing).length,
  results
};
const markdown = [
  '# Browser performance run',
  '',
  '- Mode: ' + mode,
  '- Base URL: ' + baseUrl,
  '- CPU throttle: ' + cpuThrottleRate + '×',
  '- Runs: ' + results.length + ' × ' + Math.round(durationMs / 1000) + 's',
  '- Browser readiness median: ' + summary.gameReadyMedianMs + ' ms',
  '- Frame p50/p95/p99 median: ' + summary.frameP50MedianMs + ' / ' + summary.frameP95MedianMs + ' / ' + summary.frameP99MedianMs + ' ms',
  '- Long tasks >50 ms median count: ' + summary.longTaskMedianCount,
  '- Runs with strictly increasing geometry/texture counts: ' + summary.geometryStrictIncreaseRuns + ' / ' + summary.textureStrictIncreaseRuns,
  '',
  '| Run | p50 ms | p95 ms | p99 ms | Max ms | >33 ms frames | >50 ms long tasks | Save writes |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...results.map(result => '| ' + result.run + ' | ' + result.frames.p50Ms + ' | ' + result.frames.p95Ms + ' | ' +
    result.frames.p99Ms + ' | ' + result.frames.maxMs + ' | ' + result.frames.over33ms + ' | ' +
    result.longTasks.countOver50ms + ' | ' + result.saveWritesDuringMeasurement + ' |'),
  '',
  'These are measurements from this run and machine only. Do not compare them with previous runs unless browser, machine, build, map and CPU throttle are matched.',
  ''
].join('\n');

await writeFile(artifactDir + '/web-perf-summary.json', JSON.stringify(summary, null, 2));
await writeFile(artifactDir + '/web-perf-summary.md', markdown);
process.stdout.write('\n' + markdown + '\n');

if (mode === 'soak') {
  assert.equal(summary.geometryStrictIncreaseRuns, 0, 'GPU geometry count must not increase strictly across every post-warmup sample during soak.');
  assert.equal(summary.textureStrictIncreaseRuns, 0, 'GPU texture count must not increase strictly across every post-warmup sample during soak.');
  assert.ok(results.every(result => result.pageErrors.length === 0), 'soak should not generate uncaught page errors');
}
