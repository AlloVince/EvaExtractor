# 使用示例

这份文档展示了安装 `evaextractor` 之后，如何在业务代码里直接使用它。

## 安装

```bash
pnpm add evaextractor
```

如果你会用到 OSS 或 MinIO，再安装对应的 peer dependency：

```bash
pnpm add ali-oss
pnpm add minio
```

## 导入方式

大多数场景只需要主入口：

```ts
import { HtmlProcessor, JsonProcessor, STORAGES } from 'evaextractor';
```

## 处理 HTML 元数据

EvaExtractor 的处理器能够识别仓库示例里使用的 HTML 元数据格式：

```ts
const content = [
  '<!--url:https://example.com/article-->',
  '<!--timestamp:2026-08-07T08:00:00.000Z-->',
  '<h1>Hello</h1>',
].join('\n');
```

## 从 HTML 中提取结构化数据

当内容是 HTML，且你想把它映射成普通对象时，`HtmlProcessor` 很合适：

```ts
import { HtmlProcessor, STORAGES } from 'evaextractor';

const processor = new HtmlProcessor(
  {
    storage: STORAGES.FILE,
    uri: './sample.html',
  },
  {
    async fetch() {
      return '<!--url:https://example.com--><div class="title">Hello</div>';
    },
    async fetchBuffer() {
      return Buffer.from('');
    },
  },
);

processor.extractRules = {
  title: ($) => $('div.title').text(),
};

await processor.process();

console.log(processor.getExtractedItem());
```

## 解析 JSON 内容

当源数据本身就是 JSON 时，可以直接用 `JsonProcessor`：

```ts
import { JsonProcessor, STORAGES } from 'evaextractor';

const processor = new JsonProcessor(
  {
    storage: STORAGES.FILE,
    uri: './sample.json',
  },
  {
    async fetch() {
      return JSON.stringify({
        url: 'https://example.com',
        title: 'Hello',
      });
    },
    async fetchBuffer() {
      return Buffer.from('');
    },
  },
);

await processor.process();

console.log(processor.getParsedItem());
```

## MinIO 迭代示例

仓库里的 `examples/minio.iterator.ts` 演示了如何连接 MinIO 并遍历对象。
它使用的是仓库源码级导入，因此更适合作为参考实现，而不是直接复制到
npm 包使用场景里：

```ts
import Minio from 'minio';
import { MinioIterator } from '../src/iterators';
import { MinioFetcher } from '../src/fetchers';

const client = new Minio.Client({
  endPoint: '127.0.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
});

const iterator = new MinioIterator(client, 'dev');
const fetcher = new MinioFetcher(client, 'dev');

for await (const item of iterator.getItems({ prefix: '' })) {
  console.log(item);
}

console.log(await fetcher.fetch('path/to/object.json'));
```

## 说明

- 以上示例都尽量保持简短，方便直接复制到项目中使用。
- `examples/` 目录下的源码会继续作为更具体集成方式的参考资料保留。
