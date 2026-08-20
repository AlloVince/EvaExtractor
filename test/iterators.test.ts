import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DatabaseIterator, FileIterator, MinioIterator, ORDER, OssIterator } from '../src/iterators';

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
      items.push({ name: item.file.name, cursor: item.cursor });
    }

    assert.deepEqual(items.sort(), [
    { name: path.join(root, 'a.html'), cursor: path.join(root, 'a.html') },
    { name: path.join(root, 'nested', 'b.html'), cursor: path.join(root, 'nested', 'b.html') },
  ].sort((a, b) => a.name.localeCompare(b.name)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('FileIterator with empty prefix uses relative pattern', async () => {
  const items = [];
  for await (const item of new FileIterator().getItems({ prefix: '', pattern: 'package.json' })) {
    items.push({ name: item.file.name, cursor: item.cursor });
  }
  assert.deepEqual(items, [{ name: 'package.json', cursor: 'package.json' }]);
});

test('MinioIterator exposes the object name as cursor', async () => {
  const minio = {
    listObjectsV2() {
      return (async function* objects() {
        yield { name: 'raw/a.json', size: 1 };
      })();
    },
  };
  const items = [];
  for await (const item of new MinioIterator(minio, 'dev').getItems({ prefix: 'raw/' })) {
    items.push(item);
  }

  assert.deepEqual(items, [{
    file: { name: 'raw/a.json', size: 1 },
    cursor: 'raw/a.json',
  }]);
});

test('DatabaseIterator pages through results using cursor', async () => {
  const calls: Array<{ where: Record<string, object>, order: [string, string], limit: number }> = [];
  const entity = {
    pk: 'id',
    async findAll({ where, order, limit }: { where: Record<string, object>, order: [string, string], limit: number }) {
      calls.push({ where, order, limit });
      const gt = (where[entity.pk] as Record<string, unknown>)['$gt'] as number | undefined;
      if (gt === 0) {
        return [{ id: 1 }, { id: 2 }];
      }
      if (gt === 2) {
        return [{ id: 3 }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity as any, 'id', 2);
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
    { where: { id: { $gt: 0 } }, order: [['id', 'ASC']], limit: 2 },
    { where: { id: { $gt: 2 } }, order: [['id', 'ASC']], limit: 2 },
    { where: { id: { $gt: 3 } }, order: [['id', 'ASC']], limit: 2 },
  ]);
});

test('DatabaseIterator uses cursor for DESC direction', async () => {
  const calls: Array<{ where: Record<string, object>, order: [string, string][], limit: number }> = [];
  const entity = {
    pk: 'id',
    async findAll({ where, order, limit }: { where: Record<string, object>, order: [string, string][], limit: number }) {
      calls.push({ where, order, limit });
      const lt = (where[entity.pk] as Record<string, unknown>)['$lt'] as number | undefined;
      if (lt === 0) {
        return [{ id: 3 }, { id: 2 }];
      }
      if (lt === 2) {
        return [{ id: 1 }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity as any, 'id', 2);
  const results = [];
  for await (const item of iterator.getItems({
    startCursor: 0,
    whereCondition: {},
    direction: ORDER.DESC,
  })) {
    results.push(item);
  }

  assert.deepEqual(results, [{ id: 3 }, { id: 2 }, { id: 1 }]);
  assert.ok(calls.every(({ order }) => order[0][1] === ORDER.DESC), 'Every call must use DESC direction');
  assert.ok(calls.every(({ where }) => '$lt' in (where[entity.pk] as Record<string, unknown>)), 'Every call must use $lt for DESC');
});

test('DatabaseIterator starts from startCursor', async () => {
  const calls: Array<{ where: Record<string, object>, limit: number }> = [];
  const entity = {
    pk: 'id',
    async findAll({ where, limit }: { where: Record<string, object>, limit: number }) {
      calls.push({ where, limit });
      const gt = (where[entity.pk] as Record<string, unknown>)['$gt'] as number | undefined;
      if (gt === 5) {
        return [{ id: 6 }, { id: 7 }];
      }
      if (gt === 7) {
        return [{ id: 8 }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity as any, 'id', 2);
  const results = [];
  for await (const item of iterator.getItems({
    startCursor: 5,
    whereCondition: {},
    direction: ORDER.ASC,
  })) {
    results.push(item);
  }

  assert.deepEqual(results, [{ id: 6 }, { id: 7 }, { id: 8 }]);
  assert.equal((calls[0].where[entity.pk] as Record<string, unknown>)['$gt'], 5);
});

test('DatabaseIterator merges whereCondition with cursor', async () => {
  const calls: Array<{ where: Record<string, object>, limit: number }> = [];
  const entity = {
    pk: 'id',
    async findAll({ where, limit }: { where: Record<string, object>, limit: number }) {
      calls.push({ where, limit });
      const gt = (where[entity.pk] as Record<string, unknown>)['$gt'] as number | undefined;
      if (gt === 0) {
        return [{ id: 1, status: 'active' }];
      }
      return [];
    },
  };

  const iterator = new DatabaseIterator(entity as any, 'id', 2);
  const results = [];
  for await (const item of iterator.getItems({
    startCursor: 0,
    whereCondition: { status: 'active' },
    direction: ORDER.ASC,
  })) {
    results.push(item);
  }

  assert.deepEqual(results, [{ id: 1, status: 'active' }]);
  const firstWhere = calls[0].where;
  assert.ok('id' in firstWhere, 'whereCondition must include id cursor');
  assert.ok('status' in firstWhere, 'whereCondition must include original filter');
  assert.equal(firstWhere['status'], 'active');
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
