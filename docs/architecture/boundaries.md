# 边界

## 何时读
判断改动是否越界、模块该谁改、什么不该进本库。

## 内容
### 库负责
- 通用 fetch / parse / extract / transfer 管线与扩展点
- 本地文件、HTTP（注入 client）、Ali OSS、MinIO 的读写与列举适配
- DB 分页迭代的薄适配（假定 `findAll` 风格 entity）
- HtmlPlus 元数据编解码、URL 哈希路径、少量 transfer 辅助

### 库不负责
- 具体站点选择器业务规则（由消费者设 `extractRules`）
- 账号、密钥、部署拓扑
- 完整爬虫调度、队列、去重服务
- 替消费者实现 `load()` 持久化语义（除非本库内明确 API）

### 模块边界
| 模块 | 做 | 不做 |
|---|---|---|
| processors | 编排阶段、规则执行 | 不直接绑死某种云 SDK 构造 |
| fetchers | 按 uri 读出 string/Buffer | 不解析业务结构 |
| storages | access/write | 不跑提取规则 |
| iterators | 产出条目流 | 不下载全文（可与 fetcher 组合） |
| utils | 纯工具 | 无 I/O 副作用（除 hash 计算） |
| transfers | 单值变换函数 | 不是管线本身 |

### 依赖边界
- 运行时硬依赖：`cheerio`、`fast-glob`
- 可选 peer：`ali-oss`、`minio`
- 优先 Node 内置：`node:fs`、`node:stream/consumers`、`node:crypto` 等

### 兼容红线
- 保持 CommonJS 消费者可用，除非明确 ESM 迁移项目
- 不静默改公开方法名/字段名（含历史拼写 `transferedItem`）
- 扩大 `exports` 或改语义须同步文档与视为中/大变更

## 相关
- `overview.md`
- 各 `../components/*/`
