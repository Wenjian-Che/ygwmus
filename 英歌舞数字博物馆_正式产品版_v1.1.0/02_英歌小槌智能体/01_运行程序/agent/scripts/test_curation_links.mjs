import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const web = path.join(root, "web");
const pages = ["spread.html", path.join("admin", "curation.html")];

for (const page of pages) {
  const pagePath = path.join(web, page);
  const html = fs.readFileSync(pagePath, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|data:)/.test(ref)) continue;
    const resolved = path.resolve(path.dirname(pagePath), ref);
    assert.ok(resolved.startsWith(web), `${page} 引用了站点目录外文件：${ref}`);
    assert.ok(fs.existsSync(resolved), `${page} 本地资源不存在：${ref}`);
  }
}

const catalog = JSON.parse(fs.readFileSync(path.join(web, "data", "exhibits.public.json"), "utf8"));
for (const event of catalog.exhibits.flatMap(exhibit => exhibit.events)) {
  if (event.public_media) {
    const mediaUrls=Array.isArray(event.media_urls) ? event.media_urls : [event.media_url];
    assert.ok(mediaUrls.length,"已发布活动必须至少有一张受控公开图片");
    assert.equal(event.media_url,mediaUrls[0],"兼容字段必须始终指向活动画廊第一张图片");
    for (const mediaUrl of mediaUrls) {
      assert.match(mediaUrl,/^assets\/curation\/[A-Za-z0-9._/-]+$/,"已发布图片必须使用受控本站资源地址");
      assert.ok(fs.existsSync(path.join(web,mediaUrl)),event.id+" 的已发布图片文件不存在");
    }
  }
  assert.ok(event.sources.length, `${event.id} 缺少公开来源`);
  for (const source of event.sources) assert.match(source.url, /^https:\/\//, `${event.id} 来源不是 HTTPS`);
  assert.equal(Object.hasOwn(event, "media_file"), false, `${event.id} 泄露内部媒体路径`);
  assert.equal(Object.hasOwn(event, "media_sha256"), false, `${event.id} 泄露内部媒体哈希`);
}

console.log(`curation links ok: ${pages.length} pages`);
