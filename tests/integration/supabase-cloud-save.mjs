import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const REQUIRED_CONFIRMATION = 'I_CONFIRM_THIS_IS_AN_ISOLATED_STAGING_PROJECT';
const FIXTURE_MARKER = 'ashen-crown-s4-cloud-save-test';

function refuse(message) {
  throw new Error('Refusing to run: ' + message);
}

function readConfig() {
  if (process.env.ASHEN_S4_STAGING_CONFIRM !== REQUIRED_CONFIRMATION) {
    refuse('set ASHEN_S4_STAGING_CONFIRM to the exact staging-only confirmation string before any network request.');
  }

  const required = [
    'ASHEN_S4_SUPABASE_URL',
    'ASHEN_S4_SUPABASE_PUBLISHABLE_KEY',
    'ASHEN_S4_ALLOWED_PROJECT_REF',
    'ASHEN_S4_USER_A_EMAIL',
    'ASHEN_S4_USER_A_PASSWORD',
    'ASHEN_S4_USER_B_EMAIL',
    'ASHEN_S4_USER_B_PASSWORD'
  ];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) refuse('missing environment variables: ' + missing.join(', ') + '.');

  const base = new URL(process.env.ASHEN_S4_SUPABASE_URL);
  if (base.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.supabase\.co$/i.test(base.hostname) ||
      base.username || base.password || base.port || base.search || base.hash ||
      (base.pathname !== '/' && base.pathname !== '')) {
    refuse('ASHEN_S4_SUPABASE_URL must be a plain HTTPS <project-ref>.supabase.co origin.');
  }
  const projectRef = base.hostname.split('.')[0];
  if (projectRef !== process.env.ASHEN_S4_ALLOWED_PROJECT_REF) {
    refuse('URL project ref does not match ASHEN_S4_ALLOWED_PROJECT_REF.');
  }

  const apiKey = process.env.ASHEN_S4_SUPABASE_PUBLISHABLE_KEY.trim();
  if (!apiKey || /^sb_secret_/i.test(apiKey)) {
    refuse('use a publishable/anon API key; secret/service-role keys are forbidden.');
  }
  if (apiKey.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(apiKey.split('.')[1], 'base64url').toString('utf8'));
      if (payload.role === 'service_role') {
        refuse('service_role JWTs are forbidden in this client-level test.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Refusing to run:')) throw error;
      refuse('could not safely inspect the supplied legacy anon JWT role.');
    }
  }

  const emailA = process.env.ASHEN_S4_USER_A_EMAIL.trim().toLowerCase();
  const emailB = process.env.ASHEN_S4_USER_B_EMAIL.trim().toLowerCase();
  if (!emailA || !emailB || emailA === emailB) refuse('two distinct test-account emails are required.');

  return {
    base: base.origin,
    apiKey,
    projectRef,
    accounts: [
      { label: 'A', email: emailA, password: process.env.ASHEN_S4_USER_A_PASSWORD },
      { label: 'B', email: emailB, password: process.env.ASHEN_S4_USER_B_PASSWORD }
    ]
  };
}

async function requestJson(url, { token, method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: config.apiKey,
    Authorization: 'Bearer ' + (token || config.apiKey),
    Accept: 'application/json'
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = { message: 'Response was not JSON.' }; }
  }
  return { response, data };
}

async function signIn(account) {
  const { response, data } = await requestJson(
    config.base + '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: { email: account.email, password: account.password }
    }
  );
  if (!response.ok || !data?.access_token || !data?.user?.id) {
    refuse('sign-in failed for test account ' + account.label +
      ' (HTTP ' + response.status + '). Check email confirmation and staging credentials; response body is suppressed.');
  }
  if (String(data.user.email || '').toLowerCase() !== account.email) {
    refuse('Supabase returned a different email for test account ' + account.label + '.');
  }
  return { ...account, userId: data.user.id, accessToken: data.access_token };
}

function rowsUrl(userId) {
  return config.base + '/rest/v1/player_web_saves?select=user_id,save_json,updated_at,version&user_id=eq.' +
    encodeURIComponent(userId);
}

async function readOwn(account) {
  const { response, data } = await requestJson(rowsUrl(account.userId), { token: account.accessToken });
  if (!response.ok || !Array.isArray(data)) {
    refuse('reading the own-row probe failed for account ' + account.label + ' (HTTP ' + response.status + ').');
  }
  return data;
}

async function upsertOwn(account, save, updatedAt) {
  const { response } = await requestJson(config.base + '/rest/v1/player_web_saves?on_conflict=user_id', {
    token: account.accessToken,
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: account.userId,
      save_json: save,
      version: 5,
      updated_at: updatedAt
    }
  });
  if (!response.ok) {
    refuse('own-row v5 save write failed for account ' + account.label + ' (HTTP ' + response.status + ').');
  }
}

function makeFixture(level, runId) {
  return {
    saveVersion: 5,
    level,
    chapter: 1,
    inventory: [],
    flags: {
      __ashen_s4_test: true,
      __ashen_s4_fixture: FIXTURE_MARKER,
      __ashen_s4_run: runId
    },
    savedAt: Date.now(),
    __ashen_s4_test: true,
    __ashen_s4_fixture: FIXTURE_MARKER,
    __ashen_s4_run: runId
  };
}

