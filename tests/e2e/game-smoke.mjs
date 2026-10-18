import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const artifactDir = 'artifacts/game-smoke';
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const pageErrors = [];
const consoleErrors = [];
const consoleWarnings = [];
const failedRequests = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
  if (message.type() === 'warning') consoleWarnings.push(message.text());
});
page.on('requestfailed', request => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' }));
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).origin === new URL(baseUrl).origin) {
    failedRequests.push({ url: response.url(), status: response.status() });
  }
});

let status = null;
let failure = null;
const screenshotFiles = [];
try {
  await page.addInitScript(() => {
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
  });
  await page.goto(baseUrl + '/play.html?e2e=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true', null, { timeout: 60000 });
  await page.locator('#tutorialStart').click({ timeout: 12000 });
  await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.status === 'function', null, { timeout: 12000 });
  await page.evaluate(() => window.__ASHEN_TEST__.prepareVisuals());
  await page.waitForFunction(() => {
    const state = window.__ASHEN_TEST__.status();
    return state.playerModelLoaded === true && state.npcRosterLoaded === true
      && state.npcProductionModelCount >= 3 && state.villagerProductionModelCount >= 10;
  }, null, { timeout: 90000 });
  await page.waitForTimeout(700);
  const landscapeStatus = await page.evaluate(() => window.__ASHEN_TEST__.status());
  assert.equal(landscapeStatus.npcRosterLoaded, true, '56-model NPC production roster should load');
  assert.ok(landscapeStatus.npcRosterModelCount >= 50, 'roster should contain at least 50 named character roots');
  assert.equal(landscapeStatus.npcProductionModelCount, 3, 'all narrative NPCs should use production model clones');
  assert.equal(landscapeStatus.villagerProductionModelCount, 10, 'all ten villager definitions should use production model clones');
  await page.screenshot({ path: artifactDir + '/ashen-crown-gameplay.png', fullPage: false });
  screenshotFiles.push('ashen-crown-gameplay.png');
  assert.equal(landscapeStatus.gameReady, true, 'Three.js scene should have rendered at least one frame');
  assert.equal(landscapeStatus.playerModelLoaded, true, 'production Ashen Sentinel GLB should load');
  assert.ok(landscapeStatus.canvasWidth >= 600 && landscapeStatus.canvasHeight >= 300, 'game canvas should be visible at desktop test size');

  const started = await page.evaluate(() => window.__ASHEN_TEST__.startBossEncounter());
  assert.equal(started, true, 'local-only harness should be able to start the Warden encounter');
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossModelLoaded === true, null, { timeout: 60000 });
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossEncounter === true, null, { timeout: 12000 });
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossVisualAttached === true, null, { timeout: 12000 });
  await page.waitForTimeout(900);
  status = await page.evaluate(() => window.__ASHEN_TEST__.status());
  await page.screenshot({ path: artifactDir + '/ashen-crown-boss-encounter.png', fullPage: false });
  screenshotFiles.push('ashen-crown-boss-encounter.png');
  assert.equal(status.npcRosterLoaded, true, 'production NPC roster should remain loaded during a boss encounter');
  assert.ok(status.npcProductionModelCount >= 3, 'narrative NPC models should remain attached after boss spawn');
  assert.equal(status.bossModelLoaded, true, 'production Ashen Regent GLB should load');
  assert.equal(status.bossVisualAttached, true, 'production Ashen Regent scene should be attached to the encounter root');
  assert.equal(status.bossEncounter, true, 'boss should remain active after model load');
  assert.ok(status.bossHp > 0, 'boss health should be initialized');

  // Resume the staged encounter, then exercise the real light-attack combo path.
  const beforeAttack = status.bossHp;
  assert.equal(await page.evaluate(() => window.__ASHEN_TEST__.releaseBossHold()), true, 'test-only staging hold should release');
  for (let strike = 0; strike < 3; strike++) {
    await page.evaluate(() => window.__ASHEN_TEST__.attackOnce());
    if (strike < 2) await page.waitForTimeout(390);
  }
  // Capture the final chain strike while its real in-game feedback/effects are visible.
  await page.waitForTimeout(120);
  await page.screenshot({ path: artifactDir + '/ashen-crown-combo-strike.png', fullPage: false });
  screenshotFiles.push('ashen-crown-combo-strike.png');
  await page.waitForTimeout(300);
  const afterAttack = await page.evaluate(() => window.__ASHEN_TEST__.status());
  status = afterAttack;
  assert.ok(afterAttack.bossHp < beforeAttack, 'real player attack input should reduce Warden HP');
  assert.equal(pageErrors.length, 0, 'browser must not report uncaught JavaScript exceptions');
  assert.equal(consoleErrors.length, 0, 'browser must not report console errors');
  assert.equal(failedRequests.length, 0, 'all same-origin resource-pack paths should resolve');
  const bootError = await page.locator('.game-boot-status').evaluate(el => !el.hidden).catch(() => false);
  assert.equal(bootError, false, 'game boot diagnostic must remain hidden');

} catch (error) {
  failure = String(error?.stack || error);
  if (page && !page.isClosed()) {
    try { await page.screenshot({ path: artifactDir + '/ashen-crown-debug-on-failure.png', fullPage: false }); screenshotFiles.push('ashen-crown-debug-on-failure.png'); } catch {}
  }
} finally {
  status ||= await page.evaluate(() => window.__ASHEN_TEST__?.status?.() || null).catch(() => null);
  await writeFile(artifactDir + '/diagnostics.json', JSON.stringify({
    baseUrl, status, failure, pageErrors, consoleErrors, consoleWarnings, failedRequests,
    screenshotFiles
  }, null, 2));
  await browser.close();
}

if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else {
  console.log('Gameplay smoke passed: Sentinel, Regent and 56-model NPC roster loaded; live NPC models attached; Warden visual attached; real combo damage verified; screenshots captured.');
}
