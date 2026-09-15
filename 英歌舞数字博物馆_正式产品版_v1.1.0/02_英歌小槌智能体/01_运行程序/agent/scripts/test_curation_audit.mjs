import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createCurationStore} from "../../backend/curation-store.mjs";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"yingge-curation-audit-"));
const catalogPath=path.join(temp,"catalog.json");
const publicPath=path.join(temp,"public.json");
const auditPath=path.join(temp,"audit.jsonl");
const source={id:"source-one",label:"来源",url:"https://example.com/source",source_type:"government_institution",supported_claim:"活动事实",version:1,reviewed_version:1,order:0};
const event={id:"event-one",event_title:"活动",date:"2024-05-01",location:"曼谷",people_or_team:"队伍",caption:"原说明",audience_summary:"摘要",student_takeaway:"要点",research_note:"注释",workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true,version:1,reviewed_version:1,ever_published:true,order:0,sources:[source]};
const exhibit={id:"exhibit-one",title:"章节",audience_summary:"导语",student_takeaway:"要点",research_note:"注释",workflow_status:"published",version:1,reviewed_version:1,ever_published:true,order:0,events:[event]};
fs.writeFileSync(catalogPath,JSON.stringify({schema_version:2,version:1,media_assets:[],exhibits:[exhibit]}),"utf8");
const store=createCurationStore({catalogPath,publicPath,auditPath,now:()=>"2026-08-29T06:00:00.000Z",allowedSourceHosts:["example.com"]});

store.updateEvent("event-one",{expected_version:1,caption:"修订说明"},{actor:{id:"author-a",role:"author"},reason:"纠正表述"});
const entries=store.readAudit();
assert.equal(entries.length,1);
assert.equal(entries[0].operation,"update_event");
assert.equal(entries[0].object_type,"event");
assert.equal(entries[0].object_id,"event-one");
assert.deepEqual(entries[0].actor,{id:"author-a",role:"author"});
assert.equal(entries[0].reason,"纠正表述");
assert.ok(entries[0].field_diff.caption);
assert.equal(entries[0].catalog_version,2);

store.updateEvent("event-one",{expected_version:2,workflow_status:"published",fact_review_status:"verified",source_review_status:"verified",public_fact:true},{actor:{id:"reviewer-b",role:"reviewer"},reason:"完成复核"});
store.confirmPublish({expected_version:3},{actor:{id:"publisher-c",role:"publisher"},reason:"批准上线"});
const appended=store.readAudit();
assert.equal(appended.length,3,"审计日志必须追加而不是覆盖");
assert.equal(appended[2].operation,"confirm_publish");
assert.equal(appended[2].decision,"published");
assert.doesNotMatch(JSON.stringify(store.publicProjection()),/author-a|reviewer-b|publisher-c|field_diff/);

console.log("curation audit chain ok");
