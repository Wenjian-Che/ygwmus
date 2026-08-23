# 高风险知识结构化（WP-06）

本目录把模型最容易编造或过度泛化的字段拆成可校验记录。它不是第二套自由编辑的知识库，而是对当前 Markdown/RAG 的高风险事实索引。

## 结构化范围

| 文件 | 范围 | 默认风险 |
|---|---|---|
| `projects.json` | 国家级项目、项目编号、批次、保护单位 | high |
| `inheritors.json` | 国家级代表性传承人及公开字段缺口 | critical |
| `teams.json` | 地区、队伍、板式和队伍个案 | high |
| `formations.json` | 有来源的阵形、空间关系和适用范围 | high |
| `signals.json` | 锣鼓、吆喝、槌声信号的可证范围 | high |
| `events.json` | 有日期和来源的活动记录；历史记录也必须标注时效 | realtime |

## 字段规则

- 每条记录必须有稳定的 `id`，不能用展示名称作为唯一键。
- 每条高风险记录必须带 `source_refs`；引用只写 `source_registry.json` 中的 `source_id`。
- `scope` 表示适用地区、队伍或项目。没有 scope 的队伍个案不得写成通用事实。
- 公开来源没有展示的字段使用 `null`，并在 `field_notes` 或 `evidence_boundary` 说明“未公开/待核验”，禁止补造。
- 同名动作、槌法和阵形默认是“名称相同未必同形”，除非来源明确给出结构。
- `events.json` 中 `historical`、`expired` 记录不能回答“今天/近期正在发生”；实时问题必须重新核验来源。

## 来源等级

`source_refs` 的等级来自 `web/data/source_registry.json`，不是客户端传入的等级。当前第一批只录入 A 级政府、文旅主管部门、国家非遗平台和地方标准来源。

## 校验

```powershell
node agent/scripts/validate_structured.mjs
node agent/scripts/test_structured.mjs
```

校验器不访问网络，检查必填字段、ID 唯一性、来源注册、A 级来源覆盖、高风险字段空值说明、时间格式和队伍/阵形适用边界。它不会自动把结构化数据写入黄金集。
