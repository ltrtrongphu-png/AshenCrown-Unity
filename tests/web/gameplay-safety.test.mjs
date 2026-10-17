import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

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


test('web frame loop rejects negative and non-finite elapsed time', () => {
  assert.match(gameSource, /const elapsed=\(t-last\)\/1000;/);
  assert.match(gameSource, /Number\.isFinite\(elapsed\)\?Math\.max\(0,Math\.min\(\.05,elapsed\)\):0/);
  assert.match(gameSource, /const dt=Math\.min\(\.033,rawDt\)/);
});

test('TimeScaleService is the only C# owner that writes Time.timeScale', () => {
  const scriptsRoot = new URL('../../Assets/Scripts/', import.meta.url);
  const offenders = [];
  const visit = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relativePath = prefix ? prefix + '/' + entry.name : entry.name;
      const fullPath = new URL(relativePath, directory.href.endsWith('/') ? directory : new URL(directory.href + '/'));
      if (entry.isDirectory()) {
        visit(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.cs') && entry.name !== 'TimeScaleService.cs') {
        const source = readFileSync(fullPath, 'utf8');
        if (/Time\\.timeScale\\s*=/.test(source)) offenders.push(relativePath);
      }
    }
  };
  visit(scriptsRoot);
  assert.deepEqual(offenders, [], 'all global time-scale writes must go through TimeScaleService');
});
