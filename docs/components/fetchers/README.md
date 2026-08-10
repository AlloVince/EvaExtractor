# fetchers

## 何时读
改内容读取适配、路径安全、HTTP/OSS/MinIO 读接口。

## 职责
- `FetcherInterface`：`fetch(uri)→string`、`fetchBuffer(uri)→Buffer`
- `FileFetcher`：本地读；可选 `FILE_FETCHER_ROOT` 限制不得出 root
- `OssFetcher`：`oss.get` → content
- `HttpFetcher`：注入 client 的 `request(uri)`，body 支持 string/Buffer/stream
- `MinioFetcher`：`getObject(bucket, uri)` + stream consumers

## 边界
- 只负责读字节/文本，不 parse HTML/JSON
- HTTP client / OSS / MinIO 实例由外部注入，本模块不配置凭证

## 主要接口 / 入口
- 子路径：`evaextractor/fetchers` → `src/fetchers.ts`
- 亦由 `src/index.ts` 的 `factoryFetcher` 引用

## 依赖
- `node:fs/promises`、`node:path`、`node:stream/consumers`
- 运行时可选：ali-oss / minio 客户端形状

## 雷区
- File 越界路径抛 `refusing to read outside of root`
- Http body 若既非 string/Buffer 则当 stream 消费；client 契约需匹配
- Minio 必须提供 bucket（构造参数）

## 相关
- 代码：`src/fetchers.ts`
- 测试：`test/fetchers.test.ts`
- 对称写：`../storages/`
