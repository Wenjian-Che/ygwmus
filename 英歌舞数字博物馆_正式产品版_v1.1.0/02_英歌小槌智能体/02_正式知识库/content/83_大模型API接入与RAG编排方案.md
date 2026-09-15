---
tags: [英歌舞, 智能体, 大模型API, RAG, H5, 接入方案]
aliases: [英歌智能体API方案, 英歌RAG编排]
status: 已审校
updated: 2026-08-01
---

# 英歌舞智能体大模型 API 接入与 RAG 编排方案

## 一、先回答：要不要接大模型 API

要接，但不是把 API 直接塞进 H5 页面。

当前网页已经完成了知识库、来源注册、规则路由和本地回答，属于“可验证知识底座”。接入大模型后，模型负责理解自然语言、组织长答案、追问和多轮上下文；知识库负责提供事实证据；后端负责检索、引用、权限和安全。

推荐链路：

```text
H5聊天框
  → 业务后端 /api/agent/chat
  → 意图识别与地域约束
  → 检索本地英歌知识库
  → 组装带文件名和来源的证据包
  → 大模型 API
  → 引用校验、敏感信息过滤、结构化输出
  → SSE流式返回H5
```

## 二、当前网页和生产智能体的分工

| 层 | 当前状态 | 接入后职责 |
|---|---|---|
| H5界面 | 已有 | 输入、流式答案、来源卡片、追问、图片上传 |
| 本地知识库 | 83篇、314个切片 | 事实、队伍差异、动作同步、证据边界 |
| 规则路由 | 已有 | 实时问题、图片澄清、深答主题的快速判断 |
| 检索器 | 已有词项检索 | 生产环境可升级为混合检索或向量检索 |
| 大模型 | 尚未接入 | 生成自然语言、总结证据、追问和多轮对话 |
| 后端 API | 契约已定义 | 密钥、鉴权、限流、日志脱敏、引用校验 |

## 三、为什么不能让 H5 直接调用模型

模型密钥不能放在浏览器 JavaScript、localStorage、网页源码或公开环境变量中。只要用户打开开发者工具，就可能看到并盗用密钥。

H5只需要拿到你的业务接口，例如：

```http
POST /api/agent/chat
Authorization: Bearer <用户登录态>
Content-Type: application/json
```

真正的模型请求在服务端完成。服务端还要限制每个用户的请求频率、单次输入长度、文件大小和每日额度。

## 四、第一版推荐的后端流程

### 1. 接收请求

```json
{
  "conversation_id": "uuid",
  "message": "甲子英歌八拍吆喝由谁领喊？",
  "context": {
    "region": "甲子",
    "scene": "知识问答",
    "detail_level": "deep"
  },
  "client": {
    "knowledge_version": "2026.07.30.4",
    "locale": "zh-CN"
  }
}
```

### 2. 先走确定性路由

- 今天、明天、票务、路线、天气：转实时数据服务；
- 图片或没有地点的视频识别具体队伍：先请求地点、队名、日期和节目单；
- 明确的事实问题：检索知识库后交给模型组织答案；
- 涉及动作教学、未成年人、个人隐私：追加安全和隐私约束。

### 3. 检索证据

第一阶段可以直接复用当前 `chunks.jsonl` 的词项检索，取前6—10个切片；第二阶段再增加向量检索和重排序。检索结果必须带：

```json
{
  "source_file": "79_队伍动作鼓点阵形同步个案.md",
  "heading_path": ["甲子", "动作转换信号"],
  "content": "……",
  "source_ids": ["shanwei_jiazi"],
  "evidence_level": "A",
  "region_scope": ["甲子"]
}
```

### 4. 让模型只在证据范围内回答

系统提示词要明确：

- 只能把证据包中的事实写成确定事实；
- 证据只描述甲子时，不得扩展成全部英歌标准；
- 事实、影像观察和分析推断要分层；
- 没有来源时不能补造引用、数字、人物身份和活动安排；
- 用户要求“详细”时增加机制、例子、边界和下一步核验方式，而不是重复套话；
- 输出引用 ID，由后端把 ID 映射成真实来源卡片，模型不能自由生成 URL。

### 5. 校验后流式返回

建议使用 SSE：

```text
event: meta
data: {"message_id":"uuid","intent":"performance.sync"}

event: delta
data: {"text":"甲子英歌的公开资料记录……"}

event: citations
data: {"items":[{"source_id":"shanwei_jiazi"}]}

event: done
data: {"confidence":"高","knowledge_version":"2026.07.30.4"}
```

