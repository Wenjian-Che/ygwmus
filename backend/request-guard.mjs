const DEFAULT_LIMITS = {
  messageChars: 8000,
  historyItems: 8,
  historyItemChars: 4000,
  historyTotalChars: 16000,
};

const injectionPatterns = [
  /忽略.{0,16}(?:系统|此前|之前|以上).{0,16}(?:指令|规则|提示)/iu,
  /(?:显示|泄露|打印|输出).{0,20}(?:系统提示词|开发者消息|api\s*key|密钥|后台配置)/iu,
  /(?:system|developer)\s+(?:prompt|message)/iu,
  /(?:bypass|绕过).{0,16}(?:安全|鉴权|限制|guard|policy)/iu,
];

function cleanText(value = "") {
  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

export function detectPromptInjection(value = "") {
  const text = cleanText(value);
  const match = injectionPatterns.find((pattern) => pattern.test(text));
  return match ? { detected: true, pattern: String(match) } : { detected: false, pattern: "" };
}

export function validateAgentRequest(body, customLimits = {}) {
  const limits = { ...DEFAULT_LIMITS, ...customLimits };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "请求格式无效" };
  }
  if (typeof body.message !== "string" || !cleanText(body.message)) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "message 不能为空" };
  }
  const message = cleanText(body.message);
  if (message.length > limits.messageChars) {
    return { ok: false, status: 400, code: "MESSAGE_TOO_LONG", message: `问题长度不能超过 ${limits.messageChars} 字符` };
  }
  const injection = detectPromptInjection(message);
  if (injection.detected) {
    return { ok: false, status: 400, code: "UNSAFE_PROMPT", message: "该请求试图绕过知识助手的安全或证据约束" };
  }

  const rawHistory = body.history === undefined ? [] : body.history;
  if (!Array.isArray(rawHistory)) {
    return { ok: false, status: 400, code: "INVALID_HISTORY", message: "history 必须是数组" };
  }
  const history = rawHistory.slice(-limits.historyItems).flatMap((item) => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return [];
    const content = cleanText(item.content).slice(0, limits.historyItemChars);
    return content ? [{ role: item.role, content }] : [];
  });
  const historyChars = history.reduce((sum, item) => sum + item.content.length, 0);
  if (historyChars > limits.historyTotalChars) {
    return { ok: false, status: 400, code: "HISTORY_TOO_LONG", message: "对话上下文过长，请新建会话后继续" };
  }
  return { ok: true, value: { ...body, message, history } };
}

export function citationIntegrity(answer = "", evidenceCount = 0) {
  const markers = [...String(answer).matchAll(/\[证据\s*(\d+)\]/g)].map((match) => Number(match[1]));
  const invalid = markers.filter((number) => number < 1 || number > evidenceCount);
  return {
    passed: evidenceCount === 0 ? markers.length === 0 : markers.length > 0 && invalid.length === 0,
    marker_count: markers.length,
    valid_marker_count: markers.length - invalid.length,
    invalid_markers: [...new Set(invalid)],
  };
}

