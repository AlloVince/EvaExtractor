# EvaExtractor

轻量 TypeScript 工具库：从本地文件与对象存储抓取、解析、提取并转换内容。

适合这些场景：

- 从本地磁盘、HTTP、阿里云 OSS 或 MinIO 读取内容
- 使用 `HtmlPlus` 解析 HTML 元数据
- 从 HTML 或 JSON 提取结构化信息
- 在持久化前做字段转换
- 遍历文件、对象存储或数据库中的记录

## 安装

```bash
pnpm add evaextractor
```

使用 OSS 或 MinIO 时，再安装对应 peer dependency：

```bash
pnpm add ali-oss
pnpm add minio
```

## 环境要求

- Node.js `>=24`
- pnpm

## 导入

大多数场景用主入口即可：

```ts
import { HtmlProcessor, JsonProcessor, STORAGES } from 'evaextractor';
```

也可按子路径导入：`evaextractor/fetchers`、`evaextractor/storages`、`evaextractor/iterators`、`evaextractor/utils`、`evaextractor/transfers`。

## 使用示例

### HTML 元数据格式

处理器识别文件头连续的 HTML 注释元数据：

```ts
const content = [
  '<!--url:https://example.com/article-->',
  '<!--timestamp:2026-08-07T08:00:00.000Z-->',
  '<h1>Hello</h1>',
].join('\n');
```

### 从 HTML 提取结构化数据

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

### 解析 JSON

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

### MinIO 遍历与读取

```ts
import Minio from 'minio';
import { MinioIterator } from 'evaextractor/iterators';
import { MinioFetcher } from 'evaextractor/fetchers';

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

更具体的仓库内集成参考见 `examples/`。

## 开发

```bash
pnpm install
pnpm test
pnpm run lint
pnpm run build
```

CI 在 `main` push 上跑测试后执行 semantic-release（Conventional Commits）；发布需配置 `NPM_TOKEN`。

## 文档

- 对外说明与示例：本 README
- AI / 维护者入口：`AGENTS.md` → `docs/index.md`
