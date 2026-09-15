import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createCurationStore} from "../../backend/curation-store.mjs";

function fixture() {
  const source={id:"source-one",label:"原来源",url:"https://example.com/original",source_type:"government_institution",supported_claim:"活动日期与地点",version:1,reviewed_version:1,published_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0};
  const event={id:"event-one",event_title:"核验活动",date:"2024-05-01",location:"曼谷",people_or_team:"测试队伍",caption:"已核验说明",audience_summary:"公众摘要",student_takeaway:"学生要点",research_note:"研究注释",workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true,media_asset_id:null,public_media:false,ever_published:true,version:1,reviewed_version:1,published_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0,sources:[source]};
  const exhibit={id:"exhibit-one",title:"英歌出海",summary:"摘要",boundary_note:"边界",audience_summary:"公众导语",student_takeaway:"学生要点",research_note:"研究注释",workflow_status:"published",ever_published:true,version:1,reviewed_version:1,published_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0,events:[event]};
  return {schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],media_assets:[],exhibits:[exhibit]};
}

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"yingge-review-governance-"));
const catalogPath=path.join(temp,"catalog.json");
const publicPath=path.join(temp,"public.json");
fs.writeFileSync(catalogPath,JSON.stringify(fixture()),"utf8");
const store=createCurationStore({catalogPath,publicPath,now:()=>"2026-08-29T02:00:00.000Z",allowedSourceHosts:["example.com"]});
assert.equal(store.publicProjection().exhibits.length,1,"已复核且已确认发布的 seed 应进入公众投影");
const unconfirmed=fixture();
delete unconfirmed.exhibits[0].events[0].published_version;
fs.writeFileSync(catalogPath,JSON.stringify(unconfirmed),"utf8");
assert.equal(store.publicProjection().exhibits.length,0,"仅有 reviewed_version 的活动不得进入公众投影");
assert.equal(store.previewPublish().projection.exhibits.length,1,"已复核未确认的活动必须能进入发布预览");
fs.writeFileSync(catalogPath,JSON.stringify(fixture()),"utf8");
store.confirmPublish({expected_version:1});

const changedSource=store.updateSource("source-one",{expected_version:1,url:"https://example.com/revised"});
assert.equal(changedSource.version,2);
const afterSource=store.read().exhibits[0].events[0];
assert.equal(afterSource.workflow_status,"pending_review","已核验来源变更必须退回活动审核");
assert.equal(afterSource.source_review_status,"unverified");
assert.equal(afterSource.fact_review_status,"unverified");
assert.equal(afterSource.public_fact,false);
assert.equal(afterSource.sources[0].reviewed_version,0);
assert.equal(store.previewPublish().projection.exhibits.length,0,"变更来源不得沿用旧审核进入下一快照");
assert.equal(store.previewPublish().review_context.events["event-one"].sources[0].url,"https://example.com/revised");

const mediaCatalog=fixture();
mediaCatalog.media_assets=[{id:"media-one",label:"已授权影像",inventory_ref:"candidate/media.jpg",dimensions:"1200x800",sha256:"a".repeat(64),rights_status:"authorized",privacy_review_status:"approved",privacy_risk:"low",public_media:true,public_url:"https://example.com/media-old.jpg",ever_published:true,version:1,reviewed_version:1,published_version:1,updated_at:"2026-08-29T00:00:00.000Z",order:0}];
mediaCatalog.exhibits[0].events[0].media_asset_id="media-one";
const mediaCatalogPath=path.join(temp,"media-catalog.json");
const mediaPublicPath=path.join(temp,"media-public.json");
fs.writeFileSync(mediaCatalogPath,JSON.stringify(mediaCatalog),"utf8");
const mediaStore=createCurationStore({catalogPath:mediaCatalogPath,publicPath:mediaPublicPath,now:()=>"2026-08-29T03:00:00.000Z",allowedSourceHosts:["example.com"]});
mediaStore.confirmPublish({expected_version:1});
const changedMedia=mediaStore.updateMedia("media-one",{expected_version:1,public_url:"https://example.com/media-new.jpg"});
assert.equal(changedMedia.rights_status,"pending_authorization","已授权媒体关键字段变更必须重置授权");
assert.equal(changedMedia.privacy_review_status,"unreviewed");
assert.equal(changedMedia.public_media,false);
assert.equal(changedMedia.reviewed_version,0);
const mediaPreview=mediaStore.previewPublish();
assert.equal(mediaPreview.projection.exhibits[0].events[0].public_media,false);
assert.equal(mediaPreview.projection.exhibits[0].events[0].media_url,undefined,"新媒体 URL 未重新审核前不得进入公众投影");
assert.equal(mediaPreview.review_context.events["event-one"].media[0].public_url,"https://example.com/media-new.jpg");
assert.equal(mediaPreview.review_context.events["event-one"].media[0].rights_status,"pending_authorization");
assert.equal(mediaPreview.review_context.events["event-one"].media[0].privacy_review_status,"unreviewed");

