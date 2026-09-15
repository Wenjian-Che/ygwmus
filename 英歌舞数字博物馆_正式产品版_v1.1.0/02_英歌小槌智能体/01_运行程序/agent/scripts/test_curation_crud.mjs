import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCurationStore } from "../../backend/curation-store.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-curation-crud-"));
const catalogPath = path.join(temp, "exhibits.json");
const publicPath = path.join(temp, "exhibits.public.json");
fs.writeFileSync(catalogPath, JSON.stringify({schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],media_assets:[],exhibits:[]}), "utf8");

let id = 0;
const store = createCurationStore({
  catalogPath,
  publicPath,
  now:() => "2026-08-29T01:00:00.000Z",
  idFactory:prefix => `${prefix}-${++id}`,
  allowedSourceHosts:["example.com"],
});

const exhibit = store.createExhibit({
  expected_version:1,
  title:"英歌出海补充章节",
  summary:"只使用已经核验的跨国传播材料。",
  boundary_note:"不把个案外推为所有英歌队伍的共同路径。",
  audience_summary:"从三次真实交流认识英歌如何进入新的社区。",
  student_takeaway:"传播不只是演出，也包括共同学习与在地组队。",
  research_note:"本章节只采用已登记的政府与媒体来源。",
});
assert.equal(exhibit.id, "exhibit-1");
assert.equal(exhibit.workflow_status, "draft");
assert.equal(exhibit.version, 1);
assert.equal(exhibit.updated_at, "2026-08-29T01:00:00.000Z");

const event = store.createEvent(exhibit.id, {
  expected_version:1,
  event_title:"曼谷共同表演",
  date:"2024-05-01",
  location:"泰国曼谷",
  people_or_team:"普宁富美青年英歌队、泰国文益英歌队",
  caption:"两支队伍在曼谷共同表演。",
  audience_summary:"两支队伍在同一场活动中共同表演。",
  student_takeaway:"文化交流会改变谁在学习和表演。",
  research_note:"活动事实仍须由已登记来源支持。",
});
assert.equal(event.id, "event-2");
assert.equal(event.workflow_status, "draft");
assert.equal(event.version, 1);
assert.deepEqual(event.sources, []);
assert.equal(event.media_asset_id, null);

const source = store.addSource(event.id, {
  expected_version:1,
  label:"机构活动页面",
  url:"https://example.com/yingge-event",
  source_type:"government_institution",
  supported_claim:"支持活动时间、地点与参与队伍",
  source_document:"evidence/source.docx",
  source_paragraph:"段落 2-13",
  publication:"机构官网",
  accessed_at:"2026-08-29",
});
assert.equal(source.id, "source-3");
assert.equal(source.version, 1);
assert.equal(source.url, "https://example.com/yingge-event");
assert.equal(source.supported_claim,"支持活动时间、地点与参与队伍");
assert.equal(source.source_document,"evidence/source.docx");

const media = store.createMedia({
  expected_version:4,
  label:"曼谷共同表演候选图",
  inventory_ref:"pre-2025-media/image1.jpeg",
  dimensions:"1265x843",
  sha256:"07b849ffe11680d705abd93b96ba99f2bc94ba3c19adf421d38416d67efc3b6e",
  source_document:"evidence/source.docx",
  source_paragraph:"图片锚点 3",
  publication:"一手合作材料",
  accessed_at:"2026-08-29",
  rights_holder:"待确认",
  license_scope:"尚未取得公开传播授权",
  authorization_evidence_ref:"authorizations/pending/image1.md",
  expires_at:"2027-08-29",
});
assert.equal(media.id, "media-4");
assert.equal(media.rights_status, "pending_authorization");
assert.equal(media.privacy_review_status, "unreviewed");
assert.equal(media.authorization_evidence_ref,"authorizations/pending/image1.md");
const adminView = store.adminProjection();
assert.equal(adminView.catalog.media_assets[0].inventory_ref, "pre-2025-media/image1.jpeg");
assert.equal(JSON.stringify(adminView).includes("D:/private"), false, "管理 API 不得返回内部绝对路径");
assert.equal(adminView.catalog.version, 5);

const bound = store.bindMedia(event.id, {expected_version:2, media_asset_id:media.id});
assert.equal(bound.media_asset_id, media.id);
assert.equal(bound.version, 3);

let stale;
try { store.updateEvent(event.id, {expected_version:2, caption:"过期写入"}); }
catch (error) { stale = error; }
assert.equal(stale?.code, "CURATION_VERSION_CONFLICT", "旧版本不得覆盖活动");

const edited = store.updateEvent(event.id, {expected_version:3, caption:"更新后的展览说明。", audience_summary:"公众首先看到这一层说明。"});
assert.equal(edited.caption, "更新后的展览说明。");
assert.equal(edited.version, 4);

const editedExhibit = store.updateExhibit(exhibit.id, {expected_version:2, title:"英歌出海教学章节", student_takeaway:"学生应能区分演出、交流与在地组队。"});
assert.equal(editedExhibit.title, "英歌出海教学章节");
assert.equal(editedExhibit.version, 3);

const editedSource = store.updateSource(source.id, {expected_version:1, label:"更新后的机构活动页面"});
assert.equal(editedSource.label, "更新后的机构活动页面");
assert.equal(editedSource.version, 2);

