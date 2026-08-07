import { strict as assert } from 'node:assert';
import test from 'node:test';
import { HtmlProcessor, JsonProcessor, STORAGES } from '../index.js';

test('HtmlProcessor extracts from parsed html', async () => {
  const fetcher = {
    fetcher: undefined,
    async fetch() {
      return '<!--url:http://example.com-->\n<div class="title">Hello</div>';
    },
    async fetchBuffer() {
      return Buffer.from('');
    },
  };

  const processor = new HtmlProcessor({
    storage: STORAGES.FILE,
    uri: 'unused',
  }, fetcher);

  processor.extractRules = {
    title: ($) => $('div.title').text(),
  };

  await processor.fetch();
  await processor.parse();
  await processor.extract();

  assert.equal(processor.getExtractedItem()['title'], 'Hello');
});

test('JsonProcessor parses json payload', async () => {
  const fetcher = {
    fetcher: undefined,
    async fetch() {
      return JSON.stringify({ url: 'https://example.com', value: 1 });
    },
    async fetchBuffer() {
      return Buffer.from('');
    },
  };

  const processor = new JsonProcessor({
    storage: STORAGES.FILE,
    uri: 'unused',
  }, fetcher);

  await processor.fetch();
  await processor.parse();

  assert.equal(processor.getParsedItem()['value'], 1);
});
