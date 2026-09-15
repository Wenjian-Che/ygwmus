import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {createPrivateMediaService} from "../../backend/private-media.mjs";

const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
const testParent=path.join(path.dirname(process.cwd()),".ygwmus-private-media-tests");
fs.mkdirSync(testParent,{recursive:true});
const temp=fs.mkdtempSync(path.join(testParent,"service-"));
const cleanup=()=>{
  fs.rmSync(temp,{recursive:true,force:true});
  try { fs.rmdirSync(testParent); } catch {}
};
process.once("exit",cleanup);
const root=path.join(temp,"root");
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,"one.png"),png);

const projectRoot=path.join(temp,"project");
for(const relative of ["web",".git","knowledge-base",path.join("agent","generated")]) fs.mkdirSync(path.join(projectRoot,relative),{recursive:true});

const records=new Map([["media-one",{id:"media-one",inventory_ref:"one.png",sha256:sha(png)}]]);
const service=createPrivateMediaService({root,projectRoot,lookup:id=>records.get(id),maxBytes:1024});
assert.equal(service.connected,true,"D 盘项目外只读根应允许连接");
const linuxService=createPrivateMediaService({root,projectRoot,lookup:id=>records.get(id),maxBytes:1024,platform:"linux"});
assert.equal(linuxService.connected,true,"Linux 项目外只读根应允许连接，不得硬编码 Windows 盘符");
const result=service.readById("media-one");
assert.equal(result.mime,"image/png");
assert.equal(result.body.equals(png),true);
assert.equal(result.filename,"media-one.png");
assert.doesNotMatch(JSON.stringify(result),new RegExp(root.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&")),"结果不得泄漏私有根绝对路径");

for(const relative of ["web",".git","knowledge-base",path.join("agent","generated")]) {
  const forbidden=createPrivateMediaService({root:path.join(projectRoot,relative),projectRoot,lookup:id=>records.get(id)});
  assert.equal(forbidden.connected,false,`${relative} 不得成为私有候选根`);
  assert.throws(()=>forbidden.readById("media-one"),error=>error.code==="PRIVATE_MEDIA_ROOT_NOT_CONFIGURED"&&error.status===503&&!error.message.includes(projectRoot));
}

const projectParent=createPrivateMediaService({root:temp,projectRoot,lookup:id=>records.get(id)});
assert.equal(projectParent.connected,false,"包住当前项目的父目录不得成为私有候选根");

const systemRoot=fs.realpathSync.native(process.env.SystemRoot||"C:\\Windows");
const wrongDrive=createPrivateMediaService({root:systemRoot,projectRoot,lookup:id=>records.get(id),platform:"win32"});
assert.equal(wrongDrive.connected,false,"非 D 盘目录不得成为私有候选根");

const rootAlias=path.join(temp,"root-junction");
try {
  fs.symlinkSync(root,rootAlias,"junction");
  const reparseRoot=createPrivateMediaService({root:rootAlias,projectRoot,lookup:id=>records.get(id)});
  assert.equal(reparseRoot.connected,false,"junction 或重解析点根不得绕过路径策略");
} catch(error) {
  if(error.code!=="EPERM") throw error;
}

assert.throws(()=>createPrivateMediaService({root:"",lookup:id=>records.get(id)}).readById("media-one"),error=>error.code==="PRIVATE_MEDIA_ROOT_NOT_CONFIGURED"&&error.status===503);
assert.throws(()=>service.readById("missing"),error=>error.code==="PRIVATE_MEDIA_NOT_FOUND"&&error.status===404);

records.set("media-traversal",{id:"media-traversal",inventory_ref:"../outside.png",sha256:sha(png)});
assert.throws(()=>service.readById("media-traversal"),error=>error.code==="PRIVATE_MEDIA_INVALID_REFERENCE"&&!error.message.includes(temp));

fs.mkdirSync(path.join(root,"directory.png"));
records.set("media-directory",{id:"media-directory",inventory_ref:"directory.png",sha256:sha(png)});
assert.throws(()=>service.readById("media-directory"),error=>error.code==="PRIVATE_MEDIA_NOT_FILE");

fs.writeFileSync(path.join(root,"spoof.png"),Buffer.from([0xff,0xd8,0xff,0x00]));
records.set("media-spoof",{id:"media-spoof",inventory_ref:"spoof.png",sha256:sha(Buffer.from([0xff,0xd8,0xff,0x00]))});
assert.throws(()=>service.readById("media-spoof"),error=>error.code==="PRIVATE_MEDIA_MIME_MISMATCH");

fs.writeFileSync(path.join(root,"large.png"),Buffer.concat([png,Buffer.alloc(2048)]));
records.set("media-large",{id:"media-large",inventory_ref:"large.png",sha256:sha(Buffer.concat([png,Buffer.alloc(2048)]))});
assert.throws(()=>service.readById("media-large"),error=>error.code==="PRIVATE_MEDIA_TOO_LARGE"&&error.status===413);

fs.writeFileSync(path.join(root,"changed.png"),png);
records.set("media-changed",{id:"media-changed",inventory_ref:"changed.png",sha256:sha(png)});
const changingService=createPrivateMediaService({root,projectRoot,lookup:id=>records.get(id),maxBytes:4096,beforeRead:()=>fs.appendFileSync(path.join(root,"changed.png"),Buffer.from([0]))});
assert.throws(()=>changingService.readById("media-changed"),error=>error.code==="PRIVATE_MEDIA_CHANGED_DURING_READ");

const outside=path.join(temp,"outside");
fs.mkdirSync(outside);
fs.writeFileSync(path.join(outside,"linked.png"),png);
try {
  fs.symlinkSync(outside,path.join(root,"linked"),"junction");
  records.set("media-link",{id:"media-link",inventory_ref:"linked/linked.png",sha256:sha(png)});
  assert.throws(()=>service.readById("media-link"),error=>error.code==="PRIVATE_MEDIA_REPARSE_POINT");
} catch(error) {
  if (error.code!=="EPERM") throw error;
}

cleanup();
process.removeListener("exit",cleanup);
console.log("private media service ok");
