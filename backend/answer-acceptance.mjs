const internalLead = /^\s*(?:#{1,4}\s*)?(?:直接回答|直接结论|结论先说|答案是)[:：]?/;
const boundaryWords = /具体队伍|具体人物|具体活动|不同队伍|不同地区|地区差异|地方标准|历史活动|并非统一|不能一概而论|以当地|以该队|个案|待核验|资料不足|尚不能确认|可能存在差异/;

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "").split(/[，,；;\n]/).map((item) => item.trim()).filter(Boolean);
}

function questionKind(question = "") {
  if (/为什么|为何|为啥|有什么作用|作用是什么|原因/.test(question)) return "why";
  if (/区别|不同|比较|差异|哪个好/.test(question)) return "compare";
  if (/怎么|如何|怎样|步骤|方法/.test(question)) return "how";
  if (/谁|哪位|哪个人|领喊|领舞/.test(question)) return "identity";
  if (/今天|明天|最近|近期|几点|哪里演|演出/.test(question)) return "realtime";
  return "fact";
}

function openingMatches(question, opening) {
  const kind = questionKind(question);
  if (kind === "why") return /因为|原因|作用|主要|并不只是|不是为了|是为了/.test(opening);
  if (kind === "compare") return /区别|不同|相比|分别|主要差异/.test(opening);
  if (kind === "how") return /先|可以|需要|步骤|应当|方法/.test(opening);
  if (kind === "identity") return /是|无法确认|不能确认|公开资料|具体/.test(opening);
  if (kind === "realtime") return /日期|时间|目前|最新|公告|无法确认/.test(opening);
  return opening.length >= 20;
}

function check(key, label, pass, detail, blocking = true) { return { key, label, pass: Boolean(pass), detail, blocking }; }

function hasUnnegatedPhrase(text, phrase) {
  let start = 0;
  while (start < text.length) {
    const index = text.indexOf(phrase, start);
    if (index < 0) return false;
    const prefix = text.slice(Math.max(0, index - 36), index);
    const clause = prefix.split(/[，,。；;！!？?\n]/).at(-1) || "";
    if (!/(?:不|不是|并非|不能|不可|没有|并没有|不存在|避免|切勿|禁止|并不)/.test(clause)) return true;
    start = index + phrase.length;
  }
  return false;
}

export function evaluateAnswerCandidate(input = {}, options = {}) {
  const question = String(input.question || "").trim();
  const answer = String(input.answer || "").trim();
  const aliases = normalizeList(input.aliases);
  const directTerms = normalizeList(input.direct_terms);
  const mustTerms = normalizeList(input.must_terms);
  const forbiddenTerms = normalizeList(input.forbidden_terms);
  const sourceFiles = [...new Set(normalizeList(input.source_files))];
  const opening = answer.split(/\n\s*\n|\n/)[0]?.slice(0, 220) || "";
  const missingMust = mustTerms.filter((term) => !answer.includes(term));
  const forbiddenHits = forbiddenTerms.filter((term) => hasUnnegatedPhrase(answer, term));
  const missingSources = sourceFiles.filter((file) => options.sourceExists && !options.sourceExists(file));
  const requireBoundary = input.require_boundary !== false;
  const checks = [
    check("answer_depth", "答案深度", answer.length >= 80 && answer.length <= 2200, `${answer.length} 字，要求 80—2200 字`),
    check("focused_opening", "首段切题", openingMatches(question, opening), "第一段应直接回应问题类型"),
    check("clean_lead", "用户化表达", !internalLead.test(answer), "不得出现“直接回答/直接结论”等内部标签"),
    check("aliases", "真实问法覆盖", aliases.length >= 2, `${aliases.length} 条别名，至少需要 2 条`),
    check("direct_terms", "开头切题词", directTerms.length > 0 && directTerms.some((term) => opening.includes(term)), directTerms.length ? `首段需命中：${directTerms.join("、")}` : "尚未设置开头切题词"),
    check("must_terms", "关键事实覆盖", mustTerms.length > 0 && missingMust.length === 0, missingMust.length ? `缺少：${missingMust.join("、")}` : mustTerms.length ? `已覆盖 ${mustTerms.length} 项` : "尚未设置关键事实词"),
    check("forbidden_terms", "错误表述规避", forbiddenHits.length === 0, forbiddenHits.length ? `命中：${forbiddenHits.join("、")}` : "未命中禁止表述"),
    check("sources", "知识来源文件", sourceFiles.length > 0 && missingSources.length === 0, missingSources.length ? `文件不存在：${missingSources.join("、")}` : `${sourceFiles.length} 个来源文件`),
    check("boundary", "适用边界", !requireBoundary || boundaryWords.test(answer), requireBoundary ? "需明确地区、队伍、个案或待核验边界" : "该题不强制边界"),
  ];
  const blocking = checks.filter((item) => item.blocking);
  const passedCount = blocking.filter((item) => item.pass).length;
  return {
    passed: blocking.every((item) => item.pass),
    score: Math.round((passedCount / Math.max(1, blocking.length)) * 100),
    checks, missing_must_terms: missingMust, forbidden_hits: forbiddenHits, missing_sources: missingSources,
    normalized: { aliases, direct_terms: directTerms, must_terms: mustTerms, forbidden_terms: forbiddenTerms, source_files: sourceFiles },
  };
}
