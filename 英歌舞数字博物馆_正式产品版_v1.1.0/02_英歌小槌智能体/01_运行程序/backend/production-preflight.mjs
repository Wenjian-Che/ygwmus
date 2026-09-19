import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProductionEnvironment } from "./production-config.mjs";
import { assertPublicWebRootReadable, resolvePublicWebRoot } from "./public-web-root.mjs";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(backendDir, "..");

function fail(message) {
  throw Object.assign(new Error(message), { code: "PRODUCTION_PREFLIGHT_FAILED" });
}

function requireDirectory(directory, { writable = false } = {}) {
  let stat;
  try { stat = fs.statSync(directory); } catch { fail(`缺少部署目录：${directory}`); }
  if (!stat.isDirectory()) fail(`部署路径不是目录：${directory}`);
  try { fs.accessSync(directory, fs.constants.R_OK | (writable ? fs.constants.W_OK : 0)); }
  catch { fail(`服务账户无权${writable ? "读写" : "读取"}目录：${directory}`); }
}

function requireFile(file) {
  let stat;
  try { stat = fs.statSync(file); } catch { fail(`缺少部署文件：${file}`); }
  if (!stat.isFile()) fail(`部署路径不是普通文件：${file}`);
  try { fs.accessSync(file, fs.constants.R_OK); } catch { fail(`服务账户无法读取文件：${file}`); }
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function canonicalTarget(target) {
  if (fs.existsSync(target)) return fs.realpathSync.native(target);
  const parent = fs.realpathSync.native(path.dirname(target));
  return path.join(parent, path.basename(target));
}

function assertCanonicalBoundaries(runtime) {
  const projectReal = fs.realpathSync.native(projectRoot);
  const privateRootReal = fs.realpathSync.native(runtime.paths.privateStateRoot);
  if (inside(projectReal, privateRootReal) || inside(privateRootReal, projectReal)) fail("私密状态根与发布目录真实路径相交");
  const privateTargets = [
    runtime.paths.agentStoreDir, runtime.paths.adminStateDir, runtime.paths.curationCatalogPath,
    runtime.paths.curationAuditPath, runtime.paths.siteContentPath, runtime.paths.siteContentAuditPath,
    runtime.paths.plansPath, runtime.paths.appsPath, runtime.paths.operationsStateDir,
    runtime.paths.knowledgeGovernanceDir, runtime.paths.knowledgeSourceDir, runtime.paths.knowledgeBuildOutputDir,
    runtime.paths.knowledgeRuntimeDataDir, runtime.paths.knowledgeGraphPath, runtime.paths.backupDir,
  ];
  if (privateTargets.some((target) => !inside(privateRootReal, canonicalTarget(target)))) fail("私密状态路径通过符号链接逃离 YINGGE_PRIVATE_STATE_ROOT");
  if (inside(privateRootReal, canonicalTarget(runtime.paths.curationPublicPath))) fail("公众投影真实路径进入私密状态根");
}

function assertPrivatePermissions(directory) {
  if (process.platform === "win32") return;
  const mode = fs.statSync(directory).mode & 0o777;
  if ((mode & 0o077) !== 0) fail("YINGGE_PRIVATE_STATE_ROOT 权限必须限制为服务账户专用（建议 0700）");
}

function assertRoleCredentials(raw) {
  let parsed;
  try { parsed = JSON.parse(String(raw || "")); } catch { fail("ADMIN_CREDENTIALS_JSON 不是有效 JSON"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail("生产环境必须配置独立 reviewer 与 publisher 服务凭据");
  const rows = Object.entries(parsed);
  if (rows.some(([token, actor]) => token.length < 32 || !actor || typeof actor !== "object" || !String(actor.id || "").trim())) {
    fail("ADMIN_CREDENTIALS_JSON 的令牌至少 32 位，且每项必须包含 actor id");
  }
  const reviewer = rows.find(([, actor]) => actor.role === "reviewer");
  const publisher = rows.find(([, actor]) => actor.role === "publisher");
  if (!reviewer || !publisher || reviewer[1].id === publisher[1].id) fail("生产环境必须配置身份分离的 reviewer 与 publisher");
}

function assertPublicProjection(file) {
  requireFile(file);
  let payload;
  try { payload = JSON.parse(fs.readFileSync(file, "utf8")); } catch { fail("策展公众投影不是有效 JSON"); }
  const serialized = JSON.stringify(payload);
  const forbidden = /inventory_ref|media_sha256|source_document|source_paragraph|authorization_evidence_ref|minor_consent_evidence_ref|third_party_rights_evidence_ref|privacy_review_status|review_note|password_hash|install-key|model-settings/i;
  if (forbidden.test(serialized) || /(?:[A-Za-z]:\\|\\\\|\/home\/|\/var\/lib\/)/.test(serialized)) fail("策展公众投影包含私密治理字段或内部绝对路径");
}

function assertStaticRootClean(webRoot) {
  const forbidden = [
    path.join(webRoot, ".env"),
    path.join(webRoot, "data", "chunks.jsonl"),
    path.join(webRoot, "data", "lexical_index.json"),
    path.join(webRoot, "data", "source_registry.json"),
    path.join(webRoot, "data", "build_report.json"),
    path.join(webRoot, "admin-auth.json"),
    path.join(webRoot, "model-settings.json"),
    path.join(webRoot, "install-key.bin"),
  ];
  if (forbidden.some((file) => fs.existsSync(file))) fail("公众静态目录仍包含私密状态或后端知识运行时文件");
}

async function assertSqliteWritable(directory) {
  let DatabaseSync;
  try { ({ DatabaseSync } = await import("node:sqlite")); }
  catch { fail("当前 Node.js 不支持 node:sqlite，生产环境禁止退回内存存储"); }
  const probe = path.join(directory, `.preflight-${process.pid}-${Date.now()}.sqlite`);
  let database;
  try {
    database = new DatabaseSync(probe);
    database.exec("CREATE TABLE preflight (ok INTEGER NOT NULL); INSERT INTO preflight VALUES (1);");
    const row = database.prepare("SELECT ok FROM preflight").get();
    if (Number(row?.ok) !== 1) fail("SQLite 持久化读写探测失败");
  } finally {
    try { database?.close(); } catch {}
    try { if (fs.existsSync(probe)) fs.unlinkSync(probe); } catch {}
  }
}

export async function runProductionPreflight({ env = process.env } = {}) {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 14)) fail("生产环境需要 Node.js 22.14.0 或更高版本");
  const webRoot = resolvePublicWebRoot({ env, projectRoot }).root;
  const runtime = validateProductionEnvironment({ env, projectRoot, webRoot });
  if (!runtime.production) fail("生产预检要求 NODE_ENV=production");
  try { assertPublicWebRootReadable(webRoot); }
  catch (error) { fail(error.message); }
  assertRoleCredentials(env.ADMIN_CREDENTIALS_JSON);

  const directoryPaths = [
    runtime.paths.privateStateRoot,
    runtime.paths.agentStoreDir,
    runtime.paths.adminStateDir,
    runtime.paths.operationsStateDir,
    runtime.paths.knowledgeGovernanceDir,
    runtime.paths.knowledgeSourceDir,
    runtime.paths.knowledgeBuildOutputDir,
    runtime.paths.knowledgeRuntimeDataDir,
    runtime.paths.backupDir,
    path.dirname(runtime.paths.curationCatalogPath),
    path.dirname(runtime.paths.curationAuditPath),
    path.dirname(runtime.paths.curationPublicPath),
    path.dirname(runtime.paths.siteContentPath),
    path.dirname(runtime.paths.siteContentAuditPath),
    path.dirname(runtime.paths.plansPath),
    path.dirname(runtime.paths.appsPath),
    path.dirname(runtime.paths.knowledgeGraphPath),
  ];
  for (const directory of new Set(directoryPaths.map((item) => path.resolve(item)))) requireDirectory(directory, { writable: true });
  assertPrivatePermissions(runtime.paths.privateStateRoot);
  assertCanonicalBoundaries(runtime);

  requireFile(runtime.paths.curationCatalogPath);
  assertPublicProjection(runtime.paths.curationPublicPath);
  for (const name of ["chunks.jsonl", "lexical_index.json", "source_registry.json", "build_report.json"]) requireFile(path.join(runtime.paths.knowledgeRuntimeDataDir, name));
  for (const name of ["rag_config.json", "retrieval_eval.json", "golden_answer_eval.json", "intents.json", "knowledge_manifest.json", "golden_answers.json"]) requireFile(path.join(runtime.paths.knowledgeGovernanceDir, name));
  assertStaticRootClean(webRoot);
  await assertSqliteWritable(runtime.paths.agentStoreDir);

  return Object.freeze({
    ok: true,
    node: process.versions.node,
    platform: `${process.platform}-${os.arch()}`,
    origins: runtime.allowedOrigins.length,
    persistent_storage: "sqlite",
    private_media: String(env.CURATION_PRIVATE_MEDIA_ROOT || "").trim() ? "configured" : "not_configured",
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runProductionPreflight()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(`生产预检失败：${error.message}`);
      process.exitCode = 1;
    });
}
