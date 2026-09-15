import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCurationStore } from "../../backend/curation-store.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const dataPath = path.join(root, "content", "curation", "exhibits.json");

assert.ok(fs.existsSync(dataPath), "策展数据文件尚未建立");

const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
assert.equal(payload.schema_version, 2);
assert.ok(Number.isInteger(payload.version));
assert.equal(payload.exhibits[0]?.id, "yingge-across-borders");

const required = [
  "event_title", "date", "location", "people_or_team", "caption",
  "audience_summary", "student_takeaway", "research_note", "media_asset_id",
  "fact_review_status", "source_review_status", "workflow_status", "version", "updated_at",
];

const events = payload.exhibits[0]?.events || [];
assert.ok(events.length >= 3, "首展至少应有泰国、马来西亚、新加坡三个真实事件");
for (const event of events) {
  for (const key of required) assert.ok(Object.hasOwn(event, key), `${event.id || "未命名事件"} 缺少 ${key}`);
  assert.ok(["draft", "pending_review", "published", "withdrawn"].includes(event.workflow_status));
  assert.ok(event.sources.length >= 1);
  for (const source of event.sources) for (const key of ["id","label","url","source_type","version"]) assert.ok(Object.hasOwn(source,key), `${event.id} 的来源缺少 ${key}`);
  assert.ok(payload.media_assets.some(media => media.id === event.media_asset_id), `${event.id} 的媒体引用无效`);
}
const publishedMediaIds = [];
for (const media of payload.media_assets) {
  for (const key of ["id","inventory_ref","sha256","source_document","source_paragraph","rights_status","privacy_review_status","version"]) assert.ok(Object.hasOwn(media,key), `${media.id} 缺少 ${key}`);
  if (media.public_media) publishedMediaIds.push(media.id);
}
assert.equal(publishedMediaIds.length,3,"应有两张曼谷现场图与一张柔佛在地组队现场图完成授权、隐私复核和发布");
const publishedInventoryRefs=payload.media_assets.filter(media=>publishedMediaIds.includes(media.id)).map(media=>media.inventory_ref).sort();
assert.deepEqual(publishedInventoryRefs,["external-public/th-embassy-2024-05-photo-03.jpg","external-public/th-embassy-2024-05-photo-04.jpg","pre-2025-media/image19.jpeg"],"公众图片必须绑定已登记的活动候选图");

const publicDataPath = path.join(root, "web", "data", "exhibits.public.json");
const store = createCurationStore({catalogPath:dataPath, publicPath:publicDataPath});
const generatedProjection = store.publicProjection();
const persistedProjection = JSON.parse(fs.readFileSync(publicDataPath, "utf8"));
delete generatedProjection.generated_at;
delete persistedProjection.generated_at;
assert.deepEqual(persistedProjection, generatedProjection, "公众 JSON 必须由 store 的同一投影生成");
assert.doesNotMatch(JSON.stringify(persistedProjection), /source_document|source_paragraph|inventory_ref|media_file|media_sha256|privacy_risk|rights_holder|license_scope|authorization_evidence_ref|reviewer|reviewed_at|CURATION_PRIVATE_MEDIA_ROOT/, "公众 JSON 泄漏内部策展或私有媒体字段");
const thailandEvent=persistedProjection.exhibits.flatMap(exhibit=>exhibit.events).find(event=>event.id==="thailand-2024-cultural-visit");
assert.equal(thailandEvent?.public_media,true,"已发布的曼谷现场图必须进入同一公众投影");
assert.deepEqual(thailandEvent?.media_urls,["assets/curation/thailand-2024-performance-wide.jpg","assets/curation/thailand-2024-performance-close.jpg"]);
assert.equal(thailandEvent?.media_url,thailandEvent?.media_urls?.[0],"兼容图片字段必须保持为画廊首图");

const publicExhibit = path.join(root, "web", "spread.html");
assert.ok(fs.existsSync(publicExhibit), "公众端真实展厅尚未建立");
const html = fs.readFileSync(publicExhibit, "utf8");
const spreadJs = fs.readFileSync(path.join(root, "web", "spread.js"), "utf8");
assert.match(html, /英歌出海/);
assert.doesNotMatch(html, /DRAFT|待补|字段|二级页面|source_paragraph/);
assert.doesNotMatch(html, /[—–]/, "公众文案不得使用破折号作为设计符号");
for (const text of ["核验来源","这一场如何发生","共同表演","继续交流"]) assert.match(`${html}\n${spreadJs}`,new RegExp(text),`公众专题缺少可信叙事：${text}`);
assert.match(spreadJs,/source-card/,"待授权图片降级时应直接展示文字来源卡");
assert.match(spreadJs,/media-awaiting/,"待授权图片必须使用安全占位");
assert.match(spreadJs,/safeMediaUrl/,"公众端必须再次校验图片 URL");
assert.match(spreadJs,/media_urls/,"跨国传播展厅必须能呈现同一活动中已审核的多张现场图片");
assert.doesNotMatch(`${html}\n${spreadJs}`,/source_document|source_paragraph|inventory_ref|sha256|authorization_evidence_ref|review_note/);
const collection = fs.readFileSync(path.join(root, "web", "content.html"), "utf8");
const app = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
assert.match(`${collection}\n${app}`, /href=["']spread\.html["']/, "馆藏总览尚未接入真实事件专题");
for (const page of ["watch.html","characters.html"]) {
  const content=fs.readFileSync(path.join(root,"web",page),"utf8")+"\n"+app;
  assert.match(content,/assets\/curation\/thailand-2024-performance-close\.jpg/,`${page} 尚未换用已审核的真实英歌人物影像`);
  assert.match(content,/中国驻泰国使馆报道/,`${page} 缺少简洁图片来源说明`);
}

console.log(`curation slice ok: ${events.length} events`);
