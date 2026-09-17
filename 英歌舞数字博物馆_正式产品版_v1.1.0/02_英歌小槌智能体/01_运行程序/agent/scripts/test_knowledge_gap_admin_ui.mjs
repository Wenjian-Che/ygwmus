import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const adminRoot = path.resolve(scriptDir, "../../../../01_公众网站/admin");
const workspace = fs.readFileSync(path.join(adminRoot, "workspace.html"), "utf8");
const workspaceScript = fs.readFileSync(path.join(adminRoot, "workspace.js"), "utf8");

assert.match(workspace, /data-knowledge-feedback/,
  "统一工作台必须有可到达的知识反馈审核区");
assert.match(workspace, /系统自动标记/,
  "后台必须说明待补证任务的自动来源");
assert.match(workspace, /不会自动发布到知识库/,
  "后台必须明确待补证不是已发布知识");
assert.match(workspaceScript, /已进入待补证/,
  "单项任务应中性标注为已进入待补证");
assert.doesNotMatch(workspaceScript, /系统自动标记 · 待补证/,
  "任务记录没有来源字段时，不得把每一项误标为自动生成");
assert.match(workspace, /data-knowledge-gap-list/,
  "统一工作台必须有自动待补证任务列表");
assert.match(workspace, /data-knowledge-unanswered-list/,
  "统一工作台必须保留尚未分流问题列表");
assert.match(workspaceScript, /\/api\/admin\/knowledge-tasks/,
  "统一工作台必须读取知识任务接口");
assert.match(workspaceScript, /\/api\/admin\/unanswered\?status=all/,
  "统一工作台必须读取问题出现次数");
assert.match(workspaceScript, /feedback_downvote/,
  "点踩来源必须在后台获得独立说明");
assert.match(workspaceScript, /来源待核验，尚未发布/,
  "来源状态必须明确为待核验而非已发布");
assert.match(workspace, /admin-shell\.js\?v=1\.5\.2/,
  "后台共享壳必须使用语义化静态缓存版本");
assert.match(workspace, /workspace\.js\?v=1\.5\.2/,
  "变更后的工作台脚本必须使用语义化静态缓存版本");

console.log("knowledge gap admin UI contract passed");
