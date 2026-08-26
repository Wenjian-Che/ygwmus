import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const structuredDir = path.join(root, 'agent', 'structured');
const sourceRegistryPath = path.join(root, 'web', 'data', 'source_registry.json');

const entityFiles = {
  projects: 'projects.json',
  inheritors: 'inheritors.json',
  teams: 'teams.json',
  formations: 'formations.json',
  signals: 'signals.json',
  events: 'events.json',
  conflicts: 'conflicts.json'
};

const required = {
  projects: ['project_id', 'official_name', 'project_no', 'project_code', 'inclusion', 'region', 'protection_unit', 'source_refs', 'status'],
  inheritors: ['person_id', 'name', 'project_id', 'recognition_level', 'batch', 'official_serial', 'verified_as_of', 'public_display', 'field_notes', 'source_refs', 'status'],
  teams: ['team_id', 'official_name', 'region', 'scope', 'established', 'style', 'named_forms', 'evidence_boundary', 'source_refs', 'status'],
  formations: ['formation_id', 'name', 'scope', 'spatial_summary', 'movement_summary', 'identification_boundary', 'source_refs', 'status'],
  signals: ['signal_id', 'name', 'scope', 'known_role', 'exact_sequence_status', 'boundary', 'source_refs', 'status'],
  events: ['event_id', 'title', 'event_date', 'location', 'participants', 'event_type', 'status', 'freshness_until', 'source_refs', 'status_note'],
  conflicts: ['conflict_id', 'field', 'status', 'observations', 'resolution', 'source_refs']
};

const nonEmpty = value => typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
const datePattern = /^\d{4}-\d{2}(?:-\d{2})?$/;

