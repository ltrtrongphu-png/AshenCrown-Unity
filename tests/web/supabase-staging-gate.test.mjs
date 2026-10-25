import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('live Supabase staging probe refuses to contact any project without explicit confirmation', () => {
  const env = { ...process.env };
  for (const key of [
    'ASHEN_S4_SUPABASE_URL',
    'ASHEN_S4_SUPABASE_PUBLISHABLE_KEY',
    'ASHEN_S4_ALLOWED_PROJECT_REF',
    'ASHEN_S4_USER_A_EMAIL',
    'ASHEN_S4_USER_A_PASSWORD',
    'ASHEN_S4_USER_B_EMAIL',
    'ASHEN_S4_USER_B_PASSWORD',
    'ASHEN_S4_STAGING_CONFIRM'
  ]) delete env[key];

  const result = spawnSync(
    process.execPath,
    ['tests/integration/supabase-cloud-save.mjs'],
    { env, encoding: 'utf8', timeout: 5000 }
  );
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exact staging-only confirmation string/);
});
