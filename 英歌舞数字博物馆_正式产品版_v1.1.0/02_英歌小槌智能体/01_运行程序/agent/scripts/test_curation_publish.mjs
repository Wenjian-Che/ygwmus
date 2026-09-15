import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCurationStore } from "../../backend/curation-store.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-curation-publish-"));
const catalogPath = path.join(temp, "exhibits.json");
const publicPath = path.join(temp, "exhibits.public.json");
const event = {
  id:"event-one",event_title:"曼谷共同表演",date:"2024-05-01",location:"泰国曼谷",people_or_team:"两支英歌队",caption:"两支队伍共同表演。",
  audience_summary:"从共同表演认识跨国交流。",student_takeaway:"交流会改变谁在学习和表演。",research_note:"只采用已登记来源。",
  workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true,rights_status:"pending_authorization",privacy_review_status:"unreviewed",privacy_risk:"medium",public_media:false,media_asset_id:null,
  ever_published:true,version:1,reviewed_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0,
  sources:[{id:"source-one",label:"机构来源",url:"https://example.com/event",source_type:"government_institution",supported_claim:"活动日期与参与主体",version:1,reviewed_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0}],
};
const exhibit = {
  id:"exhibit-one",title:"英歌出海",summary:"真实事件时间线。",boundary_note:"不外推个案。",chapter_type:"cross_border_timeline",
  audience_summary:"三次交流呈现传播路径。",student_takeaway:"传播包含演出、学习和组队。",research_note:"研究注释折叠显示。",
  workflow_status:"published",ever_published:true,version:1,reviewed_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0,events:[event],
};
fs.writeFileSync(catalogPath, JSON.stringify({schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],media_assets:[],exhibits:[exhibit]}), "utf8");
fs.writeFileSync(publicPath, JSON.stringify({schema_version:2,generated_at:"2026-08-29T00:00:00.000Z",exhibits:[]}), "utf8");

const store = createCurationStore({catalogPath,publicPath,now:()=>"2026-08-29T01:00:00.000Z",allowedSourceHosts:["example.com"]});
const preview = store.previewPublish();
assert.deepEqual(preview.changes.exhibits.added, ["exhibit-one"]);
assert.deepEqual(preview.changes.events.added, ["event-one"]);
assert.equal(JSON.parse(fs.readFileSync(publicPath,"utf8")).exhibits.length, 0, "预览不得写入公众 JSON");

const published = store.confirmPublish({expected_version:1});
assert.deepEqual(store.readPublished(), published.projection);
assert.equal(published.projection.exhibits[0].student_takeaway, exhibit.student_takeaway);
assert.equal(published.projection.exhibits[0].events[0].research_note, event.research_note);
assert.equal(published.projection.exhibits[0].events[0].media_asset_id, undefined);

const updated = store.updateEvent("event-one", {expected_version:1,date:"2024-05-02"});
assert.equal(updated.version, 2);
assert.equal(updated.workflow_status,"pending_review","已发布事实变更必须退回待审");
assert.equal(updated.fact_review_status,"unverified");
assert.equal(updated.source_review_status,"unverified");
assert.equal(updated.public_fact,false);
assert.equal(store.readPublished().exhibits[0].events[0].date,event.date,"普通保存不能改动公众快照");
const changedPreview = store.previewPublish();
assert.deepEqual(changedPreview.changes.events.removed,["event-one"]);
assert.deepEqual(changedPreview.changes.events.details["event-one"].fields.date,{before:"2024-05-01",after:undefined});
assert.equal(changedPreview.review_context.events["event-one"].date,"2024-05-02");
assert.equal(changedPreview.review_context.events["event-one"].sources[0].supported_claim,"活动日期与参与主体");
assert.throws(() => store.confirmPublish({expected_version:1}), error => error.status === 409);
const rereviewed=store.updateEvent("event-one",{expected_version:2,workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true});
assert.equal(rereviewed.reviewed_version,3);
store.confirmPublish({expected_version:3});
assert.equal(store.readPublished().exhibits[0].events[0].date,"2024-05-02");

const withdrawn = store.updateEvent("event-one", {expected_version:3,workflow_status:"withdrawn"});
assert.equal(withdrawn.workflow_status, "withdrawn");
assert.equal(store.readPublished().exhibits[0].events.length, 1, "撤回需经确认发布才影响公众快照");
const withdrawalPreview = store.previewPublish();
assert.deepEqual(withdrawalPreview.changes.events.removed, ["event-one"]);
store.confirmPublish({expected_version:4});
assert.equal(store.readPublished().exhibits.length,0,"最后一个公开活动撤回后不得发布空章节");

console.log("curation publish workflow ok");
