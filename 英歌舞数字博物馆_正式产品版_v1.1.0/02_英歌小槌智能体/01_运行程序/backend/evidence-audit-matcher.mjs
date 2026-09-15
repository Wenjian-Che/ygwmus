import { buildEvidenceAudit, normalizeClaim } from "./evidence-audit.mjs";

const NEGATION_RE = /不|没|未|无|并非|不是|不能|不可|不应|避免|尚未|暂无|没有|未能/;
const TOPIC_RE = /英歌|潮阳|潮南|普宁|甲子|汕头|汕尾|揭阳|惠来|神泉|西门|后溪|桃园|岭东|金浦|英歌槌|槌|锣|鼓|脸谱|阵形|队形|前棚|后棚|传承|非遗|角色|动作|节拍|巡游|演出|文化|队伍|舞者|步法|板式|保护单位|传承人/;
const INFERENCE_RE = /可能|或许|往往|通常|可以理解为|可视为|这意味着|这说明|因此|所以|推测|推断|大致|倾向于|有助于|让观众感到|看起来/;
const REALTIME_RE = /今天|明天|现在|当前|近期|最新|动态|活动|演出|展演|日程|几点|在哪里|何时/;
const IDENTITY_RE = /代表性传承人|传承人|保护单位|队长|教练|教头|头槌|二槌|司鼓|领舞|角色|人物|属于|是.+队/;
const DATE_RE = /(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?|\d{4}[年./-]\d{1,2}(?:[月./-]\d{1,2})?|第[一二三四五六七八九十百]+批/;
const NUMBER_RE = /\d+(?:\.\d+)?\s*(?:人|支|名|个|套|拍|步|年|月|日|米|分钟|秒|种|类|项|次|号)?|[一二三四五六七八九十百]+(?:人|支|名|个|套|拍|步|年|月|日|种|类|项|次|号)/;
const COMPARE_RE = /区别|不同|相比|比较|差异|分别|不能一概而论/;
const MECHANISM_RE = /因为|原因|作用|用于|承担|通过|配合|组织|形成|带来|影响|帮助|提示|标记|转换|控制|体现|表现为|依靠|可以|能够|让.+感受/;
const HIGH_ANCHOR_RE = /全国统一|统一标准|所有队伍|一定是|固定是|必须是|正宗|唯一|代表性传承人|国家级|省级|市级|县级|列入|入选/;
const EVIDENCE_ANCHORS = [
  "英歌槌", "槌击", "锣鼓", "时间标记", "节拍", "节奏", "队形转换", "阵形", "前棚", "后棚",
  "全国统一", "统一标准", "所有队伍", "代表性传承人", "保护单位", "国家级", "第六批", "第五批",
  "潮阳", "潮南", "普宁", "甲子", "汕头", "汕尾", "英歌",
];

function normalize(text = "") {
  return String(text).toLowerCase().replace(/[^\u4e00-\u9fff\w]/g, "");
}

function cjkTerms(text = "") {
  const value = normalize(text);
  const result = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (/^[\u4e00-\u9fff]$/.test(char)) result.add(char);
    if (index < value.length - 1) result.add(value.slice(index, index + 2));
  }
  return result;
}

export function tokenizeClaimText(text = "") {
  const raw = String(text);
  const tokens = cjkTerms(raw);
  for (const word of raw.match(/[A-Za-z][A-Za-z0-9_-]{1,40}|\d+(?:\.\d+)?/g) || []) tokens.add(word.toLowerCase());
  return tokens;
}

export function extractClaimEntities(text = "") {
  const value = String(text);
  const entities = new Set();
  const known = [
    "英歌", "潮阳", "潮南", "普宁", "甲子", "汕头", "汕尾", "揭阳", "惠来", "神泉", "西门", "后溪", "桃园", "岭东", "金浦",
    "英歌槌", "前棚", "后棚", "头槌", "二槌", "司鼓", "脸谱", "阵形", "队形", "锣鼓", "节拍", "非遗", "传承人", "保护单位",
    "全国统一", "统一标准", "所有队伍", "正宗",
  ];
  known.filter((item) => value.includes(item)).forEach((item) => entities.add(item));
  for (const match of value.matchAll(/(?:19|20)\d{2}年(?:\d{1,2}月(?:\d{1,2}日)?)?|第[一二三四五六七八九十百]+批|\d+(?:\.\d+)?(?:人|支|名|个|拍|步|年|月|日|米|分钟|秒|种|类|项|次|号)?/g)) entities.add(match[0]);
  return entities;
}

