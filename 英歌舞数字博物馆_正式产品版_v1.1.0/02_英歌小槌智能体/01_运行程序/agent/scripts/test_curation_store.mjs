import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCurationStore } from "../../backend/curation-store.mjs";

const fixture = {
  schema_version: 2,
  version: 1,
  media_assets: [],
  exhibits: [{
    id: "test-exhibit",
    workflow_status: "draft",
    version: 1,
    events: [{
      id: "event-1",
      event_title: "测试英歌活动",
      date: "2026-08-29",
      location: "广东汕头",
      people_or_team: "测试英歌队",
      caption: "用于验证策展发布门禁的完整活动说明。",
      workflow_status: "draft",
      fact_review_status: "verified",
      source_review_status: "verified",
      public_fact: true,
      rights_status: "pending_authorization",
      public_media: false,
      media_file: "D:/private/candidate.jpg",
      media_sha256: "abc",
      privacy_risk: "medium",
      version: 1,
      sources: [{id:"source-1",label: "来源", url: "https://example.com", source_type: "media_report",version:1}],
    }],
  }],
};

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-curation-"));
const catalogPath = path.join(temp, "exhibits.json");
const publicPath = path.join(temp, "exhibits.public.json");
fs.writeFileSync(catalogPath, JSON.stringify(fixture), "utf8");

const store = createCurationStore({catalogPath, publicPath,allowedSourceHosts:["example.com"]});
assert.equal(store.summary().events.total, 1);
assert.equal(Object.keys(store.summary().rights).length, 0);
assert.equal(store.publicProjection().exhibits.length, 0, "草稿展览不得进入公众投影");

let invalidTransition;
try { store.updateEvent("event-1", {expected_version:1,workflow_status: "published"}); }
catch (error) { invalidTransition = error; }
assert.equal(invalidTransition?.code, "CURATION_INVALID_TRANSITION", "draft 不得直接 published");

const reviewed = store.updateEvent("event-1", {expected_version:1,workflow_status: "pending_review"});
assert.equal(reviewed.workflow_status, "pending_review");
const pendingExhibitCatalog = store.read();
pendingExhibitCatalog.exhibits[0].workflow_status = "pending_review";
fs.writeFileSync(catalogPath, JSON.stringify(pendingExhibitCatalog), "utf8");
assert.equal(store.publicProjection().exhibits.length, 0, "待审展览不得进入公众投影");

let blocked;
try { store.updateEvent("event-1", {expected_version:2,public_media: true}); }
catch (error) { blocked = error; }
assert.match(blocked?.message || "", /授权/);
assert.equal(blocked.code, "CURATION_REVIEW_BLOCKED");
assert.equal(blocked.status, 409);

const missingSourceCatalog = store.read();
missingSourceCatalog.exhibits[0].workflow_status = "published";
missingSourceCatalog.exhibits[0].reviewed_version = missingSourceCatalog.exhibits[0].version;
missingSourceCatalog.exhibits[0].events[0].sources = [];
fs.writeFileSync(catalogPath, JSON.stringify(missingSourceCatalog), "utf8");
assert.equal(store.publicProjection().exhibits.length, 0, "没有可公开活动的章节不得进入公众投影");
let missingSource;
try { store.updateEvent("event-1", {expected_version:2,workflow_status: "published"}); }
catch (error) { missingSource = error; }
assert.equal(missingSource?.code, "CURATION_PUBLISH_INCOMPLETE", "缺少合法来源的活动不得发布");

const forcedInvalidPublished = structuredClone(fixture);
forcedInvalidPublished.exhibits[0].workflow_status = "published";
forcedInvalidPublished.exhibits[0].reviewed_version = forcedInvalidPublished.exhibits[0].version;
forcedInvalidPublished.exhibits[0].events[0].workflow_status = "published";
forcedInvalidPublished.exhibits[0].events[0].reviewed_version = forcedInvalidPublished.exhibits[0].events[0].version;
forcedInvalidPublished.exhibits[0].events[0].sources = [];
fs.writeFileSync(catalogPath, JSON.stringify(forcedInvalidPublished), "utf8");
assert.equal(store.publicProjection().exhibits.length, 0, "绕过工作流写入的不完整 published 活动也不得公开");

