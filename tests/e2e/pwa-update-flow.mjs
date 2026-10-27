import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.ASHEN_SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

try {
  await page.addInitScript(() => {
    // Isolate the update protocol from the real worker so CI can deterministically
    // exercise an older active worker and a different, waiting build.
    localStorage.setItem('ashen-crown.auto-update.v1', 'false');
    const container = new EventTarget();
    let registration = null;

    const makeWorker = buildId => ({
      state: 'activated',
      postMessage(message, ports = []) {
        if (message?.type === 'ASHEN_GET_VERSION') {
          ports[0]?.postMessage({ type: 'ASHEN_APP_VERSION', buildId });
          return;
        }
        if (message?.type === 'ASHEN_SKIP_WAITING') {
          sessionStorage.setItem('ashen-test-skip-waiting', 'true');
          registration.active = registration.waiting;
          registration.waiting = null;
          container.controller = registration.active;
          setTimeout(() => container.dispatchEvent(new Event('controllerchange')), 0);
        }
      }
    });

    container.controller = null;
    container.register = async () => {
      if (registration) return registration;
      const currentBuild = document.querySelector('meta[name="ashen-build-id"]')?.content || '';
      const nextBuild = (currentBuild[0] === 'a' ? 'b' : 'a') + currentBuild.slice(1);
      const active = makeWorker(currentBuild);
      const waiting = makeWorker(nextBuild);
      registration = new EventTarget();
      registration.active = active;
      registration.waiting = waiting;
      registration.installing = null;
      registration.update = async () => {};
      container.controller = active;
      sessionStorage.setItem('ashen-test-target-build', nextBuild);
      return registration;
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: container
    });
  });

  await page.goto(baseUrl + '/?e2e=pwa-update-flow', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.AshenAppUpdater?.getState?.().updateAvailable === true, null, { timeout: 10000 });

  const before = await page.evaluate(() => ({
    state: window.AshenAppUpdater.getState(),
    expectedTarget: sessionStorage.getItem('ashen-test-target-build')
  }));
  assert.equal(before.state.autoUpdate, false, 'the test must disable automatic refresh to prove the waiting build does not activate by itself');
  assert.equal(before.state.updateAvailable, true, 'the newer waiting build must be detected');
  assert.equal(before.state.workerBuildId, before.expectedTarget, 'the waiting build must be the update target');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('ashen-test-skip-waiting')), null,
    'the waiting worker must not activate while auto-update is disabled and the user has not confirmed');

  const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.evaluate(() => {
    void window.AshenAppUpdater.applyUpdate();
  });
  await navigation;

  const after = await page.evaluate(() => ({
    activated: sessionStorage.getItem('ashen-test-skip-waiting'),
    reloadTarget: sessionStorage.getItem('ashen-crown.update-reload-target.v1'),
    expectedTarget: sessionStorage.getItem('ashen-test-target-build')
  }));
  assert.equal(after.activated, 'true', 'manual update must message the waiting worker to activate');
  assert.equal(after.reloadTarget, after.expectedTarget, 'the target build should be recorded before reloading');
  assert.equal(pageErrors.length, 0, 'update flow must not raise uncaught browser errors: ' + pageErrors.join('\n'));
  console.log('PWA update-flow E2E passed: distinct waiting build detected, kept waiting until requested, activated, and reloaded.');
} finally {
  await context.close();
  await browser.close();
}