function hasFactMarker(sentence, context = "") {
  const hasTopic = TOPIC_RE.test(sentence) || (TOPIC_RE.test(context) && MECHANISM_RE.test(sentence));
  return hasTopic && (
    /[是为有在于从由将会能可应需不得不能并非没有未曾]/.test(sentence)
    || MECHANISM_RE.test(sentence)
    || DATE_RE.test(sentence)
    || NUMBER_RE.test(sentence)
    || COMPARE_RE.test(sentence)
  );
}

function isTransitionOnly(sentence) {
  return /^(?:因此|所以|总之|综上|换句话说|也就是说|接下来|下面|具体来说|例如|需要注意的是|再者|此外)[，,:：、\s]*$/u.test(sentence);
}

function cleanSentence(sentence) {
  return String(sentence)
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)、]\s*)/, "")
    .replace(/^\s*(?:直接回答|直接结论|答案是)[:：]?\s*/u, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitAnswerSentences(answer = "", context = "") {
  const source = String(answer)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\|[^\n]*\|/g, "")
    .replace(/\r/g, "");
  const pieces = [];
  for (const line of source.split("\n")) {
    const cleanLine = cleanSentence(line);
    if (!cleanLine) continue;
    const sentences = cleanLine.split(/(?<=[。！？!?；;])/u).map(cleanSentence).filter(Boolean);
    pieces.push(...sentences);
  }
  return pieces.filter((sentence) => {
    if (sentence.length < 8 || isTransitionOnly(sentence)) return false;
    if (/[？?]$/.test(sentence)) return false;
    if (/^[？?！!。；;，,、:：]+$/.test(sentence)) return false;
    if (/^(?:你可以|请提供|如果你|需要我|想了解|是否需要|要不要)/.test(sentence) && !hasFactMarker(sentence, context)) return false;
    return hasFactMarker(sentence, context);
  });
}

function isNegative(text) {
  return NEGATION_RE.test(String(text));
}

export function classifyClaimText(text = "", options = {}) {
  const sentence = String(text).trim();
  const question = String(options.question || "");
  let claimType = "fact";
  if (INFERENCE_RE.test(sentence)) claimType = "inference";
  else if (REALTIME_RE.test(sentence)) claimType = "realtime";
  else if (COMPARE_RE.test(sentence)) claimType = "comparison";
  else if (IDENTITY_RE.test(sentence)) claimType = "identity";
  else if (DATE_RE.test(sentence)) claimType = "date";
  else if (NUMBER_RE.test(sentence)) claimType = "number";
  else if (MECHANISM_RE.test(sentence)) claimType = "mechanism";
  else if (/为什么|为何|作用|原因/.test(question)) claimType = "mechanism";

  let riskLevel = "low";
  if (claimType === "inference") riskLevel = "low";
  else if (HIGH_ANCHOR_RE.test(sentence)) riskLevel = /代表性传承人|国家级|省级|市级|县级/.test(sentence) ? "critical" : "high";
  else if (["identity", "date", "number", "realtime"].includes(claimType)) riskLevel = "high";
  else if (["mechanism", "comparison"].includes(claimType) || /地区|队伍|流派|板式/.test(sentence)) riskLevel = "medium";

  return { text: sentence, claim_type: claimType, risk_level: riskLevel, negated: isNegative(sentence) };
}

export function answerToClaims(answer = "", options = {}) {
  return splitAnswerSentences(answer, options.question).map((sentence, index) => {
    const classified = classifyClaimText(sentence, options);
    return {
      claim_id: `claim-${String(index + 1).padStart(3, "0")}`,
      text: classified.text,
      claim_type: classified.claim_type,
      risk_level: classified.risk_level,
      evidence_refs: [],
      status: "unsupported",
      negated: classified.negated,
      sentence_index: index,
    };
  });
}

function gradeScore(grade) {
  return ({ A: 1, B: .8, C: .55, D: .3 })[String(grade || "").toUpperCase()] || 0;
}

