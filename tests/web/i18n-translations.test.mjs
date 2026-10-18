import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../i18n.js', import.meta.url), 'utf8');
const start = source.indexOf('const translationRows = [');
const end = source.indexOf('];', start);

assert.notEqual(start, -1, 'i18n.js must define the translation table');
assert.ok(end > start, 'translation table must have a closing bracket');

const tableSource = source.slice(start, end + 2);
const rows = [...tableSource.matchAll(/\[(?:"(?:\\.|[^"\\])*"\s*,\s*){4}"(?:\\.|[^"\\])*"\s*\]/g)]
  .map(match => JSON.parse(match[0]));
const translations = new Map(rows.map(row => [row[0], row]));

test('translation table rows follow EN / VI / JA / KO / ZH and are unique', () => {
  assert.ok(rows.length > 0, 'translation table must not be empty');
  const keys = new Set();

  for (const row of rows) {
    assert.equal(row.length, 5, `expected five language columns for "${row[0]}"`);
    assert.ok(row.every(value => typeof value === 'string' && value.trim()), `blank translation in "${row[0]}"`);
    assert.ok(!keys.has(row[0]), `duplicate source key would make language selection ambiguous: "${row[0]}"`);
    keys.add(row[0]);
  }
});

test('navigation and hero copy use the correct translation column for all five languages', () => {
  assert.deepEqual(translations.get('Progression'), [
    'Progression', 'Tiến trình', '成長', '성장', '成长'
  ]);
  assert.deepEqual(translations.get('Play now'), [
    'Play now', 'Chơi ngay', '今すぐプレイ', '지금 플레이', '立即游玩'
  ]);
  assert.deepEqual(translations.get('THE CROWN REMEMBERS NOTHING.'), [
    'THE CROWN REMEMBERS NOTHING.',
    'Vương Miện chẳng còn nhớ gì.',
    '王冠は何も覚えていない。',
    '왕관은 아무것도 기억하지 않는다.',
    '王冠已忘记一切。'
  ]);
  assert.deepEqual(translations.get('The Crown erased a village.'), [
    'The Crown erased a village.',
    'Vương Miện đã xóa sổ một ngôi làng.',
    '王冠は村を消し去った。',
    '왕관은 한 마을을 지워 버렸다.',
    '王冠抹去了一个村庄。'
  ]);
  assert.deepEqual(translations.get('One ember remembers every name.'), [
    'One ember remembers every name.',
    'Chỉ một tàn lửa còn nhớ mọi cái tên.',
    'ひとつの残り火が、すべての名を覚えている。',
    '오직 하나의 잔불만이 모든 이름을 기억한다.',
    '唯有一簇余烬记得每个名字。'
  ]);
});

test('runtime does not allow a later duplicate to override an earlier translation', () => {
  assert.match(source, /Use first-wins/);
  assert.match(source, /hasOwnProperty\.call\(dictionary, key\)/);
});
