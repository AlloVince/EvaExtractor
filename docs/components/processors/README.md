# processors

## 何时读
改 Html/Json 处理管线、规则类型、factoryFetcher、公开处理器 API。

## 职责
- 定义 `ProcessorInterface` 与阶段数据：meta → fetched → parsed → extracted → transfered → load
- `AbstractProcessor`：`process()` 串行阶段；assert 顺序；getter/setter；`debug`/`output`
- `HtmlProcessor`：fetch → HtmlPlus.parse → cheerio + extractRules → transferRules/pipe → load
- `JsonProcessor`：fetch → JSON.parse → extract/transfer 默认透传 → load
- `STORAGES` 枚举与 `factoryFetcher`（file/oss/http/s3→MinioFetcher）

## 边界
- 不做：具体 load 落库/落盘实现（基类 `load()` throw）
- 不内置创建 OSS/MinIO 客户端；fetcher 由构造注入或 factory 映射参数创建

## 主要接口 / 入口
- 包入口：`evaextractor` → `src/index.ts`
- 关键类型：`MetaItemInterface`、`FetchedItemInterface`、`ParsedItemInterface`、`ExtractRulesInterface`、`TransferRulesInterface`
- 规则：`extractRules[key] = ($ , parsed, processor?) => value`（Html）；嵌套规则对象在 extract 中非函数则原样放入
- transfer：`transferRules[key] = TransferRule[]`，经 `pipe` 从左到右

## 依赖
- `cheerio`（Html extract）
- `./utils`（HtmlPlus、pipe）
- `./fetchers`（默认 FileFetcher、factory 映射）

## 雷区
- 阶段必须按序；跳过会 assert 抛错
- 公开字段名 `transferedItem` 为历史拼写，属兼容面
- `factoryFetcher` 的 `mapping[storage]` 为构造参数数组，调用方需与对应 Fetcher 构造一致
- `STORAGES.S3` 实际构造 `MinioFetcher`（命名与 AWS SDK 关系见 memory 待验证）

## 相关
- 代码：`src/index.ts`
- 测试：`test/processors.test.ts`
- 示例：`README.md`、`examples/`
replaceAll
