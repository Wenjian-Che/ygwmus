import fs from "node:fs";
import path from "node:path";

function configurationError(message) {
  return Object.assign(new Error(message), { code: "PUBLIC_WEB_ROOT_INVALID" });
}

function isReadableDirectory(directory) {
  try {
    return fs.statSync(directory).isDirectory()
      && (fs.accessSync(directory, fs.constants.R_OK), true);
  } catch {
    return false;
  }
}

function looksLikePublicWebRoot(directory) {
  if (!isReadableDirectory(directory)) return false;
  try {
    return fs.statSync(path.join(directory, "index.html")).isFile()
      && fs.statSync(path.join(directory, "app.js")).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve the public site paired with a runtime without ever deriving it from
 * private-state paths.  The explicit environment setting wins; compatibility
 * fallbacks are used only when they look like a real public web root.
 */
export function resolvePublicWebRoot({ env = process.env, projectRoot } = {}) {
  if (!projectRoot) throw new TypeError("projectRoot is required");
  const runtimeRoot = path.resolve(projectRoot);
  const configured = String(env.YINGGE_PUBLIC_WEB_ROOT || "").trim();
  if (configured) {
    if (!path.isAbsolute(configured)) throw configurationError("YINGGE_PUBLIC_WEB_ROOT 必须是绝对路径");
    return Object.freeze({ root: path.resolve(configured), source: "environment" });
  }

  const candidates = [
    { root: path.resolve(runtimeRoot, "..", "web"), source: "release-sibling" },
    { root: path.resolve(runtimeRoot, "..", "..", "01_公众网站"), source: "formal-package" },
    { root: path.join(runtimeRoot, "web"), source: "legacy-runtime" },
  ];
  const detected = candidates.find((candidate) => looksLikePublicWebRoot(candidate.root));
  if (detected) return Object.freeze(detected);

  // Keep an old release diagnosable: preflight will turn this canonical target
  // into an explicit deployment failure instead of silently selecting a random
  // directory or a private-state location.
  return Object.freeze(candidates[0]);
}

export function assertPublicWebRootReadable(webRoot) {
  const root = path.resolve(String(webRoot || ""));
  let stat;
  try { stat = fs.statSync(root); } catch { throw configurationError("缺少公众网站目录"); }
  if (!stat.isDirectory()) throw configurationError("公众网站根路径不是目录");
  try { fs.accessSync(root, fs.constants.R_OK); }
  catch { throw configurationError("服务账户无权读取公众网站目录"); }
  for (const name of ["index.html", "app.js"]) {
    const file = path.join(root, name);
    let fileStat;
    try { fileStat = fs.statSync(file); } catch { throw configurationError(`公众网站入口文件缺失：${name}`); }
    if (!fileStat.isFile()) throw configurationError(`公众网站入口文件不是普通文件：${name}`);
    try { fs.accessSync(file, fs.constants.R_OK); }
    catch { throw configurationError(`服务账户无权读取公众网站入口文件：${name}`); }
  }
  return root;
}
