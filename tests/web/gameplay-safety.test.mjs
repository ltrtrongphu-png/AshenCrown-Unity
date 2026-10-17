import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gameSource = readFileSync(new URL('../../play.js', import.meta.url), 'utf8');

test('ending an encounter disposes only encounter-owned fallback GPU resources', () => {
  const helperStart = gameSource.indexOf('function disposeEncounterVisuals(enemy)');
  const helperEnd = gameSource.indexOf('function finishEncounter()', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'encounter disposal helper should exist before the finish path');
  const helper = gameSource.slice(helperStart, helperEnd);
  assert.match(helper, /geometry\.dispose\(\)/);
  assert.match(helper, /material\.dispose\(\)/);
  assert.match(helper, /worldMats\.values\(\)/, 'shared world materials must not be disposed per encounter');
  assert.match(helper, /productionBossScene\.removeFromParent\(\)/, 'cached GLB must be detached rather than destroyed');
  const finishStart = helperEnd;
  const finishEnd = gameSource.indexOf('function advanceChapter()', finishStart);
  assert.match(gameSource.slice(finishStart, finishEnd), /disposeEncounterVisuals\(defeated\)/);
});
