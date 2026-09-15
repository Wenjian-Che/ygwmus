import fs from "node:fs";
import path from "node:path";

export const defaultSiteContent = Object.freeze({
  hero: Object.freeze({
    eyebrow: "国家级非物质文化遗产 英歌",
    titleLine1: "看见英歌，",
    titleLine2: "也看懂英歌。",
    body: "影像、互动与知识档案，共同解释动作、阵法、人物和地方传承。",
    primaryCta: "进入数字展馆",
  }),
  experiences: Object.freeze({
    title: "三件核心展项",
    intro: "先看真实表演，再进互动叙事；遇到不懂的内容，随时问英歌小槌。",
    cards: Object.freeze({
      video: Object.freeze({ title: "看英歌", description: "从完整表演进入动作、阵形、人物与地方现场。" }),
      h5: Object.freeze({ title: "互动特展", description: "沿着互动叙事认识英歌，并随时返回博物馆继续参观。" }),
      agent: Object.freeze({ title: "问小槌", description: "围绕当前展品回答，并说明资料来源和适用范围。" }),
    }),
  }),
});

function problem(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exactKeys(value, keys, label) {
  if (!plainObject(value)) throw problem("SITE_CONTENT_INVALID_INPUT", `${label} 必须是对象`);
  const allowed = new Set(keys);
  const actual = Object.keys(value);
  if (actual.some((key) => !allowed.has(key)) || keys.some((key) => !Object.hasOwn(value, key))) {
    throw problem("SITE_CONTENT_INVALID_INPUT", `${label} 字段不完整或包含未知字段`);
  }
}

function cleanText(value, label, max) {
  if (typeof value !== "string") throw problem("SITE_CONTENT_INVALID_INPUT", `${label} 必须是文字`);
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) {
    throw problem("SITE_CONTENT_INVALID_INPUT", `${label} 长度应为 1–${max} 个字符`);
  }
  return text;
}

export function normalizeSiteContent(input) {
  exactKeys(input, ["hero", "experiences"], "页面内容");
  exactKeys(input.hero, ["eyebrow", "titleLine1", "titleLine2", "body", "primaryCta"], "首页首屏");
  exactKeys(input.experiences, ["title", "intro", "cards"], "核心展项");
  exactKeys(input.experiences.cards, ["video", "h5", "agent"], "展项卡片");
  for (const key of ["video", "h5", "agent"]) exactKeys(input.experiences.cards[key], ["title", "description"], `${key} 展项`);
  return {
    hero: {
      eyebrow: cleanText(input.hero.eyebrow, "眉题", 50),
      titleLine1: cleanText(input.hero.titleLine1, "主标题第一行", 30),
      titleLine2: cleanText(input.hero.titleLine2, "主标题第二行", 30),
      body: cleanText(input.hero.body, "首屏说明", 140),
      primaryCta: cleanText(input.hero.primaryCta, "主按钮", 20),
    },
    experiences: {
      title: cleanText(input.experiences.title, "展项区标题", 30),
      intro: cleanText(input.experiences.intro, "展项区说明", 120),
      cards: Object.fromEntries(["video", "h5", "agent"].map((key) => [key, {
        title: cleanText(input.experiences.cards[key].title, `${key} 标题`, 20),
        description: cleanText(input.experiences.cards[key].description, `${key} 说明`, 100),
      }])),
    },
  };
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  fs.renameSync(temporary, file);
}

function changedPaths(before, after, prefix = "") {
  if (before === after) return [];
  if (!plainObject(before) || !plainObject(after)) return [prefix || "content"];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].flatMap((key) => changedPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}

function initialState(now) {
  const content = normalizeSiteContent(structuredClone(defaultSiteContent));
  return {
    schema_version: 2,
    version: 1,
    published_version: 1,
    workflow_status: "published",
    draft: content,
    published: structuredClone(content),
    draft_editor: null,
    draft_updated_at: now,
    published_at: now,
    updated_at: now,
  };
}

