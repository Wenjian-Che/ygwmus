import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";

const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
const testParent=path.join(path.dirname(process.cwd()),".ygwmus-private-media-tests");
fs.mkdirSync(testParent,{recursive:true});
const temp=fs.mkdtempSync(path.join(testParent,"api-"));
const cleanup=()=>{
  fs.rmSync(temp,{recursive:true,force:true});
  try { fs.rmdirSync(testParent); } catch {}
};
process.once("exit",cleanup);
const mediaRoot=path.join(temp,"private");
fs.mkdirSync(mediaRoot);
fs.writeFileSync(path.join(mediaRoot,"candidate.png"),png);
const catalogPath=path.join(temp,"catalog.json");
fs.writeFileSync(catalogPath,JSON.stringify({schema_version:2,version:1,updated_at:"2026-08-29T00:00:00.000Z",page_coverage:[],exhibits:[],media_assets:[{id:"candidate:one",label:"候选图",inventory_ref:"candidate.png",dimensions:"1x1",sha256:crypto.createHash("sha256").update(png).digest("hex"),rights_status:"pending_authorization",privacy_review_status:"unreviewed",privacy_risk:"unreviewed",public_media:false,public_url:"",version:1,reviewed_version:0,order:0}]}),"utf8");

const credentials=JSON.stringify({
  "author-secret":{id:"author-a",role:"author"},
  "reviewer-secret":{id:"reviewer-b",role:"reviewer"},
  "publisher-secret":{id:"publisher-c",role:"publisher"},
});

