# iterators

## 何时读
改源枚举、分页、cursor、与 ORM/对象存储列表 API 的适配。

## 职责
- `IteratorInterface`：`getItems(input) → AsyncIterableIterator`
- `FileIterator`：`fast-glob` 流式匹配 `prefix`+`pattern`（默认 `**/*.html`），产出 `{ file, cursor }`
- `MinioIterator`：`listObjectsV2`，可 override bucket，产出 `{ file, cursor }`
- `OssIterator`：`list` 分页（limit 1000），产出 `{ file, cursor, nextCursor, count, pageOffset }`，支持 `max`
- `DatabaseIterator`：对 `entity.findAll` 做 offset 分页；`ORDER` ASC/DESC

## 边界
- 产出「有哪些条目」，默认不拉取文件正文
- 不封装凭证；client/entity 外部注入

## 主要接口 / 入口
- 子路径：`evaextractor/iterators` → `src/iterators.ts`
- 各 `getItems` 的 input 形状因后端而异（见源码解构默认值）

## 依赖
- `fast-glob`（File）
- 可选 minio / ali-oss；DB entity 需提供 `findAll`

## 雷区
- 文件/对象存储 iterator 统一产出 `file` 和 `cursor`；`OssIterator` 额外产出分页信息；`DatabaseIterator` 保持直接产出 entity 的既有语义
- `DatabaseIterator` 语义绑定 Sequelize 风格；换 ORM 需适配层
- Oss 内部状态在实例上（cursor/objects），并发共用同一实例不安全（Assumed 使用方式）

## 相关
- 代码：`src/iterators.ts`
- 测试：`test/iterators.test.ts`
- 示例：`examples/minio.iterator.ts`
