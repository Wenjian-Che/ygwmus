import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAdversarialSuite } from '../../backend/adversarial-eval.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, '../adversarial_eval.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const allowedRoutes = new Set([
  'region_switch', 'correction', 'premise_correction', 'identity_boundary',
  'media_boundary', 'unsafe_tutorial', 'safety', 'realtime_expired',
  'realtime_unknown', 'generalization_boundary', 'media_evidence',
  'conflict_split', 'privacy', 'context_followup', 'context_switch',
  'grounded_long_answer',
]);

const failures = [];
if (data.count !== 20 || data.cases.length !== 20) failures.push('count must be 20');
const ids = new Set();
for (const item of data.cases) {
  if (ids.has(item.id)) failures.push(`${item.id}: duplicate id`);
  ids.add(item.id);
  if (!allowedRoutes.has(item.expected_route)) failures.push(`${item.id}: invalid route`);
  if (!Array.isArray(item.turns) || item.turns.length < 1) failures.push(`${item.id}: missing turns`);
  if (!String(item.response ?? '').trim()) failures.push(`${item.id}: empty response`);
}
const report = evaluateAdversarialSuite(data);
for (const result of report.results) {
  if (!result.passed) failures.push(`${result.id}: ${result.failed.join(',')}`);
}
const output = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  version: data.version,
  count: report.count,
  passed: report.passed,
  failed: report.failed,
  failures,
};
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);