const validPendingCatalog = structuredClone(fixture);
validPendingCatalog.exhibits[0].workflow_status = "published";
validPendingCatalog.exhibits[0].reviewed_version = validPendingCatalog.exhibits[0].version;
validPendingCatalog.exhibits[0].events[0].workflow_status = "pending_review";
validPendingCatalog.exhibits[0].events[0].sources = [{id:"source-valid",version:1,label:"机构来源", url:"https://example.com/event", source_type:"government_institution"}];

for (const invalidSources of [
  [{id:"source-invalid-1",version:1,label:"机构来源", url:"http://example.com/event", source_type:"government_institution"}],
  [{id:"source-invalid-2",version:1,label:"", url:"https://example.com/event", source_type:"government_institution"}],
  [{id:"source-invalid-3",version:1,label:"机构来源", url:"https://example.com/event", source_type:""}],
]) {
  const invalidSourceCatalog = structuredClone(validPendingCatalog);
  invalidSourceCatalog.exhibits[0].events[0].sources = invalidSources;
  fs.writeFileSync(catalogPath, JSON.stringify(invalidSourceCatalog), "utf8");
  let invalidSource;
  try { store.updateEvent("event-1", {expected_version:1,workflow_status:"published"}); }
  catch (error) { invalidSource = error; }
  assert.equal(invalidSource?.code, "CURATION_PUBLISH_INCOMPLETE", "活动来源必须包含 label、HTTPS url 和 source_type");
}

for (const field of ["event_title", "date", "location", "people_or_team", "caption"]) {
  const incompleteCatalog = structuredClone(validPendingCatalog);
  incompleteCatalog.exhibits[0].events[0][field] = " ";
  fs.writeFileSync(catalogPath, JSON.stringify(incompleteCatalog), "utf8");
  let incomplete;
  try { store.updateEvent("event-1", {expected_version:1,workflow_status:"published"}); }
  catch (error) { incomplete = error; }
  assert.equal(incomplete?.code, "CURATION_PUBLISH_INCOMPLETE", `缺少 ${field} 的活动不得发布`);
}

const unconfirmedFactCatalog = structuredClone(validPendingCatalog);
unconfirmedFactCatalog.exhibits[0].events[0].public_fact = false;
fs.writeFileSync(catalogPath, JSON.stringify(unconfirmedFactCatalog), "utf8");
let unconfirmedFact;
try { store.updateEvent("event-1", {expected_version:1,workflow_status:"published"}); }
catch (error) { unconfirmedFact = error; }
assert.equal(unconfirmedFact?.code, "CURATION_PUBLISH_INCOMPLETE", "public_fact 未确认的活动不得发布");

const publishableCatalog = structuredClone(validPendingCatalog);
fs.writeFileSync(catalogPath, JSON.stringify(publishableCatalog), "utf8");
const published = store.updateEvent("event-1", {expected_version:1,workflow_status:"published"});
assert.equal(published.workflow_status, "published");
const projection = store.confirmPublish({expected_version:2}).projection;
assert.equal(projection.exhibits[0].events.length, 1, "合法的待审活动应进入公众投影");
const publicEvent = projection.exhibits[0].events[0];
for (const privateKey of ["source_document", "source_paragraph", "media_file", "media_sha256", "privacy_risk"]) {
  assert.equal(Object.hasOwn(publicEvent, privateKey), false, `公众数据泄漏 ${privateKey}`);
}

store.updateEvent("event-1", {expected_version:2,workflow_status:"pending_review"});
assert.equal(store.publicProjection().exhibits.length, 0, "已发布活动退回待审后，空章节也必须从公众投影消失");
store.updateEvent("event-1", {expected_version:3,workflow_status:"published"});
assert.equal(store.publicProjection().exhibits.length, 0, "重新审核通过不等于已经确认发布");
assert.equal(store.previewPublish().projection.exhibits[0].events.length, 1, "重新审核通过的活动应进入发布预览");
store.confirmPublish({expected_version:4});
assert.equal(store.publicProjection().exhibits[0].events.length, 1, "独立确认发布后活动才应重新进入公众投影");
store.updateEvent("event-1", {expected_version:4,workflow_status:"withdrawn"});
assert.equal(store.publicProjection().exhibits.length, 0, "撤回最后一个活动后，章节必须从公众投影消失");
let withdrawnPublish;
try { store.updateEvent("event-1", {expected_version:5,workflow_status:"published"}); }
catch (error) { withdrawnPublish = error; }
assert.equal(withdrawnPublish?.code, "CURATION_INVALID_TRANSITION", "withdrawn 不得直接 published");

