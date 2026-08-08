import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DatabaseIterator, FileIterator, ORDER, OssIterator } from '../src/iterators';

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

test('FileIterator with empty prefix uses relative pattern', async () => {
  const items = [];
  for await (const item of new FileIterator().getItems({ prefix: '', pattern: 'package.json' })) {
    items.push(item.file.name);
  }
  assert.deepEqual(items, ['package.json']);
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

test('DatabaseIterator keeps direction on subsequent pages', async () => {
  const calls: Array<{ offset: number, order: [string, string] }> = [];
  const entity = {
    async findAll({ offset, order }: { offset: number, order: [string, string] }) {
      calls.push({ offset, order });
      if (offset === 0) {
        return [{ id: 3 }, { id: 2 }];
      }
      if (offset === 2) {
        return [{ id: 1 }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity, 'id', 2);
  const results = [];
  for await (const item of iterator.getItems({
    startCursor: 0,
    whereCondition: {},
    direction: ORDER.DESC,
  })) {
    results.push(item);
  }

  assert.deepEqual(results, [{ id: 3 }, { id: 2 }, { id: 1 }]);
  // Every page must use the requested direction, not a hardcoded ASC.
  assert.ok(calls.every(({ order }) => order[0][1] === ORDER.DESC));
});

test('OssIterator stops when reaching max', async () => {
  const oss = {
    async list({ marker }: { marker: string }) {
      if (marker === '') {
        return { objects: [{ name: 'a' }, { name: 'b' }, { name: 'c' }], nextMarker: 'page2' };
      }
      return { objects: [{ name: 'd' }], nextMarker: '' };
    },
  };

  const iterator = new OssIterator(oss);
  const items = [];
  for await (const item of iterator.getItems({ prefix: '', max: 2 })) {
    items.push(item);
  }

  assert.deepEqual(items.map(i => (i['file'] as { name: string }).name), ['a', 'b']);
});

test('OssIterator resets count between runs', async () => {
  const oss = {
    async list() {
      return { objects: [{ name: 'a' }], nextMarker: '' };
    },
  };

  const iterator = new OssIterator(oss);
  const run = async () => {
    const counts = [];
    for await (const item of iterator.getItems({ prefix: '' })) {
      counts.push(item.count);
    }
    return counts;
  };

  assert.deepEqual(await run(), [0]);
  assert.deepEqual(await run(), [0]);
});

test('OssIterator pages until exhausted when max is -1', async () => {
  let listCalls = 0;
  const oss = {
    async list({ marker }: { marker: string }) {
      listCalls += 1;
      if (marker === '') {
        return { objects: [{ name: 'a' }, { name: 'b' }], nextMarker: 'page2' };
      }
      return { objects: [{ name: 'c' }], nextMarker: '' };
    },
  };

  const iterator = new OssIterator(oss);
  const items = [];
  for await (const item of iterator.getItems({ prefix: '', max: -1 })) {
    items.push(item);
  }

  assert.deepEqual(items.map(i => (i['file'] as { name: string }).name), ['a', 'b', 'c']);
  assert.equal(listCalls, 2);
});
