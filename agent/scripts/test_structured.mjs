import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateStructured } from './validate_structured.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const structured = path.join(root, 'agent', 'structured');
const load = async name => JSON.parse(await readFile(path.join(structured, name), 'utf8'));
const report = await validateStructured();
if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

const projects = await load('projects.json');
const inheritors = await load('inheritors.json');
const formations = await load('formations.json');
const signals = await load('signals.json');
const events = await load('events.json');
if (!projects.records.every(item => item.project_code === 'Ⅲ—8')) throw new Error('project code regression');
const lin = inheritors.records.find(item => item.person_id === 'inheritor-lin-zhongcheng');
if (!lin || lin.official_serial !== null || !/未|缺|公开|空/.test(lin.field_notes)) throw new Error('missing serial boundary regression');
if (!formations.records.every(item => item.scope.includes('DB4405/T 315—2025'))) throw new Error('formation scope regression');
if (!signals.records.every(item => item.exact_sequence_status === 'not_published')) throw new Error('signal precision regression');
if (!events.records.every(item => ['historical', 'expired'].includes(item.status))) throw new Error('historical event safety regression');
for (const file of ['projects.json', 'inheritors.json', 'teams.json', 'formations.json', 'signals.json', 'events.json']) {
  const data = await load(file);
  if (JSON.stringify(data).includes('"url"')) throw new Error(`${file} leaked client-facing source URL; use source_id only`);
}
console.log(JSON.stringify({ passed: true, message: 'structured WP-06 contract tests passed', counts: report.counts }, null, 2));
