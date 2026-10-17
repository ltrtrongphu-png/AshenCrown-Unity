import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, sanitizeItemRecord } from '../../save-utils.js';

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