const reviewedMedia = store.updateMedia(media.id, {expected_version:1, rights_status:"authorized", privacy_review_status:"approved", public_url:"https://example.com/media.jpg"});
assert.equal(reviewedMedia.rights_status, "authorized");
assert.equal(reviewedMedia.privacy_review_status, "approved");
assert.equal(reviewedMedia.version, 2);
let invalidAuthorizationRef;
try { store.updateMedia(media.id,{expected_version:2,authorization_evidence_ref:"../secret.txt"}); } catch(error){invalidAuthorizationRef=error;}
assert.equal(invalidAuthorizationRef?.code,"CURATION_INVALID_INPUT");

const secondEvent = store.createEvent(exhibit.id, {expected_version:3,event_title:"第二个草稿活动"});
const reorderedEvents = store.reorderEvents(exhibit.id, {expected_version:4, ids:[secondEvent.id,event.id]});
assert.deepEqual(reorderedEvents.map(item => item.id), [secondEvent.id,event.id]);
assert.deepEqual(reorderedEvents.map(item => item.order), [0,1]);

const secondSource = store.addSource(event.id, {expected_version:5,label:"第二来源",url:"https://example.com/second",source_type:"media_report",supported_claim:"补充活动背景"});
const reorderedSources = store.reorderSources(event.id, {expected_version:6,ids:[secondSource.id,source.id]});
assert.deepEqual(reorderedSources.map(item => item.id), [secondSource.id,source.id]);

const secondExhibit = store.createExhibit({expected_version:14,title:"第二草稿章节",audience_summary:"草稿。",student_takeaway:"草稿。"});
const reorderedExhibits = store.reorderExhibits({expected_version:15,ids:[secondExhibit.id,exhibit.id]});
assert.deepEqual(reorderedExhibits.map(item => item.id), [secondExhibit.id,exhibit.id]);

const secondMedia = store.createMedia({expected_version:16,label:"第二候选图",inventory_ref:"pre-2025-media/image2.jpeg",dimensions:"800x600",sha256:"17b849ffe11680d705abd93b96ba99f2bc94ba3c19adf421d38416d67efc3b6e"});
const reorderedMedia = store.reorderMedia({expected_version:17,ids:[secondMedia.id,media.id]});
assert.deepEqual(reorderedMedia.map(item => item.id), [secondMedia.id,media.id]);

const copiedEvent = store.copyEvent(secondEvent.id, {expected_version:1});
assert.equal(copiedEvent.id, "event-9");
assert.equal(copiedEvent.workflow_status, "draft");
assert.equal(copiedEvent.media_asset_id, null);
assert.match(copiedEvent.event_title, /副本/);

const copiedExhibit = store.copyExhibit(secondExhibit.id, {expected_version:1});
assert.equal(copiedExhibit.id, "exhibit-10");
assert.equal(copiedExhibit.workflow_status, "draft");
assert.match(copiedExhibit.title, /副本/);

assert.equal(store.deleteEvent(copiedEvent.id, {expected_version:1}), true);
assert.equal(store.deleteExhibit(copiedExhibit.id, {expected_version:1}), true);
assert.equal(store.deleteMedia(secondMedia.id, {expected_version:1}), true);

const currentCatalog = store.read();
const currentEvent = currentCatalog.exhibits.flatMap(item => item.events).find(item => item.id === event.id);
let referencedEventDelete;
try { store.deleteEvent(event.id, {expected_version:currentEvent.version}); }
catch (error) { referencedEventDelete = error; }
assert.equal(referencedEventDelete?.code, "CURATION_DELETE_BLOCKED");

const currentMedia = currentCatalog.media_assets.find(item => item.id === media.id);
let referencedMediaDelete;
try { store.deleteMedia(media.id, {expected_version:currentMedia.version}); }
catch (error) { referencedMediaDelete = error; }
assert.equal(referencedMediaDelete?.code, "CURATION_DELETE_BLOCKED");

assert.equal(store.deleteSource(source.id, {expected_version:2}), true);
assert.equal(store.read().exhibits.flatMap(item => item.events).find(item => item.id === event.id).sources.length, 1);
const unbound = store.bindMedia(event.id, {expected_version:8,media_asset_id:null});
assert.equal(unbound.media_asset_id, null);
assert.equal(store.deleteMedia(media.id, {expected_version:2}), true);

for (const invalidPatch of [
  {expected_version:9,unknown_field:"x"},
  {expected_version:9,event_title:"x".repeat(121)},
  {expected_version:9,date:"2024-99-99"},
  JSON.parse('{"expected_version":9,"__proto__":{"polluted":true}}'),
]) {
  let invalid;
  try { store.updateEvent(event.id, invalidPatch); }
  catch (error) { invalid = error; }
  assert.equal(invalid?.code, "CURATION_INVALID_INPUT");
}
assert.equal({}.polluted, undefined);

let illegalUrl;
try { store.addSource(event.id, {expected_version:9,label:"非法来源",url:"http://example.com",source_type:"media_report"}); }
catch (error) { illegalUrl = error; }
assert.equal(illegalUrl?.code, "CURATION_INVALID_INPUT");

let missingMedia;
try { store.bindMedia(event.id, {expected_version:9,media_asset_id:"media-missing"}); }
catch (error) { missingMedia = error; }
assert.equal(missingMedia?.code, "CURATION_INVALID_INPUT");

for (const invalidSource of [
  {source_document:"D:/private/source.docx"},
  {accessed_at:"2026-99-99"},
]) {
  let error;
  try { store.updateSource(secondSource.id,{expected_version:secondSource.version,...invalidSource}); } catch(caught){error=caught;}
  assert.equal(error?.code,"CURATION_INVALID_INPUT");
}

console.log("curation CRUD ok");
