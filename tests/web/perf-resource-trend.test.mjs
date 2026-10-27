import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResourceTrend, analyzeRendererResourceTrends } from '../../tools/perf/resource-trend.mjs';

test('stable renderer counts with small reversible noise do not trigger a leak signal', () => {
  const samples = [100, 102, 101, 103, 102, 101, 103, 102]
    .map(geometries => ({ geometries, textures: 40, heapBytes: 10_000 }));
  const report = analyzeRendererResourceTrends(samples, { sampleIntervalMs: 30_000 });

  assert.equal(report.geometries.delta, 2);
  assert.equal(report.geometries.sustainedGrowth, false);
  assert.equal(report.textures.sustainedGrowth, false);
  assert.equal(report.suspectedLeak, false);
});

test('sustained geometry growth above the net-delta threshold is detected', () => {
  const samples = [100, 102, 104, 106, 108, 110, 112, 114]
    .map(geometries => ({ geometries, textures: 20 }));
  const report = analyzeRendererResourceTrends(samples, { sampleIntervalMs: 30_000 });

  assert.equal(report.geometries.delta, 14);
  assert.equal(report.geometries.positiveStepRatio, 1);
  assert.equal(report.geometries.sustainedGrowth, true);
  assert.equal(report.suspectedLeak, true);
});

test('sustained texture growth has its own threshold', () => {
  const samples = [40, 41, 42, 43, 45, 47, 48]
    .map(textures => ({ geometries: 100, textures }));
  const report = analyzeRendererResourceTrends(samples);

  assert.equal(report.textures.delta, 8);
  assert.equal(report.textures.sustainedGrowth, true);
  assert.equal(report.suspectedLeak, true);
});

test('short runs cannot be labeled as sustained growth', () => {
  const samples = [100, 105, 110, 115, 120].map(geometries => ({ geometries }));
  const report = analyzeResourceTrend(samples, 'geometries', { minNetIncrease: 1 });

  assert.equal(report.sampleCount, 5);
  assert.equal(report.sustainedGrowth, false);
});

test('single spikes and mostly-flat samples are not sustained growth', () => {
  const samples = [100, 101, 102, 115, 114, 114, 114, 114]
    .map(geometries => ({ geometries, textures: 5 }));
  const report = analyzeRendererResourceTrends(samples);

  assert.equal(report.geometries.delta, 14);
  assert.equal(report.geometries.positiveStepRatio, 0.429);
  assert.equal(report.geometries.sustainedGrowth, false);
  assert.equal(report.suspectedLeak, false);
});

test('missing, negative, and non-finite metrics are excluded safely', () => {
  const report = analyzeResourceTrend([
    { count: 1 },
    { count: Number.NaN },
    { count: -1 },
    { count: 3 },
    { count: 4 }
  ], 'count', { minSamples: 4, minNetIncrease: 1 });

  assert.equal(report.sampleCount, 3);
  assert.equal(report.start, 1);
  assert.equal(report.end, 4);
  assert.equal(report.delta, 3);
  assert.equal(report.sustainedGrowth, false);
});

test('heap growth is diagnostic and does not alone trigger the WebGL leak sentinel', () => {
  const samples = Array.from({ length: 8 }, (_, index) => ({
    geometries: 100,
    textures: 20,
    heapBytes: 10_000_000 + index * 12_000_000
  }));
  const report = analyzeRendererResourceTrends(samples);

  assert.equal(report.heap.sustainedGrowth, true);
  assert.equal(report.suspectedLeak, false);
});
