const EQUIPMENT_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const EQUIPMENT_TYPES = new Set(['Weapon', 'Core', 'Armor', 'Trinket', 'Relic', 'Quest Relic', 'Chapter Relic']);
const STORED_ITEM_TYPES = new Set([
  ...EQUIPMENT_TYPES,
  'Chapter Record',
  'Material',
  'Crafting Material',
  'Quest Item',
  'Consumable'
]);

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function clampInteger(value, min, max) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/**
 * Normalize browser-saved inventory data before it reaches gameplay or the DOM.
 * This is validation/normalization, not a trust boundary for competitive rewards.
 */
export function sanitizeItemRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const name = String(raw.name ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 80);
  if (!name) return null;

  const itemId = typeof raw.itemId === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(raw.itemId)
    ? raw.itemId
    : '';
  const type = STORED_ITEM_TYPES.has(raw.type) ? raw.type : 'Material';
  const rarity = EQUIPMENT_RARITIES.includes(raw.rarity) ? raw.rarity : 'Common';
  const stats = {};

  for (const key of ['vitality', 'focus', 'ward']) {
    const value = Number(raw.stats?.[key]);
    if (Number.isFinite(value)) stats[key] = clampInteger(value, 0, 5);
  }

  const item = {
    itemId,
    name,
    type,
    rarity,
    attrs: (Array.isArray(raw.attrs) ? raw.attrs : [])
      .filter((value) => typeof value === 'string')
      .slice(0, 8)
      .map((value) => value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 40)),
    stats
  };

  if (typeof raw.source === 'string') item.source = raw.source.slice(0, 30);
  if (Number.isFinite(Number(raw.price))) item.price = clampInteger(raw.price, 0, 999999);

  return item;
}


/**
 * Stable save comparison which ignores only the write timestamp. This allows periodic
 * checkpoint calls to be cheap when gameplay state has not changed.
 */
function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== 'object') return value;
  const normalized = {};
  for (const key of Object.keys(value).sort()) normalized[key] = sortObjectKeys(value[key]);
  return normalized;
}

export function serializeSaveForComparison(save) {
  if (!save || typeof save !== 'object' || Array.isArray(save)) return '';
  const snapshot = { ...save };
  delete snapshot.savedAt;
  return JSON.stringify(sortObjectKeys(snapshot));
}


/**
 * Decide whether a remote browser save may replace the local one. A newer cloud
 * save is a conflict, not an implicit overwrite; callers must ask and back up first.
 */
export function cloudSaveDecision(local, remote, remoteUpdatedAt = '') {
  const localValid = Boolean(local && typeof local === 'object' && !Array.isArray(local));
  const remoteValid = Boolean(
    remote &&
    typeof remote === 'object' &&
    !Array.isArray(remote) &&
    Number.isFinite(Number(remote.level)) &&
    Number(remote.level) >= 1
  );
  if (!remoteValid) return { action: 'invalid-cloud', localStamp: Number(local?.savedAt) || 0, remoteStamp: 0 };
  if (!localValid) return { action: 'use-cloud', localStamp: 0, remoteStamp: Number(remote.savedAt) || Date.parse(remoteUpdatedAt) || 0 };
  const localStamp = Number(local.savedAt) || 0;
  const remoteStamp = Number(remote.savedAt) || Date.parse(remoteUpdatedAt) || 0;
  const samePayload = serializeSaveForComparison(local) === serializeSaveForComparison(remote);
  let action = 'keep-local';
  if (!samePayload && remoteStamp > localStamp) action = 'ask-cloud';
  else if (!samePayload) action = 'ask-local';
  return { action, localStamp, remoteStamp };
}


/**
 * Back up raw local-save bytes before a cloud conflict may replace them.
 * Keeps a small rolling set to avoid unbounded localStorage growth.
 */
