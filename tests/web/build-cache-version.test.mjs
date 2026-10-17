import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('play.js URL is versioned consistently in HTML and service-worker templates', () => {
  const page = read('play.html');
  const worker = read('sw.js');
  const build = read('tools/build-web.mjs');
  const refCheck = read('tools/check-refs.mjs');
  assert.ok(page.includes('src="./play.js?v=__ASHEN_BUILD_ID__"'));
  assert.ok(worker.includes("'./play.js?v=__ASHEN_BUILD_ID__'"));
  assert.ok(build.includes("file === 'sw.js' || file === 'play.html'"));
  assert.ok(build.includes("replaceAll('__ASHEN_BUILD_ID__', buildId)"));
  assert.ok(refCheck.includes('must precache the same build-versioned play.js URL'));
});

test('post-build checker verifies the HTML URL and service-worker cache version', () => {
  const check = read('tools/check-build-cache.mjs');
  assert.ok(check.includes('pageBuildId !== cacheBuildId || pageBuildId !== assetBuildId'));
  assert.ok(check.includes('A build-version placeholder remains unresolved'));
});
