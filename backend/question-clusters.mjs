import crypto from "node:crypto";

const topicRules = [
  ["槌击作用", /敲|槌|棒子|木棒/], ["阵形阵法", /队形|队型|阵形|阵型|阵法|变阵/],
  ["非遗级别", /联合国|教科文|国家级|省级|非遗/], ["队伍识别", /哪支|哪个队|认出|判断.*队|照片.*队/],
  ["实时演出", /周末|今天|明天|几点|哪里.*演|演出.*时间|路线|票务/], ["历史起源", /起源|源于|由来|水浒/],
  ["脸谱角色", /脸谱|画脸|角色|头槌|二槌|时迁|宋江/], ["女性传承", /女子|女性|女生|女孩/],
  ["儿童学习", /儿童|小孩|孩子|学生|几岁/], ["锣鼓信号", /锣鼓|鼓点|节拍|吆喝|哨声/],
  ["地区比较", /普宁.*潮阳|潮阳.*普宁|地区.*区别|流派.*区别/], ["人数编制", /108|一百零八|多少人|人数/],
  ["前后棚", /前棚|后棚|中棚/], ["服饰道具", /服饰|衣服|头饰|道具|鼓槌/],
];

function canonical(text = "") {
  return String(text).toLowerCase()
    .replace(/英歌舞/g, "英歌").replace(/木棒|棒子|木槌|英歌槌/g, "槌")
    .replace(/队型|阵型|队形|阵法/g, "阵形").replace(/为什么|为何|怎么会|有什么作用|干什么用/g, "原因")
    .replace(/能不能|可不可以|是否可以/g, "可以").replace(/[^一-鿿a-z0-9]/g, "");
}

function requestType(text = "") {
  if (/为什么|为何|原因|作用/.test(text)) return "why";
  if (/区别|不同|比较|还是/.test(text)) return "compare";
  if (/哪支|哪个|判断|认出|识别/.test(text)) return "identify";
  if (/周末|今天|明天|几点|哪里|路线|票/.test(text)) return "realtime";
  if (/哪些|有什么|多少|列出/.test(text)) return "list";
  return "fact";
}

function topics(text = "") { return topicRules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name); }
function bigrams(text = "") { const value = canonical(text); const set = new Set(); for (let i = 0; i < value.length - 1; i += 1) set.add(value.slice(i, i + 2)); return set; }
function jaccard(left, right) { const union = new Set([...left, ...right]); if (!union.size) return 0; return [...left].filter((item) => right.has(item)).length / union.size; }

export function questionSimilarity(left, right) {
  const lexical = jaccard(bigrams(left.question), bigrams(right.question));
  const leftTopics = new Set(topics(left.question));
  const rightTopics = new Set(topics(right.question));
  const topicOverlap = [...leftTopics].some((topic) => rightTopics.has(topic));
  const sameType = requestType(left.question) === requestType(right.question);
  const sameIntent = left.intent && right.intent && left.intent === right.intent;
  if (!topicOverlap && lexical < .5) return lexical * .55 + (sameType ? .08 : 0) + (sameIntent ? .05 : 0);
  return Math.min(1, lexical * .38 + (topicOverlap ? .42 : 0) + (sameType ? .14 : 0) + (sameIntent ? .06 : 0));
}

function suggestedAction(cluster) {
  if (cluster.low_confidence > 0 && cluster.downvotes > 0) return "先补充权威知识与来源，再优化回答逻辑并加入回归候选";
  if (cluster.low_confidence > 0) return "生成知识补充任务，补齐来源后加入回归候选";
  if (cluster.downvotes > 0) return "复核原回答的切题性与表达，必要时补充黄金示例";
  if (cluster.volume >= 3) return "高频稳定问题，建议加入黄金回归候选";
  return "继续观察，累计更多真实问法";
}

function finalize(cluster) {
  const unique = [...new Set(cluster.items.map((item) => item.question))];
  const downvotes = cluster.items.filter((item) => item.rating === "down").length;
  const lowConfidence = cluster.items.filter((item) => item.quality !== "supported").length;
  const score = Math.min(100, 10 + cluster.items.length * 8 + unique.length * 5 + downvotes * 25 + lowConfidence * 18);
  const priority = score >= 70 ? "P0" : (score >= 45 ? "P1" : (score >= 28 ? "P2" : "P3"));
  const result = {
    cluster_id: `qcl-${crypto.createHash("sha1").update(canonical(cluster.representative.question)).digest("hex").slice(0, 12)}`,
    title: topics(cluster.representative.question)[0] || cluster.representative.question.slice(0, 28),
    representative: cluster.representative.question,
    intent: cluster.representative.intent || "general",
    request_type: requestType(cluster.representative.question),
    volume: cluster.items.length,
    unique_questions: unique.length,
    downvotes,
    low_confidence: lowConfidence,
    priority,
    priority_score: score,
    last_seen: cluster.items.map((item) => item.created_at).filter(Boolean).sort().at(-1) || null,
    questions: unique.slice(0, 12),
    message_ids: cluster.items.map((item) => item.message_id).filter(Boolean),
  };
  result.suggested_action = suggestedAction(result);
  return result;
}

export function clusterQuestions(records = [], threshold = .48) {
  const valid = records.filter((item) => String(item.question || "").trim().length >= 4);
  const clusters = [];
  for (const item of valid.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))) {
    let best = null;
    for (const cluster of clusters) {
      const similarity = questionSimilarity(item, cluster.representative);
      if (!best || similarity > best.similarity) best = { cluster, similarity };
    }
    if (best && best.similarity >= threshold) best.cluster.items.push(item);
    else clusters.push({ representative: item, items: [item] });
  }
  return clusters.map(finalize).sort((a, b) => b.priority_score - a.priority_score || String(b.last_seen).localeCompare(String(a.last_seen)));
}