export function backupLocalSave(storage, rawSave, timestamp = Date.now(), keep = 3) {
  if (!storage || typeof storage.setItem !== 'function' || typeof storage.getItem !== 'function') {
    throw new TypeError('A writable storage object is required.');
  }
  if (typeof rawSave !== 'string' || rawSave.length === 0) {
    throw new TypeError('A non-empty local save is required for backup.');
  }

  const prefix = 'ashen-crown-3d.backup.';
  const stamp = Number.isFinite(Number(timestamp)) ? Math.max(0, Math.floor(Number(timestamp))) : Date.now();
  let key = prefix + stamp;
  let suffix = 1;
  while (storage.getItem(key) !== null) key = prefix + stamp + '-' + suffix++;

  storage.setItem(key, rawSave);
  if (storage.getItem(key) !== rawSave) {
    storage.removeItem(key);
    throw new Error('Local save backup verification failed.');
  }

  const backups = [];
  for (let index = 0; index < storage.length; index++) {
    const candidate = storage.key(index);
    if (typeof candidate === 'string' && candidate.startsWith(prefix)) backups.push(candidate);
  }
  backups.sort((left, right) => {
    const leftStamp = Number(left.slice(prefix.length).split('-')[0]) || 0;
    const rightStamp = Number(right.slice(prefix.length).split('-')[0]) || 0;
    return leftStamp - rightStamp || left.localeCompare(right);
  });

  const limit = Number.isFinite(Number(keep)) ? Math.max(1, Math.floor(Number(keep))) : 3;
  while (backups.length > limit) storage.removeItem(backups.shift());
  return key;
}


/**
 * Local saves are ciphertext envelopes. The AES-GCM key is held separately by
 * the browser's IndexedDB keyring (not exported into localStorage).
 */
export const ENCRYPTED_SAVE_PREFIX = 'ASHEN-AESGCM-v1:';

export function isEncryptedSaveEnvelope(value) {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_SAVE_PREFIX);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function encryptSavePayload(value, key, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== 'function' || !key) {
    throw new Error('Web Crypto and a local AES-GCM key are required to encrypt saves.');
  }
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv, 0);
  packed.set(ciphertext, iv.length);
  return ENCRYPTED_SAVE_PREFIX + bytesToBase64(packed);
}

export async function decryptSavePayload(envelope, key, cryptoApi = globalThis.crypto) {
  if (!isEncryptedSaveEnvelope(envelope)) throw new Error('The local save is not an encrypted AES-GCM envelope.');
  if (!cryptoApi?.subtle || !key) throw new Error('The local save encryption key is unavailable.');
  const packed = base64ToBytes(envelope.slice(ENCRYPTED_SAVE_PREFIX.length));
  if (packed.length < 29) throw new Error('The encrypted save is incomplete.');
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const plaintext = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const value = JSON.parse(new TextDecoder().decode(plaintext));
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The decrypted local save is not a valid save object.');
  }
  return value;
}

function removeLocalSaveAndBackups(storage, keyName) {
  const remove = new Set([keyName]);
  const backupPrefix = keyName + '.backup.';
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (typeof key === 'string' && (key.startsWith(backupPrefix) || key.startsWith('ashen-crown-3d.backup.'))) {
      remove.add(key);
    }
  }
  for (const key of remove) storage.removeItem(key);
}

/**
 * Plaintext v5 records are intentionally not migrated: on first encrypted-save
 * rollout, remove them and their rolling backups instead of leaving cleartext.
 * A corrupt envelope is also cleared so the next save starts cleanly.
 */
export async function readEncryptedLocalSave(storage, keyName, getKey, cryptoApi = globalThis.crypto) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.removeItem !== 'function') {
    throw new TypeError('A readable and writable local storage object is required.');
  }
  const raw = storage.getItem(keyName);
  if (raw === null || raw === undefined || raw === '') {
    return { value: null, wipedLegacy: false, corrupt: false };
  }
  if (!isEncryptedSaveEnvelope(raw)) {
    removeLocalSaveAndBackups(storage, keyName);
    return { value: null, wipedLegacy: true, corrupt: false, reason: 'plaintext' };
  }
  try {
    if (typeof getKey !== 'function') throw new Error('The local save key provider is unavailable.');
    const key = await getKey();
    const value = await decryptSavePayload(raw, key, cryptoApi);
    return { value, wipedLegacy: false, corrupt: false };
  } catch (error) {
    removeLocalSaveAndBackups(storage, keyName);
    return { value: null, wipedLegacy: true, corrupt: true, reason: 'corrupt', error };
  }
}

export async function writeEncryptedLocalSave(storage, keyName, value, key, cryptoApi = globalThis.crypto) {
  if (!storage || typeof storage.setItem !== 'function' || typeof storage.getItem !== 'function') {
    throw new TypeError('A writable local storage object is required.');
  }
  const envelope = await encryptSavePayload(value, key, cryptoApi);
  storage.setItem(keyName, envelope);
  if (storage.getItem(keyName) !== envelope || !isEncryptedSaveEnvelope(storage.getItem(keyName))) {
    throw new Error('Encrypted local-save verification failed.');
  }
  return true;
}
