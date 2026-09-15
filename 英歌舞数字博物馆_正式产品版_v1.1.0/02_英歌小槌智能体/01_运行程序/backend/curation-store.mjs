import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const WORKFLOW = new Set(["draft", "pending_review", "published", "withdrawn"]);
const WORKFLOW_TRANSITIONS = {
  draft: new Set(["draft", "pending_review"]),
  pending_review: new Set(["draft", "pending_review", "published"]),
  published: new Set(["pending_review", "published", "withdrawn"]),
  withdrawn: new Set(["draft", "pending_review", "withdrawn"]),
};
const PUBLIC_KEYS = new Set([
  "id", "event_title", "date", "location", "people_or_team", "caption",
  "audience_summary", "student_takeaway", "research_note", "public_media", "media_url",
  "curatorial_boundary", "sources",
]);
const EVENT_PUBLIC_FIELDS = new Set(["event_title","date","location","people_or_team","caption","audience_summary","student_takeaway","research_note","curatorial_boundary"]);
const EXHIBIT_PUBLIC_FIELDS = new Set(["title","summary","boundary_note","chapter_type","audience_summary","student_takeaway","research_note"]);

function reviewError(message) {
  return Object.assign(new Error(message), {code: "CURATION_REVIEW_BLOCKED", status: 409});
}

function transitionError(from, to) {
  return Object.assign(new Error(`不允许从 ${from} 直接切换到 ${to}`), {code: "CURATION_INVALID_TRANSITION", status: 409});
}

function publicationError(message) {
  return Object.assign(new Error(message), {code: "CURATION_PUBLISH_INCOMPLETE", status: 422});
}

function inputError(message) {
  return Object.assign(new Error(message), {code:"CURATION_INVALID_INPUT", status:400});
}

function versionError() {
  return Object.assign(new Error("内容已被其他操作更新，请刷新后重试"), {code:"CURATION_VERSION_CONFLICT", status:409});
}

function deleteError(message) {
  return Object.assign(new Error(message), {code:"CURATION_DELETE_BLOCKED", status:409});
}

function assertSafeObject(value) {
  if (!value || typeof value !== "object") return;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) throw inputError("请求对象原型无效");
  for (const key of Object.keys(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) throw inputError("请求包含禁止字段");
    assertSafeObject(value[key]);
  }
}

function rejectUnknown(input, allowed) {
  assertSafeObject(input);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw inputError("请求内容必须是对象");
  const unknown = Object.keys(input).filter(key => !allowed.has(key));
  if (unknown.length) throw inputError(`未知字段：${unknown.join(", ")}`);
}

function cleanText(value, field, {required=false,max=500}={}) {
  const text = String(value ?? "").trim();
  if (required && !text) throw inputError(`${field} 不能为空`);
  if (text.length > max) throw inputError(`${field} 超过 ${max} 个字符`);
  return text;
}

function cleanDate(value, {required=false}={}) {
  const text = cleanText(value, "date", {required,max:21});
  if (!text) return "";
  const parts = text.split("/");
  if (parts.length > 2 || parts.some(part => !/^\d{4}-\d{2}-\d{2}$/.test(part) || Number.isNaN(Date.parse(`${part}T00:00:00Z`)))) throw inputError("date 必须是 YYYY-MM-DD 或 YYYY-MM-DD/YYYY-MM-DD");
  if (parts[1] && parts[0] > parts[1]) throw inputError("date 的结束日期不能早于开始日期");
  return text;
}

function cleanSimpleDate(value, field, {required=false}={}) {
  const text=cleanText(value,field,{required,max:10});
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) throw inputError(`${field} 必须是 YYYY-MM-DD`);
  return text;
}

function cleanTimestamp(value, field) {
  const text=cleanText(value,field,{max:35});
  if (!text) return "";
  if (Number.isNaN(Date.parse(text))) throw inputError(`${field} 必须是有效 ISO 时间`);
  return new Date(text).toISOString();
}

function cleanRelativeRef(value, field, {required=false,max=300}={}) {
  const ref=cleanText(value,field,{required,max}).replace(/\\/g,"/");
  if (!ref) return "";
  if (path.isAbsolute(ref) || ref.startsWith("/") || ref.split("/").includes("..")) throw inputError(`${field} 必须是安全相对路径`);
  return ref;
}

function validHttpsSource(source) {
  if (!source || typeof source !== "object" || !String(source.label || "").trim() || !String(source.source_type || "").trim()) return false;
  try { return new URL(source.url).protocol === "https:"; }
  catch { return false; }
}

function validateForPublication(event) {
  const required = ["event_title", "date", "location", "people_or_team", "caption"];
  const missing = required.filter(key => !String(event[key] || "").trim());
  if (missing.length) throw publicationError(`发布前缺少必填字段：${missing.join(", ")}`);
  if (event.public_fact !== true) throw publicationError("发布前必须确认 public_fact 为 true");
  if (event.fact_review_status !== "verified") throw publicationError("发布前必须完成事实核验");
  if (event.source_review_status !== "verified") throw publicationError("发布前必须完成来源核验");
  if (!Array.isArray(event.sources) || !event.sources.some(validHttpsSource)) throw publicationError("发布前至少需要一个包含 label、url、source_type 的 HTTPS 来源");
}

function publicationReady(event) {
  try { validateForPublication(event); return true; }
  catch { return false; }
}

