# 英歌舞智能体接入包

本目录将面向人阅读的Obsidian知识库转换为智能体和H5可使用的产品契约。

## 文件

- `system_prompt.md`：系统提示词，可作为服务端基础提示。
- `intents.json`：意图、实体和路由规则。
- `faq_100.json`：完整100条标准问答与回归评测集，由两份Markdown问答机械同步生成。
- `faq.json`：早期12条带意图与风险标签的种子集，保留用于字段设计参考。
- `knowledge_manifest.json`：知识文件清单、主题与风险信息。
- `h5_api_contract.md`：H5与智能体服务端接口建议。
- `rag_config.json`：切片、召回和回答约束参数。
- `retrieval_eval.json`：静态检索与路由回归测试集。
- `golden_answers.json`：已审核黄金回答；当前 150 条，按批次扩充，不直接接受模型草稿。
- `golden_answer_eval.json`：黄金回答评测集；当前 120 条。
- `adversarial_eval.json`：WP-08 多轮与对抗回归集；首轮 20 条，覆盖地区切换、纠错、错误前提、实时过期、安全与隐私边界。
- `../backend/adversarial-eval.mjs`：对抗回答的离线评测器，不调用网络或模型。
- `scripts/run_adversarial_http.mjs`：真实接口多轮回放器；默认 dry-run，只有显式 `--live` 且通过环境变量提供 Key 时才调用模型。
- `structured/`：项目、传承人、队伍、阵形、信号和历史活动的高风险结构化记录。
- `RETRIEVAL_GUIDE.md`：检索构建、验收和生产接入说明。
- `scripts/`：知识切片构建与自动校验脚本。
- `generated/`：脚本生成的切片、词项索引和验证报告。

## 推荐架构

```text
H5聊天界面
  → 业务API（鉴权、限流、会话）
  → 意图识别
  → 知识检索（Markdown切块 + 向量库）
  → 大模型生成
  → 引用与风险校验
  → 流式返回H5
```

浏览器端不要直接保存模型密钥。实时活动与静态知识分开检索，最终答案合并并标明日期。

## 知识导入

1. 读取`knowledge_manifest.json`列出的根目录Markdown。
2. 解析YAML，按二级/三级标题切块。
3. 为每块加入文件名、标题路径、标签、地区、来源等级和更新时间。
4. 单块控制在300—700个中文字符，保留约80字重叠。
5. 表格尽量整体保留，辨析和warning块提高排序权重。
6. 将`faq_100.json`作为标准问答库，将`retrieval_eval.json`作为检索回归集。

可直接运行：

```powershell
python agent/scripts/build_rag.py --build
python agent/scripts/validate_kb.py
node agent/scripts/validate_golden_answers.mjs
node agent/scripts/test_golden_batch_20260821.mjs
node agent/scripts/test_golden_batch_20260821_second.mjs
node agent/scripts/test_golden_batch_20260821_third.mjs
node agent/scripts/test_golden_batch_20260821_fourth.mjs
node agent/scripts/test_golden_batch_20260821_fifth.mjs
node agent/scripts/test_adversarial_eval.mjs
```

真实接口回放（会消耗模型额度，必须显式开启）：

```powershell
$env:DEEPSEEK_API_KEY = '只在当前终端临时设置，不要写入文件'
node agent/scripts/run_adversarial_http.mjs --live --limit=2
```

## 当前验收标准

- 当前91个静态知识检索题与6个路由题自动回归；
- 静态检索Recall@6不低于0.90，路由准确率为1.00；
- 每个事实性回答至少返回一个来源；
- 地域不清时主动限定；
- 实时信息明确显示“数据截至时间”；
- 无证据时使用不确定回答，不补造数字、人名或荣誉。
- 对抗回归首轮 20/20 通过；禁止把内部 token、文件路径或实现细节泄露到用户答案。
