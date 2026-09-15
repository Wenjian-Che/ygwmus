const boundaryPattern = /具体队伍|不同队伍|地区差异|并非统一|不能一概而论|以当地|以该队|个案|待核验|资料不足|尚不能确认/;
const forbiddenLeadPattern = /^\s*(?:#{1,4}\s*)?(?:直接回答|直接结论|结论先说|答案是)[:：]?/;

function questionKind(question = "") {
  if (/为什么|为何|为啥|有什么作用|作用是什么|原因/.test(question)) return "why";
  if (/区别|不同|比较|差异|哪个好/.test(question)) return "compare";
  if (/怎么|如何|怎样|步骤|方法/.test(question)) return "how";
  if (/谁|哪位|哪个人|领喊|领舞/.test(question)) return "identity";
  if (/今天|明天|最近|近期|几点|哪里演|演出/.test(question)) return "realtime";
  return "fact";
}

function outlineFor(kind) {
  const outlines = {
    why: ["第一段用一句话回答核心原因", "分点解释作用机制", "说明地区或队伍差异", "列出可核验来源"],
    compare: ["第一段概括最关键差异", "按地区、形制或功能逐项比较", "说明不能互相替代的边界", "列出对应来源"],
    how: ["第一段说明可执行路径", "按顺序列出步骤", "补充安全和适用条件", "标注来源与待确认项"],
    identity: ["先说明公开资料能否确认", "区分角色、姓名与具体队伍", "给出核验路径", "避免凭脸谱或服饰猜人"],
    realtime: ["先说明当前能否确认活动", "给出日期、地点和主办方", "区分历史报道与实时通知", "提醒以官方最新公告为准"],
    fact: ["第一段直接回答事实", "补充必要背景与机制", "说明适用范围", "逐项标注来源"],
  };
  return outlines[kind] || outlines.fact;
}

function addFinding(findings, severity, key, title, detail, action) {
  findings.push({ severity, key, title, detail, action });
}

export function diagnoseInteraction(item = {}) {
  const question = String(item.question || "").trim();
  const answer = String(item.answer || "").trim();
  const kind = questionKind(question);
  const findings = [];
  const reasons = Array.isArray(item.feedback_reasons) ? item.feedback_reasons : [];
  const citationCount = Number(item.citation_count || 0);
  const lowConfidence = item.quality && item.quality !== "supported";

  if (item.rating === "down") addFinding(findings, "critical", "downvote", "用户明确点踩", reasons.length ? `用户选择：${reasons.join("、")}` : "用户没有填写具体原因。", "优先重写，不要只做措辞润色");
  for (const reason of reasons) addFinding(findings, "critical", `reason-${reason}`, reason, "这是用户主动标记的问题。", "修订稿必须逐项消除该问题");
  if (lowConfidence) addFinding(findings, "critical", "evidence-quality", "证据等级不足", `当前证据等级为 ${item.quality}。`, "先补证据或明确说明未知范围");
  if (!citationCount) addFinding(findings, "critical", "citations", "没有可核验来源", "回答没有关联知识来源。", "生成知识任务，补齐来源后再进入黄金集");
  else if (citationCount < 2) addFinding(findings, "warning", "citations", "来源覆盖偏薄", `当前只有 ${citationCount} 个来源。`, "涉及比较、人物或历史判断时至少交叉核验");
  if (answer.length < 120) addFinding(findings, "warning", "depth", "解释深度不足", `原回答只有 ${answer.length} 字。`, "补充机制、例子和适用边界，避免只给感受性概括");
  if (forbiddenLeadPattern.test(answer)) addFinding(findings, "warning", "lead-label", "开头含内部式标签", "“直接回答/直接结论”等字样不应展示给用户。", "删除标签，直接陈述答案");

  const firstParagraph = answer.split(/\n\s*\n|\n/)[0] || "";
  const focusOk = kind === "why" ? /因为|原因|作用|主要|并不只是|不是为了/.test(firstParagraph)
    : kind === "compare" ? /区别|不同|相比|分别|主要差异/.test(firstParagraph)
      : kind === "how" ? /先|可以|需要|步骤|应当|方法/.test(firstParagraph)
        : kind === "identity" ? /是|无法确认|不能确认|公开资料|具体/.test(firstParagraph)
          : kind === "realtime" ? /日期|时间|目前|最新|公告|无法确认/.test(firstParagraph)
            : firstParagraph.length >= 20;
  if (!focusOk) addFinding(findings, "warning", "focus", "开头没有正面回答题型", `这是一道“${kind}”型问题，但首段没有给出对应结论。`, "按问题类型重写第一段，再补背景");

  if (/全国统一|所有英歌|都要|一定要|固定是|必须是|一律|统一标准|正宗/.test(answer) && !boundaryPattern.test(answer)) {
    addFinding(findings, "critical", "boundary", "存在过度泛化风险", "回答使用了统一、固定或绝对化表述，却没有交代队伍与地区边界。", "改为有来源支持的范围表达，并指出可能存在差异");
  }

  if (!findings.length) addFinding(findings, "info", "polish", "回答基础质量正常", "没有发现明显结构性缺陷。", "人工核实关键事实与来源后，可考虑加入黄金集");
  const weights = { critical: 28, warning: 12, info: 2 };
  const riskScore = Math.min(100, findings.reduce((sum, itemFinding) => sum + weights[itemFinding.severity], 0));
  return {
    message_id: String(item.message_id || ""), app_id: item.app_id || "yingge-h5", question, original_answer: answer,
    intent: item.intent || "general", quality: item.quality || "unknown", rating: item.rating || null,
    feedback_reasons: reasons, citation_count: citationCount, citation_files: item.citation_files || [],
    created_at: item.created_at || null, kind, risk_score: riskScore,
    priority: riskScore >= 70 ? "P0" : riskScore >= 45 ? "P1" : riskScore >= 25 ? "P2" : "P3",
    findings, suggested_outline: outlineFor(kind), needs_knowledge: lowConfidence || citationCount === 0,
  };
}

export function buildRevisionQueue(items = []) {
  const proposals = items.map(diagnoseInteraction).sort((a, b) => b.risk_score - a.risk_score || String(b.created_at).localeCompare(String(a.created_at)));
  return {
    generated_at: new Date().toISOString(), count: proposals.length,
    priority_counts: Object.fromEntries(["P0", "P1", "P2", "P3"].map((key) => [key, proposals.filter((item) => item.priority === key).length])),
    items: proposals,
  };
}