function sourceRows(chunk, sourceRegistry = {}) {
  const sources = sourceRegistry.sources || {};
  const ids = Array.isArray(chunk.source_ids) && chunk.source_ids.length
    ? chunk.source_ids
    : (sourceRegistry.file_map?.[chunk.source_file] || []);
  const rows = ids.map((sourceId) => ({ source_id: sourceId, ...(sources[sourceId] || {}) })).filter((row) => row.source_id && row.url);
  if (rows.length) return rows.sort((a, b) => gradeScore(b.grade) - gradeScore(a.grade));
  if (chunk.source_id || chunk.url) return [{ source_id: chunk.source_id || `file:${chunk.source_file}`, grade: chunk.grade || "B", url: chunk.url || "" }];
  return [];
}

function quoteFor(chunk, claimTerms) {
  const content = String(chunk.content || "").replace(/[ \t]+/g, " ").replace(/\r/g, "").trim();
  if (content.length <= 1000) return content;
  for (const term of [...claimTerms].sort((a, b) => b.length - a.length)) {
    const index = content.indexOf(term);
    if (index >= 0) return content.slice(Math.max(0, index - 180), Math.min(content.length, index + 820));
  }
  return content.slice(0, 1000);
}

function comparisonExcerpt(chunk, claimTerms, claimText = "") {
  const content = String(chunk.content || "").replace(/[ \t]+/g, " ").replace(/\r/g, "").trim();
  if (!content) return "";
  const sentences = content
    .split(/\r?\n|\|/u)
    .flatMap((line) => line.split(/(?<=[。！？!?；;])/u))
    .map((item) => item.replace(/^【[^】]+】\s*/u, "").trim())
    .filter((item) => item && !/^[-—:：\s]+$/u.test(item));
  if (sentences.length <= 1) return quoteFor(chunk, claimTerms);
  const anchors = EVIDENCE_ANCHORS.filter((anchor) => String(claimText).includes(anchor));
  const ranked = sentences.map((sentence) => {
    const tokens = tokenizeClaimText(sentence);
    const overlap = [...claimTerms].filter((term) => tokens.has(term)).length;
    const anchor_overlap = anchors.filter((anchor) => sentence.includes(anchor)).length;
    return { sentence, overlap, anchor_overlap };
  }).sort((a, b) => b.anchor_overlap - a.anchor_overlap || b.overlap - a.overlap);
  const selected = ranked.filter((item) => item.overlap > 0).slice(0, 1).map((item) => item.sentence);
  return (selected.length ? selected[0] : ranked[0].sentence).slice(0, 1200);
}

function polarityMismatch(claimText, evidenceText, termOverlap) {
  if (termOverlap < .22) return false;
  const claimNegative = isNegative(claimText);
  const evidenceNegative = isNegative(evidenceText);
  if (claimNegative === evidenceNegative) return false;
  const anchored = /统一|所有|固定|一定|必须|正宗|标准|不能|不可|并非|不是|没有|未/.test(`${claimText}${evidenceText}`);
  return anchored;
}

function factualValueMismatch(claimText, evidenceText, termOverlap) {
  if (termOverlap < .16) return false;
  const claimValues = [...String(claimText).matchAll(/(?:19|20)\d{2}年|第[一二三四五六七八九十百]+批|\d+(?:\.\d+)?(?:人|支|名|个|拍|步|年|月|日|米|分钟|秒|种|类|项|次|号)?/g)].map((match) => match[0]);
  const evidenceValues = [...String(evidenceText).matchAll(/(?:19|20)\d{2}年|第[一二三四五六七八九十百]+批|\d+(?:\.\d+)?(?:人|支|名|个|拍|步|年|月|日|米|分钟|秒|种|类|项|次|号)?/g)].map((match) => match[0]);
  if (!claimValues.length || !evidenceValues.length) return false;
  return claimValues.some((value) => !evidenceValues.includes(value));
}

