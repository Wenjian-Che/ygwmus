const domainTerms = /英歌|潮汕|潮阳|普宁|潮南|脸谱|头槌|双槌|英歌槌|槌法|木棒|木棍|敲槌|锣鼓|鼓点|司鼓|吆喝|阵形|队形|步法|板式|前棚|后棚|非遗|传承|巡游|表演|角色|梁山|水浒/u;
const identityTerms = /^(?:你好|嗨|hi|hello)?[，,！!？?\s]*(?:小槌[，,！!？?\s]*){0,2}(?:你是哪个(?:智能体|助手|机器人|ai)?|你是(?:谁|什么)(?:智能体|助手|机器人|ai)?|你叫什么|你叫(?:什么|啥)|你(?:今年)?多大(?:了)?|你(?:今年)?几岁(?:了)?|你的年龄(?:是多大)?)[，,！!？?\s]*$/iu;
const capabilityTerms = /(?:你能(?:做什么|干什么|帮(?:我)?什么)|你会(?:做什么|什么|哪些)|可以(?:问|帮).*(?:什么|哪些)|你是(?:只|只能|主要|专门).*(?:回答|答|处理).*(?:问题|吗))/u;
const greetingTerms = /^(?:你好|嗨|hi|hello|在吗|早上好|下午好|晚上好)[，,！!？?\s]*$/iu;
const fillerTerms = new Set(["什么", "怎么", "如何", "为何", "为什", "什么", "请问", "一下", "可以", "知道", "这个", "那个", "哪个", "你是", "智能", "能体", "英歌", "歌舞", "的吗", "吗", "呢"]);

function bigrams(value = "") {
  const text = String(value).replace(/[^\u4e00-\u9fff]/gu, "");
  const result = [];
  for (let index = 0; index < text.length - 1; index += 1) result.push(text.slice(index, index + 2));
  return [...new Set(result)];
}

function namedTeamAnchors(value = "") {
  return [...String(value || "").matchAll(/([\u4e00-\u9fff]{2,12}英歌队)/gu)]
    .map((match) => match[1])
    .filter((name) => name !== "英歌队");
}

export function classifyAgentScope(question = "", history = []) {
  const text = String(question || "").trim();
  if (identityTerms.test(text)) return { kind: "identity" };
  if (capabilityTerms.test(text)) return { kind: "capability" };
  if (greetingTerms.test(text)) return { kind: "greeting" };
  const recentContext = (history || [])
    .slice(-4)
    .filter((item) => item?.role === "user")
    .map((item) => String(item?.content || ""))
    .join("\n");
  if (!domainTerms.test(`${text}\n${recentContext}`)) return { kind: "general" };
  return { kind: "knowledge" };
}

export function assessQuestionGrounding({ question = "", evidence = [], hasKnownAnswer = false } = {}) {
  if (hasKnownAnswer) return { grounded: true, matched_terms: ["known-answer"] };
  const text = String(question || "");
  if (/(?:什么是英歌|英歌是什么|英歌舞是什么)/u.test(text)) return { grounded: true, matched_terms: ["英歌"] };
  const evidenceText = (evidence || []).map((item) => String(item?.content || "")).join("\n");
  const teamAnchors = namedTeamAnchors(text);
  const missingTeamAnchors = teamAnchors.filter((anchor) => !evidenceText.includes(anchor));
  if (missingTeamAnchors.length) return { grounded: false, matched_terms: [], missing_specific_anchors: missingTeamAnchors };
  const discriminative = bigrams(text).filter((term) => !fillerTerms.has(term));
  if (!discriminative.length) return { grounded: Boolean(domainTerms.test(text) && evidenceText), matched_terms: [] };
  const matched_terms = discriminative.filter((term) => evidenceText.includes(term));
  return { grounded: matched_terms.length > 0, matched_terms };
}

export function scopedAgentReply(scope = {}, question = "") {
  if (scope.kind === "identity") {
    if (/(?:多大|几岁|年龄)/u.test(question)) return "我今年18岁呀。叫我英歌小槌就好，你今天想聊点什么？";
    return "我是“英歌小槌”，英歌舞数字博物馆里的数字文化伙伴。我最熟悉英歌舞，也愿意陪你聊常识、学习和生活中的简单问题。";
  }
  if (scope.kind === "capability") {
    return "我最擅长英歌舞文化，可以陪你看懂动作、锣鼓、队形、角色与地方传承；日常常识、学习交流和简单生活问题也可以问我。涉及实时消息、专业结论或具体文化事实时，我会提醒你核验来源。";
  }
  if (scope.kind === "greeting") {
    return "你好呀，我是英歌小槌。英歌舞、日常常识，或者你今天想聊的事，都可以问我。";
  }
  return `我暂时没有查到足以回答“${String(question || "这个问题").slice(0, 80)}”的馆内资料，不能据相邻资料推断。你可以补充具体队伍、地区、时间或画面线索中的一项，我会按更明确的线索继续检索。`;
}
