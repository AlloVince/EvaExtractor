# utils

## 何时读
改 HtmlPlus 元数据格式、pipe、URL 哈希分片路径。

## 职责
- `pipe(...fns)`：从左到右函数组合（transfer 用）
- `HtmlPlus.stringify` / `parse`：文件头连续 `<!--key:value-->` 行 + 正文；`\` 与换行转义
- `hashUrlToPath(uri, depth=3, extension='html')`：MD5 分段文件夹 + 剩余作文件名

## 边界
- 纯函数/静态方法；无网络与存储
- 不负责 cheerio 选择器

## 主要接口 / 入口
- 子路径：`evaextractor/utils` → `src/utils.ts`
- HtmlProcessor.parse 依赖 HtmlPlus.parse

## 依赖
- `node:crypto`

## 雷区
- parse 只认「连续文件头」meta 行；中间插入非 meta 行即停止
- meta 行正则 `^<!--\w+:.+-->$`：key 须 `\w+`，空 value 不匹配
- `hashUrlToPath` depth 钳制在 0–15；分段宽 2 hex 字符

## 相关
- 代码：`src/utils.ts`
- 测试：`test/utils.test.ts`
- 管线：`../processors/`
