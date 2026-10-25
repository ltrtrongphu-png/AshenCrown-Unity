import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });

const hostileName = '<img id=xss-inventory-name src=x onerror="window.xss=1">';
const hostileAttr = '<svg onload="window.xss=1">';
const hostileLog = '<img id=xss-journal-log src=x onerror="window.xss=1">';
const fixture = {
  saveVersion: 5, mapVersion: 1, savedAt: 220, level: 1, xp: 0, hp: 100, stamina: 100,
  coins: 40, shards: 0, echoes: 0, quest: 0, chapter: 1, day: 1, chapterGathered: 0,
  weaponRank: 0, skillPoints: 0, skillRanks: [0, 0, 0], role: 'ashbreaker', appearance: 'default',
  currentMap: 'sanctuary', flags: { gate: false, truth: false }, rep: { lyra: 0, orren: 0, seer: 0 },
  meta: { renown: 0, mastery: 0, legacy: 0, points: 0, contracts: 0, developmentDay: 0, hubLevel: 0, chaptersComplete: 0 },
  settings: { quality: 'performance', sensitivity: 1, reducedMotion: false, sound: true, volume: 0.35 },
  inventory: [{
    itemId: 'xss-weapon-01', name: hostileName, type: 'Weapon', rarity: 'Rare',
    attrs: [hostileAttr, 'ordinary attribute'], stats: { vitality: 2 }
  }],
  equipment: {
    core: { itemId: 'xss-weapon-01', name: hostileName, type: 'Weapon', rarity: 'Rare',
      attrs: [hostileAttr], stats: { vitality: 2 } },
    charm: null, armor: null, relic: null
  },
  collectedNodes: [], hunt: { kills: 0 }, tutorial: true,
  log: [hostileLog, 'A normal journal entry']
};

try {
  await page.addInitScript(save => {
    window.__ASHEN_XSS_EXECUTED__ = false;
    window.xss = false;
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
    if (!sessionStorage.getItem('ashen-xss-fixture-seeded')) {
      localStorage.setItem('ashen-crown-3d', JSON.stringify(save));
      sessionStorage.setItem('ashen-xss-fixture-seeded', '1');
    }
  }, fixture);

  await page.goto(baseUrl + '/play.html?e2e=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true', null, { timeout: 60000 });
  await page.locator('#tutorialStart').evaluate(button => button.click());
  await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.status === 'function', null, { timeout: 15000 });
  await page.waitForFunction(() => {
    const state = window.__ASHEN_TEST__.status();
    return state.saveEncrypted === true && state.inventoryCount === 1;
  }, null, { timeout: 30000 });
  await page.waitForTimeout(100);

  // Inventory and equipped-slot sinks: stored JSON may be edited by the player,
  // so untrusted fields must remain text and must never become live DOM elements.
  await page.keyboard.press('i');
  await page.waitForFunction(() => document.querySelector('#inventoryMenu')?.classList.contains('show'));
  assert.equal(await page.locator('#inventoryGrid #xss-inventory-name').count(), 0);
  assert.equal(await page.locator('#inventoryGrid img, #inventoryGrid svg, .equip-slot img, .equip-slot svg').count(), 0);
  const inventoryText = await page.locator('#inventoryGrid').innerText();
  assert.ok(inventoryText.includes(hostileName), 'the hostile item name should be rendered literally');
  assert.ok(inventoryText.includes(hostileAttr), 'the hostile attribute should be rendered literally');
  assert.equal(await page.locator('.equip-slot[data-slot="core"]').textContent().then(text => text.includes(hostileName)), true,
    'the equipped-slot label should retain the item name as text');
  await page.locator('#closeInventory').click();

  // Story journal: log entries come from saved progress and must be escaped.
  await page.keyboard.press('j');
  await page.waitForFunction(() => document.querySelector('#journal')?.classList.contains('open'));
  await page.locator('.journal-tabs button[data-tab="story"]').click();
  const storyText = await page.locator('#journalBody').innerText();
  assert.ok(storyText.includes(hostileLog), 'journal log should render attacker-controlled markup as text');
  assert.equal(await page.locator('#journalBody #xss-journal-log').count(), 0);
  assert.equal(await page.locator('#journalBody img, #journalBody svg').count(), 0);
  await page.locator('.journal-tabs button[data-tab="campaign"]').click();
  assert.equal(await page.locator('#journalBody #xss-journal-log').count(), 0,
    'static campaign card rendering must not inherit untrusted journal DOM');
  await page.keyboard.press('j');

  // Archive collection/items: both views derive fields from the saved inventory.
  await page.keyboard.press('k');
  await page.waitForFunction(() => document.querySelector('#metaMenu')?.classList.contains('show'));
  await page.locator('.meta-tabs button[data-meta="items"]').click();
  const itemCatalogue = await page.locator('#metaContent').innerText();
  assert.ok(itemCatalogue.includes(hostileName), 'item catalogue should display the literal hostile name');
  assert.ok(itemCatalogue.includes(hostileAttr), 'item catalogue should display the literal hostile attribute');
  assert.equal(await page.locator('#metaContent #xss-inventory-name, #metaContent #xss-inventory-attr').count(), 0);
  assert.equal(await page.locator('#metaContent img, #metaContent svg').count(), 0);
  await page.locator('.meta-tabs button[data-meta="collection"]').click();
  assert.equal(await page.locator('#metaContent img, #metaContent svg').count(), 0);
  assert.ok((await page.locator('#metaContent').innerText()).includes(hostileName));
  assert.equal(await page.evaluate(() => window.__ASHEN_XSS_EXECUTED__ === true || window.xss === true), false,
    'no event handler from untrusted save data may execute');
  assert.deepEqual(pageErrors, [], 'the XSS regression should not cause uncaught browser errors');
  assert.deepEqual(consoleErrors, [], 'the XSS regression should not cause browser console errors');
  process.stdout.write('DOM injection regression passed: inventory, equipment, journal and archive render hostile v5 fields as text.\n');
} finally {
  await context.close();
  await browser.close();
}
