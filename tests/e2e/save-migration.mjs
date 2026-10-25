import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

try {
  await page.addInitScript(() => {
    window.confirm = () => true;
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
    if (!sessionStorage.getItem('ashen-v5-migration-fixture-seeded')) {
      const primary = {
        saveVersion: 5, mapVersion: 1, level: 7, xp: 41, hp: 100, stamina: 87,
        coins: 999, shards: 6, echoes: 4, quest: 2, chapter: 3, day: 8,
        savedAt: 220, currentMap: 'sanctuary', flags: { bellWardenDefeated: false, record_chapter_3: true },
        inventory: [{ itemId: 'fixture-blade', name: 'Fixture Blade', type: 'Weapon', rarity: 'Rare',
          attrs: ['Migration fixture'], stats: { vitality: 2 } }],
        equipment: { core: null, charm: null, armor: null, relic: null }, settings: {}, rep: {},
        meta: {}, collectedNodes: [], hunt: { kills: 0 }, skillRanks: [0, 0, 0], tutorial: true
      };
      const prior = { ...primary, level: 15, chapter: 2, savedAt: 180, coins: 500 };
      localStorage.setItem('ashen-crown-3d', JSON.stringify(primary));
      localStorage.setItem('ashen-crown-3d.backup.100', JSON.stringify(prior));
      sessionStorage.setItem('ashen-v5-migration-fixture-seeded', '1');
    }
  });

  await page.goto(baseUrl + '/play.html?e2e=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true');
  await page.locator('#tutorialStart').evaluate(button => button.click());
  await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.flushLocalSave === 'function');
  const migrated = await page.evaluate(() => window.__ASHEN_TEST__.flushLocalSave());
  const initialState = await page.evaluate(() => window.__ASHEN_TEST__.status());

  assert.equal(migrated.encrypted, true, 'the migrated v5 save must be stored as AES-GCM ciphertext');
  assert.equal(migrated.recoveryRequired, false, 'a valid v5 fixture should not trigger recovery mode');
  assert.equal(initialState.chapter, 3, 'chapter progress must survive plaintext-to-encrypted migration');
  assert.equal(initialState.level, 7, 'a valid chapter-three level must survive plaintext-to-encrypted migration');
  assert.equal(initialState.coins, 999, 'currency must survive plaintext-to-encrypted migration');
  assert.equal(initialState.inventoryCount, 1, 'inventory must survive plaintext-to-encrypted migration');
  const storageAfterMigration = await page.evaluate(() => ({
    primary: localStorage.getItem('ashen-crown-3d'),
    encryptedBackup: localStorage.getItem('ashen-crown-3d.encrypted-backup.v1'),
    legacyBackupKeys: Object.keys(localStorage).filter(key => key.startsWith('ashen-crown-3d.backup.'))
  }));
  assert.ok(storageAfterMigration.primary.startsWith('ASHEN-AESGCM-v1:'), 'primary slot must hold encrypted envelope');
  assert.ok(storageAfterMigration.encryptedBackup?.startsWith('ASHEN-AESGCM-v1:'), 'a verified encrypted backup must be retained');
  assert.deepEqual(storageAfterMigration.legacyBackupKeys, [], 'legacy plaintext backup keys should be removed only after verified migration');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportSaveButton').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^ashen-crown-save-v5-\d{4}-\d{2}-\d{2}\.json$/);
  const exportedRaw = await readFile(await download.path(), 'utf8');
  const exported = JSON.parse(exportedRaw);
  assert.equal(exported.saveVersion, 5);
  assert.equal(exported.chapter, 3);
  assert.equal(exported.level, 7);
  assert.equal(exported.inventory[0].name, 'Fixture Blade');

  const imported = {
    ...exported, saveVersion: 5, level: 5, chapter: 2, coins: 123, savedAt: Date.now(),
    inventory: [{ itemId: 'imported-sigil', name: 'Imported Sigil', type: 'Relic', rarity: 'Epic', attrs: [], stats: { ward: 3 } }]
  };
  const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.locator('#importSaveFile').setInputFiles({
    name: 'ashen-crown-import-v5.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported))
  });
  await navigation;
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true');
  await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.status === 'function');
  const importedState = await page.evaluate(() => window.__ASHEN_TEST__.status());
  const importedStorage = await page.evaluate(() => ({
    primary: localStorage.getItem('ashen-crown-3d'),
    encryptedBackup: localStorage.getItem('ashen-crown-3d.encrypted-backup.v1')
  }));
  assert.equal(importedState.chapter, 2, 'import should restore the selected chapter');
  assert.equal(importedState.level, 5, 'import should restore a level within chapter-two cap');
  assert.equal(importedState.coins, 123, 'import should restore the selected currency');
  assert.equal(importedState.inventoryCount, 1, 'imported inventory should be loaded');
  assert.ok(importedStorage.primary.startsWith('ASHEN-AESGCM-v1:'), 'imported save must be encrypted before reload');
  assert.ok(importedStorage.encryptedBackup.startsWith('ASHEN-AESGCM-v1:'), 'pre-import progress must remain backed up encrypted');
  assert.deepEqual(pageErrors, [], 'save migration/import should not create uncaught browser errors');
  process.stdout.write('Save migration/export/import regression passed: v5 progress preserved and encrypted.\n');
} finally {
  await context.close();
  await browser.close();
}
