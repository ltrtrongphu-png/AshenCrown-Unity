import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, sanitizeItemRecord } from '../../save-utils.js';

test('saved journal entries strip controls and cap display length', async () => {
  const { sanitizeJournalEntry } = await import('../../save-utils.js');
  assert.equal(sanitizeJournalEntry('line\u0000\u0008\u001f\u007f end'), 'line end');
  assert.equal(sanitizeJournalEntry('<img id="xss">'), '<img id="xss">', 'HTML must be escaped at the DOM sink, not destroyed as text');
  assert.equal(sanitizeJournalEntry('x'.repeat(1500)).length, 1000);
  assert.equal(sanitizeJournalEntry('<svg>', 3), '<sv');
  assert.equal(sanitizeJournalEntry(null), '');
});

test('escapeHtml converts markup and attribute-sensitive characters to text', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)"> & \'Ashen\''),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;Ashen&#39;'
  );
});

test('escapeHtml handles nullish values and ordinary unicode text', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml('Ashen Crown — 灰の王冠'), 'Ashen Crown — 灰の王冠');
});

test('sanitizeItemRecord rejects non-record and empty names', () => {
  assert.equal(sanitizeItemRecord(null), null);
  assert.equal(sanitizeItemRecord([]), null);
  assert.equal(sanitizeItemRecord('item'), null);
  assert.equal(sanitizeItemRecord({ name: '\u0000\u0007   ' }), null);
});

test('sanitizeItemRecord bounds strings, list length, ids, stats and price', () => {
  const raw = {
    itemId: 'gear_01',
    name: '  Ember\u0000 Blade  ',
    type: 'Weapon',
    rarity: 'Legendary',
    attrs: ['+Vitality', '<script>alert(1)</script>', 12, ...Array(9).fill('extra')],
    stats: { vitality: 9.8, focus: -3, ward: 'NaN', ignored: 100 },
    source: 'x'.repeat(40),
    price: 10000000
  };

  const item = sanitizeItemRecord(raw);

  assert.deepEqual(item, {
    itemId: 'gear_01',
    name: 'Ember Blade',
    type: 'Weapon',
    rarity: 'Legendary',
    attrs: ['+Vitality', '<script>alert(1)</script>', ...Array(6).fill('extra')],
    stats: { vitality: 5, focus: 0 },
    source: 'x'.repeat(30),
    price: 999999
  });
  assert.equal(escapeHtml(item.attrs[1]), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(raw.stats.vitality, 9.8, 'normalization must not mutate the source object');
});

test('sanitizeItemRecord applies conservative defaults to unknown fields', () => {
  assert.deepEqual(sanitizeItemRecord({ name: 'Mysterious item', type: 'AdminCommand', rarity: 'Mythic' }), {
    itemId: '',
    name: 'Mysterious item',
    type: 'Material',
    rarity: 'Common',
    attrs: [],
    stats: {}
  });
});

test('sanitizeItemRecord rejects unsafe ids and ignores non-string attributes', () => {
  const item = sanitizeItemRecord({
    itemId: '<script>',
    name: 'Relic',
    attrs: ['safe', null, 4, 'line\nfeed'],
    price: Number.POSITIVE_INFINITY
  });
  assert.equal(item.itemId, '');
  assert.deepEqual(item.attrs, ['safe', 'linefeed']);
  assert.equal('price' in item, false);
});


test('save comparison ignores write timestamps but detects gameplay changes', async () => {
  const { serializeSaveForComparison } = await import('../../save-utils.js');
  const first = { saveVersion: 5, level: 3, coins: 20, savedAt: 100 };
  const sameState = { saveVersion: 5, level: 3, coins: 20, savedAt: 200 };
  const changedState = { saveVersion: 5, level: 3, coins: 21, savedAt: 200 };

  assert.equal(serializeSaveForComparison(first), serializeSaveForComparison(sameState));
  assert.notEqual(serializeSaveForComparison(first), serializeSaveForComparison(changedState));
  assert.equal(serializeSaveForComparison(null), '');
});


test('cloud save conflict never silently selects a newer cloud save over local progress', async () => {
  const { cloudSaveDecision } = await import('../../save-utils.js');
  const local = { saveVersion: 5, level: 12, savedAt: 200 };
  const newerCloud = { saveVersion: 5, level: 8, savedAt: 300 };
  const olderCloud = { saveVersion: 5, level: 8, savedAt: 100 };

  assert.equal(cloudSaveDecision(local, newerCloud).action, 'ask-cloud');
  assert.equal(cloudSaveDecision(local, olderCloud).action, 'ask-local');
  assert.equal(cloudSaveDecision(null, newerCloud).action, 'use-cloud');
  assert.equal(cloudSaveDecision(local, { level: 'invalid' }).action, 'invalid-cloud');
  assert.equal(cloudSaveDecision(local, { saveVersion: 4, level: 12 }).action, 'invalid-cloud');
  assert.equal(cloudSaveDecision(local, { saveVersion: 5, level: 1.5 }).action, 'invalid-cloud');
});


test('local save backups verify raw bytes and rotate old conflict copies', async () => {
  const { backupLocalSave } = await import('../../save-utils.js');
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };

  assert.equal(backupLocalSave(storage, '{"level":1}', 100), 'ashen-crown-3d.backup.100');
  assert.equal(backupLocalSave(storage, '{"level":2}', 200), 'ashen-crown-3d.backup.200');
  assert.equal(backupLocalSave(storage, '{"level":3}', 300), 'ashen-crown-3d.backup.300');
  assert.equal(backupLocalSave(storage, '{"level":4}', 400), 'ashen-crown-3d.backup.400');
  assert.equal(storage.getItem('ashen-crown-3d.backup.100'), null);
  assert.equal(storage.getItem('ashen-crown-3d.backup.200'), '{"level":2}');
  assert.equal(storage.getItem('ashen-crown-3d.backup.400'), '{"level":4}');
  assert.throws(() => backupLocalSave(storage, '', 500), /non-empty local save/);
});

