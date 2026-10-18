import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getChapterRequirements,
  chapterRecordKey,
  hasChapterRecord,
  isChapterWardenReady,
  canAdvanceChapter
} from '../../story-progression.js';

const gameSource = readFileSync(new URL('../../play.js', import.meta.url), 'utf8');
const campaignSource = readFileSync(new URL('../../campaign.js', import.meta.url), 'utf8');

test('chapter requirements scale across the ten-road campaign', () => {
  assert.deepEqual(getChapterRequirements(1), { embers: 2, echoes: 2, record: true });
  assert.deepEqual(getChapterRequirements(2), { embers: 3, echoes: 3, record: true });
  assert.deepEqual(getChapterRequirements(3), { embers: 3, echoes: 3, record: true });
  assert.deepEqual(getChapterRequirements(4), { embers: 4, echoes: 3, record: true });
  assert.deepEqual(getChapterRequirements(5), { embers: 4, echoes: 3, record: true });
  assert.deepEqual(getChapterRequirements(6), { embers: 4, echoes: 4, record: true });
  assert.deepEqual(getChapterRequirements(7), { embers: 4, echoes: 4, record: true });
  assert.deepEqual(getChapterRequirements(8), { embers: 5, echoes: 4, record: true });
  assert.deepEqual(getChapterRequirements(9), { embers: 5, echoes: 4, record: true });
  assert.deepEqual(getChapterRequirements(10), { embers: 5, echoes: 5, record: true });
});

test('requirement and record helpers clamp chapter numbers safely', () => {
  assert.deepEqual(getChapterRequirements(0), getChapterRequirements(1));
  assert.deepEqual(getChapterRequirements(99), getChapterRequirements(10));
  assert.deepEqual(getChapterRequirements(Number.NaN), getChapterRequirements(1));
  assert.equal(chapterRecordKey(4), 'chapter4Record');
  assert.equal(chapterRecordKey(-1), 'chapter1Record');
  assert.equal(chapterRecordKey(11), 'chapter10Record');
  assert.equal(hasChapterRecord({ chapter4Record: true }, 4), true);
  assert.equal(hasChapterRecord({ chapter4Record: false }, 4), false);
});

test('a chapter warden cannot appear before both evidence and required echoes', () => {
  const state = {
    chapter: 4,
    quest: 3,
    echoes: 3,
    flags: { chapter4Record: false, bellWardenDefeated: false }
  };
  assert.equal(isChapterWardenReady(state), false, 'the record is a mandatory story gate');
  state.flags.chapter4Record = true;
  state.echoes = 2;
  assert.equal(isChapterWardenReady(state), false, 'the echo count must meet the chapter requirement');
  state.echoes = 3;
  assert.equal(isChapterWardenReady(state), true);
  state.flags.bellWardenDefeated = true;
  assert.equal(isChapterWardenReady(state), false, 'a defeated warden must not respawn as the chapter boss');
  assert.equal(isChapterWardenReady({ ...state, quest: 2, flags: { chapter4Record: true } }), false);
});

test('the next chapter opens only after completion and return to the Sanctuary', () => {
  const state = { chapter: 3, quest: 5 };
  assert.equal(canAdvanceChapter(state, 'sanctuary'), true);
  assert.equal(canAdvanceChapter(state, 'hollow'), false, 'must return home before advancing');
  assert.equal(canAdvanceChapter({ ...state, quest: 4 }, 'sanctuary'), false, 'must finish the choice');
  assert.equal(canAdvanceChapter({ ...state, chapter: 10 }, 'sanctuary'), false, 'the finale cannot advance to chapter 11');
});

test('play.js uses the evidence gate and cannot bypass it through chapter advance', () => {
  assert.match(gameSource, /import \{ getChapterRequirements, chapterRecordKey, hasChapterRecord, isChapterWardenReady, canAdvanceChapter \} from '\.\/story-progression\.js';/);
  assert.match(gameSource, /nextNode\('record'\)/);
  assert.match(gameSource, /n\.type==='record'&&\(state\.quest!==2\|\|hasChapterRecord\(state\.flags,state\.chapter\)\)/);
  assert.match(gameSource, /if\(!canAdvanceChapter\(state,activeMapId\)\)/);
  assert.match(gameSource, /isChapterWardenReady\(state\)/);
});

test('all ten campaign entries have distinct evidence and warden identities', () => {
  const records = [...campaignSource.matchAll(/recordName:'([^']+)'/g)].map(match => match[1]);
  const wardens = [...campaignSource.matchAll(/wardenName:'([^']+)'/g)].map(match => match[1]);
  const titles = [...campaignSource.matchAll(/title:'([^']+)'/g)].map(match => match[1]);
  assert.equal(titles.length, 10, 'campaign should have ten authored chapter titles');
  assert.equal(records.length, 10, 'every chapter needs its own evidence item');
  assert.equal(wardens.length, 10, 'every chapter needs its own named warden');
  assert.equal(new Set(records).size, 10, 'record identities must not repeat');
  assert.equal(new Set(wardens).size, 10, 'warden identities must not repeat');
});
