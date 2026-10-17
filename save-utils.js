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
export function serializeSaveForComparison(save) {
  if (!save || typeof save !== 'object' || Array.isArray(save)) return '';
  const snapshot = { ...save };
  delete snapshot.savedAt;
  return JSON.stringify(snapshot);
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
  let action = 'keep-local';
  if (remoteStamp > localStamp) action = 'ask-cloud';
  else if (localStamp > remoteStamp) action = 'ask-local';
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
