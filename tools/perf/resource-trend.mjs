const DEFAULT_SAMPLE_INTERVAL_MS = 30_000;
const DEFAULT_MIN_SAMPLES = 6;
const DEFAULT_MIN_POSITIVE_STEP_RATIO = 0.75;

/**
 * Analyze one renderer/memory counter over approximately equally spaced samples.
 * Missing or invalid counters are ignored. This is a leak signal, not a proof of
 * a leak: callers should keep the sampled scene and activity consistent.
 */
export function analyzeResourceTrend(samples, field, {
  sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL_MS,
  minSamples = DEFAULT_MIN_SAMPLES,
  minNetIncrease = 1,
  minPositiveStepRatio = DEFAULT_MIN_POSITIVE_STEP_RATIO
} = {}) {
  const values = samples
    .map(sample => sample?.[field])
    .filter(value => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const differences = values.slice(1).map((value, index) => value - values[index]);
  const positiveSteps = differences.filter(delta => delta > 0).length;
  const negativeSteps = differences.filter(delta => delta < 0).length;
  const flatSteps = differences.length - positiveSteps - negativeSteps;
  const delta = values.length >= 2 ? values.at(-1) - values[0] : null;
  const positiveStepRatio = differences.length ? positiveSteps / differences.length : 0;
  const elapsedMinutes = differences.length > 0 && Number.isFinite(sampleIntervalMs) && sampleIntervalMs > 0
    ? differences.length * sampleIntervalMs / 60_000
    : 0;

  return {
    field,
    sampleCount: values.length,
    start: values[0] ?? null,
    end: values.at(-1) ?? null,
    delta,
    positiveSteps,
    negativeSteps,
    flatSteps,
    positiveStepRatio: Number(positiveStepRatio.toFixed(3)),
    growthPerMinute: elapsedMinutes > 0 && delta !== null
      ? Number((delta / elapsedMinutes).toFixed(3))
      : null,
    minSamples,
    minNetIncrease,
    minPositiveStepRatio,
    sustainedGrowth: values.length >= minSamples
      && delta !== null
      && delta >= minNetIncrease
      && positiveStepRatio >= minPositiveStepRatio
  };
}

/**
 * Geometry/texture counts are the automated WebGL leak sentinels.
 * JavaScript heap is reported for diagnosis only because GC makes its trend noisy.
 */
export function analyzeRendererResourceTrends(samples, { sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL_MS } = {}) {
  const geometries = analyzeResourceTrend(samples, 'geometries', {
    sampleIntervalMs,
    minNetIncrease: 12
  });
  const textures = analyzeResourceTrend(samples, 'textures', {
    sampleIntervalMs,
    minNetIncrease: 8
  });
  const heap = analyzeResourceTrend(samples, 'heapBytes', {
    sampleIntervalMs,
    minNetIncrease: 64 * 1024 * 1024
  });

  return {
    sampleIntervalMs,
    geometries,
    textures,
    heap,
    suspectedLeak: geometries.sustainedGrowth || textures.sustainedGrowth
  };
}
