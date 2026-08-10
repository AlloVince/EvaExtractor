# Project Memory

限高：全文建议 ≤150 行。超限先删 Assumed/过时/已升格进 docs 的条目。
只记：代码与 docs 都表达不好、且影响未来开发的信息。
不记：架构复述、API 说明、流水账、临时调试、git 能看到的变更列表。
置信：Confirmed（代码/测试/人确认）| Assumed（待验证，用完升格或删）。

更新：2026-08-10

## 当前焦点
- 进行中：无
- 下一步：按需补测试/收紧类型等小项（原 REFORM_PLAN 已删，要点见雷区与工程习惯）

## 雷区与禁忌
- 历史拼写 `transferedItem` 为公开字段/方法族，勿静默改名 → 破坏消费者（Confirmed，代码）
- `HtmlProcessor`/`JsonProcessor` 的 `load()` 默认 throw，必须子类或调用方覆盖（Confirmed）
- `FileFetcher` 可用 `FILE_FETCHER_ROOT` 限制读路径；`FileStorage` 构造即 root — 路径穿越已拦（Confirmed）
- OSS/MinIO 为 peer：未安装时相关路径运行时才炸，勿当 hard dep（Confirmed）
- 测试先 `tsc -p tsconfig.test.json` 再到 `.test/` 跑 `node --test`；源测在 `test/`，产物在 `.test/`（Confirmed）
- 发布主干是 `master` 不是 main；`.releaserc.cjs` + CI release job（Confirmed）
- `any` 在 ESLint 关闭；外部 SDK 边界允许 any，新增公开 API 仍宜收紧（Confirmed）
- 对外文档中文；用法示例在 `README.md`（Confirmed，人确认）

## 调试手册
- 测不过 / 找不到用例：先确认是否跑了编译到 `.test`，不要只改 `test/*.ts` 却跑旧 JS
- file 读写越界：检查 root 与相对路径是否被 `resolveInsideRoot` 拒绝
- HtmlPlus 元数据丢字段：meta 行须整行 `<!--key:value-->` 且连续在文件头；值内 `\`/`\n` 有转义

## 待验证
- `STORAGES.S3` 映射 `MinioFetcher`：对外是否承诺 AWS S3 SDK，还是仅 MinIO 兼容 API（Assumed）
- `DatabaseIterator` 是否只面向 Sequelize 风格 `findAll`；有无其它 ORM 消费者（Assumed）

## 协作偏好（项目级）
- 库而非应用：不引入 app shell、DI 容器、配置中心
- 改公开 exports 路径或 processor 语义 = 中/大变更，需同步 README 与 components docs
- 已删除 `docs/USAGE_EXAMPLES.md`、`docs/REFORM_PLAN.md`、`docs/AI_DEVELOPMENT_GUIDE.md`；勿重建空壳