const galleryTemp=fs.mkdtempSync(path.join(os.tmpdir(),"yingge-gallery-"));
const galleryCatalogPath=path.join(galleryTemp,"exhibits.json");
const galleryPublicPath=path.join(galleryTemp,"exhibits.public.json");
const galleryFixture=structuredClone(fixture);
galleryFixture.media_assets=[
  {id:"media-wide",inventory_ref:"external/wide.jpg",dimensions:"1440x826",sha256:"a".repeat(64),rights_status:"authorized",privacy_review_status:"approved",privacy_risk:"adult_public_performance",contains_minors:false,contains_third_party_media:false,public_media:true,public_url:"assets/curation/wide.jpg",rights_holder:"确认权利人",license_scope:"允许公开展示",authorization_evidence_ref:"authorizations/wide.md",review_note:"已审核",expires_at:"2027-08-29",version:1,reviewed_version:1,published_version:1,order:0},
  {id:"media-close",inventory_ref:"external/close.jpg",dimensions:"1440x812",sha256:"b".repeat(64),rights_status:"authorized",privacy_review_status:"approved",privacy_risk:"adult_public_performance",contains_minors:false,contains_third_party_media:false,public_media:true,public_url:"assets/curation/close.jpg",rights_holder:"确认权利人",license_scope:"允许公开展示",authorization_evidence_ref:"authorizations/close.md",review_note:"已审核",expires_at:"2027-08-29",version:1,reviewed_version:1,published_version:1,order:1},
];
galleryFixture.exhibits[0].events[0].sources[0].reviewed_version=1;
galleryFixture.exhibits[0].events[0].sources[0].published_version=1;
fs.writeFileSync(galleryCatalogPath,JSON.stringify(galleryFixture),"utf8");
const galleryStore=createCurationStore({catalogPath:galleryCatalogPath,publicPath:galleryPublicPath,allowedSourceHosts:["example.com"]});
const galleryBound=galleryStore.bindMedia("event-1",{expected_version:1,media_asset_id:"media-wide",media_asset_ids:["media-wide","media-close"]},{actor:{id:"author-a",role:"author"},reason:"绑定同一活动的远景与近景"});
assert.deepEqual(galleryBound.media_asset_ids,["media-wide","media-close"],"活动应保存有序的多图绑定");
assert.ok(Object.hasOwn(galleryStore.readAudit().at(-1).field_diff,"media_asset_ids"),"多图绑定必须在审计记录中保留字段变更");
const galleryCatalog=galleryStore.read();
galleryCatalog.exhibits[0].workflow_status="published";
galleryCatalog.exhibits[0].reviewed_version=galleryCatalog.exhibits[0].version;
galleryCatalog.exhibits[0].published_version=galleryCatalog.exhibits[0].version;
const galleryEvent=galleryCatalog.exhibits[0].events[0];
galleryEvent.workflow_status="published";
galleryEvent.fact_review_status="verified";
galleryEvent.source_review_status="verified";
galleryEvent.public_fact=true;
galleryEvent.reviewed_version=galleryEvent.version;
galleryEvent.published_version=galleryEvent.version;
fs.writeFileSync(galleryCatalogPath,JSON.stringify(galleryCatalog),"utf8");
const galleryProjection=galleryStore.publicProjection();
assert.deepEqual(galleryProjection.exhibits[0].events[0].media_urls,["assets/curation/wide.jpg","assets/curation/close.jpg"],"公众投影应只输出按活动绑定顺序的已发布图片");
assert.equal(galleryProjection.exhibits[0].events[0].media_url,"assets/curation/wide.jpg","首图应继续兼容既有媒体字段");

console.log("curation store ok");
