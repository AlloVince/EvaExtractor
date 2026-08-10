# 常用命令

## 何时读
跑安装、测试、lint、构建、发布相关本地操作。

## 内容
```bash
pnpm install
pnpm test              # tsc -p tsconfig.test.json && node --test .test/test/**/*.js
pnpm run lint          # eslint .
pnpm run build         # rm -rf lib && tsc -p tsconfig.build.json
pnpm run watch         # tsc -w
```

发布：`prepublishOnly` → build；正式发版由 CI 在 `main` 上 semantic-release（需 `NPM_TOKEN`）。勿在无要求时本地冒充 release。

## 相关
- `setup.md`、`testing.md`
- `package.json` scripts
