import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createCurationStore} from "../../backend/curation-store.mjs";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"ygwmus-media-trust-"));
const cleanup=()=>fs.rmSync(temp,{recursive:true,force:true});
process.once("exit",cleanup);
const catalogPath=path.join(temp,"catalog.json");
const publicPath=path.join(temp,"public.json");
const media={
  id:"singapore-candidate",label:"新加坡交流候选媒体截图",inventory_ref:"private/singapore.png",dimensions:"1200x800",sha256:"b".repeat(64),
  source_document:"evidence/source.docx",source_paragraph:"50-64；候选图片锚点：51",publication:"合作材料候选媒体",accessed_at:"2026-08-29",
  supported_claim:"只用于内部核对交流活动，不构成公开传播授权",rights_holder:"待确认",license_scope:"尚未取得公开传播授权",
  authorization_evidence_ref:"",minor_consent_evidence_ref:"",third_party_rights_evidence_ref:"",review_note:"",expires_at:"",
  rights_status:"pending_authorization",privacy_review_status:"unreviewed",privacy_risk:"高风险，需专项复核",contains_minors:true,contains_third_party_media:true,
  public_media:false,public_url:"",reviewer:"",reviewed_at:"",reviewed_version:0,published_version:0,ever_published:false,version:1,order:0,
};
const source={id:"source-one",label:"示例机构",url:"https://example.com/report",source_type:"media_report",supported_claim:"支持活动时间与交流场次",version:1,reviewed_version:1,published_version:1,order:0};
const event={id:"event-one",event_title:"潮阳英歌队赴新加坡交流",date:"2024-12-19/2024-12-23",location:"新加坡",people_or_team:"潮阳英歌队、新加坡潮阳会馆",caption:"队伍在五天行程中进行了四场交流表演。",audience_summary:"连续交流让社区之间建立联系。",student_takeaway:"传播也包括持续往来。",research_note:"事实来自已核验公开来源。",media_asset_id:media.id,workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true,reviewed_version:1,published_version:1,version:1,order:0,sources:[source]};
const exhibit={id:"exhibit-one",title:"英歌出海",summary:"真实交流事件。",boundary_note:"只描述可核验个案。",audience_summary:"真实交流事件。",student_takeaway:"从事件理解传播。",research_note:"不外推全部英歌。",workflow_status:"published",reviewed_version:1,published_version:1,version:1,order:0,events:[event]};
fs.writeFileSync(catalogPath,JSON.stringify({schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],media_assets:[media],exhibits:[exhibit]}),"utf8");
fs.writeFileSync(publicPath,JSON.stringify({schema_version:2,generated_at:null,exhibits:[]}),"utf8");
const store=createCurationStore({catalogPath,publicPath,now:()=>"2026-08-29T08:00:00.000Z",allowedSourceHosts:["example.com"]});

const initialPublic=store.publicProjection();
assert.equal(initialPublic.exhibits[0].events[0].public_media,false);
assert.equal(Object.hasOwn(initialPublic.exhibits[0].events[0],"media_url"),false);

const initialAdmin=store.adminProjection();
const initialReview=initialAdmin.catalog.media_assets[0].review_workflow;
assert.equal(initialReview.stage,"pending_authorization");
assert.equal(initialReview.high_risk,true);
assert.equal(initialReview.requires_minor_consent,true);
assert.equal(initialReview.requires_third_party_rights,true);
assert.equal(initialReview.public_version,0);
assert.equal(initialReview.binding.event_id,"event-one");
assert.equal(initialReview.binding.date,event.date);
assert.equal(initialReview.binding.people_or_team,event.people_or_team);

assert.throws(()=>store.updateMedia(media.id,{
  expected_version:1,rights_status:"authorized",privacy_review_status:"approved",public_url:"https://example.com/media.png",public_media:true,
  rights_holder:"明确权利人",license_scope:"允许网页在授权期内公开展示，并可撤回下架",authorization_evidence_ref:"authorizations/general.pdf",expires_at:"2027-08-29",review_note:"已核对通用授权",
},{actor:{id:"reviewer-b",role:"reviewer"},reason:"尝试公开高风险候选"}),error=>error.code==="CURATION_REVIEW_BLOCKED"&&/未成年人|第三方/.test(error.message));

const approved=store.updateMedia(media.id,{
  expected_version:1,rights_status:"authorized",privacy_review_status:"approved",public_url:"https://example.com/media.png",public_media:true,
  rights_holder:"明确权利人",license_scope:"允许网页在授权期内公开展示，并可撤回下架",authorization_evidence_ref:"authorizations/general.pdf",
  minor_consent_evidence_ref:"authorizations/minor-consent.pdf",third_party_rights_evidence_ref:"authorizations/press-rights.pdf",
  review_note:"已分别核对未成年人肖像同意与第三方媒体截图使用范围。",expires_at:"2027-08-29",
},{actor:{id:"reviewer-b",role:"reviewer"},reason:"完成高风险专项权利复核"});
assert.equal(approved.public_media,true);
assert.equal(store.publicProjection().exhibits[0].events[0].public_media,false,"审核通过但未发布的图片不得进入公众快照");
const ready=store.adminProjection().catalog.media_assets[0].review_workflow;
assert.equal(ready.stage,"publishable");
assert.equal(ready.public_version,0);

store.confirmPublish({expected_version:2},{actor:{id:"publisher-c",role:"publisher"},reason:"确认公众快照"});
const published=store.publicProjection();
assert.equal(published.exhibits[0].events[0].public_media,true);
assert.equal(published.exhibits[0].events[0].media_url,"https://example.com/media.png");
assert.doesNotMatch(JSON.stringify(published),/inventory_ref|sha256|source_document|source_paragraph|authorization_evidence_ref|minor_consent_evidence_ref|third_party_rights_evidence_ref|review_note|privacy_risk|review_workflow/);
assert.equal(store.adminProjection().catalog.media_assets[0].review_workflow.stage,"published");

cleanup();
process.removeListener("exit",cleanup);
console.log("media trust workbench ok");
