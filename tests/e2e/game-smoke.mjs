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
try {
  await page.addInitScript(() => {
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
  });
  await page.goto(baseUrl + '/play.html?e2e=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true', { timeout: 60000 });
  await page.locator('#tutorialStart').click({ timeout: 12000 });
  await page.waitForFunction(() => typeof window.__ASHEN_TEST__?.status === 'function', { timeout: 12000 });
  await page.evaluate(() => window.__ASHEN_TEST__.prepareVisuals());
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().playerModelLoaded === true, { timeout: 60000 });
  await page.waitForTimeout(900);
  const landscapeStatus = await page.evaluate(() => window.__ASHEN_TEST__.status());
  await page.screenshot({ path: artifactDir + '/ashen-crown-gameplay.png', fullPage: false });
  assert.equal(landscapeStatus.gameReady, true, 'Three.js scene should have rendered at least one frame');
  assert.equal(landscapeStatus.playerModelLoaded, true, 'production Ashen Sentinel GLB should load');
  assert.ok(landscapeStatus.canvasWidth >= 600 && landscapeStatus.canvasHeight >= 300, 'game canvas should be visible at desktop test size');

  const started = await page.evaluate(() => window.__ASHEN_TEST__.startBossEncounter());
  assert.equal(started, true, 'local-only harness should be able to start the Warden encounter');
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossModelLoaded === true, { timeout: 60000 });
  await page.waitForFunction(() => window.__ASHEN_TEST__.status().bossEncounter === true, { timeout: 12000 });
  await page.waitForTimeout(900);
  status = await page.evaluate(() => window.__ASHEN_TEST__.status());
  await page.screenshot({ path: artifactDir + '/ashen-crown-boss-encounter.png', fullPage: false });
  assert.equal(status.bossModelLoaded, true, 'production Ashen Regent GLB should load');
  assert.equal(status.bossEncounter, true, 'boss should remain active after model load');
  assert.ok(status.bossHp > 0, 'boss health should be initialized');
  assert.equal(pageErrors.length, 0, 'browser must not report uncaught JavaScript exceptions');
  const bootError = await page.locator('.game-boot-status').evaluate(el => !el.hidden).catch(() => false);
  assert.equal(bootError, false, 'game boot diagnostic must remain hidden');

} catch (error) {
  failure = String(error?.stack || error);
} finally {
  status ||= await page.evaluate(() => window.__ASHEN_TEST__?.status?.() || null).catch(() => null);
  await writeFile(artifactDir + '/diagnostics.json', JSON.stringify({
    baseUrl, status, failure, pageErrors, consoleErrors, consoleWarnings, failedRequests,
    screenshotFiles: ['ashen-crown-gameplay.png', 'ashen-crown-boss-encounter.png']
  }, null, 2));
  await browser.close();
}

if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else {
  console.log('Gameplay smoke passed; captured production-player and Warden encounter screenshots.');
}
