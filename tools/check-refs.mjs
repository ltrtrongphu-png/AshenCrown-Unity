import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');
const fail = (message) => {
  console.error('[check:refs] ' + message);
  process.exitCode = 1;
};

const build = read('tools/build-web.mjs');
const allowListMatch = build.match(/const webFiles = \[([\s\S]*?)\];/);
if (!allowListMatch) {
  fail('Could not read webFiles from tools/build-web.mjs.');
  process.exit(1);
}
const allowList = [...allowListMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
const generated = new Set(['resource-pack.json']);
const packageSources = new Map([
  ['vendor/three.module.js', 'node_modules/three/build/three.module.js'],
  ['vendor/three.core.js', 'node_modules/three/build/three.core.js'],
]);

for (const file of allowList) {
  if (generated.has(file)) continue;
  const source = packageSources.get(file) || file;
  const fullPath = join(root, source);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile())
    fail('Required allow-list source is missing: ' + source);
}

for (const page of ['index.html', 'play.html']) {
  const html = read(page);
  const refs = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const [, reference] of refs) {
    if (/^(?:[a-z]+:|\/\/|data:|#)/i.test(reference)) continue;
    const path = reference.split(/[?#]/, 1)[0].replace(/^\.\//, '');
    if (path === '' || path === '.') continue;
    if (/\.[a-z0-9]{2,8}$/i.test(path) && !allowList.includes(path))
      fail(page + ' references a local file outside the allow-list: ' + reference);
  }
}

const worker = read('sw.js');
if (!read('play.html').includes('./play.js?v=__ASHEN_BUILD_ID__'))
  fail('play.html must use a build-versioned URL for play.js.');
if (!worker.includes('./play.js?v=__ASHEN_BUILD_ID__'))
  fail('The service worker must precache the same build-versioned play.js URL.');
for (const [, rawReference] of worker.matchAll(/'\\.\\/([^']+)'/g)) {
  const reference = rawReference.split(/[?#]/, 1)[0];
  if (/^(?:https?:|data:)/i.test(reference)) continue;
  if (/\\.[a-z0-9]{2,8}$/i.test(reference) && !allowList.includes(reference))
    fail('Service worker precaches an asset outside the allow-list: ' + reference);
}

const packageJson = JSON.parse(read('package.json'));
if (packageJson.dependencies?.three !== '0.186.1')
  fail('Three.js version must remain explicitly pinned to 0.186.1.');

const auth = read('auth.js');
const playSource = read('play.js');
for (const match of playSource.matchAll(/(?:from\s*|import\()(['"])\.\/([^'"]+)\1/g)) {
  const modulePath = match[2].split(/[?#]/, 1)[0];
  if (!allowList.includes(modulePath))
    fail('play.js imports a local module outside the deployment allow-list: ' + modulePath);
}
const migration = read('supabase/migrations/002_player_web_saves.sql');
for (const column of ['user_id', 'save_json', 'updated_at', 'version']) {
  if (!migration.includes(column)) fail('Browser save migration is missing column: ' + column);
}
if (!migration.includes('public.player_web_saves'))
  fail('Browser save migration does not define public.player_web_saves.');
if (!/from\(['"]player_web_saves['"]\)/.test(auth))
  fail('Browser cloud-save client does not use player_web_saves.');
if (!auth.includes('version: 5'))
  fail('Browser cloud save must continue to identify save version 5.');
if (/save_text\s*:/.test(auth))
  fail('Browser cloud save still sends a save_text field absent from migration 002.');
if (/for delete\s+to\s+authenticated/i.test(migration))
  fail('Browser save migration must not add a direct DELETE policy.');
if (!migration.includes('(select auth.uid()) = user_id'))
  fail('Browser save RLS policies must constrain access by auth.uid().');

if (process.exitCode)
  process.exit(process.exitCode);
console.log('[check:refs] Allow-list, HTML/service-worker references, pinned Three.js, and browser-save schema checks passed.');
