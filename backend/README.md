# 英歌智能体 API 骨架

这是一个无第三方依赖的本地 API 骨架，默认使用 DeepSeek V4 Flash。它会读取 `web/data/chunks.jsonl` 和 `web/data/source_registry.json`，先做本地检索，再调用 DeepSeek，并把引用以 SSE 事件返回。

## 启动

```powershell
Copy-Item backend/.env.example backend/.env
# 编辑 backend/.env，填写 DEEPSEEK_API_KEY
node backend/server.mjs
```

接口：

- `GET /api/health`：检查服务和 Key 状态，不返回 Key；
- `GET /api/admin/config`：读取安全配置摘要；
- `GET /api/admin/candidates`：读取每日更新候选池；
- `POST /api/admin/candidates/review`：写入通过/驳回审核事件；
- `POST /api/agent/feedback`：按回答 `message_id` 接收点赞、点踩和问题原因；
- `GET /api/admin/feedback`：读取真实问答、低置信度和点踩复核队列；
- `GET /api/admin/feedback/clusters`：读取真实问题聚类、优先级和知识缺口摘要；
- `POST /api/admin/feedback/clusters/run`：立即重算最近真实问题的语义主题；
- `GET /api/admin/feedback/revisions`：读取待修订回答、风险分、质量诊断和建议回答骨架；
- `POST /api/admin/feedback/revisions/generate`：使用服务端模型与当前知识证据生成一版修订草稿，不自动发布；
- `POST /api/admin/feedback/revisions/validate`：验收修订稿的首段切题、事实词、禁止表述、来源文件、适用边界和别名检索覆盖，并强制通过服务器保存的逐句证据审计；
- `POST /api/admin/feedback/revisions/audit-evidence`：按回答 `message_id` 对修订稿逐句匹配当前知识证据，返回支持率、风险缺口、证据片段、真实来源与自动验收闸门；
- `GET /api/admin/feedback/revisions/audits/:message_id`：读取已保存的逐句证据审计结果；
- `POST /api/admin/feedback/promote-golden`：人工确认答案、关键事实和来源后，加入黄金回答与真实回归集；后端会重新读取审计并拒绝缺审计、旧审计、关键/高风险无直接证据、支持率低于 90% 或未说明证据冲突的请求；
- `GET /api/admin/dynamic`：读取审核通过且未过期的动态知识；
- `GET /api/admin/apps`：读取已注册的 H5 应用；
- `GET /api/admin/metrics`：读取不含问题正文的请求统计；
- `GET /api/admin/unanswered`：读取证据不足的问题清单；
- `POST /api/admin/unanswered/promote`：把问题转成知识补充任务；
- `GET /api/admin/knowledge-tasks`：读取知识补充任务队列；
- `POST /api/admin/knowledge-tasks/status`：更新任务状态；
- `GET /api/admin/revisions`：读取知识变更记录与备份路径；
- `POST /api/admin/revisions/restore`：显式恢复某个已构建版本；
- `POST /api/agent/chat`：生产问答，返回 SSE；请求可带 `history`（最近若干轮 `role/content`），服务端会截断后参与本轮回答；
- `POST /api/admin/test`：管理页临时测试，body 中的 `api_key` 只用于本次请求，不保存。

问答会先进行轻量意图路由（历史、队伍、动作、锣鼓、脸谱角色、保护传承、最新动态），并为每类问题提供专属回答结构；同时评估证据等级（充分、有限、不足），结果会随测试接口返回。指代不明或证据不足时，会要求模型先澄清地区、队伍、日期或具体动作。

黄金回答写入前会在后端重新运行答案验收门。即使绕过管理页面直接调用写入接口，只要深度、切题、关键事实、错误表述、来源、边界或别名检索任一强制项不合格，写入仍会被拒绝。

生产环境应把 API 服务放在 HTTPS 反向代理后，增加登录鉴权、域名白名单、限流、日志脱敏和多应用 `app_id` 隔离。应用清单见 `backend/apps.json`，请求可通过 body 或 `X-App-Id` 传入应用标识。

可通过 `ADMIN_TOKEN` 开启管理接口保护。开启后，管理页使用 session 内 Token 请求；健康接口和公开动态页仍可访问。

逐句证据审计接口不接受客户端传入的文件路径或来源注册表，只使用服务端当前知识切片和 `web/data/source_registry.json` 中的 HTTPS 来源；管理请求应通过 `Authorization: Bearer <ADMIN_TOKEN>` 或 `X-Admin-Token` 发送。审计引用片段最多保留 1000 个字符，高风险声明无直接证据或出现冲突时不会允许继续自动验收。黄金集验收还会把审计答案快照与当前审核答案做精确归一化比对，任何答案字段改动都会重新锁定。

当前运行环境支持 Node 内置 SQLite，服务会自动创建 `backend/yingge.sqlite`，持久化 H5 应用、问答记录、主动反馈、知识任务、审核事件和已发布动态；不记录用户 IP。若运行环境不支持 `node:sqlite`，会回退到进程内 JSON 兼容模式。

审核通过且关联知识补充任务的候选，会追加到 `knowledge-base/content/84_审核通过知识补充.md`，调用 `agent/scripts/build_rag.py --build` 重建切片，并同步到 `web/data/`。如部署环境的 Python 不在 PATH，可设置 `PYTHON_BIN` 指向解释器。

## 2026-08-24 运行时优化

- 复用 `web/data/lexical_index.json` 做 BM25 候选召回，再叠加意图、主题、标题与来源规则重排；候选结果带 TTL 缓存。
- `/api/health` 与 `/api/admin/metrics` 返回检索引擎、缓存命中和平均耗时。
- 聊天与管理测试接口统一校验消息、历史长度和提示词注入；请求体默认限制为 128 KiB。
- 模型请求默认 45 秒超时，上游错误仅写服务端脱敏日志，不回传原始响应。
- 生成结束后校验 `[证据N]` 编号；缺失或越界时把回答降为 `limited` 并进入复核队列。
- SQLite 自动迁移并记录模型、意图、证据等级、检索耗时和引用完整率。
- CORS 响应遵循 `AGENT_ALLOWED_ORIGINS`，生产环境应配置确切域名。

离线回归入口：`node agent/scripts/test_agent_runtime.mjs`，以及 `GET /api/admin/evaluation`。
