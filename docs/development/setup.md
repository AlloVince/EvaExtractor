# 环境搭建

## 何时读
首次克隆、换机器、对齐运行时版本。

## 内容
- Node.js `>=24`（CI 矩阵为 24）
- 包管理：pnpm `10.14.0`（见 `packageManager` 与 CI）
- 安装：`pnpm install`（CI 用 `--frozen-lockfile`）
- 可选 peer（按需）：`pnpm add ali-oss` / `pnpm add minio`
- TypeScript / ESLint 已在 devDependencies；构建产物目录 `lib/`（gitignore）
- 测试编译产物目录 `.test/`（gitignore）

无需本地数据库/云资源即可跑默认单测；MinIO 示例需自备服务（见 `examples/`）。

## 相关
- `commands.md`、`testing.md`
- `package.json`、`.github/workflows/ci.yml`
