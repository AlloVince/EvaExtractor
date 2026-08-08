import { strict as assert } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { FileFetcher, HttpFetcher } from '../src/fetchers';

test('FileFetcher reads inside the configured root', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'evaextractor-'));
  process.env['FILE_FETCHER_ROOT'] = root;
  try {
    await writeFile(path.join(root, 'inside.txt'), 'data');
    const fetcher = new FileFetcher();
    assert.equal(await fetcher.fetch('inside.txt'), 'data');
  } finally {
    delete process.env['FILE_FETCHER_ROOT'];
    await rm(root, { recursive: true, force: true });
  }
});

test('FileFetcher rejects paths escaping the configured root', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'evaextractor-'));
  process.env['FILE_FETCHER_ROOT'] = root;
  try {
    const fetcher = new FileFetcher();
    await assert.rejects(() => fetcher.fetch('../outside.txt'), /outside of root/);
    await assert.rejects(() => fetcher.fetchBuffer('../outside.txt'), /outside of root/);
  } finally {
    delete process.env['FILE_FETCHER_ROOT'];
    await rm(root, { recursive: true, force: true });
  }
});

test('HttpFetcher consumes string and stream bodies', async () => {
  let mode: 'string' | 'stream' = 'string';
  const client = {
    async request() {
      if (mode === 'string') {
        return { body: 'hello' };
      }
      return { body: Readable.from(['hello']) };
    },
  };

  const fetcher = new HttpFetcher(client);
  assert.equal(await fetcher.fetch('x'), 'hello');
  assert.deepEqual(await fetcher.fetchBuffer('x'), Buffer.from('hello'));

  mode = 'stream';
  assert.equal(await fetcher.fetch('x'), 'hello');
  assert.deepEqual(await fetcher.fetchBuffer('x'), Buffer.from('hello'));
});
