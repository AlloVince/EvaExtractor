# storages

## 何时读
改持久化写入、存在性检查、对象键拼接。

## 职责
- `StorageInterface`：`access`、`write`
- `FileStorage(root)`：root 内相对路径；`mkdir` recursive + `writeFile`
- `OssStorage(root, oss)`：`head` / `put`，键为 root 前缀拼接
- `MinioStorage(root, minio, bucket)`：`statObject` / `putObject`（write 可带 meta）

## 边界
- 不实现 processor.load 业务；仅存储原语
- 不做列举（列举见 iterators）

## 主要接口 / 入口
- 子路径：`evaextractor/storages` → `src/storages.ts`

## 依赖
- `node:fs/promises`、`node:path`
- 可选云 SDK

## 雷区
- `resolveInsideRoot` / `objectKey`：相对路径规范化；File 拒绝出 root
- root 尾斜杠与 relative 首斜杠在 objectKey 中会规范化
- Minio `write` 签名多 `meta` 参数，与 File/Oss 不完全对称

## 相关
- 代码：`src/storages.ts`
- 测试：`test/storage.test.ts`
- 对称读：`../fetchers/`
