import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DatabaseIterator, FileIterator, ORDER } from '../iterators';

test('FileIterator yields matching html files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'evaextractor-'));
  try {
    await mkdir(path.join(root, 'nested'), { recursive: true });
    await writeFile(path.join(root, 'a.html'), 'a');
    await writeFile(path.join(root, 'nested', 'b.html'), 'b');
    await writeFile(path.join(root, 'nested', 'ignore.txt'), 'x');

    const iterator = new FileIterator();
    const items = [];
    for await (const item of iterator.getItems({ prefix: root, pattern: '**/*.html' })) {
      items.push(item.file.name);
    }

    assert.deepEqual(items.sort(), [
      path.join(root, 'a.html'),
      path.join(root, 'nested', 'b.html'),
    ].sort());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('DatabaseIterator pages through results', async () => {
  const calls: Array<{ offset: number, limit: number }> = [];
  const entity = {
    async findAll({ offset, limit }: { offset: number, limit: number }) {
      calls.push({ offset, limit });
      if (offset === 0) {
        return [{ id: 1 }, { id: 2 }];
      }
      if (offset === 2) {
        return [{ id: 3 }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity, 'id', 2);
  const results = [];
  for await (const item of iterator.getItems({
    startCursor: 0,
    whereCondition: {},
    direction: ORDER.ASC,
  })) {
    results.push(item);
  }

  assert.deepEqual(results, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(calls, [
    { offset: 0, limit: 2 },
    { offset: 2, limit: 2 },
    { offset: 4, limit: 2 },
  ]);
});
