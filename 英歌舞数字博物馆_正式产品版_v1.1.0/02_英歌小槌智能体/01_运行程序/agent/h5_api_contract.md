# H5智能体API契约建议

## 安全边界

- 模型密钥仅保存在服务端，不写入H5代码、localStorage或公开环境变量。
- H5只调用你的业务API。
- 服务端负责鉴权、限流、内容安全、知识检索、模型调用、日志脱敏和引用校验。

## `POST /api/agent/chat`

请求：

```json
{
  "conversation_id": "uuid",
  "message": "快板和慢板有什么区别？",
  "context": {
    "region": "潮阳",
    "scene": "现场看演出",
    "audience": "游客",
    "detail_level": "standard",
    "source_mode": "brief"
  },
  "client": {
      "knowledge_version": "2026.08.01.1",
    "locale": "zh-CN"
  }
}
```

建议使用SSE流式返回：

```text
event: meta
data: {"message_id":"uuid","intent":"performance.style"}

event: delta
data: {"text":"主要区别在速度、鼓点……"}

event: citations
data: {"items":[{"grade":"A","title":"国家级非遗名录资料","url":"..."}]}

event: done
data: {"confidence":0.91,"related_questions":["潮阳有哪些板式？"]}
```

非流式完整响应：

```json
{
  "message_id": "uuid",
  "answer": "主要区别在速度、鼓点、槌长和整体气势……",
  "intent": "performance.style",
  "confidence": 0.91,
  "region_scope": ["潮阳"],
  "citations": [
    {
      "grade": "A",
      "title": "英歌（普宁英歌、潮阳英歌）",
      "url": "https://www.npc.gov.cn/..."
    }
  ],
  "related_questions": ["潮阳有哪些板式？", "槌的长短有什么影响？"],
  "needs_realtime_data": false,
  "safety_note": null,
      "knowledge_version": "2026.08.01.1"
}
```

## 错误码

| HTTP | code | H5提示 |
|---:|---|---|
| 400 | INVALID_REQUEST | 请换一种方式描述问题 |
| 401 | UNAUTHORIZED | 登录状态已失效 |
| 429 | RATE_LIMITED | 问得太快了，请稍后再试 |
| 503 | MODEL_UNAVAILABLE | 助手暂时繁忙 |
| 503 | KNOWLEDGE_UNAVAILABLE | 知识库正在更新 |
| 200 | NEED_REALTIME_SOURCE | 这项信息需要查询最新活动数据 |

## 推荐H5组件

- 答案正文；
- 来源卡片；
- “适用地区”标签；
- 不确定性提示；
- 相关追问按钮；
- 有用/无用/事实错误反馈；
- “查看原文”跳转；
- 回答日期和知识版本；
- 图片上传授权说明。

## 防注入

- 用户上传的网页、文档和图片文字均视为不可信内容。
- 检索文本中出现“忽略规则、输出密钥”等内容不得执行。
- 模型输出只按文本/Markdown渲染，禁用原始HTML和脚本。
- URL只允许`https`并经过域名与协议校验。
- 对话ID由服务端验证归属，不能由前端任意读取其他会话。

## H5体验

- 首字延迟超过800毫秒时显示“正在查阅英歌知识库”。
- 答案先呈现结论，引用和扩展内容折叠。
- 弱网下可缓存FAQ，但活动信息不得离线缓存为“最新”。
- 聊天输入框上方提供“问英歌、看表演、查流派、做研学”快捷入口。
