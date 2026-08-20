# EvaExtractor

轻量 TypeScript 库，从本地文件、HTTP、阿里云 OSS、Minio (S3) 或数据库中抓取、解析、提取与转换内容, 通过一致的接口，实现底层的切换而不用更改代码。

## 安装

```bash
pnpm add evaextractor
```

按需安装对应存储的 peer dependency：

```bash
# 阿里云 OSS
pnpm add ali-oss
# MinIO / AWS S3
pnpm add minio
# 数据库遍历（Sequelize）
pnpm add sequelize
```

## 快速开始

### 从 HTML 提取结构化数据

```ts
import { HtmlProcessor, STORAGES } from 'evaextractor';

const processor = new HtmlProcessor({
  storage: STORAGES.FILE,
  uri: './page.html',
});

// 定义提取规则
processor.extractRules = {
  title: ($) => $('h1').text().trim(),
  description: ($) => $('meta[name="description"]').attr('content'),
  links: ($) => $('a').map((_, el) => $(el).attr('href')).get(),
};

await processor.process();
console.log(processor.getExtractedItem());
// → { title: '...', description: '...', links: ['...', ...] }
```

### 从 JSON 解析数据

```ts
import { JsonProcessor, STORAGES } from 'evaextractor';

const processor = new JsonProcessor({
  storage: STORAGES.HTTP,
  uri: 'https://api.example.com/data.json',
});

await processor.process();
console.log(processor.getParsedItem());
// → { url: '...', content: { ... } }
```

### 遍历 MinIO 对象

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

// 遍历 bucket 中所有对象
const iterator = new MinioIterator(client, 'my-bucket');
for await (const item of iterator.getItems({ prefix: 'data/' })) {
  console.log(item.file.name, item.cursor);
}

// 读取单个对象内容
const fetcher = new MinioFetcher(client, 'my-bucket');
const content = await fetcher.fetch('data/file.json');
```

### 遍历数据库记录（keyset 分页）

```ts
import { DatabaseIterator } from 'evaextractor/iterators';

// entity 是 Sequelize Model 实例
const iterator = new DatabaseIterator(Works, 'id', 100);

for await (const item of iterator.getItems({
  startCursor: 0,
  whereCondition: { status: 'active' },
  direction: 'ASC',
})) {
  console.log(item.id);
}
// 内部使用 Op.gt/Op.lt 做 keyset 分页，避免深分页性能问题
```

### 写入文件或 OSS

```ts
import { FileStorage, OssStorage, MinioStorage } from 'evaextractor/storages';

// 本地文件
const file = new FileStorage('./output');
await file.write('data.json', JSON.stringify({ hello: 'world' }));

// 阿里云 OSS
const oss = new OssStorage('prefix', ossClient);
await oss.write('data.json', 'content');

// MinIO
const minio = new MinioStorage('prefix', minioClient, 'bucket');
await minio.write('data.json', 'content', { 'Content-Type': 'application/json' });
```

## 核心概念

### 处理器（Processor）

处理器是核心入口，按 `fetch → parse → extract → transfer → load` 流水线处理内容：

| 步骤 | 说明 |
|---|---|
| `fetch` | 根据 `storage` + `uri` 获取原始内容 |
| `parse` | 解析为结构化数据（HTML 用 cheerio，JSON 直接解析） |
| `extract` | 按 `extractRules` 提取字段 |
| `transfer` | 按 `transferRules` 转换字段 |
| `load` | 自定义持久化逻辑 |

内置处理器：`HtmlProcessor`、`JsonProcessor`。可通过继承 `AbstractProcessor` 自定义。

### 抓取器（Fetcher）

| 类 | 用途 | 依赖 |
|---|---|---|
| `FileFetcher` | 读取本地文件 | 无 |
| `HttpFetcher` | HTTP 请求 | 传入 HTTP client |
| `OssFetcher` | 阿里云 OSS | `ali-oss` |
| `MinioFetcher` | MinIO / S3 | `minio` |

### 遍历器（Iterator）

| 类 | 用途 | 产出 |
|---|---|---|
| `FileIterator` | 本地文件 glob 匹配 | `{ file, cursor }` |
| `MinioIterator` | MinIO `listObjectsV2` | `{ file, cursor }` |
| `OssIterator` | OSS `list` 分页 | `{ file, cursor, nextCursor, count, pageOffset }` |
| `DatabaseIterator` | Sequelize keyset 分页 | 直接产出 entity 实例 |

### 存储器（Storage）

| 类 | 用途 |
|---|---|
| `FileStorage` | 写入本地文件（自动创建目录，路径穿越防护） |
| `OssStorage` | 写入阿里云 OSS |
| `MinioStorage` | 写入 MinIO / S3 |

### 工具

- `HtmlPlus.stringify()` / `HtmlPlus.parse()` — HTML 文件头元数据格式（`<!--key:value-->`）
- `pipe()` — 左到右函数组合
- `humanFileSizeToBytes()` — 人类可读文件大小转字节数

## HTML 元数据格式

处理器识别文件头连续的 HTML 注释作为元数据：

```html
<!--url:https://example.com/article-->
<!--timestamp:2026-08-07T08:00:00.000Z-->
<!--version:2-->
<h1>Hello</h1>
```

元数据值支持 `\` 和 `\n` 转义。

## 环境要求

- Node.js `>=24`
- pnpm

## 开发

```bash
pnpm install
pnpm test       # tsc + node --test
pnpm run lint
pnpm run build  # tsc → lib/
```

CI 在 `main` push 上运行测试后执行 semantic-release（Conventional Commits）。
