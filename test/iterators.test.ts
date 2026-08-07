import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FileIterator } from '../src/iterators';

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
