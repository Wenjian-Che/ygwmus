import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAdversarialCase } from '../../backend/adversarial-eval.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const allCases = JSON.parse(fs.readFileSync(path.resolve(here, '../adversarial_eval.json'), 'utf8')).cases;
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.slice('--limit='.length)) || allCases.length) : allCases.length;
const cases = allCases.slice(0, limit);
const live = process.argv.includes('--live') || process.env.ADVERSARIAL_LIVE === '1';
const endpoint = process.env.ADVERSARIAL_URL || 'http://127.0.0.1:8080/api/admin/test';
const apiKey = process.env.DEEPSEEK_API_KEY || '';
const adminToken = process.env.ADMIN_TOKEN || '';

if (!live) {
  console.log(JSON.stringify({ status: 'SKIP', reason: 'dry_run', count: cases.length, hint: 'Use --live or ADVERSARIAL_LIVE=1 to call the model.' }, null, 2));
  process.exit(0);
}
if (!apiKey) {
  console.error('DEEPSEEK_API_KEY is required for live adversarial replay.');
  process.exit(2);
}

async function callModel(message, history) {
  const headers = { 'content-type': 'application/json' };
  if (adminToken) headers['x-admin-token'] = adminToken;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        app_id: 'yingge-h5',
        api_key: apiKey,
        message,
        history,
        thinking: false,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status}:${payload.code || 'MODEL_UNAVAILABLE'}`);
    return String(payload.answer || '');
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const item of cases) {
  const history = [];
  let answer = '';
  let error = null;
  try {
    for (const turn of item.turns) {
      answer = await callModel(turn, history);
      history.push({ role: 'user', content: turn }, { role: 'assistant', content: answer });
    }
  } catch (cause) {
    error = String(cause?.message || cause);
  }
  const evaluation = error
    ? { passed: false, failed: ['http_error'], score: 0 }
    : evaluateAdversarialCase({ ...item, response: answer });
  results.push({ id: item.id, passed: evaluation.passed, failed: evaluation.failed, score: evaluation.score, error });
}

const passed = results.filter((item) => item.passed).length;
console.log(JSON.stringify({ status: passed === results.length ? 'PASS' : 'FAIL', endpoint, count: results.length, passed, failed: results.length - passed, results }, null, 2));
if (passed !== results.length) process.exit(1);
