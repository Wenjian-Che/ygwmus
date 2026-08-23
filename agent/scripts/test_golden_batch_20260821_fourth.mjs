import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAnswerCandidate } from '../../backend/answer-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'agent', 'golden_answers.json'), 'utf8'));
const batch = data.items.filter(item => /^gold-(?:11[1-9]|12[0-9]|130)$/.test(item.id));
const errors = [];
if (batch.length !== 20) errors.push(`expected 20 batch items, got ${batch.length}`);
for (const item of batch) {
  const result = evaluateAnswerCandidate(item, { sourceExists: file => fs.existsSync(path.join(root, file)) });
  if (!result.passed || result.score !== 100) {
    errors.push(`${item.id}: ${result.score}; ${result.checks.filter(check => !check.pass).map(check => check.key).join(',')}`);
  }
}
console.log(JSON.stringify({ status: errors.length ? 'fail' : 'pass', batch_count: batch.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
