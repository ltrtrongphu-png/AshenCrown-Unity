import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');

test('both landing and game pages expose a content-derived build id', async () => {
  const [index, game, build] = await Promise.all([
    read('index.html'), read('play.html'), read('tools/build-web.mjs')
  ]);
  assert.match(index, /<meta name="ashen-build-id" content="__ASHEN_BUILD_ID__">/);
  assert.match(game, /<meta name="ashen-build-id" content="__ASHEN_BUILD_ID__">/);
  assert.match(index, /app-update\.js\?v=__ASHEN_BUILD_ID__/);
  assert.match(game, /mobile-manager\.js\?v=__ASHEN_BUILD_ID__/);
  assert.match(build, /'app-update\.js'/);
  assert.match(build, /'mobile-manager\.js'/);
  assert.match(build, /'app-update\.css'/);
  assert.match(build, /'mobile-manager\.css'/);
});

test('automatic updater performs frequent uncached service-worker version checks', async () => {
  const [updater, worker] = await Promise.all([read('app-update.js'), read('sw.js')]);
  assert.match(updater, /updateViaCache:\s*'none'/);
  assert.match(updater, /registration\.update\(\)/);
  assert.match(updater, /CHECK_INTERVAL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
  assert.match(updater, /AUTO_UPDATE_KEY/);
  assert.match(updater, /prepareForUpdate\(\)/);
  assert.match(worker, /ASHEN_GET_VERSION/);
  assert.match(worker, /ASHEN_APP_VERSION/);
  assert.match(worker, /self\.clients\.claim\(\)/);
});

test('mobile manager exposes game, save, network, install and update controls', async () => {
  const manager = await read('mobile-manager.js');
  const styles = await read('mobile-manager.css');
  for (const id of [
    'mobileCommandDock', 'mobileManagerOverlay', 'mobileManagerSave', 'mobileManagerCloud',
    'mobileManagerNetwork', 'mobileManagerChapter', 'mobileExportSave', 'mobileImportSave',
    'mobileCheckUpdates', 'mobileInstallApp', 'mobileAutoUpdateToggle'
  ]) {
    assert.ok(manager.includes(id), 'expected mobile manager control: ' + id);
  }
  for (const shortcut of ['KeyE', 'KeyM', 'KeyJ', 'KeyK', 'KeyB', 'KeyC', 'KeyO', 'Escape']) {
    assert.ok(manager.includes(shortcut), 'expected mobile command shortcut: ' + shortcut);
  }
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /max-width:\s*760px/);
  assert.match(styles, /mobile-manager-panel/);
});

test('mobile update lifecycle saves local state before refreshing and avoids active gameplay', async () => {
  const [game, updater] = await Promise.all([read('play.js'), read('app-update.js')]);
  assert.match(game, /window\.AshenAppLifecycle\s*=\s*\{/);
  assert.match(game, /saveState\(true\);\s*await localSaveWriteChain/);
  assert.match(game, /#mobileManagerOverlay:not\(\[hidden\]\)/);
  assert.match(game, /appUpdateHoldActive = true;\s*state\.paused = true/);
  assert.match(game, /releaseAppUpdateHold\(\);\s*return false/);
  assert.match(game, /encounter\?\.isBoss/);
  assert.match(updater, /window\.AshenAppLifecycle/);
  assert.match(updater, /window\.location\.reload\(\)/);
  assert.match(game, /flushPendingCloudSave\(7000\)/);
  assert.match(await read('auth.js'), /flushPendingCloudSave/);
});
