import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const REQUIRED_CONFIRMATION = 'I_CONFIRM_THIS_IS_AN_ISOLATED_STAGING_PROJECT';
const baseUrl = process.env.ASHEN_S4_LOCAL_GAME_URL || 'http://127.0.0.1:4173';
const confirmation = process.env.ASHEN_S4_STAGING_CONFIRM;
const supabaseUrl = process.env.ASHEN_S4_SUPABASE_URL;
const allowedRef = process.env.ASHEN_S4_ALLOWED_PROJECT_REF;
const publishableKey = process.env.ASHEN_S4_SUPABASE_PUBLISHABLE_KEY;
const emailA = process.env.ASHEN_S4_USER_A_EMAIL;
const passwordA = process.env.ASHEN_S4_USER_A_PASSWORD;
const emailB = process.env.ASHEN_S4_USER_B_EMAIL;
const passwordB = process.env.ASHEN_S4_USER_B_PASSWORD;

function refuse(message) {
  throw new Error('Refusing to run staging browser test: ' + message);
}

if (confirmation !== REQUIRED_CONFIRMATION) refuse('explicit staging confirmation is required.');
if (!supabaseUrl || !allowedRef || !publishableKey || !emailA || !passwordA || !emailB || !passwordB) {
  refuse('all staging URL/key, project-ref allowlist, and two-account credentials are required.');
}
const supabaseOrigin = new URL(supabaseUrl);
if (supabaseOrigin.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/i.test(supabaseOrigin.hostname) ||
    supabaseOrigin.hostname.split('.')[0] !== allowedRef) {
  refuse('the Supabase URL must be HTTPS and match the explicit project-ref allowlist.');
}
if (/^sb_secret_/i.test(publishableKey)) refuse('service-role/secret keys must never be supplied to a browser.');

const gameUrl = new URL(baseUrl);
if (gameUrl.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '::1'].includes(gameUrl.hostname)) {
  refuse('the browser must run against a local static build, not a remote game URL.');
}
if (emailA.trim().toLowerCase() === emailB.trim().toLowerCase()) {
  refuse('two distinct staging accounts are required.');
}

