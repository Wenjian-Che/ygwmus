# 逐句证据审计记录

本目录保存回答事实句的审计结果。WP-01 只定义数据契约和离线校验，不会自动生成、发布或修改知识内容。

## 记录结构

每条记录是一个 JSON 对象：

```json
{
  "audit_id": "audit-001",
  "message_id": "message-001",
  "question": "英歌为什么要敲槌？",
  "answer": "槌击可以承担动作与节奏之间的时间标记。",
  "generated_at": "2026-08-18T00:00:00.000Z",
  "claims": [
    {
      "claim_id": "claim-001",
      "text": "槌击可以承担动作与节奏之间的时间标记。",
      "claim_type": "mechanism",
      "risk_level": "medium",
      "evidence_refs": [
        {
          "chunk_id": "chunk-001",
          "source_file": "56_锣鼓动作队形协同机制.md",
          "source_id": "shantou_yingge_standard_2025",
          "quote": "与声明直接相关的短证据片段",
          "grade": "A",
          "url": "https://example.com/source",
          "support": "direct"
        }
      ],
      "status": "supported"
    }
  ]
}
```

## 固定枚举

- `claim_type`: `fact`、`mechanism`、`comparison`、`identity`、`date`、`number`、`realtime`、`inference`
- `risk_level`: `low`、`medium`、`high`、`critical`
- `support`: `direct`、`partial`、`conflict`、`none`
- `status`: `supported`、`partial`、`unsupported`、`conflicted`
- `grade`: `A`、`B`、`C`、`D`

## 当前硬校验

- `message_id`、`answer` 和每条声明的 `claim_id`、`text`、枚举字段不能为空。
- `supported` 至少需要一条 `direct` 证据，不能同时存在 `conflict` 证据。
- `conflicted` 至少需要两条证据，并且至少有一条 `support=conflict`。
- `unsupported` 不能携带 `direct` 证据。
- `high` / `critical` 声明没有 `direct` 证据时，只能标记为 `unsupported`。
- 证据引用必须有来源文件、来源 ID、短引文、等级和 HTTPS 原始链接。
- 引文最多 1000 个字符；校验不调用网络、不调用模型。

## 使用方式

```js
import { buildEvidenceAudit, validateEvidenceAudit } from "../../backend/evidence-audit.mjs";

const audit = buildEvidenceAudit({ message_id, question, answer, claims });
if (!audit.valid) {
  console.error(audit.errors);
}
```

WP-02 负责事实句拆分和当前 RAG 片段匹配；WP-03 已把审计接入管理 API。`POST /api/admin/feedback/revisions/audit-evidence` 读取已存在的 `message_id`，可用请求体覆盖 `answer`、`question`，服务端只从当前切片和来源注册表生成 `claims`、`evidence_chunks`、`sources`、`diagnostics` 与 `passed/can_continue`。结果写入 `evidence_audits` 存储表，可通过 `GET /api/admin/feedback/revisions/audits/:message_id` 回读；接口不接受客户端文件路径、切片或来源注册表。

## WP-02 确定性匹配约定

`backend/evidence-audit-matcher.mjs` 将答案拆成事实句后，使用调用方注入的现有 `retrieve(query, limit)` 函数取得候选切片，再计算：

- 文字术语重合度；
- 地区、队伍、角色、日期和数量等实体重合度；
- 来源等级（通过 `source_registry.file_map` 解析为真实来源）；
- 否定极性和日期/批次/数量冲突。

它不会调用模型，也不会访问网络。候选片段只会被标成 `direct`、`partial`、`conflict` 或 `none`，最终声明状态遵守 WP-01 契约。问号结尾的纯提问句、标题、纯过渡句和追问句不会成为事实声明；“不能把单支队伍当作全国统一标准”这类否定边界必须与证据中的否定极性对齐，不能被误判为正面支持。

离线测试位于 `agent/scripts/test_evidence_audit_matcher.mjs`，覆盖事实句拆分、机制、人物高风险、日期/批次冲突、否定语境、部分支持和无证据等场景。

WP-03 离线服务测试位于 `agent/scripts/test_evidence_audit_api.mjs`，覆盖持久化回读、来源链接、输入校验、404、长引文限制和客户端路径注入防护。

## 黄金集验收门（WP-05）

`POST /api/admin/feedback/revisions/validate` 与
`POST /api/admin/feedback/promote-golden` 只读取服务器保存的审计结果，不信任浏览器提交的
`evidence_audit` 字段。当前审核答案必须与审计时的答案快照一致；否则视为已修改并重新锁定。

进入黄金集前还必须同时满足：

- 所有 `critical` 声明为 `supported`；
- 所有 `high` 声明不是 `unsupported` 或 `conflicted`；
- `supported / total_claims >= 90%`；
- 无冲突声明，或填写至少 12 字的人工冲突处理说明。

纯逻辑测试位于 `agent/scripts/test_golden_evidence_gate.mjs`；真实 HTTP 绕过测试位于
`agent/scripts/test_golden_http_gate.mjs`，只创建并清理带 `wp05-http-` 前缀的临时互动记录，不写入黄金集。
