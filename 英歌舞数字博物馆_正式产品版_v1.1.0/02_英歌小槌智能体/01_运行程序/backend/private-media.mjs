import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function mediaError(code,message,status=400) {
  return Object.assign(new Error(message),{code,status});
}

function inside(root,target) {
  const relative=path.relative(root,target);
  return relative==="" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function overlaps(left,right) {
  return inside(left,right) || inside(right,left);
}

function containsReparsePoint(location) {
  const absolute=path.resolve(location);
  const parsed=path.parse(absolute);
  let current=parsed.root;
  for(const segment of path.relative(parsed.root,absolute).split(path.sep).filter(Boolean)) {
    current=path.join(current,segment);
    if(fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

function detectMime(buffer) {
  if (buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "image/png";
  if (buffer.length>=3 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff) return "image/jpeg";
  if (buffer.length>=12 && buffer.subarray(0,4).toString("ascii")==="RIFF" && buffer.subarray(8,12).toString("ascii")==="WEBP") return "image/webp";
  return "";
}

function sameIdentity(before,after) {
  return before.dev===after.dev && before.ino===after.ino && before.size===after.size && before.mtimeNs===after.mtimeNs;
}

export function createPrivateMediaService({root="",projectRoot="",lookup,maxBytes=12*1024*1024,beforeRead=()=>{},platform=process.platform}={}) {
  const configuredRoot=String(root||"").trim();
  let rootReal="";
  if (configuredRoot) {
    try {
      if(containsReparsePoint(configuredRoot)) throw new Error("reparse root");
      rootReal=fs.realpathSync.native(configuredRoot);
      if (!fs.statSync(rootReal).isDirectory()) rootReal="";
      if(platform==="win32" && path.parse(rootReal).root.replace(/\//g,"\\").toUpperCase()!=="D:\\") rootReal="";
      const projectReal=projectRoot?fs.realpathSync.native(projectRoot):"";
      if(rootReal && projectReal) {
        const forbidden=[
          projectReal,
          path.join(projectReal,"web"),
          path.join(projectReal,"public"),
          path.join(projectReal,".git"),
          path.join(projectReal,"knowledge-base"),
          path.join(projectReal,"agent","generated"),
          path.join(projectReal,"web","data"),
        ].flatMap(item=>{try{return [fs.realpathSync.native(item)];}catch{return [];}});
        if(forbidden.some(item=>overlaps(rootReal,item))) rootReal="";
      }
    } catch { rootReal=""; }
  }

  return {
    connected:Boolean(rootReal),
    readById(mediaId) {
      if (!rootReal) throw mediaError("PRIVATE_MEDIA_ROOT_NOT_CONFIGURED","私有候选库未连接",503);
      const media=typeof lookup==="function"?lookup(String(mediaId||"")):null;
      if (!media) throw mediaError("PRIVATE_MEDIA_NOT_FOUND","未找到登记的候选媒体",404);
      const reference=String(media.inventory_ref||"").replace(/\\/g,"/");
      if (!reference || path.isAbsolute(reference) || reference.startsWith("/") || reference.split("/").includes("..")) throw mediaError("PRIVATE_MEDIA_INVALID_REFERENCE","候选媒体引用无效");
      const extension=path.extname(reference).toLowerCase();
      const expectedMime={".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp"}[extension];
      if (!expectedMime) throw mediaError("PRIVATE_MEDIA_UNSUPPORTED_TYPE","候选媒体类型不允许",415);
      const candidate=path.resolve(rootReal,...reference.split("/"));
      if (!inside(rootReal,candidate)) throw mediaError("PRIVATE_MEDIA_INVALID_REFERENCE","候选媒体引用无效");
      let current=rootReal;
      try {
        for (const segment of reference.split("/")) {
          current=path.join(current,segment);
          if (fs.lstatSync(current).isSymbolicLink()) throw mediaError("PRIVATE_MEDIA_REPARSE_POINT","候选媒体引用包含重解析点");
        }
      } catch(error) {
        if (error?.code?.startsWith("PRIVATE_MEDIA_")) throw error;
        throw mediaError("PRIVATE_MEDIA_NOT_FOUND","候选媒体文件不存在",404);
      }
      let real;
      try { real=fs.realpathSync.native(candidate); }
      catch { throw mediaError("PRIVATE_MEDIA_NOT_FOUND","候选媒体文件不存在",404); }
      if (!inside(rootReal,real)) throw mediaError("PRIVATE_MEDIA_REPARSE_POINT","候选媒体真实位置不在私有库内");
      const descriptor=fs.openSync(real,"r");
      try {
        const before=fs.fstatSync(descriptor,{bigint:true});
        if (!before.isFile()) throw mediaError("PRIVATE_MEDIA_NOT_FILE","候选媒体不是普通文件");
        if (before.size>BigInt(maxBytes)) throw mediaError("PRIVATE_MEDIA_TOO_LARGE","候选媒体超过预览大小限制",413);
        beforeRead({id:media.id});
        const body=fs.readFileSync(descriptor);
        const after=fs.fstatSync(descriptor,{bigint:true});
        if (!sameIdentity(before,after) || BigInt(body.length)!==after.size) throw mediaError("PRIVATE_MEDIA_CHANGED_DURING_READ","候选媒体在读取期间发生变化",409);
        const mime=detectMime(body);
        if (!mime || mime!==expectedMime) throw mediaError("PRIVATE_MEDIA_MIME_MISMATCH","候选媒体内容与登记图片类型不符",415);
        const digest=crypto.createHash("sha256").update(body).digest("hex");
        if (!/^[a-f0-9]{64}$/i.test(String(media.sha256||"")) || digest!==String(media.sha256).toLowerCase()) throw mediaError("PRIVATE_MEDIA_HASH_MISMATCH","候选媒体与登记指纹不一致",409);
        const safeId=String(media.id).replace(/[^A-Za-z0-9_-]/g,"_").slice(0,120)||"candidate";
        return {body,mime,filename:`${safeId}${extension}`,size:body.length};
      } finally {
        fs.closeSync(descriptor);
      }
    },
  };
}
