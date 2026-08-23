import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const file = path.join(root, "agent", "golden_answers.json");
const evalFile = path.join(root, "agent", "golden_answer_eval.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const evalData = JSON.parse(fs.readFileSync(evalFile, "utf8"));
const items = Array.isArray(data.items) ? data.items : [];
const errors = [];
const ids = new Set();
const questions = new Set();

function normalize(text = "") {
  return String(text).toLowerCase().replace(/[^\u4e00-\u9fff\w]/g, "");
}

function terms(text = "") {
  const value = normalize(text);
  const result = new Set();
  for (let index = 0; index < value.length; index += 1) {
    result.add(value[index]);
    if (index < value.length - 1) result.add(value.slice(index, index + 2));
  }
  return result;
}

function match(query) {
  const normalizedQuery = normalize(query);
  const queryBigrams = [...terms(query)].filter((term) => term.length === 2);
  const ranked = items.map((item) => {
    let score = 0;
    for (const phrase of [item.question, ...(item.aliases || [])].filter(Boolean)) {
      const normalizedPhrase = normalize(phrase);
      if (normalizedQuery === normalizedPhrase) score = Math.max(score, 2);
      else if (normalizedPhrase.length >= 4 && (normalizedQuery.includes(normalizedPhrase) || normalizedPhrase.includes(normalizedQuery))) score = Math.max(score, 1 + Math.min(normalizedQuery.length, normalizedPhrase.length) / Math.max(normalizedQuery.length, normalizedPhrase.length));
      const phraseBigrams = new Set([...terms(phrase)].filter((term) => term.length === 2));
      const overlap = queryBigrams.filter((term) => phraseBigrams.has(term)).length;
      score = Math.max(score, overlap / Math.max(1, Math.min(queryBigrams.length, phraseBigrams.size)));
    }
    return { score, item };
  }).sort((left, right) => right.score - left.score);
  return ranked[0]?.score >= .58 ? ranked[0].item : null;
}

if (data.count !== items.length || items.length < 50) errors.push(`golden answer count mismatch or below baseline 50: declared=${data.count} actual=${items.length}`);

for (const item of items) {
  if (!item.id || ids.has(item.id)) errors.push(`invalid or duplicate id: ${item.id}`);
  ids.add(item.id);
  if (!item.question || questions.has(item.question)) errors.push(`invalid or duplicate question: ${item.question}`);
  questions.add(item.question);
  if (!Array.isArray(item.aliases) || item.aliases.length < 2) errors.push(`${item.id}: aliases must contain at least 2 variants`);
  if (String(item.answer || "").length < 80) errors.push(`${item.id}: answer is too short`);
  if (!Array.isArray(item.source_files) || !item.source_files.length) errors.push(`${item.id}: no source_files`);
  for (const source of item.source_files || []) if (!fs.existsSync(path.join(root, source))) errors.push(`${item.id}: missing source ${source}`);
}

for (const item of items) {
  for (const phrase of [item.question, ...item.aliases]) {
    const matched = match(phrase);
    if (matched?.id !== item.id) errors.push(`${item.id}: phrase matched ${matched?.id || "nothing"}: ${phrase}`);
  }
}

const evalCases = Array.isArray(evalData.cases) ? evalData.cases : [];
const evalIds = new Set();
if (evalData.count !== evalCases.length || evalCases.length < 20) errors.push(`golden eval count mismatch or below baseline 20: declared=${evalData.count} actual=${evalCases.length}`);
for (const item of evalCases) {
  if (!item.id || evalIds.has(item.id)) errors.push(`invalid or duplicate golden eval id: ${item.id}`);
  evalIds.add(item.id);
  if (!ids.has(item.golden_id)) errors.push(`${item.id}: unknown golden_id ${item.golden_id}`);
  if (!item.query || String(item.query).length < 4) errors.push(`${item.id}: query missing`);
  if (!Array.isArray(item.direct_terms) || !item.direct_terms.length) errors.push(`${item.id}: direct_terms missing`);
  if (!Array.isArray(item.must_terms) || !item.must_terms.length) errors.push(`${item.id}: must_terms missing`);
  if (!Array.isArray(item.forbidden_terms)) errors.push(`${item.id}: forbidden_terms must be an array`);
}

const report = {
  status: errors.length ? "fail" : "pass",
  version: data.version,
  count: items.length,
  average_answer_chars: Number((items.reduce((sum, item) => sum + item.answer.length, 0) / Math.max(1, items.length)).toFixed(1)),
  aliases: items.reduce((sum, item) => sum + item.aliases.length, 0),
  source_links: items.reduce((sum, item) => sum + item.source_files.length, 0),
  verified_phrases: items.reduce((sum, item) => sum + item.aliases.length + 1, 0),
  golden_eval_cases: evalCases.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
