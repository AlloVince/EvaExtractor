import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FileStorage } from '../storages.js';

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
