import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const sourceHtmlPath = path.join(root, "integrations", "framework", ".next", "server", "app", "index.html");
const publicHtmlPath = path.join(root, "web", "framework.html");
const shellHtmlPath = path.join(root, "web", "framework-museum.html");
const shellCssPath = path.join(root, "web", "framework-shell.css");
const shellJsPath = path.join(root, "web", "framework-shell.js");
const homePath = path.join(root, "web", "index.html");
const adminContentPath = path.join(root, "web", "admin", "content.html");

assert.ok(fs.existsSync(sourceHtmlPath), "解压后的框架构建入口必须存在");
assert.ok(fs.existsSync(publicHtmlPath), "必须生成独立的二级页面入口 web/framework.html");

const sourceHtml = fs.readFileSync(sourceHtmlPath);
const publicHtml = fs.readFileSync(publicHtmlPath);
assert.deepEqual(publicHtml, sourceHtml, "二级页面必须原样使用框架构建结果，不得改动其内容或动画");

const html = publicHtml.toString("utf8");
const assetRefs = [...html.matchAll(/(?:src|href)="(\/(?:_next|images)\/[^"?#]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
assert.ok(assetRefs.length > 0, "框架页面应包含构建脚本或图片资源");
for (const assetRef of assetRefs) {
  const assetPath = path.join(root, "web", decodeURIComponent(assetRef));
  assert.ok(fs.existsSync(assetPath), `框架资源缺失：${assetRef}`);
}

const home = fs.readFileSync(homePath, "utf8");
assert.match(home, /<a href="framework-museum\.html">专题展馆<\/a>/, "首页导航必须指向带博物馆导航的专题展馆入口");

assert.ok(fs.existsSync(shellHtmlPath), "必须提供不改动原框架的博物馆集成外壳");
assert.ok(fs.existsSync(shellCssPath), "必须提供专题展馆外壳样式");
assert.ok(fs.existsSync(shellJsPath), "必须提供专题展馆导航与智能体交互脚本");

const shellHtml = fs.readFileSync(shellHtmlPath, "utf8");
assert.match(shellHtml, /<iframe[^>]+src="framework\.html"/, "外壳必须以 iframe 原样承载框架页面");
assert.match(shellHtml, /href="index\.html"[^>]*>[^<]*首页/, "顶部导航必须能返回数字博物馆首页");
assert.match(shellHtml, /data-framework-agent-open/, "专题展馆必须提供英歌小槌入口");
assert.match(shellHtml, /id="frameworkAgentPanel"/, "专题展馆必须提供可收起的智能体对话面板");
assert.equal((shellHtml.match(/assets\/ygw-xiaochui\.png/g) || []).length, 2, "专题导航和对话面板必须统一使用指定的英歌小槌形象");
assert.ok(fs.existsSync(path.join(root, "web", "assets", "ygw-xiaochui.png")), "指定的英歌小槌资源必须进入项目资产目录");

const shellJs = fs.readFileSync(shellJsPath, "utf8");
assert.match(shellJs, /\/api\/agent/, "专题展馆智能体必须接入既有问答服务");
assert.match(shellJs, /fetch\(`\$\{api\}\/chat`/, "专题展馆智能体必须调用既有聊天接口");
for (const selector of ["sectionShowcase", "sectionIntro", "section03ScrollTrack", "sectionFeature", "sectionVideos"]) {
  assert.match(shellJs, new RegExp(selector), `智能体必须理解专题页章节：${selector}`);
}
assert.doesNotMatch(shellJs, /\.innerHTML\s*=/, "动态问答内容不得通过 innerHTML 注入");

const shellCss = fs.readFileSync(shellCssPath, "utf8");
assert.match(shellCss, /--deep:\s*#243229/, "专题导航必须沿用数字博物馆螺青主色");
assert.match(shellCss, /museum-shell-nav[^}]+rgba\(37,51,41/, "专题导航必须沿用主站深绿毛玻璃材质");

const adminContent = fs.readFileSync(adminContentPath, "utf8");
assert.doesNotMatch(adminContent, /木疙瘩 H5 接入位置|木疙瘩素材到位后|href="mugeda\.html"/, "已接入的木疙瘩 H5 不得继续显示为预留位");
assert.equal(fs.existsSync(path.join(root, "web", "mugeda.html")), false, "旧木疙瘩占位跳转页应删除");

console.log("framework integration ok");
