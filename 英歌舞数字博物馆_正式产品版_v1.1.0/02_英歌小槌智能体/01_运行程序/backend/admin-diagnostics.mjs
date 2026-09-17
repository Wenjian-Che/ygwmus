import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function timedCheck(id, layer, blocking, operation) {
  const started = performance.now();
  try {
    const result = operation() || {};
    return {
      id,
      layer,
      status: result.status || "pass",
      blocking: Boolean(blocking),
      code: result.code || null,
      summary: result.summary || "检查通过",
      metrics: result.metrics || {},
      remediation: result.remediation || "",
      duration_ms: Number((performance.now() - started).toFixed(2)),
    };
  } catch {
    return {
      id,
      layer,
      status: "fail",
      blocking: Boolean(blocking),
      code: "CHECK_FAILED",
      summary: "检查未能完成",
      metrics: {},
      remediation: "检查相关配置与数据格式后重试",
      duration_ms: Number((performance.now() - started).toFixed(2)),
    };
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function safePublicContent(value) {
  return Boolean(value && typeof value === "object" && value.hero?.titleLine1 && value.experiences?.title);
}

function safePublicExhibits(value) {
  return Boolean(value && typeof value === "object" && (Array.isArray(value.exhibits) || Array.isArray(value.items)));
}

export async function runAdminDiagnostics({ projectRoot, runtime, paths = {} } = {}) {
  if (!projectRoot || !runtime) throw new TypeError("projectRoot and runtime are required");
  const publicWebRoot = paths.publicWebRoot || path.join(projectRoot, "web");
  const governanceDir = paths.knowledgeGovernanceDir || path.join(projectRoot, "agent");
  const runtimeDataDir = paths.knowledgeRuntimeDataDir || path.join(projectRoot, "web", "data");
  const sourceRoot = paths.knowledgeSourceDir || path.join(projectRoot, "knowledge-base", "content");
  const files = {
    manifest: path.join(governanceDir, "knowledge_manifest.json"),
    report: path.join(runtimeDataDir, "build_report.json"),
    chunks: path.join(runtimeDataDir, "chunks.jsonl"),
    index: path.join(runtimeDataDir, "lexical_index.json"),
    registry: path.join(runtimeDataDir, "source_registry.json"),
    indexHtml: path.join(publicWebRoot, "index.html"),
    appJs: path.join(publicWebRoot, "app.js"),
    sourceRoot,
  };
  let artifact = null;
  const checks = [];
  checks.push(timedCheck("runtime_service", "service", true, () => {
    const count = Array.isArray(runtime.chunks) ? runtime.chunks.length : 0;
    return count > 0
      ? { summary: "智能体运行时已加载知识索引", metrics: { chunks: count } }
      : { status: "fail", code: "RUNTIME_KNOWLEDGE_EMPTY", summary: "智能体运行时没有可检索的知识切片", remediation: "恢复并加载知识索引" };
  }));
  checks.push(timedCheck("frontend_contract", "browser", true, () => {
    const html = fs.readFileSync(files.indexHtml, "utf8");
    const app = fs.readFileSync(files.appJs, "utf8");
    const agentRoute = /\/api\/agent\/chat/.test(app) || (/\/api\/agent/.test(app) && /['"`]\/chat['"`]/.test(app));
    const appId = /yingge-h5/.test(app);
    const launcher = /data-guide-open/.test(html) || /data-guide-open/.test(app);
    return agentRoute && appId && launcher
      ? { summary: "公众网页已接入英歌小槌问答入口", metrics: { agent_route: true, app_id: true, launcher: true } }
      : { status: "fail", code: "FRONTEND_AGENT_CONTRACT_MISSING", summary: "公众网页的智能体接入不完整", metrics: { agent_route: agentRoute, app_id: appId, launcher }, remediation: "检查网页入口、应用 ID 与聊天接口配置" };
  }));
  checks.push(timedCheck("app_registration", "service", true, () => {
    const registered = Array.isArray(runtime.apps) && runtime.apps.some((app) => app?.app_id === "yingge-h5" && app.enabled !== false);
    return registered
      ? { summary: "公众应用 yingge-h5 已注册并启用" }
      : { status: "fail", code: "PUBLIC_APP_DISABLED", summary: "公众应用未注册或已停用", remediation: "在应用管理中启用 yingge-h5" };
  }));
  checks.push(timedCheck("knowledge_artifacts", "knowledge", true, () => {
    const manifest = readJson(files.manifest);
    const report = readJson(files.report);
    const index = readJson(files.index);
    const registry = readJson(files.registry);
    const chunks = readJsonLines(files.chunks);
    const uniqueIds = new Set(chunks.map((chunk) => String(chunk.id || "")));
    artifact = { manifest, report, index, registry, chunks };
    const valid = chunks.length > 0 && uniqueIds.size === chunks.length && Number(index.chunk_count) === chunks.length && Number(report.chunks) === chunks.length;
    return valid
      ? { summary: "知识切片、检索索引与构建报告数量一致", metrics: { chunks: chunks.length, unique_ids: uniqueIds.size } }
      : { status: "fail", code: "KNOWLEDGE_ARTIFACT_MISMATCH", summary: "知识产物数量、ID 或索引不一致", metrics: { chunks: chunks.length, unique_ids: uniqueIds.size, indexed: Number(index.chunk_count) || 0, reported: Number(report.chunks) || 0 }, remediation: "从受治理知识源重新构建全部产物" };
  }));
  checks.push(timedCheck("knowledge_version", "knowledge", true, () => {
    if (!artifact) return { status: "fail", code: "KNOWLEDGE_ARTIFACT_UNREADABLE", summary: "无法比对知识版本", remediation: "先修复知识产物" };
    const versions = [artifact.manifest.knowledge_version, artifact.report.knowledge_version, artifact.index.version, runtime.knowledgeVersion].map(String);
    const consistent = versions.every((version) => version && version !== "undefined" && version === versions[0]);
    return consistent
      ? { summary: "磁盘产物与当前检索运行时版本一致", metrics: { version: versions[0] } }
      : { status: "fail", code: "KNOWLEDGE_VERSION_STALE", summary: "知识产物与当前运行时版本不一致", metrics: { manifest: versions[0], runtime: versions[3] }, remediation: "完成构建校验后重新加载知识运行时" };
  }));
  checks.push(timedCheck("source_registry", "evidence", false, () => {
    if (!artifact) return { status: "fail", code: "SOURCE_REGISTRY_UNREADABLE", summary: "无法检查资料来源", remediation: "先修复知识产物" };
    const sources = artifact.registry.sources || {};
    const referenced = new Set(artifact.chunks.flatMap((chunk) => Array.isArray(chunk.source_ids) ? chunk.source_ids.map(String) : []));
    const missing = [...referenced].filter((id) => !sources[id]);
    const unsafe = [...referenced].filter((id) => sources[id] && !/^https:\/\//i.test(String(sources[id].url || "")));
    return !missing.length && !unsafe.length
      ? { summary: "切片引用均能映射到 HTTPS 公开来源", metrics: { referenced_sources: referenced.size } }
      : { status: "warning", code: "SOURCE_MAPPING_INCOMPLETE", summary: "部分切片缺少可公开的 HTTPS 来源映射", metrics: { referenced_sources: referenced.size, missing: missing.length, unsafe: unsafe.length }, remediation: "补齐来源注册后再发布相关回答" };
  }));
  checks.push(timedCheck("knowledge_source", "knowledge", false, () => {
    const ready = fs.existsSync(files.sourceRoot) && fs.statSync(files.sourceRoot).isDirectory()
      && fs.readdirSync(files.sourceRoot).some((name) => name.toLowerCase().endsWith(".md"));
    return ready
      ? { summary: "受治理的知识源存在，可持续重建索引" }
      : { status: "warning", code: "KNOWLEDGE_SOURCE_MISSING", summary: "当前索引还能服务，但知识源缺失，无法持续重建", remediation: "恢复经过审核的知识源目录；不要从公众切片反向生成" };
  }));
  checks.push(timedCheck("retrieval_probe", "retrieval", true, () => {
    const result = typeof runtime.retrieval === "function" ? runtime.retrieval("什么是英歌？") : null;
    const rows = Array.isArray(result?.results) ? result.results : [];
    const grounded = rows.some((row) => /英歌/.test(String(row?.chunk?.content || "")));
    return rows.length > 0 && grounded
      ? { summary: "固定问题已命中贴切的英歌知识切片", metrics: { hits: rows.length, elapsed_ms: Number(result?.meta?.elapsed_ms || 0) } }
      : { status: "fail", code: "RETRIEVAL_PROBE_EMPTY", summary: "固定问题没有命中可用的英歌知识", metrics: { hits: rows.length }, remediation: "检查索引加载、分词与检索路由" };
  }));
  checks.push(timedCheck("model_config", "model", false, () => {
    const configured = runtime.model?.configured === true && Boolean(String(runtime.model?.name || "").trim());
    return configured
      ? { summary: "回答模型已由服务端安全配置", metrics: { configured: true, model_alias: String(runtime.model.name).slice(0, 80), verified: false } }
      : { status: "warning", code: "MODEL_NOT_CONFIGURED", summary: "回答模型尚未配置；本地知识检索仍可独立工作", metrics: { configured: false, verified: false }, remediation: "在服务端环境中配置模型，不要把密钥传给浏览器" };
  }));
  checks.push(timedCheck("public_projection", "public", true, () => {
    const contentOk = safePublicContent(runtime.publicContent);
    const exhibitsOk = safePublicExhibits(runtime.publicExhibits);
    return contentOk && exhibitsOk
      ? { summary: "公众内容与展览投影可读取", metrics: { site_content: true, exhibits: true } }
      : { status: "fail", code: "PUBLIC_PROJECTION_INVALID", summary: "公众内容或展览投影结构无效", metrics: { site_content: contentOk, exhibits: exhibitsOk }, remediation: "修复统一公众投影，禁止用手写副本替代" };
  }));

  const blockingFailure = checks.some((check) => check.status === "fail" && check.blocking);
  const degraded = checks.some((check) => check.status === "warning" || check.status === "fail");
  const status = blockingFailure ? "blocked" : (degraded ? "degraded" : "healthy");
  const sourceReady = checks.find((check) => check.id === "knowledge_source")?.status === "pass";
  const runtimeReady = checks.find((check) => check.id === "runtime_service")?.status === "pass"
    && checks.find((check) => check.id === "retrieval_probe")?.status === "pass";
  return {
    diagnostic_id: crypto.randomUUID(),
    mode: "safe_offline",
    generated_at: new Date().toISOString(),
    status,
    overall: {
      status,
      serving_now: runtimeReady,
      knowledge_runtime_ready: runtimeReady,
      knowledge_source_ready: sourceReady,
      knowledge_rebuild_ready: sourceReady && checks.find((check) => check.id === "knowledge_artifacts")?.status === "pass",
      model_configured: runtime.model?.configured === true,
      model_verified: false,
      passed: checks.filter((check) => check.status === "pass").length,
      total: checks.length,
    },
    checks,
    live_probe: { requested: false, status: "skipped", billable: false },
    redaction: { secrets: "omitted", paths: "omitted", knowledge_text: "omitted" },
  };
}
