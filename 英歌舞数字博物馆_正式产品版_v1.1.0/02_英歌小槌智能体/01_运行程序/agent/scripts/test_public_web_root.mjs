import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertPublicWebRootReadable, resolvePublicWebRoot } from "../../backend/public-web-root.mjs";

function makePublicSite(root) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "index.html"), "<!doctype html><script src=\"app.js\"></script>\n");
  fs.writeFileSync(path.join(root, "app.js"), "window.YinggeMuseum=true;\n");
}

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-public-web-root-"));
try {
  const formalRuntimeRoot = path.join(sandbox, "formal", "02_英歌小槌智能体", "01_运行程序");
  const formalWebRoot = path.join(sandbox, "formal", "01_公众网站");
  makePublicSite(formalWebRoot);
  assert.deepEqual(
    resolvePublicWebRoot({ env: {}, projectRoot: formalRuntimeRoot }),
    { root: path.resolve(formalWebRoot), source: "formal-package" },
    "正式包运行程序应使用同包 01_公众网站，而非不存在的 runtime/web",
  );

  const releaseRuntimeRoot = path.join(sandbox, "release", "current", "runtime");
  const releaseWebRoot = path.join(sandbox, "release", "current", "web");
  makePublicSite(releaseWebRoot);
  assert.deepEqual(
    resolvePublicWebRoot({ env: {}, projectRoot: releaseRuntimeRoot }),
    { root: path.resolve(releaseWebRoot), source: "release-sibling" },
    "正式 release 应使用 current/web",
  );

  const configuredWebRoot = path.join(sandbox, "configured-web");
  makePublicSite(configuredWebRoot);
  assert.deepEqual(
    resolvePublicWebRoot({ env: { YINGGE_PUBLIC_WEB_ROOT: configuredWebRoot }, projectRoot: releaseRuntimeRoot }),
    { root: path.resolve(configuredWebRoot), source: "environment" },
    "显式配置必须优先于自动兼容路径",
  );
  assert.throws(
    () => resolvePublicWebRoot({ env: { YINGGE_PUBLIC_WEB_ROOT: "relative-web" }, projectRoot: releaseRuntimeRoot }),
    /YINGGE_PUBLIC_WEB_ROOT.*绝对路径/,
  );
  assertPublicWebRootReadable(configuredWebRoot);
  const emptyWebRoot = path.join(sandbox, "empty-web");
  fs.mkdirSync(emptyWebRoot, { recursive: true });
  assert.throws(() => assertPublicWebRootReadable(emptyWebRoot), /公众网站入口文件/,
    "存在但缺少正式入口文件的目录不能通过生产预检");
  assert.throws(() => assertPublicWebRootReadable(path.join(sandbox, "missing-web")), /缺少公众网站目录/);
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log("formal and release public web root resolution contract ok");