function isOwnedTestFixture(row) {
  const save = row?.save_json;
  return save?.__ashen_s4_test === true && save?.__ashen_s4_fixture === FIXTURE_MARKER ||
    save?.flags?.__ashen_s4_test === true && save?.flags?.__ashen_s4_fixture === FIXTURE_MARKER;
}

async function run() {
  const accountA = await signIn(config.accounts[0]);
  const accountB = await signIn(config.accounts[1]);
  assert.notEqual(accountA.userId, accountB.userId, 'The two staging accounts must have different user IDs.');

  // Fail closed before writing anything if either account already holds real
  // game progress. This script only writes records explicitly marked as S4 test data.
  const [initialA, initialB] = await Promise.all([readOwn(accountA), readOwn(accountB)]);
  for (const [account, rows] of [[accountA, initialA], [accountB, initialB]]) {
    if (rows.length > 1) refuse('unexpected duplicate rows for account ' + account.label + '.');
    if (rows.length === 1 && !isOwnedTestFixture(rows[0])) {
      refuse('account ' + account.label + ' already has an unmarked cloud save; use a dedicated empty staging account.');
    }
  }

  const runId = 's4-' + randomUUID();
  const saveA = makeFixture(2, runId);
  const saveB = makeFixture(7, runId);
  const stampedAt = new Date().toISOString();

  await upsertOwn(accountA, saveA, stampedAt);
  await upsertOwn(accountB, saveB, stampedAt);

  const [ownA, ownB] = await Promise.all([readOwn(accountA), readOwn(accountB)]);
  assert.equal(ownA.length, 1, 'Account A must read back its own row.');
  assert.equal(ownB.length, 1, 'Account B must read back its own row.');
  assert.equal(ownA[0].save_json.__ashen_s4_run || ownA[0].save_json.flags?.__ashen_s4_run, runId);
  assert.equal(ownB[0].save_json.__ashen_s4_run || ownB[0].save_json.flags?.__ashen_s4_run, runId);
  assert.equal(ownA[0].save_json.level, 2);
  assert.equal(ownB[0].save_json.level, 7);

  const [aReadingB, bReadingA] = await Promise.all([
    requestJson(rowsUrl(accountB.userId), { token: accountA.accessToken }),
    requestJson(rowsUrl(accountA.userId), { token: accountB.accessToken })
  ]);
  assert.equal(aReadingB.response.ok, true, 'Cross-row SELECT should be a successful empty query, not an API error.');
  assert.deepEqual(aReadingB.data, [], 'Account A must not read Account B cloud save.');
  assert.equal(bReadingA.response.ok, true, 'Cross-row SELECT should be a successful empty query, not an API error.');
  assert.deepEqual(bReadingA.data, [], 'Account B must not read Account A cloud save.');

  const attackSave = { ...makeFixture(99, runId), __ashen_s4_run: runId + '-attack' };
  const crossUpsert = await requestJson(config.base + '/rest/v1/player_web_saves?on_conflict=user_id', {
    token: accountA.accessToken,
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: accountB.userId,
      save_json: attackSave,
      version: 5,
      updated_at: new Date(Date.now() + 1000).toISOString()
    }
  });

  const crossUpdate = await requestJson(rowsUrl(accountB.userId), {
    token: accountA.accessToken,
    method: 'PATCH',
    prefer: 'return=representation',
    body: {
      save_json: attackSave,
      updated_at: new Date(Date.now() + 2000).toISOString()
    }
  });
  const crossUpdateTouchedRows = crossUpdate.response.ok &&
    Array.isArray(crossUpdate.data) && crossUpdate.data.length > 0;

  const deleteOwn = await requestJson(rowsUrl(accountA.userId), {
    token: accountA.accessToken,
    method: 'DELETE',
    prefer: 'return=representation'
  });
  const failedChecks = [];
  if (crossUpsert.response.ok) failedChecks.push('Cross-account upsert was unexpectedly accepted.');
  if (!crossUpdate.response.ok || crossUpdateTouchedRows) {
    failedChecks.push('Cross-account update was unexpectedly accepted or returned a write error.');
  }
  if (deleteOwn.response.ok) failedChecks.push('Authenticated DELETE was unexpectedly granted.');

  // Restore both rows to the current marked fixture through their owners, even
  // if a regression allowed one of the attacks above. The script never deletes rows.
  await upsertOwn(accountA, saveA, new Date().toISOString());
  await upsertOwn(accountB, saveB, new Date().toISOString());
  const [finalA, finalB] = await Promise.all([readOwn(accountA), readOwn(accountB)]);
  assert.equal(finalA.length, 1, 'Account A test fixture should remain available.');
  assert.equal(finalB.length, 1, 'Account B test fixture should remain available.');
  assert.equal(finalA[0].save_json.__ashen_s4_run || finalA[0].save_json.flags?.__ashen_s4_run, runId);
  assert.equal(finalB[0].save_json.__ashen_s4_run || finalB[0].save_json.flags?.__ashen_s4_run, runId);
  if (failedChecks.length) throw new Error(failedChecks.join(' '));

  console.log('S4 live staging checks passed for project ref ' + config.projectRef + '.');
  console.log('Verified: distinct accounts, own-row save/readback, cross-account read isolation, cross-account upsert/update denial, and no DELETE privilege.');
  console.log('Test-only marked rows remain in the two dedicated staging accounts; do not use those accounts for gameplay.');
}

let config;
try {
  config = readConfig();
  await run();
} catch (error) {
  console.error('[Ashen Crown S4] ' + String(error?.message || error));
  process.exitCode = 1;
}
