# 架构总览

## 何时读
理解系统定位、主数据流、目录与发布形态。

## 内容
**是什么**：npm 发布的 TypeScript 工具库（非应用）。消费者在自有 ETL/采集流程中组合 processor、fetcher、storage、iterator。

**运行基线**：Node `>=24`；pnpm；TS strict；构建输出 CommonJS 到 `lib/`；多入口 `exports`（`.` / `iterators` / `fetchers` / `storages` / `utils` / `transfers`）。

**主路径**（HtmlProcessor / JsonProcessor 同构）：
1. `fetch` — MetaItem + Fetcher → FetchedItem（原文）
2. `parse` — HTML 用 HtmlPlus 抽头注释元数据；JSON 用 `JSON.parse`
3. `extract` — HTML 按 `extractRules` + cheerio；JSON 直接透传 parsed
4. `transfer` — 按 `transferRules` 对字段 `pipe` 变换；JSON 默认透传
5. `load` — 基类 throw，由子类/业务覆盖

**源码地图**：
| 路径 | 角色 |
|---|---|
| `src/index.ts` | 处理器、接口、STORAGES、factoryFetcher |
| `src/fetchers.ts` | 读 |
| `src/storages.ts` | 写 |
| `src/iterators.ts` | 异步遍历源 |
| `src/utils.ts` | HtmlPlus、pipe、hashUrlToPath |
| `src/transfers.ts` | 体积字符串转字节等 |
| `test/` | 单测源 |
| `examples/` | 集成参考（非包入口） |
| `lib/` | 发布产物 |

**可选集成**：`ali-oss`、`minio` 为 peerDependencies。

**发布**：CI 在 `master` push 上 test 后 semantic-release（需 `NPM_TOKEN`）。

## 相关
- 代码：`src/`
- 边界：`boundaries.md`
- 开发：`../development/`
