# EvaExtractor

EvaExtractor is a lightweight TypeScript toolkit for fetching, parsing, extracting,
and transferring content from local files and object storage backends.

It is designed for projects that need to:

- read content from local disk, HTTP, Ali OSS, or MinIO
- parse HTML metadata with `HtmlPlus`
- extract structured data from HTML or JSON payloads
- apply transformation steps before loading or persisting results
- iterate records from files, object storage, or database sources

## Installation

```bash
pnpm add evaextractor
```

If you use the OSS or MinIO integrations, install the matching peer dependency too:

```bash
pnpm add ali-oss
pnpm add minio
```

## Requirements

- Node.js `>=24`
- pnpm

## Development

```bash
pnpm install
pnpm test
pnpm run lint
pnpm run build
```

## Documentation

- `AGENTS.md` contains the development guide and AI-facing project rules.
- `docs/AI_DEVELOPMENT_GUIDE.md` keeps the longer project reference used by AI tools.

---

# EvaExtractor

EvaExtractor 是一个轻量级的 TypeScript 工具库，用于从本地文件和对象存储后端中抓取、解析、提取和转换内容。

它适合这些场景：

- 从本地磁盘、HTTP、阿里云 OSS 或 MinIO 读取内容
- 使用 `HtmlPlus` 解析 HTML 元数据
- 从 HTML 或 JSON 数据中提取结构化信息
- 在加载或持久化之前执行转换步骤
- 遍历文件、对象存储或数据库中的记录

## 安装

```bash
pnpm add evaextractor
```

如果你会使用 OSS 或 MinIO 集成，还需要安装对应的 peer dependency：

```bash
pnpm add ali-oss
pnpm add minio
```

## 环境要求

- Node.js `>=24`
- pnpm

## 开发

```bash
pnpm install
pnpm test
pnpm run lint
pnpm run build
```

## 文档

- `AGENTS.md` 包含面向 AI 和维护者的开发规范。
- `docs/AI_DEVELOPMENT_GUIDE.md` 是更详细的项目参考文档。
