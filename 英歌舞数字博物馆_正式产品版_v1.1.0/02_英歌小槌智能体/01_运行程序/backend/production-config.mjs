import path from "node:path";

const PRIVATE_PATH_KEYS = Object.freeze([
  "AGENT_STORE_DIR",
  "ADMIN_PRIVATE_STATE_DIR",
  "CURATION_CATALOG_PATH",
  "CURATION_AUDIT_PATH",
  "SITE_CONTENT_PATH",
  "SITE_CONTENT_AUDIT_PATH",
  "ADMIN_PLANS_PATH",
  "ADMIN_APPS_PATH",
  "AGENT_OPERATIONS_STATE_DIR",
  "KNOWLEDGE_GOVERNANCE_DIR",
  "KNOWLEDGE_SOURCE_DIR",
  "KNOWLEDGE_BUILD_OUTPUT_DIR",
  "KNOWLEDGE_RUNTIME_DATA_DIR",
  "KNOWLEDGE_GRAPH_PATH",
  "YINGGE_BACKUP_DIR",
]);

const ALL_PATH_KEYS = Object.freeze([
  ...PRIVATE_PATH_KEYS,
  "CURATION_PUBLIC_PATH",
]);

function configurationError(message) {
  return Object.assign(new Error(message), { code: "PRODUCTION_CONFIG_INVALID" });
}

function isWithin(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function intersects(first, second) {
  return isWithin(first, second) || isWithin(second, first);
}

function exactOrigin(value, { production }) {
  if (value.includes("*")) throw configurationError("AGENT_ALLOWED_ORIGINS 必须填写确切域名，不能使用通配符");
  let parsed;
  try { parsed = new URL(value); } catch { throw configurationError("AGENT_ALLOWED_ORIGINS 包含无效 URL"); }
  if (parsed.username || parsed.password) throw configurationError("AGENT_ALLOWED_ORIGINS 不能包含凭据");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) throw configurationError("AGENT_ALLOWED_ORIGINS 只能填写来源，不能包含路径、查询或片段");
  if (production && parsed.protocol !== "https:") throw configurationError("生产环境 AGENT_ALLOWED_ORIGINS 必须使用 HTTPS");
  if (!production && !["http:", "https:"].includes(parsed.protocol)) throw configurationError("AGENT_ALLOWED_ORIGINS 只支持 HTTP 或 HTTPS");
  return parsed.origin;
}

function configuredPath(env, key, { production, fallback }) {
  const raw = String(env[key] || "").trim();
  if (production && !raw) throw configurationError(`生产环境必须显式配置 ${key}`);
  const selected = raw || fallback;
  if (!selected || !path.isAbsolute(selected)) throw configurationError(`${key} 必须是绝对路径`);
  return path.resolve(selected);
}

