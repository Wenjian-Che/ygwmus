import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"ygwmus-media-gate-"));
const cleanup=()=>fs.rmSync(temp,{recursive:true,force:true});
process.once("exit",cleanup);
const catalogPath=path.join(temp,"catalog.json");
const publicPath=path.join(temp,"public.json");
const {createCurationStore}=await import("../../backend/curation-store.mjs");
const media={id:"media-one",label:"候选图",inventory_ref:"candidate.png",dimensions:"1x1",sha256:"a".repeat(64),rights_status:"pending_authorization",privacy_review_status:"unreviewed",privacy_risk:"高风险，需专项复核",contains_minors:true,contains_third_party_media:true,public_media:false,public_url:"",rights_holder:"",license_scope:"",authorization_evidence_ref:"",reviewer:"",reviewed_at:"",expires_at:"",version:1,reviewed_version:0,order:0};
const catalog={schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],exhibits:[],media_assets:[media]};
fs.writeFileSync(catalogPath,JSON.stringify(catalog),"utf8");
const store=createCurationStore({catalogPath,publicPath,now:()=>"2026-08-29T08:00:00.000Z",allowedSourceHosts:["example.com"]});

assert.throws(()=>store.updateMedia("media-one",{expected_version:1,rights_status:"authorized",privacy_review_status:"approved",public_url:"https://example.com/media.png",public_media:true},{actor:{id:"reviewer-b",role:"reviewer"},reason:"资料不完整仍尝试公开"}),error=>error.code==="CURATION_REVIEW_BLOCKED"&&/权利持有人|授权范围|授权凭证/.test(error.message));

const approved=store.updateMedia("media-one",{expected_version:1,rights_status:"authorized",privacy_review_status:"approved",public_url:"https://example.com/media.png",rights_holder:"明确权利人",license_scope:"允许数字博物馆网页在中国地区公开展示，授权期内可申请撤回下架",authorization_evidence_ref:"authorizations/media-one.pdf",minor_consent_evidence_ref:"authorizations/minor-consent.pdf",third_party_rights_evidence_ref:"authorizations/press-rights.pdf",review_note:"已核对权利、隐私与两项高风险专项凭证。",expires_at:"2027-08-29",public_media:true},{actor:{id:"reviewer-b",role:"reviewer"},reason:"核对书面授权与隐私材料"});
assert.equal(approved.public_media,true);
assert.equal(approved.reviewer,"reviewer-b","审核人必须由服务端角色身份写入");
assert.equal(approved.reviewed_at,"2026-08-29T08:00:00.000Z","审核时间必须由服务端写入");
assert.equal(approved.reviewed_version,2);
assert.equal(approved.published_version||0,0,"审核通过仍不等于已经确认发布");

cleanup();
process.removeListener("exit",cleanup);
console.log("media authorization gate ok");