test('equal save timestamps with different progress still require a user decision', async () => {
  const { cloudSaveDecision } = await import('../../save-utils.js');
  const local = { saveVersion: 5, level: 5, savedAt: 100, coins: 100 };
  const remote = { saveVersion: 5, level: 3, savedAt: 100, coins: 20 };
  assert.equal(cloudSaveDecision(local, remote).action, 'ask-local');
});

test('save comparison is insensitive to object key order across JSONB round trips', async () => {
  const { serializeSaveForComparison } = await import('../../save-utils.js');
  const local = { saveVersion: 5, savedAt: 200, level: 4, settings: { volume: 0.5, quality: 'high' }, inventory: [{ name: 'Blade', stats: { ward: 2, focus: 1 } }] };
  const cloud = { saveVersion: 5, inventory: [{ stats: { focus: 1, ward: 2 }, name: 'Blade' }], settings: { quality: 'high', volume: 0.5 }, level: 4, savedAt: 900 };
  assert.equal(serializeSaveForComparison(local), serializeSaveForComparison(cloud));
});

test('equivalent local and cloud payloads do not prompt solely because timestamps differ', async () => {
  const { cloudSaveDecision } = await import('../../save-utils.js');
  assert.equal(cloudSaveDecision(
    { saveVersion: 5, savedAt: 100, level: 4, inventory: [{ name: 'Blade', stats: { ward: 2, focus: 1 } }] },
    { saveVersion: 5, savedAt: 300, inventory: [{ stats: { focus: 1, ward: 2 }, name: 'Blade' }], level: 4 }
  ).action, 'keep-local');
});


