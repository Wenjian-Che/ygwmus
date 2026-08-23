# 英歌舞每日知识更新

每日更新建议做成“发现—候选—审核—发布”，不要让脚本直接改正式知识库。

## 流程

```text
官方 RSS/JSON Feed 或授权数据源
  → daily_refresh.mjs
  → automation/inbox/YYYY-MM-DD.jsonl
  → 去重、来源分级、地域识别
  → 人工审核/事实核验
  → 生成 Markdown 与 source_registry
  → 重建 RAG 索引
  → 回归测试后发布
```

脚本只接受 `sources.json` 中明确配置的来源。项目已放入一份官方页面配置，后续可继续追加 RSS/JSON Feed；没有 Feed 的网站不要自行拼接 RSS 地址。若要重新建立模板，可参考 `sources.example.json`。

脚本还会读取 SQLite 中状态为 `open` 的知识补充任务，生成 `automation/inbox/task-plans-YYYY-MM-DD.jsonl`。任务计划包含意图、拆分后的检索词和可用官方来源；抓取结果若命中任务，会在候选记录中附带 `task_ids`，方便审核后回填知识缺口。

每日包装脚本还会调用 `question_cluster.mjs`，把最近真实问题按主题、问法和意图聚类，并综合问题频次、点踩数和低置信度生成 P0—P3 优先级。聚类只生成运营决策数据，不会绕过人工审核直接改知识库。

## 为什么不能每天自动改正式库

- 新闻稿可能是一次性活动，不是稳定知识；
- 同一消息会被多个媒体重复转载；
- 短视频标题可能夸大人数、年代和“最正宗”等判断；
- 队伍成立、传承人和非遗级别属于需要核对的高风险字段；
- 当天活动信息有失效时间，不能混入历史知识。

候选记录默认 `pending_review`。只有审核者确认来源、日期、地区、事件类型和适用期限后，才进入正式文档。

## 运行

```powershell
node automation/daily_refresh.mjs
```

只生成补充任务检索计划、不访问外部来源时，可运行 `node automation/daily_refresh.mjs --plan-only`。

Windows 任务计划程序可以每天运行一次；生产环境应给脚本设置超时、失败告警和候选数量上限。正式发布仍应调用 `build_rag.py`、`validate_kb.py` 并完成网页回归。

项目内也提供了任务计划程序可直接调用的包装脚本：

```powershell
powershell.exe -ExecutionPolicy Bypass -File D:\vctest\英歌舞\automation\run_daily_refresh.ps1
```

也可以单独重算问题聚类：

```powershell
node automation/question_cluster.mjs
```

建议设置为每天早上 07:00 运行，并把工作目录设为项目根目录。脚本失败时会返回非零退出码，方便任务计划程序或外部监控告警。

如果希望自动安装 Windows 每日任务，可在项目根目录执行：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\automation\register_daily_task.ps1
```

该脚本只注册当前用户的任务，不会自动发布候选内容；审核仍在 `review.html` 中完成。

## 内容分层

- `dynamic`：当天演出、路线、票务和活动通知，带过期时间；
- `candidate`：自动发现、等待审核的新闻和队伍动态；
- `stable`：经过来源核验后进入正式知识库的历史与机制知识。
