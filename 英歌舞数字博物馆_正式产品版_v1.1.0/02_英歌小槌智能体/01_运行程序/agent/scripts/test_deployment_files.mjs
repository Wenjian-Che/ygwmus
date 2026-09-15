import assert from "node:assert/strict";
import fs from "node:fs";

const required = [
  "deploy/yingge-museum.service",
  "deploy/nginx.yingge-museum.conf",
  "deploy/yingge-museum.env.example",
  "deploy/bootstrap-admin.mjs",
  "deploy/backup.sh",
  "deploy/restore.md",
  "deploy/README.md",
];
for (const file of required) assert.equal(fs.existsSync(file), true, `缺少部署文件 ${file}`);

const service = fs.readFileSync("deploy/yingge-museum.service", "utf8");
assert.match(service, /User=yingge/);
assert.match(service, /EnvironmentFile=\/etc\/yingge-museum\/yingge-museum\.env/);
assert.match(service, /ExecStartPre=.*production-preflight\.mjs/);
assert.match(service, /ProtectSystem=strict/);
assert.match(service, /ReadWritePaths=\/var\/lib\/yingge-museum/);
assert.match(service, /NoNewPrivileges=true/);
assert.match(service, /UMask=0027/);

const nginx = fs.readFileSync("deploy/nginx.yingge-museum.conf", "utf8");
assert.match(nginx, /listen 443 ssl/);
assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:8787/);
assert.match(nginx, /proxy_buffering off/);
assert.match(nginx, /Strict-Transport-Security/);
assert.match(nginx, /Content-Security-Policy/);
for (const sensitiveName of ["chunks", "lexical_index", "source_registry", "build_report"]) assert.match(nginx, new RegExp(sensitiveName));
assert.doesNotMatch(nginx, /Access-Control-Allow-Origin\s+\*/i);
assert.match(nginx, /location = \/_museum_auth\s*\{[\s\S]*?internal;/);
assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:8787\/api\/admin\/session/);
assert.match(nginx, /proxy_pass_request_body off/);
assert.match(nginx, /proxy_set_header Content-Length ""/);
assert.match(nginx, /proxy_set_header Cookie \$http_cookie/);
assert.match(nginx, /proxy_set_header Authorization \$http_authorization/);
assert.match(nginx, /proxy_set_header Origin \$scheme:\/\/\$host/);

const environment = fs.readFileSync("deploy/yingge-museum.env.example", "utf8");
for (const key of [
  "NODE_ENV", "AGENT_ALLOWED_ORIGINS", "AGENT_COOKIE_SECURE", "YINGGE_PRIVATE_STATE_ROOT",
  "AGENT_STORE_DIR", "ADMIN_PRIVATE_STATE_DIR", "CURATION_CATALOG_PATH", "CURATION_AUDIT_PATH",
  "CURATION_PUBLIC_PATH", "SITE_CONTENT_PATH", "SITE_CONTENT_AUDIT_PATH", "ADMIN_PLANS_PATH",
  "ADMIN_APPS_PATH", "AGENT_OPERATIONS_STATE_DIR", "KNOWLEDGE_GOVERNANCE_DIR", "KNOWLEDGE_SOURCE_DIR",
  "KNOWLEDGE_BUILD_OUTPUT_DIR", "KNOWLEDGE_RUNTIME_DATA_DIR", "KNOWLEDGE_GRAPH_PATH", "YINGGE_BACKUP_DIR",
  "ADMIN_CREDENTIALS_JSON",
]) assert.match(environment, new RegExp(`^${key}=`, "m"), `生产环境示例缺少 ${key}`);
assert.doesNotMatch(environment, /sk-[A-Za-z0-9]{8,}|SecretKey\s*=\s*\S+/i, "环境示例不得包含真实密钥形态");

const readme = fs.readFileSync("deploy/README.md", "utf8");
for (const phrase of ["Node.js 22", "首次管理员", "/api/health", "/api/ready", "回滚", "单实例", "未授权素材"]) assert.match(readme, new RegExp(phrase));
assert.match(readme, /-g nginx -m 2750 \/var\/lib\/yingge-museum\/public\/data/);
assert.doesNotMatch(readme, /www-data/);
const restore = fs.readFileSync("deploy/restore.md", "utf8");
assert.match(restore, /停止服务/);
assert.match(restore, /校验/);
assert.match(restore, /恢复演练/);

console.log("Linux deployment manifests and operating guide contract ok");