test('encrypted local saves round-trip with AES-GCM and use a fresh IV', async () => {
  const { webcrypto } = await import('node:crypto');
  const { encryptSavePayload, decryptSavePayload, isEncryptedSaveEnvelope } = await import('../../save-utils.js');
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const save = { saveVersion: 5, level: 7, coins: 80, inventory: [{ name: 'Ashen Blade' }] };
  const first = await encryptSavePayload(save, key, webcrypto);
  const second = await encryptSavePayload(save, key, webcrypto);
  assert.equal(isEncryptedSaveEnvelope(first), true);
  assert.notEqual(first, second, 'each encryption must use a unique random IV');
  assert.equal(first.includes('"Ashen Blade"'), false, 'ciphertext must not expose JSON fields');
  assert.deepEqual(await decryptSavePayload(first, key, webcrypto), save);
  const middle = first.length - 6;
  const tampered = first.slice(0, middle) + (first[middle] === 'A' ? 'B' : 'A') + first.slice(middle + 1);
  await assert.rejects(() => decryptSavePayload(tampered, key, webcrypto));
});

test('plaintext v5 save migrates only after verified encrypted primary and backup writes', async () => {
  const { webcrypto } = await import('node:crypto');
  const { readEncryptedLocalSave, decryptSavePayload, ENCRYPTED_SAVE_BACKUP_SUFFIX } = await import('../../save-utils.js');
  const primary = { saveVersion: 5, level: 22, chapter: 3, coins: 999, savedAt: 220, inventory: [] };
  const olderBackup = { saveVersion: 5, level: 18, chapter: 2, coins: 500, savedAt: 180, inventory: [] };
  const newestBackup = { saveVersion: 5, level: 23, chapter: 4, coins: 1000, savedAt: 230, inventory: [] };
  const values = new Map([
    ['ashen-crown-3d', JSON.stringify(primary)],
    ['ashen-crown-3d.backup.100', JSON.stringify(olderBackup)],
    ['ashen-crown-3d.backup.200', JSON.stringify(newestBackup)],
    ['unrelated-preference', 'dark']
  ]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, primary);
  assert.equal(result.migrated, true);
  assert.equal(result.wipedLegacy, false);
  assert.equal(result.needsRecovery, undefined);
  const encryptedPrimary = storage.getItem('ashen-crown-3d');
  assert.equal(encryptedPrimary.startsWith('ASHEN-AESGCM-v1:'), true);
  assert.deepEqual(await decryptSavePayload(encryptedPrimary, key, webcrypto), primary);
  assert.deepEqual(
    await decryptSavePayload(storage.getItem('ashen-crown-3d' + ENCRYPTED_SAVE_BACKUP_SUFFIX), key, webcrypto),
    newestBackup,
    'retain the newest prior v5 backup in encrypted form'
  );
  assert.equal(storage.getItem('ashen-crown-3d.backup.100'), null);
  assert.equal(storage.getItem('ashen-crown-3d.backup.200'), null);
  assert.equal(storage.getItem('unrelated-preference'), 'dark');
});

test('invalid plaintext save is preserved and requires recovery rather than being wiped', async () => {
  const { readEncryptedLocalSave } = await import('../../save-utils.js');
  const raw = '{"saveVersion":4,"level":22}';
  const values = new Map([['ashen-crown-3d', raw], ['ashen-crown-3d.backup.bad', 'not-json']]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => {
    throw new Error('must not create a key for unsupported data');
  });
  assert.equal(result.needsRecovery, true);
  assert.equal(result.reason, 'unsupported-plaintext');
  assert.equal(storage.getItem('ashen-crown-3d'), raw);
  assert.equal(storage.getItem('ashen-crown-3d.backup.bad'), 'not-json');
});

test('save import rejects oversized, corrupt, wrong-version and malformed payloads', async () => {
  const { parseSaveImport } = await import('../../save-utils.js');
  const save = { saveVersion: 5, level: 4, chapter: 2, inventory: [], flags: {} };
  assert.deepEqual(parseSaveImport(JSON.stringify(save)), save);
  assert.throws(() => parseSaveImport('{bad json'), /valid JSON/);
  assert.throws(() => parseSaveImport(JSON.stringify({ ...save, saveVersion: 4 })), /v5 save/);
  assert.throws(() => parseSaveImport(JSON.stringify({ ...save, level: 3.5 })), /v5 save/);
  assert.throws(() => parseSaveImport(JSON.stringify(save), 10), /too large/);
});

