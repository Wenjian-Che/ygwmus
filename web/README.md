# 英歌有意思网站

静态响应式英歌文化网站，内置浏览器端知识检索智能体，并提供 DeepSeek V4 Flash 接入控制台。

## 本地启动

不要直接双击 `index.html`，因为浏览器会限制本地JSON读取。请在知识库根目录运行：

推荐直接运行项目根目录的 `start_local.ps1`，它会同时启动后端 API 和 H5 静态服务：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\start_local.ps1
```

也可以手动启动：

```powershell
python -m http.server 8080 --directory web
```

然后访问 `http://127.0.0.1:8080/`。

管理页：`http://127.0.0.1:8080/admin.html`。它不会保存 API Key，只显示后端接口状态并提供临时连通测试。

每日动态审核：`http://127.0.0.1:8080/review.html`。它读取候选池并把审核事件追加到 `automation/inbox/reviews.jsonl`。

用户动态页：`http://127.0.0.1:8080/dynamic.html`。它只展示审核通过且未过期的动态知识。

## 启动 DeepSeek API 骨架

在另一个终端执行：

```powershell
Copy-Item backend/.env.example backend/.env
# 编辑 backend/.env，填写 DEEPSEEK_API_KEY
node backend/server.mjs
```

默认 API 地址为 `http://127.0.0.1:8787`，模型为 `deepseek-v4-flash`。详细说明见 [backend/README.md](../backend/README.md)。

## 数据同步

知识库更新后重新生成切片，并同步两份数据：

```powershell
python agent/scripts/build_rag.py --build
Copy-Item agent/faq_100.json web/data/faq_100.json -Force
Copy-Item agent/generated/chunks.jsonl web/data/chunks.jsonl -Force
```

目前浏览器端仍可独立运行，无需模型密钥；配置后可由服务端承担真实模型调用。生产接入时，应保留现有实时问题路由、证据不足追问和来源展示逻辑，并将真正的模型密钥放在服务端。

接入不同 H5 时，在 `admin.html` 设置对应 `app_id`；后端应用清单位于 `backend/apps.json`。

对话面板会在当前页面内保留最近几轮上下文；点击右上角“新对话”可清空上下文并回到欢迎状态。上下文只用于当前浏览器会话，不写入本地存储。

服务端还会对问题做轻量意图路由：历史源流、队伍地区、动作阵形、锣鼓信号、脸谱角色、保护传承和最新动态，并给每类问题匹配专属回答结构。系统还会显示证据等级；仅说“这个呢”等指代不明或资料不足时，会优先让智能体澄清对象。

管理页的“待补充问题”可以一键生成知识补充任务，任务进入 SQLite 队列后再由资料抓取、审核和发布流程处理。

`admin-feedback.html` 是独立的真实用户反馈闭环：展示完整问答、证据等级、点赞/点踩和低置信度记录。管理员可生成知识补充任务、标记处理、删除隐私记录，或在人工核对答案与来源后把问题加入黄金回答和真实回归集。

同一页面的“高频问题与知识缺口”会把相近问法聚成主题，并按频次、点踩和低置信度标记 P0—P3。管理员可展开查看原始问法，或一键把主题转成知识补充任务。

`admin-answer-revisions.html` 是独立的答案修订工作台。它会综合用户点踩、反馈原因、证据等级、引用覆盖、开头切题程度和过度泛化风险形成诊断；管理员可按当前证据调用模型生成修订草稿，并将草稿送入人工黄金集审核。模型生成不会直接修改知识库。

人工审核弹窗带有自动验收报告和发布锁。修订稿只有全部检查通过后才能点击“人工确认并加入”；通过后若再次修改任意字段，页面会立即重新锁定并要求再次验收。

每次自动回填前会创建知识版本快照；管理页“知识变更记录”可查看构建状态、切片数量和备份位置，必要时显式恢复某个已构建版本。