模型可以生成文本，但引用卡片、置信提示和知识版本应由后端控制，避免模型输出一个不存在的来源。

## 五、DeepSeek V4 Flash 默认配置

本项目默认按 DeepSeek V4 Flash 接入：

```env
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_THINKING=true
DEEPSEEK_MAX_TOKENS=4096
```

官方接口使用 OpenAI 兼容的 `POST /chat/completions`，流式回答打开 `stream: true`；Thinking 模式通过 `thinking.type` 控制。管理页和后端骨架已经使用这些默认值，Key 仍只应放在服务端环境变量或服务端密钥管理器中。

## 六、模型怎么选

模型不是第一步决定项。先把检索、引用和评测打通，再做模型对比。

如果选择 OpenAI，官方当前建议使用 Responses API 处理推理、工具调用和多轮流程；模型页也列出 File Search、函数调用等能力。复杂的英歌长答可以使用高质量模型，普通问答则应测试更低成本、低延迟的型号，最终按本项目的事实命中率、引用完整率、延迟和成本评估，不凭模型名猜效果。

如果以后改用其他模型厂商，只替换 `ModelProvider` 适配层，不修改 H5 契约和知识库格式：

```ts
interface ModelProvider {
  streamAnswer(input: {
    system: string;
    messages: Message[];
    evidence: EvidenceChunk[];
  }): AsyncIterable<ModelEvent>;
}
```

## 七、第一版不要急着做的事

- 不要一开始就微调模型；英歌知识仍在持续补充，先用 RAG 更容易更新和追溯。
- 不要把314个切片全部塞进每次请求；只发送与问题相关的证据。
- 不要让模型自由输出网页 HTML、脚本或来源网址。
- 不要把短视频、宣传语和队伍个案混成全国统一规则。
- 不要把实时活动信息写进静态知识库后当成最新消息。

## 八、每日知识更新与正式库发布

每日自动化是必要的，但它负责“发现新内容”，不负责无审核地改写知识库。建议把每天的内容分成三类：

- `dynamic`：当天活动、演出、路线和票务，带过期时间；
- `candidate`：自动发现的新闻、队伍动态和新访谈，先进入候选池；
- `stable`：完成来源核验、地域标注和去重后，才进入正式知识库。

自动程序每天执行：抓取白名单官方 Feed → 提取标题、日期、地区和正文 → 去重 → 判断是否与英歌相关 → 写入 `automation/inbox/YYYY-MM-DD.jsonl`。审核者确认后，再生成 Markdown、更新来源注册表、重建 RAG 并跑回归测试。

详细脚本和配置见 `automation/daily_refresh.mjs`、`automation/README.md`。

## 九、接入验收指标

每次改模型或提示词，都要跑同一组回归：

| 指标 | 第一版目标 |
|---|---:|
| 知识检索 Recall@6 | ≥0.95 |
| 引用存在率 | 100% |
| 引用与答案事实相关率 | ≥0.95 |
| 事实越界率 | ≤2% |
| 实时问题误答率 | 0 |
| 流式首字延迟 | 目标≤800ms，超时显示查阅状态 |
| 密钥出现在前端资源 | 0 |

当前本地回归已经达到 Recall@6=1.00、路由准确率=1.00，下一步是增加“模型答案引用完整率”和“事实越界率”两类评测。

## 十、实施顺序

1. 先确定后端运行环境和登录鉴权方式；
2. 实现 `/api/agent/chat` 的非流式版本；
3. 把当前本地检索器搬到服务端；
4. 接入一个模型 Provider，先返回结构化 JSON；
5. 增加引用校验、限流、日志脱敏和错误码；
6. 改成 SSE 流式返回；
7. 用现有71个问题加上模型专用评测集做回归；
8. 最后再接图片理解、实时活动查询和语音能力。

## 九、来源

- [OpenAI Model guidance](https://developers.openai.com/api/docs/guides/latest-model)：Responses API、模型选择和多轮流程建议。
- [OpenAI Models](https://developers.openai.com/api/docs/models)：模型能力、Responses API、File Search 和函数调用能力说明。
- 项目内部：[H5智能体API契约建议](agent/h5_api_contract.md)、[英歌舞智能体系统提示词](agent/system_prompt.md)。
