import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FileStorage, OssStorage } from '../src/storages';

test('FileStorage.write creates parent directories', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'evaextractor-'));
  try {
    const storage = new FileStorage(root);
    const writtenPath = await storage.write('nested/file.txt', 'hello');

    assert.equal(writtenPath, path.join(root, 'nested/file.txt'));
    assert.equal(await readFile(writtenPath, 'utf8'), 'hello');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('FileStorage rejects paths escaping root', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'evaextractor-'));
  try {
    const storage = new FileStorage(root);
    await assert.rejects(() => storage.write('../escape.txt', 'x'), /outside of root/);
    await assert.rejects(() => storage.access('../escape.txt'), /outside of root/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('OssStorage joins root and relative with a single slash', async () => {
  const heads: string[] = [];
  const puts: string[] = [];
  const storage = new OssStorage('dev/', {
    async head(key: string) { heads.push(key); },
    async put(key: string) { puts.push(key); },
  });

  await storage.access('a/b');
  await storage.write('c/d', 'x');

  assert.deepEqual(heads, ['dev/a/b']);
  assert.deepEqual(puts, ['dev/c/d']);
});
