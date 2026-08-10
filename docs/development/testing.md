# 测试

## 何时读
加测、改测、查 CI 失败、选测试风格。

## 内容
- 运行器：Node 内置 `node:test`（编译后 JS）
- 源：`test/*.test.ts`；先编到 `.test/` 再执行
- 范围偏好：公开行为、确定性工具函数；少而稳的单元测优先于重集成
- 建议覆盖（历史约定）：HtmlPlus、`hashUrlToPath`、iterator 分页、fetcher/storage 路径
- lint：`eslint` + `typescript-eslint`；`no-explicit-any` 关闭；`consistent-type-imports` error
- CI：lint → test → build；Node 24

加测时与现有 `test/*.test.ts` 风格对齐；mock 外部 SDK 即可，不强制真实云。

## 相关
- `commands.md`
- 代码：`test/`
- CI：`.github/workflows/ci.yml`
