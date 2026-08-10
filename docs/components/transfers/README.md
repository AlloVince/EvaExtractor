# transfers

## 何时读
改字段级转换辅助函数（非管线本身）。

## 职责
- `humanFileSizeToBytes(str)`：解析如 `1.5MB` / `12Kb` 为 number；无法解析则 `NaN`
- 单位：字节系 `B,KB,...`（1000 进制）；比特系 `b,Kb,...` 再 `/8`

## 边界
- 不实现 `transferRules` 引擎（在 processors + `pipe`）
- 目前模块面很窄；新辅助函数仅在有真实复用时添加

## 主要接口 / 入口
- 子路径：`evaextractor/transfers` → `src/transfers.ts`

## 依赖
- 无

## 雷区
- 使用 1000 而非 1024 进制
- 非法输入返回 `NaN` 而非 throw

## 相关
- 代码：`src/transfers.ts`
- 管线规则：`../processors/`
