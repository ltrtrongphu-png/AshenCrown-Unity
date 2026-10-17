import { existsSync, readFileSync, statSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => {
  console.error('[check:build-cache] ' + message);
  process.exitCode = 1;
};

for (const path of ['dist/play.html', 'dist/play.js', 'dist/sw.js']) {
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) {
    fail('Required built asset is missing or empty: ' + path);
  }
}
if (process.exitCode) process.exit(process.exitCode);

const page = read('dist/play.html');
const worker = read('dist/sw.js');
const pageMatch = page.match(/<script\s+type="module"\s+src="\.\/play\.js\?v=([a-f0-9]{16})"><\/script>/i);
const workerCacheMatch = worker.match(/const SHELL_CACHE = 'ashen-shell-([a-f0-9]{16})';/);
const workerAssetMatch = worker.match(/'\.\/play\.js\?v=([a-f0-9]{16})'/);

if (!pageMatch) fail('Built play.html must reference play.js with a 16-character build ID.');
if (!workerCacheMatch) fail('Built service worker must use a build-specific shell cache name.');
if (!workerAssetMatch) fail('Built service worker must precache a versioned play.js URL.');
if (page.includes('__ASHEN_BUILD_ID__') || worker.includes('__ASHEN_BUILD_ID__'))
  fail('A build-version placeholder remains unresolved in production output.');

if (!process.exitCode) {
  const pageBuildId = pageMatch[1];
  const cacheBuildId = workerCacheMatch[1];
  const assetBuildId = workerAssetMatch[1];
  if (pageBuildId !== cacheBuildId || pageBuildId !== assetBuildId) {
    fail('play.html, play.js, and the service-worker cache must use the same build ID.');
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('[check:build-cache] Versioned play.js URL and service-worker cache IDs match.');