export async function validateStructured() {
  const failures = [];
  const warnings = [];
  const recordsByType = {};
  let registry;

  const fail = (code, message, entity_type = null, id = null) => failures.push({ code, message, entity_type, id });
  if (!existsSync(sourceRegistryPath)) {
    fail('source_registry_missing', sourceRegistryPath);
  } else {
    try { registry = JSON.parse(await readFile(sourceRegistryPath, 'utf8')); } catch (error) { fail('source_registry_invalid', error.message); }
  }
  const sources = registry?.sources ?? {};

  for (const [entityType, fileName] of Object.entries(entityFiles)) {
    const filePath = path.join(structuredDir, fileName);
    let payload;
    try {
      payload = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      fail('json_invalid', `${fileName}: ${error.message}`, entityType);
      continue;
    }
    if (!Array.isArray(payload.records)) {
      fail('records_not_array', `${fileName}.records must be an array`, entityType);
      continue;
    }
    recordsByType[entityType] = payload.records;
    const ids = new Set();
    for (const record of payload.records) {
      const idKey = entityType === 'inheritors' ? 'person_id' : entityType === 'projects' ? 'project_id' : entityType === 'teams' ? 'team_id' : entityType === 'formations' ? 'formation_id' : entityType === 'signals' ? 'signal_id' : entityType === 'events' ? 'event_id' : 'conflict_id';
      const id = record?.[idKey];
      if (!nonEmpty(id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail('id_invalid', `${idKey} must be kebab-case`, entityType, id ?? null);
      if (ids.has(id)) fail('id_duplicate', `${idKey} duplicated`, entityType, id);
      ids.add(id);
      for (const key of required[entityType]) {
        if (!(key in record)) fail('required_missing', `${fileName}: missing ${key}`, entityType, id);
      }
      if (Array.isArray(record.source_refs)) {
        if (record.source_refs.length === 0) fail('source_refs_empty', 'high-risk record must cite a source', entityType, id);
        for (const ref of record.source_refs) {
          if (!ref || !nonEmpty(ref.source_id)) { fail('source_ref_invalid', 'source_ref.source_id missing', entityType, id); continue; }
          if (!sources[ref.source_id]) fail('source_unknown', `unknown source ${ref.source_id}`, entityType, id);
          if (!['direct', 'partial', 'conflict', 'none'].includes(ref.support)) fail('support_invalid', `invalid support ${ref.support}`, entityType, id);
          if (sources[ref.source_id]?.grade !== 'A') fail('source_not_a_grade', `source ${ref.source_id} is not grade A`, entityType, id);
        }
      }
    }
  }

  for (const record of recordsByType.projects ?? []) {
    if (!Number.isInteger(record.project_no)) fail('project_no_invalid', 'project_no must be integer', 'projects', record.project_id);
    if (record.project_code !== 'Ⅲ—8') fail('project_code_unexpected', 'first batch scope expects project code Ⅲ—8', 'projects', record.project_id);
    if (!Number.isInteger(record.inclusion?.year)) fail('inclusion_year_invalid', 'inclusion.year must be integer', 'projects', record.project_id);
    if (!nonEmpty(record.protection_unit)) fail('protection_unit_missing', 'protection_unit must be explicit', 'projects', record.project_id);
  }
  for (const record of recordsByType.inheritors ?? []) {
    if (!datePattern.test(record.verified_as_of)) fail('verified_date_invalid', 'verified_as_of must be YYYY-MM or YYYY-MM-DD', 'inheritors', record.person_id);
    if (record.official_serial === null && !/未|缺|公开|空/.test(record.field_notes ?? '')) fail('null_without_boundary', 'null official_serial requires an explicit public-field gap note', 'inheritors', record.person_id);
    if (typeof record.public_display !== 'boolean' && (!Array.isArray(record.public_display) || record.public_display.length === 0)) fail('public_display_invalid', 'public_display must be boolean or a non-empty display-field array', 'inheritors', record.person_id);
  }
  for (const record of recordsByType.teams ?? []) {
    if (!nonEmpty(record.scope) || !nonEmpty(record.evidence_boundary)) fail('team_boundary_missing', 'team scope and evidence boundary are required', 'teams', record.team_id);
    if (typeof record.established !== 'object' || !('precision' in record.established)) fail('established_invalid', 'established.precision is required', 'teams', record.team_id);
    if (record.established?.year !== null && !Number.isInteger(record.established?.year)) fail('established_year_invalid', 'established.year must be integer or null', 'teams', record.team_id);
  }
  for (const record of recordsByType.formations ?? []) {
    if (!record.scope.includes('DB4405/T 315—2025')) fail('formation_scope_missing', 'formation must declare the local-standard scope', 'formations', record.formation_id);
    if (!nonEmpty(record.identification_boundary)) fail('formation_boundary_missing', 'formation identification boundary required', 'formations', record.formation_id);
  }
  for (const record of recordsByType.signals ?? []) {
    if (record.exact_sequence_status !== 'not_published') fail('signal_precision_overstated', 'first batch signals must remain not_published', 'signals', record.signal_id);
    if (!nonEmpty(record.boundary)) fail('signal_boundary_missing', 'signal boundary required', 'signals', record.signal_id);
  }
  for (const record of recordsByType.events ?? []) {
    if (!datePattern.test(record.event_date)) fail('event_date_invalid', 'event_date must be YYYY-MM or YYYY-MM-DD', 'events', record.event_id);
    if (!['historical', 'expired', 'confirmed', 'upcoming', 'unknown'].includes(record.status)) fail('event_status_invalid', 'invalid event status', 'events', record.event_id);
    if (record.status !== 'historical' && record.status !== 'expired') warnings.push({ code: 'live_event_requires_recheck', id: record.event_id });
    if (record.freshness_until !== null && !datePattern.test(record.freshness_until)) fail('freshness_date_invalid', 'freshness_until must be null or a date', 'events', record.event_id);
    if (!Array.isArray(record.participants) || record.participants.length === 0) fail('participants_empty', 'participants must be a non-empty array', 'events', record.event_id);
  }

  const manifestPath = path.join(structuredDir, 'manifest.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    for (const [type, expected] of Object.entries(manifest.records ?? {})) {
      if ((recordsByType[type] ?? []).length !== expected) fail('manifest_count_mismatch', `${type}: expected ${expected}, got ${(recordsByType[type] ?? []).length}`, type);
    }
  } catch (error) { fail('manifest_invalid', error.message); }

  const counts = Object.fromEntries(Object.entries(recordsByType).map(([type, records]) => [type, records.length]));
  return { passed: failures.length === 0, counts, failures, warnings, source_coverage: failures.filter(item => item.code.startsWith('source_')).length === 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await validateStructured();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