const exhibitCatalogPath=path.join(temp,"exhibit-catalog.json");
const exhibitPublicPath=path.join(temp,"exhibit-public.json");
fs.writeFileSync(exhibitCatalogPath,JSON.stringify(fixture()),"utf8");
const exhibitStore=createCurationStore({catalogPath:exhibitCatalogPath,publicPath:exhibitPublicPath,now:()=>"2026-08-29T04:00:00.000Z",allowedSourceHosts:["example.com"]});
exhibitStore.confirmPublish({expected_version:1});
const changedExhibit=exhibitStore.updateExhibit("exhibit-one",{expected_version:1,boundary_note:"更新后的适用边界"});
assert.equal(changedExhibit.workflow_status,"pending_review","已发布章节的公众字段变更必须退回待审");
assert.equal(changedExhibit.reviewed_version,0);
assert.equal(exhibitStore.previewPublish().projection.exhibits.length,0);

const roleCatalogPath=path.join(temp,"role-catalog.json");
const rolePublicPath=path.join(temp,"role-public.json");
fs.writeFileSync(roleCatalogPath,JSON.stringify(fixture()),"utf8");
const roleStore=createCurationStore({catalogPath:roleCatalogPath,publicPath:rolePublicPath,now:()=>"2026-08-29T05:00:00.000Z",allowedSourceHosts:["example.com"]});
roleStore.confirmPublish({expected_version:1},{actor:{id:"publisher-initial",role:"publisher"}});
const authored=roleStore.updateEvent("event-one",{expected_version:1,caption:"作者修订说明"},{actor:{id:"staff-a",role:"author"},reason:"修正文案"});
assert.equal(authored.last_change_actor_id,"staff-a");
assert.throws(()=>roleStore.updateEvent("event-one",{expected_version:2,workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true},{actor:{id:"staff-a",role:"reviewer"},reason:"自审"}),error=>error.code==="CURATION_REVIEW_BLOCKED");
const independentlyReviewed=roleStore.updateEvent("event-one",{expected_version:2,workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true},{actor:{id:"staff-b",role:"reviewer"},reason:"复核来源与事实"});
assert.equal(independentlyReviewed.last_review_actor_id,"staff-b");
assert.throws(()=>roleStore.confirmPublish({expected_version:3},{actor:{id:"staff-a",role:"publisher"},reason:"作者自发"}),error=>error.code==="CURATION_REVIEW_BLOCKED");
roleStore.confirmPublish({expected_version:3},{actor:{id:"staff-c",role:"publisher"},reason:"独立发布"});

const sourceAddPath=path.join(temp,"source-add.json");
fs.writeFileSync(sourceAddPath,JSON.stringify(fixture()),"utf8");
const sourceAddStore=createCurationStore({catalogPath:sourceAddPath,publicPath:path.join(temp,"source-add-public.json"),allowedSourceHosts:["example.com"]});
sourceAddStore.addSource("event-one",{expected_version:1,label:"补充来源",url:"https://example.com/second",source_type:"media_report",supported_claim:"补充支持活动事实"},{actor:{id:"staff-a",role:"author"},reason:"补充来源"});
const sourceAddedEvent=sourceAddStore.read().exhibits[0].events[0];
assert.equal(sourceAddedEvent.workflow_status,"pending_review","已发布活动新增来源必须退回复核");
assert.equal(sourceAddedEvent.last_change_actor_id,"staff-a");

const bindCatalog=fixture();
bindCatalog.media_assets=[{id:"media-bind",label:"候选",inventory_ref:"candidate/bind.jpg",dimensions:"100x100",sha256:"b".repeat(64),rights_status:"pending_authorization",privacy_review_status:"unreviewed",privacy_risk:"unreviewed",public_media:false,public_url:"",version:1,reviewed_version:0,order:0}];
const bindPath=path.join(temp,"bind.json");
fs.writeFileSync(bindPath,JSON.stringify(bindCatalog),"utf8");
const bindStore=createCurationStore({catalogPath:bindPath,publicPath:path.join(temp,"bind-public.json"),allowedSourceHosts:["example.com"]});
bindStore.bindMedia("event-one",{expected_version:1,media_asset_id:"media-bind"},{actor:{id:"staff-a",role:"author"},reason:"绑定候选媒体"});
assert.equal(bindStore.read().exhibits[0].events[0].workflow_status,"pending_review","已发布活动变更媒体绑定必须退回复核");

console.log("curation review governance ok");
