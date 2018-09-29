import test from 'ava';
import { HtmlPlus, hashUrlToPath } from '../src/utils';

test('HTMLPlus stringify', async (t) => {
  t.is(
    HtmlPlus.stringify({
      content: '',
    }),
    '',
  );
  t.is(
    HtmlPlus.stringify({
      content: 'foo',
    }),
    'foo',
  );

  t.is(
    HtmlPlus.stringify({
      content: '<!--normal comment-->\nfoo',
    }),
    '<!--normal comment-->\nfoo',
  );

  t.is(
    HtmlPlus.stringify({
      key1: 'value1',
      key2: '2',
      content: 'foo',
    }),
    '<!--key1:value1-->\n<!--key2:2-->\nfoo',
  );
});

test('HTMLPlus parse', async (t) => {
  t.deepEqual(HtmlPlus.parse(''), {
    content: '',
  });
  t.deepEqual(HtmlPlus.parse('foo'), {
    content: 'foo',
  });

  t.deepEqual(HtmlPlus.parse('<!--normal comment-->\nfoo'), {
    content: '<!--normal comment-->\nfoo',
  });

  t.deepEqual(HtmlPlus.parse('<!--key:value-->\nfoo'), {
    key: 'value',
    content: 'foo',
  });

  t.deepEqual(HtmlPlus.parse('<!--key1:value1-->\n<!--key2:2-->\nfoo'), {
    key1: 'value1',
    key2: '2',
    content: 'foo',
  });
});

test('Hash url to path', async (t) => {
  t.deepEqual(hashUrlToPath('http://example.com', 0, 'json'), {
    filename: 'a9b9f04336ce0181a08e774e01113b31.json',
    hash: 'a9b9f04336ce0181a08e774e01113b31',
    folder: '',
    relative: 'a9b9f04336ce0181a08e774e01113b31.json',
  });

  t.deepEqual(hashUrlToPath('http://example.com', 3, 'html'), {
    filename: '4336ce0181a08e774e01113b31.html',
    hash: 'a9b9f04336ce0181a08e774e01113b31',
    folder: 'a9/b9/f0',
    relative: 'a9/b9/f0/4336ce0181a08e774e01113b31.html',
  });
});
