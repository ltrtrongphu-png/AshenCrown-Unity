import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudSaveQueue } from '../../cloud-save-queue.js';

test('queued cloud saves are copied and only the latest same-account state is retained', () => {
  const queue = new CloudSaveQueue();
  const mutable = { saveVersion: 5, level: 4, coins: 20 };
  assert.equal(queue.enqueue('user-a', mutable), true);
  mutable.level = 99;
  assert.equal(queue.enqueue('user-a', { saveVersion: 5, level: 7, coins: 40 }), true);

  const snapshot = queue.take('user-a');
  assert.deepEqual(snapshot, {
    userId: 'user-a',
    save: { saveVersion: 5, level: 7, coins: 40 }
  });
  assert.equal(queue.hasPending, false);
});

test('a user switch clears queued work from the previous account', () => {
  const queue = new CloudSaveQueue();
  queue.enqueue('user-a', { saveVersion: 5, level: 8 });
  queue.clearForUser('user-b');
  assert.equal(queue.hasPending, false);

  queue.enqueue('user-a', { saveVersion: 5, level: 8 });
  assert.equal(queue.take('user-b'), null);
  assert.equal(queue.hasPending, false);
});

test('failed writes retry only for the same account and preserve newer queued progress', () => {
  const queue = new CloudSaveQueue();
  queue.enqueue('user-a', { saveVersion: 5, level: 5 });
  const inFlight = queue.take('user-a');

  assert.equal(queue.retry(inFlight, 'user-b'), false);
  assert.equal(queue.hasPending, false);

  queue.enqueue('user-a', { saveVersion: 5, level: 6 });
  assert.equal(queue.retry(inFlight, 'user-a'), true);
  assert.deepEqual(queue.take('user-a').save, { saveVersion: 5, level: 6 });
});

test('failed snapshots are requeued when no newer save exists for the same user', () => {
  const queue = new CloudSaveQueue();
  queue.enqueue('user-a', { saveVersion: 5, level: 9 });
  const inFlight = queue.take('user-a');

  assert.equal(queue.retry(inFlight, 'user-a'), true);
  assert.deepEqual(queue.take('user-a'), inFlight);
});

test('invalid queue entries are rejected without creating pending work', () => {
  const queue = new CloudSaveQueue();
  assert.equal(queue.enqueue('', { level: 1 }), false);
  assert.equal(queue.enqueue('user-a', null), false);
  assert.equal(queue.enqueue('user-a', []), false);
  assert.equal(queue.hasPending, false);
});
