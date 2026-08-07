import { strict as assert } from 'node:assert';
import test from 'node:test';
import { HtmlPlus, hashUrlToPath, pipe } from '../utils';
import { humanFileSizeToBytes } from '../transfers';

test('HtmlPlus.stringify preserves content and metadata order', () => {
  assert.equal(HtmlPlus.stringify({ content: '' }), '');
  assert.equal(HtmlPlus.stringify({ content: 'foo' }), 'foo');
  assert.equal(
    HtmlPlus.stringify({
      key1: 'value1',
      key2: '2',
      content: 'foo',
    }),
    '<!--key1:value1-->\n<!--key2:2-->\nfoo',
  );
});

test('HtmlPlus.parse reads metadata prefix only', () => {
  assert.deepEqual(HtmlPlus.parse(''), { content: '' });
  assert.deepEqual(HtmlPlus.parse('foo'), { content: 'foo' });
  assert.deepEqual(HtmlPlus.parse('<!--key:value-->\nfoo'), {
    key: 'value',
    content: 'foo',
  });
  assert.deepEqual(HtmlPlus.parse('<!--normal comment-->\nfoo'), {
    content: '<!--normal comment-->\nfoo',
  });
});

test('hashUrlToPath splits hash into folders', () => {
  assert.deepEqual(hashUrlToPath('http://example.com', 0, 'json'), {
    filename: 'a9b9f04336ce0181a08e774e01113b31.json',
    hash: 'a9b9f04336ce0181a08e774e01113b31',
    folder: '',
    relative: 'a9b9f04336ce0181a08e774e01113b31.json',
  });

  assert.deepEqual(hashUrlToPath('http://example.com', 3, 'html'), {
    filename: '4336ce0181a08e774e01113b31.html',
    hash: 'a9b9f04336ce0181a08e774e01113b31',
    folder: 'a9/b9/f0',
    relative: 'a9/b9/f0/4336ce0181a08e774e01113b31.html',
  });
});

test('pipe composes left to right', () => {
  const add1 = (value: number) => value + 1;
  const double = (value: number) => value * 2;
  assert.equal(pipe(add1, double)(2), 6);
});

test('humanFileSizeToBytes handles valid and invalid input', () => {
  assert.equal(humanFileSizeToBytes('1KB'), 1000);
  assert.equal(humanFileSizeToBytes('1Mb'), 125000);
  assert.ok(Number.isNaN(humanFileSizeToBytes('')));
});