test('encrypted local-save adapter preserves a corrupt envelope for manual recovery', async () => {
  const { webcrypto } = await import('node:crypto');
  const { readEncryptedLocalSave, encryptSavePayload } = await import('../../save-utils.js');
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const save = { saveVersion: 5, level: 4, chapter: 2, inventory: [], flags: {} };
  const envelope = await encryptSavePayload(save, key, webcrypto);
  const middle = envelope.length - 6;
  const tampered = envelope.slice(0, middle) + (envelope[middle] === 'A' ? 'B' : 'A') + envelope.slice(middle + 1);
  storage.setItem('ashen-crown-3d', tampered);
  storage.setItem('unrelated-preference', 'dark');
  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.equal(result.value, null);
  assert.equal(result.wipedLegacy, false);
  assert.equal(result.corrupt, true);
  assert.equal(result.needsRecovery, true);
  assert.equal(storage.getItem('ashen-crown-3d'), tampered);
  assert.equal(storage.getItem('unrelated-preference'), 'dark');
});

test('encrypted local-save adapter offers a verified backup without overwriting corrupt ciphertext', async () => {
  const { webcrypto } = await import('node:crypto');
  const { writeEncryptedLocalSave, readEncryptedLocalSave, encryptSavePayload } = await import('../../save-utils.js');
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const save = { saveVersion: 5, level: 4, flags: { gate: true } };
  assert.equal(await writeEncryptedLocalSave(storage, 'ashen-crown-3d', save, key, webcrypto), true);
  const savedEnvelope = storage.getItem('ashen-crown-3d');
  assert.equal(savedEnvelope.includes('"level"'), false);
  const legacyBackup = { saveVersion: 5, level: 3, chapter: 1, inventory: [], flags: {}, savedAt: 10 };
  storage.setItem('ashen-crown-3d.backup.legacy', JSON.stringify(legacyBackup));
  const loaded = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(loaded.value, save);
  assert.equal(loaded.removedBackups, 1);
  assert.equal(loaded.wipedLegacy, false);
  assert.equal(storage.getItem('ashen-crown-3d.backup.legacy'), null);
  const badEnvelope = await encryptSavePayload(save, key, webcrypto);
  const middle = badEnvelope.length - 6;
  const tamperedEnvelope = badEnvelope.slice(0, middle) +
    (badEnvelope[middle] === 'A' ? 'B' : 'A') + badEnvelope.slice(middle + 1);
  values.set('ashen-crown-3d', tamperedEnvelope);
  const bad = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(bad.value, legacyBackup, 'the readable encrypted backup should be offered as recoverable progress');
  assert.equal(bad.wipedLegacy, false);
  assert.equal(bad.corrupt, true);
  assert.equal(bad.needsRecovery, true);
  assert.equal(bad.reason, 'corrupt-envelope-encrypted-backup-available');
  assert.equal(storage.getItem('ashen-crown-3d'), tamperedEnvelope, 'corrupt ciphertext must be retained until explicit recovery');
});


test('orphaned plaintext v5 backup restores the save only after encryption succeeds', async () => {
  const { webcrypto } = await import('node:crypto');
  const { readEncryptedLocalSave, decryptSavePayload, ENCRYPTED_SAVE_BACKUP_SUFFIX } = await import('../../save-utils.js');
  const recovery = { saveVersion: 5, level: 22, chapter: 8, coins: 999, savedAt: 500, inventory: [], flags: {} };
  const values = new Map([
    ['ashen-crown-3d.backup.100', JSON.stringify({ saveVersion: 5, level: 18, chapter: 6, coins: 500, savedAt: 300, inventory: [], flags: {} })],
    ['ashen-crown-3d.backup.200', JSON.stringify(recovery)],
    ['unrelated-preference', 'dark']
  ]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, recovery);
  assert.equal(result.recoveredFromBackup, true);
  assert.equal(result.migrated, true);
  assert.deepEqual(await decryptSavePayload(storage.getItem('ashen-crown-3d'), key, webcrypto), recovery);
  assert.deepEqual(await decryptSavePayload(storage.getItem('ashen-crown-3d' + ENCRYPTED_SAVE_BACKUP_SUFFIX), key, webcrypto), recovery);
  assert.equal(storage.getItem('ashen-crown-3d.backup.100'), null);
  assert.equal(storage.getItem('ashen-crown-3d.backup.200'), null);
  assert.equal(storage.getItem('unrelated-preference'), 'dark');
});