export function validateProductionEnvironment({ env = process.env, projectRoot, webRoot } = {}) {
  if (!projectRoot || !webRoot) throw new TypeError("projectRoot and webRoot are required");
  const production = String(env.NODE_ENV || "").trim().toLowerCase() === "production";
  const allowedOrigins = String(env.AGENT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => exactOrigin(item, { production }));
  if (production && !allowedOrigins.length) throw configurationError("生产环境必须显式配置 AGENT_ALLOWED_ORIGINS");
  if (new Set(allowedOrigins).size !== allowedOrigins.length) throw configurationError("AGENT_ALLOWED_ORIGINS 不能包含重复来源");

  const bindHost = String(env.AGENT_HOST || "127.0.0.1").trim();
  if (production && !["127.0.0.1", "::1"].includes(bindHost)) throw configurationError("生产 API 必须绑定回环地址并通过 HTTPS 反向代理访问");
  if (!bindHost) throw configurationError("AGENT_HOST 不能为空");

  const cookieFlag = String(env.AGENT_COOKIE_SECURE || "").trim().toLowerCase();
  const cookieSecure = production ? cookieFlag !== "false" : cookieFlag === "true";
  if (production && !cookieSecure) throw configurationError("生产环境管理员 Cookie 必须启用 Secure");

  const defaults = {
    AGENT_STORE_DIR: path.join(projectRoot, "backend"),
    ADMIN_PRIVATE_STATE_DIR: path.join(projectRoot, "backend", ".admin-state"),
    CURATION_CATALOG_PATH: path.join(projectRoot, "content", "curation", "exhibits.json"),
    CURATION_AUDIT_PATH: path.join(projectRoot, "content", "curation", "audit.jsonl"),
    CURATION_PUBLIC_PATH: path.join(webRoot, "data", "exhibits.public.json"),
    SITE_CONTENT_PATH: path.join(projectRoot, "backend", "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(projectRoot, "backend", "site-content-audit.jsonl"),
    ADMIN_PLANS_PATH: path.join(projectRoot, "backend", "plans.json"),
    ADMIN_APPS_PATH: path.join(projectRoot, "backend", "apps.json"),
    AGENT_OPERATIONS_STATE_DIR: path.join(projectRoot, "agent", "generated"),
    KNOWLEDGE_GOVERNANCE_DIR: path.join(projectRoot, "agent"),
    KNOWLEDGE_SOURCE_DIR: path.join(projectRoot, "knowledge-base", "content"),
    KNOWLEDGE_BUILD_OUTPUT_DIR: path.join(projectRoot, "agent", "generated"),
    KNOWLEDGE_RUNTIME_DATA_DIR: path.join(projectRoot, "agent", "runtime"),
    KNOWLEDGE_GRAPH_PATH: path.join(projectRoot, "content", "knowledge", "knowledge_graph.json"),
    YINGGE_BACKUP_DIR: path.join(projectRoot, "backups"),
  };
  const privateStateRoot = configuredPath(env, "YINGGE_PRIVATE_STATE_ROOT", {
    production,
    fallback: path.join(projectRoot, "backend"),
  });
  const resolved = Object.fromEntries(ALL_PATH_KEYS.map((key) => [key, configuredPath(env, key, { production, fallback: defaults[key] })]));
  if (production) {
    if (isWithin(privateStateRoot, projectRoot)) throw configurationError("YINGGE_PRIVATE_STATE_ROOT 必须位于项目目录之外");
    for (const key of PRIVATE_PATH_KEYS) {
      if (isWithin(resolved[key], projectRoot)) throw configurationError(`${key} 必须位于项目目录之外`);
      if (!isWithin(resolved[key], privateStateRoot)) throw configurationError(`${key} 必须位于 YINGGE_PRIVATE_STATE_ROOT 内`);
    }
    for (const publicKey of ["CURATION_PUBLIC_PATH"]) {
      if (intersects(resolved[publicKey], privateStateRoot)) {
        throw configurationError(`${publicKey} 公众数据路径不能与私密状态 YINGGE_PRIVATE_STATE_ROOT 相交`);
      }
      for (const privateKey of PRIVATE_PATH_KEYS) {
        if (intersects(resolved[publicKey], resolved[privateKey])) {
          throw configurationError(`${publicKey} 公众数据路径不能与私密状态 ${privateKey} 相交`);
        }
      }
    }
  }

  return Object.freeze({
    production,
    bindHost,
    cookieSecure,
    allowedOrigins: Object.freeze(allowedOrigins),
    paths: Object.freeze({
      agentStoreDir: resolved.AGENT_STORE_DIR,
      privateStateRoot,
      adminStateDir: resolved.ADMIN_PRIVATE_STATE_DIR,
      curationCatalogPath: resolved.CURATION_CATALOG_PATH,
      curationAuditPath: resolved.CURATION_AUDIT_PATH,
      curationPublicPath: resolved.CURATION_PUBLIC_PATH,
      siteContentPath: resolved.SITE_CONTENT_PATH,
      siteContentAuditPath: resolved.SITE_CONTENT_AUDIT_PATH,
      plansPath: resolved.ADMIN_PLANS_PATH,
      appsPath: resolved.ADMIN_APPS_PATH,
      operationsStateDir: resolved.AGENT_OPERATIONS_STATE_DIR,
      knowledgeGovernanceDir: resolved.KNOWLEDGE_GOVERNANCE_DIR,
      knowledgeSourceDir: resolved.KNOWLEDGE_SOURCE_DIR,
      knowledgeBuildOutputDir: resolved.KNOWLEDGE_BUILD_OUTPUT_DIR,
      knowledgeRuntimeDataDir: resolved.KNOWLEDGE_RUNTIME_DATA_DIR,
      knowledgeGraphPath: resolved.KNOWLEDGE_GRAPH_PATH,
      backupDir: resolved.YINGGE_BACKUP_DIR,
    }),
  });
}