function candidateScore(claim, chunk, sourceRegistry) {
  const claimTerms = tokenizeClaimText(claim.text);
  const evidenceText = `${chunk.title || ""} ${(chunk.heading_path || []).join(" ")} ${chunk.content || ""}`;
  const comparisonText = comparisonExcerpt(chunk, claimTerms, claim.text);
  const evidenceTerms = tokenizeClaimText(evidenceText);
  const overlapTerms = [...claimTerms].filter((term) => evidenceTerms.has(term));
  const termOverlap = overlapTerms.length / Math.max(1, claimTerms.size);
  const claimEntities = extractClaimEntities(claim.text);
  const evidenceEntities = extractClaimEntities(evidenceText);
  const overlapEntities = [...claimEntities].filter((term) => evidenceEntities.has(term));
  const entityOverlap = claimEntities.size ? overlapEntities.length / claimEntities.size : 0;
  const sources = sourceRows(chunk, sourceRegistry);
  const source = sources[0] || { source_id: `file:${chunk.source_file || "unknown"}`, grade: "D", url: "" };
  const mismatch = polarityMismatch(claim.text, comparisonText, termOverlap) || factualValueMismatch(claim.text, comparisonText, termOverlap);
  const lexicalScore = termOverlap * .55 + entityOverlap * .3 + gradeScore(source.grade) * .15;
  let support = "none";
  if (mismatch && lexicalScore >= .2) support = "conflict";
  else if (termOverlap >= .45 || (entityOverlap >= .75 && termOverlap >= .16)) support = "direct";
  else if (termOverlap >= .22 || (entityOverlap >= .5 && termOverlap >= .1)) support = "partial";
  return {
    score: Number(lexicalScore.toFixed(4)),
    term_overlap: Number(termOverlap.toFixed(4)),
    entity_overlap: Number(entityOverlap.toFixed(4)),
    support,
    source,
    chunk,
    claim_terms: overlapTerms,
    claim_entities: overlapEntities,
  };
}

export function matchClaimEvidence(claim, options = {}) {
  const normalizedClaim = normalizeClaim(claim);
  const limit = Math.max(1, Math.min(12, Number(options.limit) || 6));
  const retrieve = typeof options.retrieve === "function"
    ? options.retrieve
    : ((query, count) => (Array.isArray(options.chunks) ? options.chunks.slice(0, count) : []));
  const candidates = (retrieve(normalizedClaim.text, limit) || [])
    .filter((chunk) => chunk && typeof chunk === "object")
    .map((chunk) => candidateScore(normalizedClaim, chunk, options.sourceRegistry || {}))
    .sort((a, b) => b.score - a.score || String(a.chunk.id || "").localeCompare(String(b.chunk.id || "")));

  const selected = candidates.filter((item) => item.support !== "none").slice(0, limit);
  const evidenceRefs = [];
  for (const item of selected) {
    const ref = {
      chunk_id: String(item.chunk.id || `chunk-${evidenceRefs.length + 1}`),
      source_file: String(item.chunk.source_file || ""),
      source_id: String(item.source.source_id || ""),
      quote: quoteFor(item.chunk, new Set(item.claim_terms)),
      grade: String(item.source.grade || "B").toUpperCase(),
      url: String(item.source.url || ""),
      support: item.support,
    };
    if (ref.source_file && ref.source_id && ref.quote && ref.url) evidenceRefs.push(ref);
  }
  const directCount = evidenceRefs.filter((item) => item.support === "direct").length;
  const conflictCount = evidenceRefs.filter((item) => item.support === "conflict").length;
  const partialCount = evidenceRefs.filter((item) => item.support === "partial").length;
  let status = "unsupported";
  if (directCount && conflictCount) status = "conflicted";
  else if (directCount) status = "supported";
  else if (partialCount && !["high", "critical"].includes(normalizedClaim.risk_level)) status = "partial";
  return {
    claim: { ...normalizedClaim, evidence_refs: evidenceRefs, status },
    candidates: candidates.slice(0, limit).map((item) => ({
      chunk_id: item.chunk.id || null,
      source_file: item.chunk.source_file || "",
      score: item.score,
      term_overlap: item.term_overlap,
      entity_overlap: item.entity_overlap,
      support: item.support,
      source_id: item.source.source_id || null,
    })),
    diagnostics: { direct_count: directCount, partial_count: partialCount, conflict_count: conflictCount, candidate_count: candidates.length },
  };
}

export function auditAnswerEvidence(input = {}) {
  const baseClaims = answerToClaims(input.answer, { question: input.question });
  const matched = baseClaims.map((claim) => matchClaimEvidence(claim, input));
  const audit = buildEvidenceAudit({
    audit_id: input.audit_id,
    message_id: input.message_id,
    question: input.question,
    answer: input.answer,
    generated_at: input.generated_at,
    claims: matched.map((item) => item.claim),
  });
  return {
    ...audit,
    diagnostics: matched.map((item) => ({ claim_id: item.claim.claim_id, ...item.diagnostics, candidates: item.candidates })),
  };
}
