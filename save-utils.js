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
