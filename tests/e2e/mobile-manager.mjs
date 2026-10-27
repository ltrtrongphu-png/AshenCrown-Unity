import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true
});
const page = await context.newPage();
page.setDefaultTimeout(60000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

try {
  await page.addInitScript(() => {
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
  });
  await page.goto(baseUrl + '/play.html?e2e=mobile-manager', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true', null, { timeout: 60000 });
  await page.waitForSelector('#mobileCommandDock');
  await page.locator('#tutorialStart').evaluate(button => button.click());

  const layout = await page.evaluate(() => {
    const dock = document.querySelector('#mobileCommandDock').getBoundingClientRect();
    const stage = document.querySelector('.stage').getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dockLeft: dock.left,
      dockRight: dock.right,
      dockBottom: dock.bottom,
      stageBottom: stage.bottom,
      dockDisplay: getComputedStyle(document.querySelector('#mobileCommandDock')).display,
      controlsDisplay: getComputedStyle(document.querySelector('.touch-controls')).display
    };
  });
  assert.equal(layout.dockDisplay, 'grid', 'mobile command dock should be visible on a phone viewport');
  assert.equal(layout.controlsDisplay, 'flex', 'touch controls should be visible on a phone viewport');
  assert.ok(layout.dockLeft >= 0 && layout.dockRight <= layout.viewportWidth,
    'mobile command dock must remain inside the viewport: ' + JSON.stringify(layout));
  assert.ok(layout.dockBottom <= layout.stageBottom + 1,
    'mobile dock must stay inside the gameplay stage: ' + JSON.stringify(layout));
  assert.ok(layout.documentWidth <= layout.viewportWidth + 1,
    'mobile layout must not introduce horizontal document overflow: ' + JSON.stringify(layout));

  await page.locator('#mobileDockMenu').click();
  await page.waitForFunction(() => !document.querySelector('#mobileManagerOverlay').hidden);
  assert.equal(await page.locator('#mobileManagerOverlay [role="dialog"]').count(), 1);
  assert.match((await page.locator('#mobileManagerVersion').innerText()).trim(), /^[a-f0-9]{8}$/i,
    'field manager should display the deployed build identifier');
  assert.match((await page.locator('#mobileManagerNetwork').innerText()).trim(), /NETWORK · ONLINE|NETWORK · OFFLINE/);
  assert.ok((await page.locator('#mobileManagerSave').innerText()).trim().length > 0,
    'field manager should show local save state');
  assert.equal(await page.locator('#mobileAutoUpdateToggle').getAttribute('aria-pressed'), 'true',
    'automatic updates should be enabled by default');

  const initialAutoUpdate = await page.evaluate(() => window.AshenAppUpdater.getState().autoUpdate);
  await page.locator('#mobileAutoUpdateToggle').click();
  assert.equal(await page.evaluate(() => window.AshenAppUpdater.getState().autoUpdate), !initialAutoUpdate,
    'automatic updates setting should toggle');
  await page.locator('#mobileAutoUpdateToggle').click();
  assert.equal(await page.evaluate(() => window.AshenAppUpdater.getState().autoUpdate), initialAutoUpdate,
    'automatic updates setting should be reversible');

  await page.locator('#mobileManagerClose').click();
  await page.locator('#mobileDockBag').click();
  await page.waitForFunction(() => document.querySelector('#inventoryMenu')?.classList.contains('show'));
  await page.locator('#closeInventory').click();

  await page.locator('#mobileDockMap').click();
  await page.waitForFunction(() => document.querySelector('#worldMap')?.classList.contains('show'));
  await page.locator('#closeMap').click();

  await page.locator('#mobileDockJournal').click();
  assert.equal(await page.locator('#journal').evaluate(el => el.classList.contains('open')), true,
    'mobile journal command should open the journal');
  await page.locator('#mobileDockJournal').click();
  assert.equal(await page.locator('#journal').evaluate(el => el.classList.contains('open')), false,
    'mobile journal command should toggle it closed');

  await page.locator('#mobileDockPause').click();
  assert.equal(await page.locator('#pause').evaluate(el => el.classList.contains('show')), true,
    'mobile pause command should pause the journey');
  await page.locator('#mobileDockPause').click();
  assert.equal(await page.locator('#pause').evaluate(el => el.classList.contains('show')), false,
    'mobile pause command should resume the journey');

  const updaterReady = await page.evaluate(async () => {
    const updater = window.AshenAppUpdater;
    if (!updater) return false;
    await updater.checkForUpdates();
    return Boolean(updater.getState().status);
  });
  assert.equal(updaterReady, true, 'mobile field manager should be wired to the app update service');
  assert.equal(pageErrors.length, 0, 'mobile manager should not introduce uncaught browser errors: ' + pageErrors.join('\n'));
  console.log('Mobile manager E2E passed: responsive dock, local/cloud status, automatic update toggle, inventory, map, journal and pause controls.');
} finally {
  await context.close();
  await browser.close();
}