test('cloud conflict ciphertext backups do not trigger legacy-save recovery mode', async () => {
  const { webcrypto } = await import('node:crypto');
  const { encryptSavePayload, readEncryptedLocalSave, backupLocalSave } = await import('../../save-utils.js');
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const save = { saveVersion: 5, level: 6, chapter: 2, inventory: [], flags: {}, savedAt: 200 };
  const envelope = await encryptSavePayload(save, key, webcrypto);
  storage.setItem('ashen-crown-3d', envelope);
  backupLocalSave(storage, envelope, 300, 3, 'ashen-crown-3d.cloud-conflict.backup.');

  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, save);
  assert.equal(result.needsRecovery, undefined);
  assert.equal(storage.getItem('ashen-crown-3d.cloud-conflict.backup.300'), envelope);
});


test('encrypted primary with an unsupported payload enters recovery instead of loading it', async () => {
  const { webcrypto } = await import('node:crypto');
  const { encryptSavePayload, readEncryptedLocalSave } = await import('../../save-utils.js');
  const unsupported = { saveVersion: 6, level: 12, chapter: 3, inventory: [], flags: {} };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const envelope = await encryptSavePayload(unsupported, key, webcrypto);
  const values = new Map([['ashen-crown-3d', envelope]]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(keyName) { return values.has(keyName) ? values.get(keyName) : null; },
    setItem(keyName, value) { values.set(String(keyName), String(value)); },
    removeItem(keyName) { values.delete(keyName); }
  };

  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.equal(result.value, null);
  assert.equal(result.needsRecovery, true);
  assert.equal(result.reason, 'unsupported-encrypted-save');
  assert.equal(result.corrupt, false, 'authenticated ciphertext with an unsupported schema is not cryptographic corruption');
  assert.equal(storage.getItem('ashen-crown-3d'), envelope, 'the original envelope must be preserved byte-for-byte');
});

test('unsupported encrypted primary may expose a v5 backup without auto-restoring over the primary', async () => {
  const { webcrypto } = await import('node:crypto');
  const { encryptSavePayload, readEncryptedLocalSave } = await import('../../save-utils.js');
  const unsupported = { saveVersion: 6, level: 12, chapter: 3, inventory: [], flags: {} };
  const backup = { saveVersion: 5, level: 8, chapter: 2, inventory: [], flags: {}, savedAt: 120 };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const primaryEnvelope = await encryptSavePayload(unsupported, key, webcrypto);
  const backupEnvelope = await encryptSavePayload(backup, key, webcrypto);
  const backupKey = 'ashen-crown-3d.encrypted-backup.v1';
  const values = new Map([['ashen-crown-3d', primaryEnvelope], [backupKey, backupEnvelope]]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(keyName) { return values.has(keyName) ? values.get(keyName) : null; },
    setItem(keyName, value) { values.set(String(keyName), String(value)); },
    removeItem(keyName) { values.delete(keyName); }
  };

  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, backup);
  assert.equal(result.needsRecovery, true);
  assert.equal(result.reason, 'unsupported-encrypted-save-encrypted-backup-available');
  assert.equal(storage.getItem('ashen-crown-3d'), primaryEnvelope, 'primary data stays unchanged until explicit recovery');
  assert.equal(storage.getItem(backupKey), backupEnvelope, 'the encrypted backup stays unchanged too');
});

