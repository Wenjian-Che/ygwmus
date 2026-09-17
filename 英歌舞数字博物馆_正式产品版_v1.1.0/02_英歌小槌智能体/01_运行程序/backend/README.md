# 英歌智能体 API 骨架

这是一个无第三方依赖的本地 API 骨架，默认使用服务端配置的回答模型。它会先做本地检索，再调用回答模型，并把净化后的引用以 SSE 事件返回。

## 启动

```powershell
Copy-Item backend/.env.example backend/.env
node backend/server.mjs
```

接口：

- `GET /api/health`：只返回公众所需的服务模式与知识可用状态；模型、上游、存储和语音详情只在受保护管理接口中查看；
- `GET /api/admin/config`：读取安全配置摘要；
- `GET /api/admin/auth/status`、`POST /api/admin/auth/setup|login|logout`：本机首次设置、账号密码登录与 HttpOnly 会话；
- `GET|PUT /api/admin/settings/model`、`POST /api/admin/settings/model/test`：读取安全摘要、加密保存 DeepSeek 设置并显式测试连接；
- `GET /api/admin/site-content`：读取草稿、公众版、工作流与当前版本；
- `POST /api/admin/site-content/preview`：严格校验一份预览，不写入文件；
- `PUT /api/admin/site-content/draft`：author 按 `expected_version` 保存草稿；
- `POST /api/admin/site-content/publish`：publisher 确认发布当前草稿；
- `POST /api/admin/diagnostics/run`：运行零外网、零模型费用的知识连接诊断；
- `GET /api/admin/knowledge-graph`：读取确定性知识图谱的后台治理投影；缺少生产图谱文件时返回脱敏的 `not_ready`，不提供公众图谱接口；
- `GET /api/admin/candidates`：读取每日更新候选池；
- `POST /api/admin/candidates/review`：写入通过/驳回审核事件；
- `POST /api/agent/feedback`：按回答 `message_id` 接收点赞、点踩和问题原因；英歌知识问答被点踩时会自动生成待复核补证任务；
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
- `GET /api/admin/unanswered`：读取尚未分流的证据不足问题清单；
- `POST /api/admin/unanswered/promote`：把问题转成知识补充任务；
- `GET /api/admin/knowledge-tasks`：读取知识补充任务队列；
- `POST /api/admin/knowledge-tasks/status`：更新任务状态；
- `GET /api/admin/revisions`：读取知识变更记录与备份路径；
- `POST /api/admin/revisions/restore`：显式恢复某个已构建版本；
- `POST /api/agent/chat`：生产问答，返回 SSE；请求可带 `history`（最近若干轮 `role/content`），服务端会截断后参与本轮回答；
- `POST /api/admin/test`：使用服务端配置的模型运行管理页测试；浏览器不得传入 API Key。

问答会先进行轻量意图路由（历史、队伍、动作、锣鼓、脸谱角色、保护传承、最新动态），并为每类问题提供专属回答结构；同时评估证据等级（充分、有限、不足），结果会随测试接口返回。指代不明或证据不足时，会要求模型先澄清地区、队伍、日期或具体动作。

英歌知识域出现馆内知识空缺、证据不足、引用完整性失败或用户点踩时，服务会按“应用 + 规范化问题”去重，自动写入待审核的知识补证任务；同时保留未答好信号用于统计。这个动作只建立后台工作项，不会自动生成事实、写入 Markdown、重建索引或发布给公众。补充内容仍须经过来源核验、适用范围说明和人工审核，再走现有的知识重建与黄金回答闸门。

黄金回答写入前会在后端重新运行答案验收门。即使绕过管理页面直接调用写入接口，只要深度、切题、关键事实、错误表述、来源、边界或别名检索任一强制项不合格，写入仍会被拒绝。

生产环境必须使用 `deploy/` 中的 HTTPS 反向代理、确切域名白名单、Secure Cookie、外置私密状态目录和启动预检。应用清单路径由 `ADMIN_APPS_PATH` 指定，请求可通过 body 或 `X-App-Id` 传入应用标识。

未配置 `ADMIN_CREDENTIALS_JSON` 时，管理工作台只允许在本机执行一次首次设置：密码使用 scrypt 保存为不可逆哈希，后续会话使用 `HttpOnly + SameSite=Strict` Cookie。`ADMIN_CREDENTIALS_JSON` 仍可用于 author、reviewer、publisher 的责任分离兼容流程。所有私密账户与模型设置都存放在公众目录之外；首次设置完成前，其余管理接口 fail-closed。完整流程见 `docs/ADMIN_OPERATIONS.md`。

逐句证据审计接口不接受客户端传入的文件路径或来源注册表，只使用服务端当前知识切片和已登记的 HTTPS 来源。浏览器工作台使用安全 Cookie；服务端自动化或分角色兼容调用仍可使用 `Authorization: Bearer <role-token>` 或 `X-Admin-Token`。审计引用片段最多保留 1000 个字符，高风险声明无直接证据或出现冲突时不会允许继续自动验收。

当前运行环境支持 Node 内置 SQLite，服务会在 `AGENT_STORE_DIR` 持久化 H5 应用、问答记录、主动反馈、知识任务、审核事件和已发布动态；不记录用户 IP。开发环境缺少 `node:sqlite` 时可降级为内存兼容模式，生产环境则 fail-closed，禁止静默丢失数据。

审核通过且关联知识补充任务的候选，会写入 `KNOWLEDGE_SOURCE_DIR`，调用 `agent/scripts/build_rag.py --build` 重建到 `KNOWLEDGE_BUILD_OUTPUT_DIR`，再同步到仅后端可读的 `KNOWLEDGE_RUNTIME_DATA_DIR`。生产环境不得把完整知识切片写入 `web/`。如 Python 不在 PATH，可设置 `PYTHON_BIN`。

## 2026-08-24 运行时优化

- 复用服务端 `KNOWLEDGE_RUNTIME_DATA_DIR/lexical_index.json` 做 BM25 候选召回，再叠加意图、主题、标题与来源规则重排；候选结果带 TTL 缓存。
- `/api/health` 与 `/api/admin/metrics` 返回检索引擎、缓存命中和平均耗时。
- 聊天与管理测试接口统一校验消息、历史长度和提示词注入；请求体默认限制为 128 KiB。
- 模型请求默认 45 秒超时，上游错误仅写服务端脱敏日志，不回传原始响应。
- 生成结束后校验 `[证据N]` 编号；缺失或越界时把回答降为 `limited` 并进入复核队列。
- SQLite 自动迁移并记录模型、意图、证据等级、检索耗时和引用完整率。
- CORS 响应遵循 `AGENT_ALLOWED_ORIGINS`，生产环境应配置确切域名。

离线回归入口：`node agent/scripts/test_agent_runtime.mjs`，以及 `GET /api/admin/evaluation`。