async function waitForHealth(port) {
  for(let attempt=0;attempt<60;attempt+=1){try{const response=await fetch(`http://127.0.0.1:${port}/api/health`);if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  throw new Error(`server ${port} did not start`);
}

async function withServer(port,extra,run) {
  const child=spawn(process.execPath,["backend/server.mjs"],{cwd:process.cwd(),env:{...process.env,NODE_ENV:"test",AGENT_STORE_DIR:temp,ADMIN_PRIVATE_STATE_DIR:temp,SITE_CONTENT_PATH:path.join(temp,"site-content.json"),SITE_CONTENT_AUDIT_PATH:path.join(temp,"site-content-audit.jsonl"),AGENT_PORT:String(port),ADMIN_CREDENTIALS_JSON:credentials,AGENT_ALLOWED_ORIGINS:"",CURATION_CATALOG_PATH:catalogPath,...extra},stdio:["ignore","pipe","pipe"]});
  try { await waitForHealth(port); await run(); }
  finally { if(child.exitCode===null){const exited=new Promise(resolve=>child.once("exit",resolve));child.kill();await exited;} }
}

await withServer(8793,{CURATION_PRIVATE_MEDIA_ROOT:mediaRoot},async()=>{
  const endpoint="http://127.0.0.1:8793/api/admin/curation/media/candidate%3Aone/preview";
  assert.equal((await fetch(endpoint)).status,401,"未认证请求不得读取私有候选媒体");
  assert.equal((await fetch(endpoint,{headers:{authorization:"Bearer wrong-secret"}})).status,401,"错误角色凭据不得读取私有候选媒体");
  for(const token of ["author-secret","reviewer-secret","publisher-secret"]){
    const response=await fetch(endpoint,{headers:{authorization:`Bearer ${token}`}});
    assert.equal(response.status,200,`${token} 应具有只读候选预览权限`);
    assert.equal(response.headers.get("cache-control"),"no-store");
    assert.equal(response.headers.get("x-content-type-options"),"nosniff");
    assert.match(response.headers.get("content-disposition")||"",/^inline;/);
    assert.equal(response.headers.get("content-type"),"image/png");
    assert.equal(Buffer.from(await response.arrayBuffer()).equals(png),true);
  }
  const reviewerSave=await fetch("http://127.0.0.1:8793/api/admin/curation/operations",{method:"POST",headers:{authorization:"Bearer reviewer-secret","content-type":"application/json"},body:JSON.stringify({operation:"update_media",id:"candidate:one",reason:"记录专项审核字段",input:{expected_version:1,privacy_risk:"高风险，需专项复核",contains_minors:true,contains_third_party_media:true,rights_status:"pending_authorization",privacy_review_status:"unreviewed",public_media:false,license_scope:"",authorization_evidence_ref:"",minor_consent_evidence_ref:"",third_party_rights_evidence_ref:"",review_note:"待补专项凭证",expires_at:""}})});
  assert.equal(reviewerSave.status,200,"审核员必须能保存工作台生成的完整媒体审核字段");
  const unknown=await fetch("http://127.0.0.1:8793/api/admin/curation/media/unknown/preview",{headers:{authorization:"Bearer author-secret"}});
  assert.equal(unknown.status,404);
  assert.doesNotMatch(await unknown.text(),new RegExp(temp.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&")),"错误响应不得泄漏绝对路径");
  const traversal=await fetch("http://127.0.0.1:8793/api/admin/curation/media/..%2F..%2Fsecret/preview",{headers:{authorization:"Bearer author-secret"}});
  assert.ok([400,404].includes(traversal.status));
  const siteContent=await (await fetch("http://127.0.0.1:8793/api/site-content")).text();
  const adminCatalogResponse=await fetch("http://127.0.0.1:8793/api/admin/curation",{headers:{authorization:"Bearer author-secret"}});
  assert.equal(adminCatalogResponse.status,200,"已认证后台应能读取授权工作台数据");
  const adminCatalog=await adminCatalogResponse.json();
  assert.equal(adminCatalog.catalog.media_assets[0].review_workflow.stage,"pending_authorization");
  assert.equal(adminCatalog.catalog.media_assets[0].review_workflow.public_version,0);
  const publicResponse=await fetch("http://127.0.0.1:8793/api/exhibits");
  assert.equal(publicResponse.status,200,"公众展览 API 必须是顶层可达路由");
  const publicPayload=await publicResponse.json();
  assert.equal(publicPayload.schema_version,2,"公众展览 API 必须返回统一投影 schema");
  assert.ok(Array.isArray(publicPayload.exhibits),"公众展览 API 必须返回展览数组");
  const publicExhibits=JSON.stringify(publicPayload);
  assert.doesNotMatch(`${siteContent}\n${publicExhibits}`,/CURATION_PRIVATE_MEDIA_ROOT|inventory_ref|source_document|source_paragraph|authorization_evidence_ref|minor_consent_evidence_ref|third_party_rights_evidence_ref|review_note|review_workflow|sha256|media_sha256/);
  assert.doesNotMatch(`${siteContent}\n${publicExhibits}`,new RegExp(temp.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&")),"公众 API 不得泄漏私有绝对路径");
});

await withServer(8794,{CURATION_PRIVATE_MEDIA_ROOT:""},async()=>{
  const response=await fetch("http://127.0.0.1:8794/api/admin/curation/media/candidate%3Aone/preview",{headers:{authorization:"Bearer reviewer-secret"}});
  assert.equal(response.status,503);
  assert.match(await response.text(),/私有候选库未连接/);
});

await withServer(8795,{CURATION_PRIVATE_MEDIA_ROOT:path.join(process.cwd(),"web")},async()=>{
  const headers={authorization:"Bearer reviewer-secret"};
  const adminResponse=await fetch("http://127.0.0.1:8795/api/admin/curation",{headers});
  assert.equal(adminResponse.status,200);
  const adminPayload=await adminResponse.json();
  assert.equal(adminPayload.private_media?.connected,false,"公众静态目录配置必须 fail-closed");
  const preview=await fetch("http://127.0.0.1:8795/api/admin/curation/media/candidate%3Aone/preview",{headers});
  assert.equal(preview.status,503,"非法私有根不得降级为文件未找到");
  const previewText=await preview.text();
  assert.match(previewText,/私有候选库未连接/);
  assert.doesNotMatch(previewText,/ygwmus|\\web|\/web/i,"非法配置响应不得暴露真实路径");
});

cleanup();
process.removeListener("exit",cleanup);
console.log("private media admin API ok");