const localFixture = {
  saveVersion: 5, mapVersion: 1, savedAt: 1, level: 1, xp: 0, hp: 100, stamina: 100,
  coins: 12, shards: 0, echoes: 0, quest: 0, chapter: 1, day: 1, chapterGathered: 0,
  weaponRank: 0, skillPoints: 0, skillRanks: [0, 0, 0], role: 'ashbreaker', appearance: 'default',
  currentMap: 'sanctuary', flags: {}, rep: { lyra: 0, orren: 0, seer: 0 },
  meta: { renown: 0, mastery: 0, legacy: 0, points: 0, contracts: 0, developmentDay: 0, hubLevel: 0, chaptersComplete: 0 },
  settings: { quality: 'performance', sensitivity: 1, reducedMotion: false, sound: true, volume: 0.35 },
  inventory: [], equipment: { core: null, charm: null, armor: null, relic: null },
  collectedNodes: [], hunt: { kills: 0 }, tutorial: true, log: ['S4 local-only fixture']
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

async function currentSession() {
  return page.evaluate(async () => window.AshenAuth?.getSession?.() || null);
}

async function signIn(email, password) {
  await page.locator('#accountOpen').click();
  await page.locator('#ashenAuthEmail').fill(email);
  await page.locator('#ashenAuthPassword').fill(password);
  await page.locator('#ashenAuthSubmit').click();
  await page.waitForFunction(async expectedEmail => {
    const session = await window.AshenAuth?.getSession?.();
    return String(session?.user?.email || '').toLowerCase() === expectedEmail.toLowerCase();
  }, email, { timeout: 60000 });
}

async function waitForRestoredLevel(level, expectedEmail) {
  await page.waitForFunction(async ({ expectedLevel, expectedEmail }) => {
    const session = await window.AshenAuth?.getSession?.();
    const status = window.__ASHEN_TEST__?.status?.();
    return String(session?.user?.email || '').toLowerCase() === expectedEmail.toLowerCase() &&
      status?.saveEncrypted === true &&
      status?.level === expectedLevel &&
      status?.chapter === 1;
  }, { expectedLevel: level, expectedEmail }, { timeout: 60000 });
}

try {
  await page.addInitScript(save => {
    window.__ASHEN_S4_CONFIRM_COUNT = Number(sessionStorage.getItem('ashen-s4-confirm-count') || 0);
    window.confirm = () => {
      window.__ASHEN_S4_CONFIRM_COUNT += 1;
      sessionStorage.setItem('ashen-s4-confirm-count', String(window.__ASHEN_S4_CONFIRM_COUNT));
      return true;
    };
    window.addEventListener('ashen:game-ready', () => {
      document.documentElement.dataset.ashenGameReady = 'true';
    }, { once: true });
    if (!sessionStorage.getItem('ashen-s4-local-fixture-seeded')) {
      localStorage.setItem('ashen-crown-3d', JSON.stringify(save));
      sessionStorage.setItem('ashen-s4-local-fixture-seeded', '1');
    }
  }, localFixture);

  await page.goto(new URL('/play.html?e2e=1', gameUrl.origin).href, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await page.waitForFunction(() => document.documentElement.dataset.ashenGameReady === 'true');
  await page.locator('#tutorialStart').click();
  await page.waitForFunction(() =>
    typeof window.__ASHEN_TEST__?.status === 'function' &&
    window.__ASHEN_TEST__.status().saveEncrypted === true
  );

  // The dedicated staging API probe has already seeded A=level 2 and B=level 4.
  // A low-timestamp local fixture forces the app to resolve a real local/cloud conflict.
  await signIn(emailA, passwordA);
  await waitForRestoredLevel(2, emailA);
  const afterA = await page.evaluate(async () => ({
    userId: (await window.AshenAuth.getSession())?.user?.id,
    local: window.__ASHEN_TEST__.status(),
    conflictBackups: Object.keys(localStorage).filter(key => key.startsWith('ashen-crown-3d.cloud-conflict.backup.')),
    confirms: Number(sessionStorage.getItem('ashen-s4-confirm-count') || 0),
    cloud: await window.AshenAuth.loadCloudSave()
  }));
  assert.ok(afterA.userId, 'Account A should have an authenticated session after restore.');
  assert.ok(afterA.conflictBackups.length >= 1, 'Restoring cloud progress must retain a local conflict backup.');
  assert.ok(afterA.confirms >= 1, 'A local/cloud conflict prompt must have been shown.');
  assert.equal(afterA.cloud?.save_json?.level, 2, 'Account A cloud row should still contain its own v5 test fixture.');

  // Switch accounts in the same browser profile. This must restore B's journey,
  // not upload A's queued save or reuse A's remote row.
  await page.locator('#accountOpen').click();
  await page.locator('#ashenAuthSignOut').click();
  await page.waitForFunction(() => !window.AshenAuth?.getUserId?.());
  await signIn(emailB, passwordB);
  await waitForRestoredLevel(4, emailB);

  const afterB = await page.evaluate(async () => ({
    userId: (await window.AshenAuth.getSession())?.user?.id,
    local: window.__ASHEN_TEST__.status(),
    conflictBackups: Object.keys(localStorage).filter(key => key.startsWith('ashen-crown-3d.cloud-conflict.backup.')),
    confirms: Number(sessionStorage.getItem('ashen-s4-confirm-count') || 0),
    cloud: await window.AshenAuth.loadCloudSave()
  }));
  assert.notEqual(afterB.userId, afterA.userId, 'Account switching must change the authenticated user.');
  assert.equal(afterB.local.level, 4, 'Switching to account B must restore B progress in the browser.');
  assert.ok(afterB.conflictBackups.length >= 2, 'The previous local progress should be backed up during each conflict restore.');
  assert.ok(afterB.confirms >= 2, 'The account switch should resolve a second local/cloud conflict.');
  assert.equal(afterB.cloud?.save_json?.level, 4, 'Account B cloud row must remain separate from account A.');
  assert.deepEqual(pageErrors, [], 'Cloud restore and account switching should not create uncaught browser errors.');

  process.stdout.write('S4 browser staging regression passed: cloud conflict restore, encrypted local backup, and two-account switching.
');
} finally {
  await context.close();
  await browser.close();
}