test('invalid encrypted backup is repaired from the current valid v5 primary', async () => {
  const { webcrypto } = await import('node:crypto');
  const { encryptSavePayload, decryptSavePayload, readEncryptedLocalSave, ENCRYPTED_SAVE_BACKUP_SUFFIX } = await import('../../save-utils.js');
  const valid = { saveVersion: 5, level: 9, chapter: 4, inventory: [], flags: {}, savedAt: 900 };
  const unsupported = { saveVersion: 6, level: 99, chapter: 10, inventory: [], flags: {} };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const primaryEnvelope = await encryptSavePayload(valid, key, webcrypto);
  const invalidBackupEnvelope = await encryptSavePayload(unsupported, key, webcrypto);
  const backupKey = 'ashen-crown-3d' + ENCRYPTED_SAVE_BACKUP_SUFFIX;
  const values = new Map([['ashen-crown-3d', primaryEnvelope], [backupKey, invalidBackupEnvelope]]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(keyName) { return values.has(keyName) ? values.get(keyName) : null; },
    setItem(keyName, value) { values.set(String(keyName), String(value)); },
    removeItem(keyName) { values.delete(keyName); }
  };

  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, valid);
  assert.equal(result.needsRecovery, undefined);
  assert.deepEqual(await decryptSavePayload(storage.getItem(backupKey), key, webcrypto), valid,
    'the last-known-good backup slot must contain a validated v5 save');
});

test('encrypted recovery backup envelopes remain preserved while a valid v5 primary is loaded', async () => {
  const { webcrypto } = await import('node:crypto');
  const { writeEncryptedLocalSave, decryptSavePayload, readEncryptedLocalSave, ENCRYPTED_SAVE_BACKUP_SUFFIX } = await import('../../save-utils.js');
  const primary = { saveVersion: 5, level: 5, chapter: 2, inventory: [], flags: {}, savedAt: 100 };
  const recovery = { kind: 'ashen-crown-recovery-v1', raw: 'unreadable-or-unsupported-original-bytes' };
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(keyName) { return values.has(keyName) ? values.get(keyName) : null; },
    setItem(keyName, value) { values.set(String(keyName), String(value)); },
    removeItem(keyName) { values.delete(keyName); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await writeEncryptedLocalSave(storage, 'ashen-crown-3d', primary, key, webcrypto);
  const backupKey = 'ashen-crown-3d' + ENCRYPTED_SAVE_BACKUP_SUFFIX;
  await writeEncryptedLocalSave(storage, backupKey, recovery, key, webcrypto);
  const recoveryEnvelope = storage.getItem(backupKey);

  const result = await readEncryptedLocalSave(storage, 'ashen-crown-3d', async () => key, webcrypto);
  assert.deepEqual(result.value, primary);
  assert.equal(result.needsRecovery, undefined);
  assert.deepEqual(await decryptSavePayload(storage.getItem(backupKey), key, webcrypto), recovery);
  assert.equal(storage.getItem(backupKey), recoveryEnvelope, 'opaque recovery bytes must not be rolled forward over on boot');
});

test('unsupported payloads cannot replace the primary encrypted save', async () => {
  const { webcrypto } = await import('node:crypto');
  const { writeEncryptedLocalSave } = await import('../../save-utils.js');
  const original = 'ASHEN-AESGCM-v1:preserve-primary-bytes';
  const values = new Map([['ashen-crown-3d', original]]);
  const storage = {
    getItem(keyName) { return values.has(keyName) ? values.get(keyName) : null; },
    setItem(keyName, value) { values.set(String(keyName), String(value)); }
  };
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

  await assert.rejects(
    () => writeEncryptedLocalSave(storage, 'ashen-crown-3d', { saveVersion: 6, level: 5, chapter: 1 }, key, webcrypto),
    /supported v5 save format/
  );
  assert.equal(storage.getItem('ashen-crown-3d'), original, 'invalid payload must not mutate the primary save');
});