function migrateState(parsed, now) {
  if (plainObject(parsed) && parsed.schema_version === 2) {
    const draft = normalizeSiteContent(parsed.draft);
    const published = normalizeSiteContent(parsed.published);
    const version = Number(parsed.version);
    const publishedVersion = Number(parsed.published_version);
    if (!Number.isSafeInteger(version) || version < 1 || !Number.isSafeInteger(publishedVersion) || publishedVersion < 1 || publishedVersion > version) {
      throw problem("SITE_CONTENT_CORRUPT", "页面内容版本无效", 500);
    }
    return {
      schema_version: 2,
      version,
      published_version: publishedVersion,
      workflow_status: parsed.workflow_status === "draft" ? "draft" : "published",
      draft,
      published,
      draft_editor: plainObject(parsed.draft_editor) ? { id: String(parsed.draft_editor.id || "").slice(0, 100), role: String(parsed.draft_editor.role || "").slice(0, 30) } : null,
      draft_updated_at: String(parsed.draft_updated_at || now),
      published_at: String(parsed.published_at || now),
      updated_at: String(parsed.updated_at || now),
    };
  }
  if (plainObject(parsed) && parsed.hero && parsed.experiences) {
    const content = normalizeSiteContent({ hero: parsed.hero, experiences: parsed.experiences });
    const version = Number.isSafeInteger(Number(parsed.version)) && Number(parsed.version) > 0 ? Number(parsed.version) : 1;
    return { ...initialState(now), version, published_version: version, draft: content, published: structuredClone(content) };
  }
  throw problem("SITE_CONTENT_CORRUPT", "页面内容文件无法识别", 500);
}

function publicState(state) {
  return {
    version: state.published_version,
    ...structuredClone(state.published),
    updated_at: state.published_at,
  };
}

export function createSiteContentStore({ contentPath, auditPath, clock = () => new Date().toISOString() } = {}) {
  if (!contentPath || !auditPath) throw new TypeError("contentPath and auditPath are required");
  let state = initialState(clock());
  if (fs.existsSync(contentPath)) {
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(contentPath, "utf8")); }
    catch { throw problem("SITE_CONTENT_CORRUPT", "页面内容文件不是有效 JSON", 500); }
    state = migrateState(parsed, clock());
  }

  function audit(operation, before, after, context = {}) {
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    const actor = context.actor || {};
    const beforeContent = operation === "publish" ? before?.published : before?.draft;
    const afterContent = operation === "publish" ? after?.published : after?.draft;
    const entry = {
      operation,
      actor: { id: String(actor.id || "unknown").slice(0, 100), role: String(actor.role || "unknown").slice(0, 30) },
      reason: String(context.reason || "").trim().slice(0, 500),
      changed_fields: changedPaths(beforeContent || {}, afterContent || {}).slice(0, 100),
      before_version: before?.version || null,
      version: after.version,
      timestamp: clock(),
    };
    fs.appendFileSync(auditPath, `${JSON.stringify(entry)}\n`, "utf8");
  }

  function requireExpectedVersion(value) {
    if (!Number.isSafeInteger(Number(value)) || Number(value) !== state.version) {
      throw problem("SITE_CONTENT_VERSION_CONFLICT", "页面内容已被其他人更新，请刷新后重试", 409);
    }
  }

  return {
    publicProjection: () => publicState(state),
    adminProjection: () => structuredClone(state),
    preview(input) {
      exactKeys(input, ["expected_version", "content"], "预览请求");
      requireExpectedVersion(input.expected_version);
      return { version: state.version, content: normalizeSiteContent(input.content), public_base: publicState(state) };
    },
    saveDraft(input, context = {}) {
      exactKeys(input, ["expected_version", "content"], "草稿请求");
      if (!["author", "owner"].includes(context.actor?.role)) throw problem("SITE_CONTENT_ROLE_FORBIDDEN", "只有内容编辑或管理员可以保存草稿", 403);
      requireExpectedVersion(input.expected_version);
      const content = normalizeSiteContent(input.content);
      const before = structuredClone(state);
      const now = clock();
      state = {
        ...state,
        version: state.version + 1,
        workflow_status: "draft",
        draft: content,
        draft_editor: { id: String(context.actor.id || "").slice(0, 100), role: String(context.actor.role || "author").slice(0, 30) },
        draft_updated_at: now,
        updated_at: now,
      };
      writeJsonAtomic(contentPath, state);
      audit("save_draft", before, state, context);
      return structuredClone(state);
    },
    publish(input, context = {}) {
      exactKeys(input, ["expected_version"], "发布请求");
      if (!["publisher", "owner"].includes(context.actor?.role)) throw problem("SITE_CONTENT_ROLE_FORBIDDEN", "只有发布角色或管理员可以确认发布", 403);
      requireExpectedVersion(input.expected_version);
      if (state.draft_editor?.id && state.draft_editor.id === String(context.actor.id || "")) {
        throw problem("SITE_CONTENT_SELF_PUBLISH", "同一提交者不能发布自己的修改", 403);
      }
      const content = normalizeSiteContent(state.draft);
      const before = structuredClone(state);
      const now = clock();
      const nextVersion = state.version + 1;
      state = {
        ...state,
        version: nextVersion,
        published_version: nextVersion,
        workflow_status: "published",
        published: structuredClone(content),
        published_at: now,
        updated_at: now,
      };
      writeJsonAtomic(contentPath, state);
      audit("publish", before, state, context);
      return structuredClone(state);
    },
  };
}
