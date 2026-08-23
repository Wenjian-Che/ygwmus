import { evaluateAnswerCandidate } from "../../backend/answer-acceptance.mjs";

const valid = evaluateAnswerCandidate({
  question:"英歌为什么要敲槌？",
  answer:"敲槌主要用于把舞者动作、锣鼓节奏和队伍变化组织到同一个时间框架中，同时强化表演的视觉力度。具体槌点和组合会随地区与不同队伍而变化，不能把某一队的做法当作全国统一标准。",
  aliases:["英歌敲木槌有什么作用？","为什么英歌舞者手里要拿槌？"], direct_terms:["主要","作用"], must_terms:["节奏","队伍"], forbidden_terms:["全国统一","所有队伍都一样"], source_files:["56_锣鼓动作队形协同机制.md"], require_boundary:true,
}, { sourceExists:(file) => file === "56_锣鼓动作队形协同机制.md" });
const invalid = evaluateAnswerCandidate({
  question:"英歌为什么要敲槌？", answer:"直接回答：就是为了热闹。", aliases:[], direct_terms:[], must_terms:["节奏"], forbidden_terms:["为了热闹"], source_files:["missing.md"], require_boundary:true,
}, { sourceExists:() => false });
const errors = [];
if (!valid.passed || valid.score !== 100) errors.push(`valid=${valid.passed}/${valid.score}`);
if (invalid.passed || invalid.score >= 50) errors.push(`invalid=${invalid.passed}/${invalid.score}`);
if (!invalid.checks.some((item) => item.key === "sources" && !item.pass)) errors.push("missing source check");
console.log(JSON.stringify({ status:errors.length ? "fail" : "pass", valid_score:valid.score, invalid_score:invalid.score, invalid_failures:invalid.checks.filter((item) => !item.pass).map((item) => item.key), errors }, null, 2));
if (errors.length) process.exitCode = 1;
