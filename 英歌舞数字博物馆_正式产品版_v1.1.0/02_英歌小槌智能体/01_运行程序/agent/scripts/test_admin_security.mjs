import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

const isolated=fs.mkdtempSync(path.join(os.tmpdir(),"yingge-admin-security-"));

async function waitForHealth(port) {
  for (let attempt=0;attempt<50;attempt+=1) {
    try { const response=await fetch(`http://127.0.0.1:${port}/api/health`); if(response.ok)return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error(`server ${port} did not start`);
}

async function withServer(port,env,run) {
  const child=spawn(process.execPath,["backend/server.mjs"],{cwd:process.cwd(),env:{...process.env,NODE_ENV:"test",AGENT_STORE_DIR:isolated,ADMIN_PRIVATE_STATE_DIR:isolated,SITE_CONTENT_PATH:path.join(isolated,"site-content.json"),SITE_CONTENT_AUDIT_PATH:path.join(isolated,"site-content-audit.jsonl"),AGENT_PORT:String(port),ADMIN_TOKEN:"",ADMIN_CREDENTIALS_JSON:"",AGENT_ALLOWED_ORIGINS:"",...env},stdio:["ignore","pipe","pipe"]});
  try { await waitForHealth(port); await run(); }
  finally { if(child.exitCode===null){const exited=new Promise(resolve=>child.once("exit",resolve));child.kill();await exited;} }
}

await withServer(8791,{},async()=>{
  const response=await fetch("http://127.0.0.1:8791/api/admin/curation");
  assert.equal(response.status,503,"未配置服务端管理凭据时敏感管理 API 必须拒绝服务");
});

const credentials=JSON.stringify({
  "author-secret":{id:"author-a",role:"author"},
  "reviewer-secret":{id:"reviewer-b",role:"reviewer"},
  "publisher-secret":{id:"publisher-c",role:"publisher"}
});
await withServer(8792,{ADMIN_CREDENTIALS_JSON:credentials,AGENT_ALLOWED_ORIGINS:"http://127.0.0.1:8097"},async()=>{
  const allowed=await fetch("http://127.0.0.1:8792/api/admin/curation",{headers:{authorization:"Bearer author-secret",origin:"http://127.0.0.1:8097"}});
  assert.equal(allowed.status,200);
  const malicious=await fetch("http://127.0.0.1:8792/api/admin/curation",{headers:{authorization:"Bearer author-secret",origin:"https://evil.example"}});
  assert.equal(malicious.status,403,"恶意 Origin 即使持有 token 也必须被拒绝");
  const authorPublish=await fetch("http://127.0.0.1:8792/api/admin/curation/publish",{method:"POST",headers:{authorization:"Bearer author-secret","content-type":"application/json"},body:JSON.stringify({expected_version:-1})});
  assert.equal(authorPublish.status,403,"author 不能确认发布");
  const authorReview=await fetch("http://127.0.0.1:8792/api/admin/curation/operations",{method:"POST",headers:{authorization:"Bearer author-secret","content-type":"application/json"},body:JSON.stringify({operation:"update_event",id:"missing",input:{expected_version:1,fact_review_status:"verified"}})});
  assert.equal(authorReview.status,403,"author 不能审核事实");
  const reviewerCreate=await fetch("http://127.0.0.1:8792/api/admin/curation/operations",{method:"POST",headers:{authorization:"Bearer reviewer-secret","content-type":"application/json"},body:JSON.stringify({operation:"create_event",parent_id:"missing",input:{expected_version:1,event_title:"x"}})});
  assert.equal(reviewerCreate.status,403,"reviewer 不能创建内容");
});

console.log("admin security fail-closed and roles ok");
fs.rmSync(isolated,{recursive:true,force:true});