function writeJsonAtomic(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

export function createCurationStore({catalogPath, publicPath, auditPath=path.join(path.dirname(catalogPath),"curation-audit.jsonl"), now=() => new Date().toISOString(), idFactory=prefix => `${prefix}-${crypto.randomUUID()}`, allowedSourceHosts=["th.china-embassy.gov.cn","www.mfa.gov.cn","swwb.shantou.gov.cn","static.nfnews.com"]}) {
  const validateCatalog = catalog => {
    assertSafeObject(catalog);
    if (catalog.schema_version !== 2 || !Number.isInteger(catalog.version) || catalog.version < 1) throw inputError("策展目录 schema 或 version 无效");
    if (!Array.isArray(catalog.exhibits) || !Array.isArray(catalog.media_assets)) throw inputError("策展目录缺少章节或媒体数组");
    const validateRecords = (records, type) => {
      const ids=new Set();
      for (const item of records) {
        const id=String(item?.id||"");
        if (!/^[A-Za-z0-9:_-]{1,120}$/.test(id) || ids.has(id)) throw inputError(`${type} id 无效或重复`);
        if (!Number.isInteger(item.version) || item.version < 1) throw inputError(`${type} version 无效`);
        ids.add(id);
      }
      return ids;
    };
    const mediaIds=validateRecords(catalog.media_assets,"媒体");
    for (const media of catalog.media_assets) {
      const ref=String(media.inventory_ref||"").replace(/\\/g,"/");
      if (!ref || path.isAbsolute(ref) || ref.startsWith("/") || ref.split("/").includes("..")) throw inputError("媒体候选引用无效");
    }
    validateRecords(catalog.exhibits,"章节");
    const events=(catalog.exhibits||[]).flatMap(exhibit=>exhibit.events||[]);
    validateRecords(events,"活动");
    const sources=events.flatMap(event=>event.sources||[]);
    validateRecords(sources,"来源");
    for (const event of events) {
      const refs=Array.isArray(event.media_asset_ids) ? event.media_asset_ids : event.media_asset_id ? [event.media_asset_id] : [];
      if (!Array.isArray(refs) || refs.some(id=>typeof id!=="string" || !mediaIds.has(id)) || new Set(refs).size!==refs.length) throw inputError("活动引用了不存在或重复的媒体候选");
      if (event.media_asset_id && refs.length && event.media_asset_id!==refs[0]) throw inputError("活动主图必须是媒体列表第一项");
    }
    return catalog;
  };
  const read = () => validateCatalog(JSON.parse(fs.readFileSync(catalogPath, "utf8")));
  const findEvent = (catalog, eventId) => (catalog.exhibits || []).flatMap(exhibit => exhibit.events || []).find(item => item.id === eventId);
  const findEventContext = (catalog, eventId) => {
    for (const exhibit of catalog.exhibits || []) {
      const event = (exhibit.events || []).find(item => item.id === eventId);
      if (event) return {exhibit,event};
    }
    return null;
  };
  const eventMediaIds = event => Array.isArray(event?.media_asset_ids) ? event.media_asset_ids : event?.media_asset_id ? [event.media_asset_id] : [];
  const findSource = (catalog, sourceId) => {
    for (const exhibit of catalog.exhibits || []) for (const event of exhibit.events || []) {
      const source = (event.sources || []).find(item => item.id === sourceId);
      if (source) return {event, source};
    }
    return null;
  };
  const cleanSourceUrl = value => {
    let url;
    try { url = new URL(String(value || "")); }
    catch { throw inputError("来源 URL 无效"); }
    if (url.protocol !== "https:" || url.username || url.password || !allowedSourceHosts.includes(url.hostname)) throw inputError("来源 URL 必须使用允许域名的 HTTPS 地址");
    url.hash = "";
    return url.toString();
  };
  const cleanPublicUrl = value => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^assets\/curation\/[A-Za-z0-9._/-]+$/.test(raw) && !raw.split("/").includes("..")) return raw;
    return cleanSourceUrl(raw);
  };
  const safeSource = source => {
    if (!validHttpsSource(source)) return null;
    try {
      const url = new URL(source.url);
      if (!allowedSourceHosts.includes(url.hostname) || url.username || url.password) return null;
      url.hash = "";
      return {label:String(source.label).trim(),url:url.toString(),source_type:String(source.source_type).trim()};
    } catch { return null; }
  };
  const versionIsCurrent = (item, field) => Number(item?.[field] || 0) === Number(item?.version || 0);
  const mediaRiskFlags = media => {
    return {minor:media?.contains_minors===true,thirdParty:media?.contains_third_party_media===true};
  };
  const mediaAuthorizationGaps = (media,{requireReviewVersion=false,requirePublishedVersion=false}={}) => {
    const gaps=[];
    const risk=mediaRiskFlags(media);
    if (media?.rights_status!=="authorized") gaps.push("权利未授权");
    if (!String(media?.rights_holder||"").trim() || /待确认/.test(String(media?.rights_holder||""))) gaps.push("权利持有人");
    if (!String(media?.license_scope||"").trim() || /尚未|待确认/.test(String(media?.license_scope||""))) gaps.push("授权范围");
    if (!String(media?.authorization_evidence_ref||"").trim()) gaps.push("授权凭证");
    if (!media?.expires_at && !/永久|无期限/.test(String(media?.license_scope||""))) gaps.push("授权期限");
    if (media?.expires_at && Date.parse(`${media.expires_at}T23:59:59Z`)<Date.parse(now())) gaps.push("有效授权期限");
    if (media?.privacy_review_status!=="approved") gaps.push("隐私复核");
    if (!String(media?.review_note||"").trim()) gaps.push("审核意见");
    if (risk.minor && !String(media?.minor_consent_evidence_ref||"").trim()) gaps.push("未成年人肖像同意凭证");
    if (risk.thirdParty && !String(media?.third_party_rights_evidence_ref||"").trim()) gaps.push("第三方媒体截图权利凭证");
    if (!media?.public_media) gaps.push("允许图片公开");
    if (!String(media?.public_url||"").trim()) gaps.push("安全公开地址");
    if (requireReviewVersion && !versionIsCurrent(media,"reviewed_version")) gaps.push("当前版本审核");
    if (requirePublishedVersion && !versionIsCurrent(media,"published_version")) gaps.push("公众版本发布");
    return [...new Set(gaps)];
  };
  const mediaWorkflow = (catalog,media) => {
    const risk=mediaRiskFlags(media);
    const authComplete=media.rights_status==="authorized" && Boolean(String(media.rights_holder||"").trim()) && !/待确认/.test(String(media.rights_holder||"")) && Boolean(String(media.license_scope||"").trim()) && !/尚未|待确认/.test(String(media.license_scope||"")) && Boolean(String(media.authorization_evidence_ref||"").trim());
    const riskComplete=(!risk.minor || Boolean(String(media.minor_consent_evidence_ref||"").trim())) && (!risk.thirdParty || Boolean(String(media.third_party_rights_evidence_ref||"").trim()));
    const reviewed=authComplete && riskComplete && media.privacy_review_status==="approved" && Boolean(String(media.review_note||"").trim()) && versionIsCurrent(media,"reviewed_version");
    let safePublicUrl=false;
    try { safePublicUrl=Boolean(cleanPublicUrl(media.public_url)); } catch {}
    const publishable=reviewed && media.public_media===true && safePublicUrl;
    const published=publishable && versionIsCurrent(media,"published_version");
    let binding=null;
    for (const exhibit of catalog.exhibits||[]) for (const event of exhibit.events||[]) if (eventMediaIds(event).includes(media.id)) {
      binding={exhibit_id:exhibit.id,exhibit_title:exhibit.title,event_id:event.id,event_title:event.event_title,date:event.date,location:event.location,people_or_team:event.people_or_team};
      break;
    }
    return {
      stage:published?"published":publishable?"publishable":reviewed?"reviewed":authComplete?"authorized":"pending_authorization",
      high_risk:risk.minor||risk.thirdParty,
      requires_minor_consent:risk.minor,
      requires_third_party_rights:risk.thirdParty,
      public_version:Number(media.published_version||0),
      binding,
      blockers:mediaAuthorizationGaps(media,{requireReviewVersion:true}),
      steps:[
        {key:"pending_authorization",label:"待授权",complete:true},
        {key:"authorized",label:"已获授权",complete:authComplete},
        {key:"reviewed",label:"已审核",complete:reviewed},
        {key:"publishable",label:"可发布",complete:publishable},
      ],
    };
  };
  const projectEvent = (event, mediaById, {requirePublishedVersion=true}={}) => {
    const result = {};
    for (const key of PUBLIC_KEYS) if (Object.hasOwn(event, key) && key !== "sources" && key !== "public_media" && key !== "media_url") result[key] = event[key];
    result.sources = (event.sources || []).map(safeSource).filter(Boolean);
    const mediaUrls=eventMediaIds(event).flatMap(mediaId=>{
      const media=mediaById.get(mediaId);
      if (!media || mediaAuthorizationGaps(media,{requireReviewVersion:true,requirePublishedVersion}).length) return [];
      try { return [cleanPublicUrl(media.public_url)]; } catch { return []; }
    });
    result.public_media = mediaUrls.length>0;
    if (mediaUrls.length) {
      result.media_url=mediaUrls[0];
      result.media_urls=mediaUrls;
    }
    return result;
  };
  const project = (catalog, {requirePublishedVersion=true}={}) => {
    const mediaById = new Map((catalog.media_assets || []).map(item => [item.id,item]));
    return {
      schema_version: catalog.schema_version,
      generated_at: now(),
      exhibits: (catalog.exhibits || [])
        .filter(exhibit => exhibit.workflow_status === "published" && versionIsCurrent(exhibit,"reviewed_version") && (!requirePublishedVersion || versionIsCurrent(exhibit,"published_version")) && (exhibit.events || []).some(event => event.workflow_status === "published" && versionIsCurrent(event,"reviewed_version") && (!requirePublishedVersion || versionIsCurrent(event,"published_version")) && publicationReady(event)))
        .sort((a,b) => Number(a.order || 0) - Number(b.order || 0))
        .map(exhibit => ({
          id: exhibit.id,
          title: exhibit.title,
          summary: exhibit.summary,
          boundary_note: exhibit.boundary_note,
          audience_summary: exhibit.audience_summary,
          student_takeaway: exhibit.student_takeaway,
          research_note: exhibit.research_note,
          events: (exhibit.events || [])
            .filter(event => event.workflow_status === "published" && versionIsCurrent(event,"reviewed_version") && (!requirePublishedVersion || versionIsCurrent(event,"published_version")) && publicationReady(event))
            .sort((a,b) => Number(a.order || 0) - Number(b.order || 0))
            .map(event => projectEvent(event, mediaById,{requirePublishedVersion})),
        })),
    };
  };
  const readPublished = () => {
    try { return JSON.parse(fs.readFileSync(publicPath, "utf8")); }
    catch { return {schema_version:read().schema_version,generated_at:null,exhibits:[]}; }
  };
  const comparable = value => {
    const copy = structuredClone(value);
    if (copy && typeof copy === "object") delete copy.generated_at;
    return JSON.stringify(copy);
  };
  const indexPublic = payload => {
    const exhibits = new Map((payload.exhibits || []).map(item => [item.id,item]));
    const events = new Map((payload.exhibits || []).flatMap(exhibit => (exhibit.events || []).map(event => [event.id,event])));
    return {exhibits,events};
  };
  const diffFields=(before={},after={}) => Object.fromEntries([...new Set([...Object.keys(before||{}),...Object.keys(after||{})])]
    .filter(key=>JSON.stringify(before?.[key])!==JSON.stringify(after?.[key]))
    .map(key=>[key,{before:before?.[key],after:after?.[key]}]));
  const diffProjection = (before, after) => {
    const previous = indexPublic(before);
    const next = indexPublic(after);
    const changesFor = key => {
      const added=[...next[key].keys()].filter(id => !previous[key].has(id));
      const modified=[...next[key].keys()].filter(id => previous[key].has(id) && comparable(next[key].get(id)) !== comparable(previous[key].get(id)));
      const removed=[...previous[key].keys()].filter(id => !next[key].has(id));
      const details=Object.fromEntries([...added,...modified,...removed].map(id=>[id,{change:added.includes(id)?"added":removed.includes(id)?"removed":"modified",fields:diffFields(previous[key].get(id),next[key].get(id))}]));
      return {added,modified,removed,details};
    };
    return {exhibits:changesFor("exhibits"),events:changesFor("events")};
  };
  const reviewContext = catalog => {
    const mediaById=new Map((catalog.media_assets||[]).map(media=>[media.id,media]));
    const events={};
    for (const exhibit of catalog.exhibits||[]) for (const event of exhibit.events||[]) {
      const media=eventMediaIds(event).flatMap(mediaId=>{
        const item=mediaById.get(mediaId);let publicUrl="";
        try { publicUrl=item?.public_url?cleanPublicUrl(item.public_url):""; } catch {}
        return item?[{public_url:publicUrl,rights_status:item.rights_status,privacy_review_status:item.privacy_review_status,public_media:Boolean(item.public_media)}]:[];
      });
      events[event.id]={event_title:event.event_title,date:event.date,location:event.location,people_or_team:event.people_or_team,caption:event.caption,curatorial_boundary:event.curatorial_boundary||"",sources:(event.sources||[]).map(source=>({...safeSource(source),supported_claim:String(source.supported_claim||"")})).filter(source=>source.url),media};
    }
    return {events};
  };
  const assertCatalogVersion = (catalog, expected) => {
    if (!Number.isInteger(expected) || expected !== Number(catalog.version || 1)) throw versionError();
  };
  const summaryValue=value => {
    if (Array.isArray(value)) return {count:value.length,ids:value.map(item=>item?.id).filter(Boolean).slice(0,30)};
    if (value && typeof value === "object") return {id:value.id||null};
    return typeof value === "string" && value.length>240 ? `${value.slice(0,240)}…` : value;
  };
  const fieldDiff=(before={},after={}) => Object.fromEntries([...new Set([...Object.keys(before||{}),...Object.keys(after||{})])]
    .filter(key=>!["version","updated_at","last_change_actor_id","last_review_actor_id"].includes(key) && JSON.stringify(before?.[key])!==JSON.stringify(after?.[key]))
    .map(key=>[key,{before:summaryValue(before?.[key]),after:summaryValue(after?.[key])}]));
  const appendAudit = ({operation,object_type="catalog",object_id="catalog",before={},after={},context={},decision="changed",catalog_version}) => {
    fs.mkdirSync(path.dirname(auditPath),{recursive:true});
    const actor=context.actor && context.actor.id && context.actor.role ? {id:String(context.actor.id),role:String(context.actor.role)} : {id:"system",role:"system"};
    const entry={id:crypto.randomUUID(),operation,object_type,object_id,actor,field_diff:fieldDiff(before,after),reason:cleanText(context.reason||"未填写原因","reason",{max:500}),timestamp:now(),catalog_version,decision};
    fs.appendFileSync(auditPath,`${JSON.stringify(entry)}\n`,{encoding:"utf8",flag:"a"});
    return entry;
  };
  const persistCatalog = (catalog,audit=null) => {
    catalog.version = Number(catalog.version || 1) + 1;
    catalog.updated_at = now();
    writeJsonAtomic(catalogPath, catalog);
    if (audit) appendAudit({...audit,catalog_version:catalog.version});
  };
  const adminCatalog = catalog => {
    const clone = structuredClone(catalog);
    const scrub = value => {
      if (Array.isArray(value)) return value.map(scrub);
      if (!value || typeof value !== "object") return value;
      for (const [key, child] of Object.entries(value)) {
        if (key === "media_file" || (typeof child === "string" && path.isAbsolute(child))) delete value[key];
        else value[key] = scrub(child);
      }
      return value;
    };
    const safe=scrub(clone);
    for (const media of safe.media_assets||[]) media.review_workflow=mediaWorkflow(safe,media);
    return safe;
  };

  return {
    read,
    readAudit() {
      if (!fs.existsSync(auditPath)) return [];
      return fs.readFileSync(auditPath,"utf8").split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
    },
    adminProjection() {
      return {catalog:adminCatalog(read()),summary:this.summary()};
    },
    publicProjection: () => project(read(),{requirePublishedVersion:true}),
    readPublished,
    previewPublish() {
      const catalog = read();
      const projection = project(catalog,{requirePublishedVersion:false});
      return {catalog_version:Number(catalog.version || 1),projection,changes:diffProjection(readPublished(),projection),review_context:reviewContext(catalog)};
    },
    confirmPublish(input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      assertCatalogVersion(catalog, input.expected_version);
      if (context.actor) {
        if (!["publisher", "owner"].includes(context.actor.role)) throw reviewError("只有发布角色或管理员可以确认发布");
        const governed=[...(catalog.exhibits||[]),...(catalog.exhibits||[]).flatMap(exhibit=>exhibit.events||[]),...(catalog.media_assets||[])];
        if (governed.some(item=>item.last_change_actor_id && item.last_change_actor_id===context.actor.id)) throw reviewError("提交者不能发布自己的同一变更");
      }
      const candidate = project(catalog,{requirePublishedVersion:false});
      const previousProjection=readPublished();
      const changes = diffProjection(previousProjection, candidate);
      const publishedExhibits=new Map((candidate.exhibits||[]).map(exhibit=>[exhibit.id,new Set((exhibit.events||[]).map(event=>event.id))]));
      for (const exhibit of catalog.exhibits||[]) {
        const publishedEvents=publishedExhibits.get(exhibit.id);
        if (!publishedEvents) continue;
        exhibit.published_version=exhibit.version;
        for (const event of exhibit.events||[]) if (publishedEvents.has(event.id)) {
          event.published_version=event.version;
          for (const source of event.sources||[]) if (versionIsCurrent(source,"reviewed_version")) source.published_version=source.version;
          for (const mediaId of eventMediaIds(event)) {
            const media=(catalog.media_assets||[]).find(item=>item.id===mediaId);
            if (media?.public_media && versionIsCurrent(media,"reviewed_version")) media.published_version=media.version;
          }
        }
      }
      writeJsonAtomic(catalogPath,catalog);
      const projection = project(catalog,{requirePublishedVersion:true});
      writeJsonAtomic(publicPath, projection);
      appendAudit({operation:"confirm_publish",object_type:"catalog",object_id:"public_projection",before:previousProjection,after:projection,context,decision:"published",catalog_version:Number(catalog.version||1)});
      return {catalog_version:Number(catalog.version || 1),projection,changes};
    },
    summary() {
      const catalog = read();
      const events = (catalog.exhibits || []).flatMap(exhibit => exhibit.events || []);
      const countBy = key => events.reduce((counts, event) => {
        const value = event[key] || "unknown";
        counts[value] = (counts[value] || 0) + 1;
        return counts;
      }, {});
      return {
        exhibits: {total: (catalog.exhibits || []).length, ...((catalog.exhibits || []).reduce((counts, exhibit) => {
          const status = exhibit.workflow_status || "draft";
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {}))},
        events: {total: events.length, ...countBy("workflow_status")},
        rights: (catalog.media_assets || []).reduce((counts, media) => { const value = media.rights_status || "unknown"; counts[value] = (counts[value] || 0) + 1; return counts; }, {}),
        privacy: (catalog.media_assets || []).reduce((counts, media) => { const value = media.privacy_review_status || "unknown"; counts[value] = (counts[value] || 0) + 1; return counts; }, {}),
        public_media: (catalog.media_assets || []).filter(media => media.public_media).length,
        ip_placeholders: events.filter(event => event.content_origin === "ip_placeholder").length,
      };
    },
    createExhibit(input, context={}) {
      const allowed = new Set(["expected_version", "title", "summary", "boundary_note", "chapter_type", "audience_summary", "student_takeaway", "research_note"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      assertCatalogVersion(catalog, input.expected_version);
      const timestamp = now();
      const exhibit = {
        id:idFactory("exhibit"),
        title:cleanText(input.title, "title", {required:true,max:80}),
        summary:cleanText(input.summary, "summary", {max:500}),
        boundary_note:cleanText(input.boundary_note, "boundary_note", {max:500}),
        chapter_type:cleanText(input.chapter_type || "editorial", "chapter_type", {required:true,max:64}),
        audience_summary:cleanText(input.audience_summary, "audience_summary", {required:true,max:500}),
        student_takeaway:cleanText(input.student_takeaway, "student_takeaway", {required:true,max:500}),
        research_note:cleanText(input.research_note, "research_note", {max:1500}),
        workflow_status:"draft",
        ever_published:false,
        version:1,
        updated_at:timestamp,
        order:(catalog.exhibits || []).length,
        events:[],
      };
      catalog.exhibits ||= [];
      if (catalog.exhibits.some(item => item.id === exhibit.id)) throw inputError("生成了重复的展览 id");
      catalog.exhibits.push(exhibit);
      persistCatalog(catalog,{operation:"create_exhibit",object_type:"exhibit",object_id:exhibit.id,before:{},after:exhibit,context,decision:"created"});
      return structuredClone(exhibit);
    },
    updateExhibit(exhibitId, input, context={}) {
      const allowed = new Set(["expected_version", "title", "summary", "boundary_note", "chapter_type", "audience_summary", "student_takeaway", "research_note", "workflow_status"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const exhibit = (catalog.exhibits || []).find(item => item.id === exhibitId);
      if (!exhibit) throw inputError("未找到展览章节");
      const before=structuredClone(exhibit);
      if (Number(exhibit.version || 1) !== input.expected_version) throw versionError();
      const next = {...exhibit};
      const fields = {title:[80,true],summary:[500,false],boundary_note:[500,false],chapter_type:[64,true],audience_summary:[500,true],student_takeaway:[500,true],research_note:[1500,false]};
      for (const [key,[max,required]] of Object.entries(fields)) if (Object.hasOwn(input, key)) next[key] = cleanText(input[key], key, {required,max});
      if (Object.hasOwn(input, "workflow_status")) next.workflow_status = input.workflow_status;
      const publicChanged=[...EXHIBIT_PUBLIC_FIELDS].some(key=>Object.hasOwn(input,key)&&next[key]!==exhibit[key]);
      if (exhibit.workflow_status === "published" && publicChanged) {
        next.workflow_status="pending_review";
        next.reviewed_version=0;
        if (context.actor?.id) next.last_change_actor_id=context.actor.id;
      } else if (exhibit.workflow_status === "published" && input.workflow_status === "published") {
        throw reviewError("已发布章节不能沿用旧审核覆盖，请先退回待审");
      }
      if (!WORKFLOW.has(next.workflow_status)) throw inputError("发布状态无效");
      if (!WORKFLOW_TRANSITIONS[exhibit.workflow_status]?.has(next.workflow_status)) throw transitionError(exhibit.workflow_status, next.workflow_status);
      if (next.workflow_status === "published") {
        for (const key of ["title","audience_summary","student_takeaway"]) if (!String(next[key] || "").trim()) throw publicationError(`章节发布前缺少 ${key}`);
        if (!(next.events || []).some(event => event.workflow_status === "published" && Number(event.reviewed_version||0)===Number(event.version||0) && publicationReady(event))) throw publicationError("章节发布前至少需要一个可公开活动");
        next.ever_published = true;
        next.reviewed_version=Number(exhibit.version||1)+1;
        if (context.actor) {
          if (context.actor.role !== "reviewer") throw reviewError("只有审核角色可以通过章节审核");
          if (exhibit.last_change_actor_id && exhibit.last_change_actor_id===context.actor.id) throw reviewError("提交者不能审核自己的同一变更");
          next.last_review_actor_id=context.actor.id;
        }
      }
      Object.assign(exhibit, next, {version:Number(exhibit.version || 1) + 1, updated_at:now()});
      persistCatalog(catalog,{operation:"update_exhibit",object_type:"exhibit",object_id:exhibitId,before,after:exhibit,context,decision:exhibit.workflow_status==="published"?"reviewed":"changed"});
      return structuredClone(exhibit);
    },
    reorderExhibits(input, context={}) {
      const allowed = new Set(["expected_version", "ids"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const before={ids:(catalog.exhibits||[]).map(item=>item.id)};
      assertCatalogVersion(catalog, input.expected_version);
      if (!Array.isArray(input.ids) || new Set(input.ids).size !== input.ids.length) throw inputError("排序 id 必须是无重复数组");
      const existing = new Map((catalog.exhibits || []).map(item => [item.id,item]));
      if (input.ids.length !== existing.size || input.ids.some(id => !existing.has(id))) throw inputError("排序 id 与当前章节不一致");
      catalog.exhibits = input.ids.map((id, order) => Object.assign(existing.get(id), {order}));
      persistCatalog(catalog,{operation:"reorder_exhibits",object_type:"catalog",object_id:"exhibits",before,after:{ids:catalog.exhibits.map(item=>item.id)},context,decision:"reordered"});
      return structuredClone(catalog.exhibits);
    },
    copyExhibit(exhibitId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const sourceExhibit = (catalog.exhibits || []).find(item => item.id === exhibitId);
      if (!sourceExhibit) throw inputError("未找到展览章节");
      if (Number(sourceExhibit.version || 1) !== input.expected_version) throw versionError();
      const timestamp = now();
      const copy = structuredClone(sourceExhibit);
      copy.id = idFactory("exhibit");
      copy.title = `${cleanText(copy.title, "title", {required:true,max:76})} 副本`;
      copy.workflow_status = "draft";
      copy.ever_published = false;
      copy.version = 1;
      copy.updated_at = timestamp;
      copy.order = (catalog.exhibits || []).length;
      copy.events = (copy.events || []).map((event, order) => ({
        ...event,
        id:idFactory("event"),
        workflow_status:"draft",
        fact_review_status:"unverified",
        source_review_status:"unverified",
        public_fact:false,
        media_asset_id:null,
        public_media:false,
        ever_published:false,
        version:1,
        updated_at:timestamp,
        order,
        sources:(event.sources || []).map((source, sourceOrder) => ({...source,id:idFactory("source"),version:1,updated_at:timestamp,order:sourceOrder})),
      }));
      if ((catalog.exhibits || []).some(item => item.id === copy.id)) throw inputError("生成了重复的展览 id");
      catalog.exhibits.push(copy);
      persistCatalog(catalog,{operation:"copy_exhibit",object_type:"exhibit",object_id:copy.id,before:{source_id:exhibitId},after:copy,context,decision:"copied"});
      return structuredClone(copy);
    },
    deleteExhibit(exhibitId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const index = (catalog.exhibits || []).findIndex(item => item.id === exhibitId);
      if (index < 0) throw inputError("未找到展览章节");
      const exhibit = catalog.exhibits[index];
      if (Number(exhibit.version || 1) !== input.expected_version) throw versionError();
      if (exhibit.workflow_status !== "draft" || exhibit.ever_published || (exhibit.events || []).length) throw deleteError("只有从未发布且没有活动引用的草稿章节可以物理删除");
      catalog.exhibits.splice(index,1);
      catalog.exhibits.forEach((item, order) => { item.order = order; });
      persistCatalog(catalog,{operation:"delete_exhibit",object_type:"exhibit",object_id:exhibitId,before:exhibit,after:{},context,decision:"deleted"});
      return true;
    },
    createEvent(exhibitId, input, context={}) {
      const allowed = new Set(["expected_version", "event_title", "date", "location", "people_or_team", "caption", "audience_summary", "student_takeaway", "research_note"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const exhibit = (catalog.exhibits || []).find(item => item.id === exhibitId);
      if (!exhibit) throw inputError("未找到展览章节");
      if (Number(exhibit.version || 1) !== input.expected_version) throw versionError();
      const timestamp = now();
      const event = {
        id:idFactory("event"),
        event_title:cleanText(input.event_title, "event_title", {required:true,max:120}),
        date:cleanDate(input.date),
        location:cleanText(input.location, "location", {max:160}),
        people_or_team:cleanText(input.people_or_team, "people_or_team", {max:300}),
        caption:cleanText(input.caption, "caption", {max:800}),
        audience_summary:cleanText(input.audience_summary, "audience_summary", {max:500}),
        student_takeaway:cleanText(input.student_takeaway, "student_takeaway", {max:500}),
        research_note:cleanText(input.research_note, "research_note", {max:1500}),
        workflow_status:"draft",
        fact_review_status:"unverified",
        source_review_status:"unverified",
        public_fact:false,
        rights_status:"pending_authorization",
        privacy_review_status:"unreviewed",
        privacy_risk:"unreviewed",
        public_media:false,
        media_asset_id:null,
        sources:[],
        ever_published:false,
        version:1,
        updated_at:timestamp,
        order:(exhibit.events || []).length,
      };
      exhibit.events ||= [];
      if ((catalog.exhibits || []).flatMap(item => item.events || []).some(item => item.id === event.id)) throw inputError("生成了重复的活动 id");
      exhibit.events.push(event);
      exhibit.version = Number(exhibit.version || 1) + 1;
      exhibit.updated_at = timestamp;
      persistCatalog(catalog,{operation:"create_event",object_type:"event",object_id:event.id,before:{exhibit_id:exhibitId},after:event,context,decision:"created"});
      return structuredClone(event);
    },
    reorderEvents(exhibitId, input, context={}) {
      const allowed = new Set(["expected_version", "ids"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const exhibit = (catalog.exhibits || []).find(item => item.id === exhibitId);
      if (!exhibit) throw inputError("未找到展览章节");
      if (Number(exhibit.version || 1) !== input.expected_version) throw versionError();
      if (!Array.isArray(input.ids) || new Set(input.ids).size !== input.ids.length) throw inputError("排序 id 必须是无重复数组");
      const existing = new Map((exhibit.events || []).map(item => [item.id,item]));
      if (input.ids.length !== existing.size || input.ids.some(id => !existing.has(id))) throw inputError("排序 id 与当前活动不一致");
      exhibit.events = input.ids.map((id, order) => Object.assign(existing.get(id), {order}));
      exhibit.version = Number(exhibit.version || 1) + 1;
      exhibit.updated_at = now();
      persistCatalog(catalog,{operation:"reorder_events",object_type:"exhibit",object_id:exhibitId,before:{},after:{ids:exhibit.events.map(item=>item.id)},context,decision:"reordered"});
      return structuredClone(exhibit.events);
    },
    copyEvent(eventId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const found = findEventContext(catalog, eventId);
      if (!found) throw inputError("未找到活动条目");
      if (Number(found.event.version || 1) !== input.expected_version) throw versionError();
      const timestamp = now();
      const copy = structuredClone(found.event);
      copy.id = idFactory("event");
      copy.event_title = `${cleanText(copy.event_title, "event_title", {required:true,max:116})} 副本`;
      copy.workflow_status = "draft";
      copy.fact_review_status = "unverified";
      copy.source_review_status = "unverified";
      copy.public_fact = false;
      copy.media_asset_id = null;
      copy.public_media = false;
      copy.ever_published = false;
      copy.version = 1;
      copy.updated_at = timestamp;
      copy.order = found.exhibit.events.length;
      copy.sources = (copy.sources || []).map((source, order) => ({...source,id:idFactory("source"),version:1,updated_at:timestamp,order}));
      const eventIds = (catalog.exhibits || []).flatMap(exhibit => exhibit.events || []).map(item => item.id);
      if (eventIds.includes(copy.id)) throw inputError("生成了重复的活动 id");
      found.exhibit.events.push(copy);
      found.exhibit.version = Number(found.exhibit.version || 1) + 1;
      found.exhibit.updated_at = timestamp;
      persistCatalog(catalog,{operation:"copy_event",object_type:"event",object_id:copy.id,before:{source_id:eventId},after:copy,context,decision:"copied"});
      return structuredClone(copy);
    },
    deleteEvent(eventId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const found = findEventContext(catalog, eventId);
      if (!found) throw inputError("未找到活动条目");
      if (Number(found.event.version || 1) !== input.expected_version) throw versionError();
      if (found.event.workflow_status !== "draft" || found.event.ever_published || (found.event.sources || []).length || found.event.media_asset_id) throw deleteError("只有从未发布且没有来源或媒体引用的草稿活动可以物理删除");
      found.exhibit.events = found.exhibit.events.filter(item => item.id !== eventId);
      found.exhibit.events.forEach((item, order) => { item.order = order; });
      found.exhibit.version = Number(found.exhibit.version || 1) + 1;
      found.exhibit.updated_at = now();
      persistCatalog(catalog,{operation:"delete_event",object_type:"event",object_id:eventId,before:found.event,after:{},context,decision:"deleted"});
      return true;
    },
    addSource(eventId, input, context={}) {
      const allowed = new Set(["expected_version", "label", "url", "source_type", "supported_claim", "source_document", "source_paragraph", "publication", "accessed_at", "reviewer", "reviewed_at"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const event = findEvent(catalog, eventId);
      if (!event) throw inputError("未找到活动条目");
      if (Number(event.version || 1) !== input.expected_version) throw versionError();
      const timestamp = now();
      const source = {
        id:idFactory("source"),
        label:cleanText(input.label, "label", {required:true,max:160}),
        url:cleanSourceUrl(input.url),
        source_type:cleanText(input.source_type, "source_type", {required:true,max:64}),
        supported_claim:cleanText(input.supported_claim,"supported_claim",{required:true,max:800}),
        source_document:cleanRelativeRef(input.source_document,"source_document",{max:300}),
        source_paragraph:cleanText(input.source_paragraph,"source_paragraph",{max:300}),
        publication:cleanText(input.publication,"publication",{max:160}),
        accessed_at:cleanSimpleDate(input.accessed_at,"accessed_at"),
        reviewer:cleanText(input.reviewer,"reviewer",{max:120}),
        reviewed_at:cleanTimestamp(input.reviewed_at,"reviewed_at"),
        version:1,
        reviewed_version:0,
        updated_at:timestamp,
        order:(event.sources || []).length,
      };
      const sourceIds = (catalog.exhibits || []).flatMap(exhibit => exhibit.events || []).flatMap(item => item.sources || []).map(item => item.id);
      if (sourceIds.includes(source.id)) throw inputError("生成了重复的来源 id");
      event.sources ||= [];
      event.sources.push(source);
      if (context.actor?.id) {
        source.last_change_actor_id=context.actor.id;
        event.last_change_actor_id=context.actor.id;
      }
      if (event.workflow_status === "published") event.workflow_status="pending_review";
      event.fact_review_status="unverified";
      event.source_review_status="unverified";
      event.public_fact=false;
      event.reviewed_version=0;
      event.version = Number(event.version || 1) + 1;
      event.updated_at = timestamp;
      persistCatalog(catalog,{operation:"add_source",object_type:"source",object_id:source.id,before:{event_id:eventId},after:source,context,decision:"created"});
      return structuredClone(source);
    },
    updateSource(sourceId, input, context={}) {
      const allowed = new Set(["expected_version", "label", "url", "source_type", "supported_claim", "source_document", "source_paragraph", "publication", "accessed_at", "reviewer", "reviewed_at"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const found = findSource(catalog, sourceId);
      if (!found) throw inputError("未找到资料来源");
      const sourceBefore=structuredClone(found.source);
      if (Number(found.source.version || 1) !== input.expected_version) throw versionError();
      const reviewFields=["label","url","source_type","supported_claim","source_document","source_paragraph","publication","accessed_at"];
      const before=Object.fromEntries(reviewFields.map(key=>[key,found.source[key]]));
      if (Object.hasOwn(input, "label")) found.source.label = cleanText(input.label, "label", {required:true,max:160});
      if (Object.hasOwn(input, "url")) found.source.url = cleanSourceUrl(input.url);
      if (Object.hasOwn(input, "source_type")) found.source.source_type = cleanText(input.source_type, "source_type", {required:true,max:64});
      if (Object.hasOwn(input, "supported_claim")) found.source.supported_claim = cleanText(input.supported_claim, "supported_claim", {required:true,max:800});
      if (Object.hasOwn(input,"source_document")) found.source.source_document=cleanRelativeRef(input.source_document,"source_document",{max:300});
      if (Object.hasOwn(input,"source_paragraph")) found.source.source_paragraph=cleanText(input.source_paragraph,"source_paragraph",{max:300});
      if (Object.hasOwn(input,"publication")) found.source.publication=cleanText(input.publication,"publication",{max:160});
      if (Object.hasOwn(input,"accessed_at")) found.source.accessed_at=cleanSimpleDate(input.accessed_at,"accessed_at");
      if (Object.hasOwn(input,"reviewer")) found.source.reviewer=cleanText(input.reviewer,"reviewer",{max:120});
      if (Object.hasOwn(input,"reviewed_at")) found.source.reviewed_at=cleanTimestamp(input.reviewed_at,"reviewed_at");
      const reviewChanged=Object.keys(before).some(key=>before[key]!==found.source[key]);
      found.source.version = Number(found.source.version || 1) + 1;
      if (reviewChanged) found.source.reviewed_version=0;
      found.source.updated_at = now();
      found.event.version = Number(found.event.version || 1) + 1;
      if (reviewChanged && found.event.workflow_status === "published") found.event.workflow_status="pending_review";
      if (reviewChanged) {
        found.event.fact_review_status="unverified";
        found.event.source_review_status="unverified";
        found.event.public_fact=false;
        found.event.reviewed_version=0;
        if (context.actor?.id) {
          found.source.last_change_actor_id=context.actor.id;
          found.event.last_change_actor_id=context.actor.id;
        }
      }
      found.event.updated_at = now();
      persistCatalog(catalog,{operation:"update_source",object_type:"source",object_id:sourceId,before:sourceBefore,after:found.source,context,decision:reviewChanged?"review_invalidated":"changed"});
      return structuredClone(found.source);
    },
    reorderSources(eventId, input, context={}) {
      const allowed = new Set(["expected_version", "ids"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const event = findEvent(catalog, eventId);
      if (!event) throw inputError("未找到活动条目");
      if (Number(event.version || 1) !== input.expected_version) throw versionError();
      if (!Array.isArray(input.ids) || new Set(input.ids).size !== input.ids.length) throw inputError("排序 id 必须是无重复数组");
      const existing = new Map((event.sources || []).map(item => [item.id,item]));
      if (input.ids.length !== existing.size || input.ids.some(id => !existing.has(id))) throw inputError("排序 id 与当前来源不一致");
      event.sources = input.ids.map((id, order) => Object.assign(existing.get(id), {order}));
      if (event.workflow_status === "published") event.workflow_status="pending_review";
      event.fact_review_status="unverified";
      event.source_review_status="unverified";
      event.public_fact=false;
      event.reviewed_version=0;
      if (context.actor?.id) event.last_change_actor_id=context.actor.id;
      event.version = Number(event.version || 1) + 1;
      event.updated_at = now();
      persistCatalog(catalog,{operation:"reorder_sources",object_type:"event",object_id:eventId,before:{},after:{ids:event.sources.map(item=>item.id)},context,decision:"reordered"});
      return structuredClone(event.sources);
    },
    deleteSource(sourceId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const found = findSource(catalog, sourceId);
      if (!found) throw inputError("未找到资料来源");
      if (Number(found.source.version || 1) !== input.expected_version) throw versionError();
      if (found.event.workflow_status !== "draft" || found.event.ever_published) throw deleteError("已发布活动的来源不能物理删除，请先退回审核并保留审计记录");
      found.event.sources = found.event.sources.filter(item => item.id !== sourceId);
      found.event.sources.forEach((item, order) => { item.order = order; });
      found.event.version = Number(found.event.version || 1) + 1;
      found.event.updated_at = now();
      persistCatalog(catalog,{operation:"delete_source",object_type:"source",object_id:sourceId,before:found.source,after:{},context,decision:"deleted"});
      return true;
    },
    createMedia(input, context={}) {
      const allowed = new Set(["expected_version", "label", "inventory_ref", "dimensions", "sha256", "source_document", "source_paragraph", "publication", "accessed_at", "supported_claim", "rights_holder", "license_scope", "authorization_evidence_ref", "minor_consent_evidence_ref", "third_party_rights_evidence_ref", "review_note", "reviewer", "reviewed_at", "expires_at"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      assertCatalogVersion(catalog, input.expected_version);
      const inventoryRef = cleanText(input.inventory_ref, "inventory_ref", {required:true,max:240}).replace(/\\/g, "/");
      if (path.isAbsolute(inventoryRef) || inventoryRef.startsWith("/") || inventoryRef.split("/").includes("..")) throw inputError("inventory_ref 必须是候选库内的相对引用");
      const dimensions = cleanText(input.dimensions, "dimensions", {required:true,max:32});
      if (!/^\d{1,5}x\d{1,5}$/.test(dimensions)) throw inputError("dimensions 必须使用 宽x高 格式");
      const sha256 = cleanText(input.sha256, "sha256", {required:true,max:64}).toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(sha256)) throw inputError("sha256 无效");
      const timestamp = now();
      const media = {
        id:idFactory("media"),
        label:cleanText(input.label, "label", {required:true,max:160}),
        inventory_ref:inventoryRef,
        dimensions,
        sha256,
        source_document:cleanRelativeRef(input.source_document,"source_document",{max:300}),
        source_paragraph:cleanText(input.source_paragraph,"source_paragraph",{max:300}),
        publication:cleanText(input.publication,"publication",{max:160}),
        accessed_at:cleanSimpleDate(input.accessed_at,"accessed_at"),
        supported_claim:cleanText(input.supported_claim,"supported_claim",{max:800}),
        rights_holder:cleanText(input.rights_holder,"rights_holder",{max:200}),
        license_scope:cleanText(input.license_scope,"license_scope",{max:500}),
        authorization_evidence_ref:cleanRelativeRef(input.authorization_evidence_ref,"authorization_evidence_ref",{max:300}),
        minor_consent_evidence_ref:cleanRelativeRef(input.minor_consent_evidence_ref,"minor_consent_evidence_ref",{max:300}),
        third_party_rights_evidence_ref:cleanRelativeRef(input.third_party_rights_evidence_ref,"third_party_rights_evidence_ref",{max:300}),
        review_note:cleanText(input.review_note,"review_note",{max:1000}),
        reviewer:cleanText(input.reviewer,"reviewer",{max:120}),
        reviewed_at:cleanTimestamp(input.reviewed_at,"reviewed_at"),
        expires_at:cleanSimpleDate(input.expires_at,"expires_at"),
        rights_status:"pending_authorization",
        privacy_review_status:"unreviewed",
        privacy_risk:"unreviewed",
        contains_minors:false,
        contains_third_party_media:false,
        public_media:false,
        public_url:"",
        ever_published:false,
        version:1,
        updated_at:timestamp,
        order:(catalog.media_assets || []).length,
      };
      catalog.media_assets ||= [];
      if (catalog.media_assets.some(item => item.id === media.id || item.sha256 === media.sha256)) throw inputError("媒体 id 或 SHA-256 重复");
      catalog.media_assets.push(media);
      persistCatalog(catalog,{operation:"create_media",object_type:"media",object_id:media.id,before:{},after:media,context,decision:"created"});
      return structuredClone(media);
    },
    updateMedia(mediaId, input, context={}) {
      const allowed = new Set(["expected_version", "label", "inventory_ref", "dimensions", "rights_status", "privacy_review_status", "privacy_risk", "contains_minors", "contains_third_party_media", "public_url", "public_media", "source_document", "source_paragraph", "publication", "accessed_at", "supported_claim", "rights_holder", "license_scope", "authorization_evidence_ref", "minor_consent_evidence_ref", "third_party_rights_evidence_ref", "review_note", "reviewer", "reviewed_at", "expires_at"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const media = (catalog.media_assets || []).find(item => item.id === mediaId);
      if (!media) throw inputError("未找到媒体候选");
      const mediaBefore=structuredClone(media);
      if (Number(media.version || 1) !== input.expected_version) throw versionError();
      const wasAuthorized=media.rights_status === "authorized" || media.public_media === true;
      const criticalFields=["inventory_ref","public_url","rights_status","privacy_risk","contains_minors","contains_third_party_media","rights_holder","license_scope","authorization_evidence_ref","minor_consent_evidence_ref","third_party_rights_evidence_ref","review_note","expires_at"];
      const beforeCritical=Object.fromEntries(criticalFields.map(key=>[key,media[key]]));
      if (Object.hasOwn(input, "label")) media.label = cleanText(input.label, "label", {required:true,max:160});
      if (Object.hasOwn(input, "inventory_ref")) {
        const ref = cleanText(input.inventory_ref, "inventory_ref", {required:true,max:240}).replace(/\\/g, "/");
        if (path.isAbsolute(ref) || ref.startsWith("/") || ref.split("/").includes("..")) throw inputError("inventory_ref 必须是候选库内的相对引用");
        media.inventory_ref = ref;
      }
      if (Object.hasOwn(input, "dimensions")) {
        const dimensions = cleanText(input.dimensions, "dimensions", {required:true,max:32});
        if (!/^\d{1,5}x\d{1,5}$/.test(dimensions)) throw inputError("dimensions 必须使用 宽x高 格式");
        media.dimensions = dimensions;
      }
      if (Object.hasOwn(input, "rights_status")) {
        if (!new Set(["pending_authorization","authorized","declined"]).has(input.rights_status)) throw inputError("版权状态无效");
        media.rights_status = input.rights_status;
      }
      if (Object.hasOwn(input, "privacy_review_status")) {
        if (!new Set(["unreviewed","approved","rejected"]).has(input.privacy_review_status)) throw inputError("隐私复核状态无效");
        media.privacy_review_status = input.privacy_review_status;
      }
      if (Object.hasOwn(input, "privacy_risk")) media.privacy_risk = cleanText(input.privacy_risk, "privacy_risk", {max:120});
      if (Object.hasOwn(input,"contains_minors")) {
        if (typeof input.contains_minors!=="boolean") throw inputError("contains_minors 必须是布尔值");
        media.contains_minors=input.contains_minors;
      }
      if (Object.hasOwn(input,"contains_third_party_media")) {
        if (typeof input.contains_third_party_media!=="boolean") throw inputError("contains_third_party_media 必须是布尔值");
        media.contains_third_party_media=input.contains_third_party_media;
      }
      if (Object.hasOwn(input, "public_url")) media.public_url = cleanPublicUrl(input.public_url);
      if (Object.hasOwn(input,"source_document")) media.source_document=cleanRelativeRef(input.source_document,"source_document",{max:300});
      if (Object.hasOwn(input,"source_paragraph")) media.source_paragraph=cleanText(input.source_paragraph,"source_paragraph",{max:300});
      if (Object.hasOwn(input,"publication")) media.publication=cleanText(input.publication,"publication",{max:160});
      if (Object.hasOwn(input,"accessed_at")) media.accessed_at=cleanSimpleDate(input.accessed_at,"accessed_at");
      if (Object.hasOwn(input,"supported_claim")) media.supported_claim=cleanText(input.supported_claim,"supported_claim",{max:800});
      if (Object.hasOwn(input,"rights_holder")) media.rights_holder=cleanText(input.rights_holder,"rights_holder",{max:200});
      if (Object.hasOwn(input,"license_scope")) media.license_scope=cleanText(input.license_scope,"license_scope",{max:500});
      if (Object.hasOwn(input,"authorization_evidence_ref")) media.authorization_evidence_ref=cleanRelativeRef(input.authorization_evidence_ref,"authorization_evidence_ref",{max:300});
      if (Object.hasOwn(input,"minor_consent_evidence_ref")) media.minor_consent_evidence_ref=cleanRelativeRef(input.minor_consent_evidence_ref,"minor_consent_evidence_ref",{max:300});
      if (Object.hasOwn(input,"third_party_rights_evidence_ref")) media.third_party_rights_evidence_ref=cleanRelativeRef(input.third_party_rights_evidence_ref,"third_party_rights_evidence_ref",{max:300});
      if (Object.hasOwn(input,"review_note")) media.review_note=cleanText(input.review_note,"review_note",{max:1000});
      if (Object.hasOwn(input,"reviewer")) media.reviewer=cleanText(input.reviewer,"reviewer",{max:120});
      if (Object.hasOwn(input,"reviewed_at")) media.reviewed_at=cleanTimestamp(input.reviewed_at,"reviewed_at");
      if (Object.hasOwn(input,"expires_at")) media.expires_at=cleanSimpleDate(input.expires_at,"expires_at");
      if (Object.hasOwn(input, "public_media")) {
        if (typeof input.public_media !== "boolean") throw inputError("public_media 必须是布尔值");
        media.public_media = input.public_media;
      }
      const criticalChanged=Object.keys(beforeCritical).some(key=>beforeCritical[key]!==media[key]);
      if (wasAuthorized && criticalChanged) {
        media.rights_status="pending_authorization";
        media.privacy_review_status="unreviewed";
        media.public_media=false;
        media.reviewed_version=0;
        if (context.actor?.id) media.last_change_actor_id=context.actor.id;
      }
      if (media.public_media) {
        const missingAuthorization=mediaAuthorizationGaps(media).filter(item=>item!=="允许图片公开");
        if (missingAuthorization.length) throw reviewError(`图片公开前仍缺少：${missingAuthorization.join("、")}`);
        if (context.actor) {
          if (context.actor.role !== "reviewer") throw reviewError("只有审核角色可以通过媒体公开审核");
          if (media.last_change_actor_id && media.last_change_actor_id===context.actor.id) throw reviewError("提交者不能审核自己的同一变更");
          media.last_review_actor_id=context.actor.id;
          media.reviewer=context.actor.id;
          media.reviewed_at=now();
        }
        media.ever_published = true;
        media.reviewed_version=Number(media.version || 1)+1;
      }
      media.version = Number(media.version || 1) + 1;
      media.updated_at = now();
      persistCatalog(catalog,{operation:"update_media",object_type:"media",object_id:mediaId,before:mediaBefore,after:media,context,decision:criticalChanged?"review_invalidated":"changed"});
      return structuredClone(media);
    },
    reorderMedia(input, context={}) {
      const allowed = new Set(["expected_version", "ids"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      assertCatalogVersion(catalog, input.expected_version);
      if (!Array.isArray(input.ids) || new Set(input.ids).size !== input.ids.length) throw inputError("排序 id 必须是无重复数组");
      const existing = new Map((catalog.media_assets || []).map(item => [item.id,item]));
      if (input.ids.length !== existing.size || input.ids.some(id => !existing.has(id))) throw inputError("排序 id 与当前媒体不一致");
      catalog.media_assets = input.ids.map((id, order) => Object.assign(existing.get(id), {order}));
      persistCatalog(catalog,{operation:"reorder_media",object_type:"catalog",object_id:"media_assets",before:{},after:{ids:catalog.media_assets.map(item=>item.id)},context,decision:"reordered"});
      return structuredClone(catalog.media_assets);
    },
    deleteMedia(mediaId, input, context={}) {
      const allowed = new Set(["expected_version"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const index = (catalog.media_assets || []).findIndex(item => item.id === mediaId);
      if (index < 0) throw inputError("未找到媒体候选");
      const media = catalog.media_assets[index];
      if (Number(media.version || 1) !== input.expected_version) throw versionError();
      const referenced = (catalog.exhibits || []).flatMap(exhibit => exhibit.events || []).some(event => event.media_asset_id === mediaId);
      if (media.ever_published || media.public_media || referenced) throw deleteError("已发布或仍被活动引用的媒体不能物理删除");
      catalog.media_assets.splice(index,1);
      catalog.media_assets.forEach((item, order) => { item.order = order; });
      persistCatalog(catalog,{operation:"delete_media",object_type:"media",object_id:mediaId,before:media,after:{},context,decision:"deleted"});
      return true;
    },
    bindMedia(eventId, input, context={}) {
      const allowed = new Set(["expected_version", "media_asset_id", "media_asset_ids"]);
      rejectUnknown(input, allowed);
      const catalog = read();
      const event = findEvent(catalog, eventId);
      if (!event) throw inputError("未找到活动条目");
      const eventBefore=structuredClone(event);
      if (Number(event.version || 1) !== input.expected_version) throw versionError();
      const suppliedList=Object.hasOwn(input,"media_asset_ids") ? input.media_asset_ids : undefined;
      if (suppliedList!==undefined && (!Array.isArray(suppliedList) || suppliedList.length>8 || new Set(suppliedList).size!==suppliedList.length)) throw inputError("media_asset_ids 必须是不重复且不超过 8 项的数组");
      const mediaIds=suppliedList===undefined
        ? (input.media_asset_id===null ? [] : [cleanText(input.media_asset_id, "media_asset_id", {required:true,max:120})])
        : suppliedList.map(mediaId=>cleanText(mediaId,"media_asset_ids",{required:true,max:120}));
      if (mediaIds.some(mediaId=>!(catalog.media_assets || []).some(item=>item.id===mediaId))) throw inputError("媒体候选不存在");
      if (Object.hasOwn(input,"media_asset_id") && input.media_asset_id!==null && input.media_asset_id!==mediaIds[0]) throw inputError("media_asset_id 必须与 media_asset_ids 第一项一致");
      event.media_asset_id=mediaIds[0]||null;
      event.media_asset_ids=mediaIds;
      event.public_media = false;
      if (event.workflow_status === "published") event.workflow_status="pending_review";
      event.fact_review_status="unverified";
      event.source_review_status="unverified";
      event.public_fact=false;
      event.reviewed_version=0;
      if (context.actor?.id) event.last_change_actor_id=context.actor.id;
      event.version = Number(event.version || 1) + 1;
      event.updated_at = now();
      persistCatalog(catalog,{operation:"bind_media",object_type:"event",object_id:eventId,before:eventBefore,after:event,context,decision:mediaIds.length?"bound":"unbound"});
      return structuredClone(event);
    },
    updateEvent(eventId, patch, context={}) {
      const catalog = read();
      const event = findEvent(catalog, eventId);
      if (!event) throw new Error("未找到活动条目");
      const before=structuredClone(event);
      const allowed = new Set(["expected_version", "event_title", "date", "location", "people_or_team", "caption", "audience_summary", "student_takeaway", "research_note", "curatorial_boundary", "workflow_status", "fact_review_status", "source_review_status", "public_fact", "rights_status", "privacy_review_status", "privacy_risk", "public_media", "order", "link_status"]);
      rejectUnknown(patch, allowed);
      if (Number(event.version || 1) !== patch.expected_version) throw versionError();
      const next = {...event};
      const textFields = {event_title:120,location:160,people_or_team:300,caption:800,audience_summary:500,student_takeaway:500,research_note:1500,curatorial_boundary:1200,privacy_risk:120,link_status:64};
      for (const [key, max] of Object.entries(textFields)) if (Object.hasOwn(patch, key)) next[key] = cleanText(patch[key], key, {max});
      if (Object.hasOwn(patch, "date")) next.date = cleanDate(patch.date);
      if (Object.hasOwn(patch, "workflow_status")) next.workflow_status = patch.workflow_status;
      if (Object.hasOwn(patch, "fact_review_status")) next.fact_review_status = patch.fact_review_status;
      if (Object.hasOwn(patch, "source_review_status")) next.source_review_status = patch.source_review_status;
      if (Object.hasOwn(patch, "rights_status")) next.rights_status = patch.rights_status;
      if (Object.hasOwn(patch, "privacy_review_status")) next.privacy_review_status = patch.privacy_review_status;
      if (Object.hasOwn(patch, "public_fact")) {
        if (typeof patch.public_fact !== "boolean") throw inputError("public_fact 必须是布尔值");
        next.public_fact = patch.public_fact;
      }
      if (Object.hasOwn(patch, "public_media")) {
        if (typeof patch.public_media !== "boolean") throw inputError("public_media 必须是布尔值");
        next.public_media = patch.public_media;
      }
      if (Object.hasOwn(patch, "order")) {
        if (!Number.isInteger(patch.order) || patch.order < 0) throw inputError("order 必须是非负整数");
        next.order = patch.order;
      }
      const publicChanged=[...EVENT_PUBLIC_FIELDS].some(key => Object.hasOwn(patch,key) && next[key] !== event[key]);
      if (event.workflow_status === "published" && publicChanged) {
        next.workflow_status="pending_review";
        next.fact_review_status="unverified";
        next.source_review_status="unverified";
        next.public_fact=false;
        next.reviewed_version=0;
        if (context.actor?.id) next.last_change_actor_id=context.actor.id;
      } else if (event.workflow_status === "published" && patch.workflow_status === "published") {
        throw reviewError("已发布活动不能沿用旧审核覆盖，请先退回待审");
      }
      if (!WORKFLOW.has(next.workflow_status)) throw inputError("发布状态无效");
      if (!new Set(["unverified","verified","rejected"]).has(next.fact_review_status || "unverified")) throw inputError("事实核验状态无效");
      if (!new Set(["unverified","verified","rejected"]).has(next.source_review_status || "unverified")) throw inputError("来源核验状态无效");
      if (!new Set(["pending_authorization","authorized","declined"]).has(next.rights_status || "pending_authorization")) throw inputError("版权状态无效");
      if (!new Set(["unreviewed","approved","rejected"]).has(next.privacy_review_status || "unreviewed")) throw inputError("隐私复核状态无效");
      if (!WORKFLOW_TRANSITIONS[event.workflow_status]?.has(next.workflow_status)) throw transitionError(event.workflow_status, next.workflow_status);
      if (next.workflow_status === "published") validateForPublication(next);
      if (next.workflow_status === "published" && event.workflow_status !== "published" && context.actor) {
        if (context.actor.role !== "reviewer") throw reviewError("只有审核角色可以通过活动审核");
        if (event.last_change_actor_id && event.last_change_actor_id===context.actor.id) throw reviewError("提交者不能审核自己的同一变更");
      }
      if (next.public_media && next.rights_status !== "authorized") throw reviewError("媒体尚未获得公开授权");
      if (next.public_media && /high|unreviewed/.test(String(next.privacy_risk))) throw reviewError("隐私风险尚未通过复核");
      if (next.workflow_status === "published") {
        next.ever_published = true;
        next.reviewed_version=Number(event.version || 1)+1;
        next.sources=(next.sources||[]).map(source=>({...source,reviewed_version:Number(source.version||1)}));
        if (context.actor?.id) next.last_review_actor_id=context.actor.id;
      }
      Object.assign(event, next, {version:Number(event.version || 1) + 1, updated_at:now()});
      persistCatalog(catalog,{operation:"update_event",object_type:"event",object_id:eventId,before,after:event,context,decision:event.workflow_status==="published"?"reviewed":"changed"});
      return structuredClone(event);
    },
    syncPublic() {
      const catalog = read();
      const projection = project(catalog,{requirePublishedVersion:true});
      writeJsonAtomic(publicPath, projection);
      return projection;
    },
  };
}
