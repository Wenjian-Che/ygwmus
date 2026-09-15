import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://api.deepseek.com";
const MODELS = new Set(["deepseek-v4-flash", "deepseek-v4-pro"]);

function problem(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

function safeMkdir(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(directory, 0o700); } catch {}
}

function flushFile(file) {
  const descriptor = fs.openSync(file, "r+");
  try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
}

function copyVerified(source, destination, flags, message) {
  const expected = fs.readFileSync(source);
  fs.copyFileSync(source, destination, flags);
  const actual = fs.readFileSync(destination);
  if (!expected.equals(actual)) throw new Error(message);
  flushFile(destination);
}

function commitPrivateFile(temporary, file) {
  try {
    fs.renameSync(temporary, file);
    return;
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
  }

  if (!fs.existsSync(file)) {
    copyVerified(temporary, file, fs.constants.COPYFILE_EXCL, "私密设置文件复制校验失败");
    return;
  }

  const backup = `${file}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.bak`;
  try {
    copyVerified(file, backup, fs.constants.COPYFILE_EXCL, "私密设置备份校验失败");
    try {
      copyVerified(temporary, file, 0, "私密设置文件复制校验失败");
    } catch (writeError) {
      try {
        copyVerified(backup, file, 0, "私密设置文件恢复校验失败");
      } catch (restoreError) {
        throw Object.assign(new Error("私密设置写入和恢复均失败"), { cause: restoreError, writeError });
      }
      throw writeError;
    }
  } finally {
    try { if (fs.existsSync(backup)) fs.unlinkSync(backup); } catch {}
  }
}

function atomicWrite(file, value, binary = false) {
  safeMkdir(path.dirname(file));
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  try {
    fs.writeFileSync(temporary, value, { ...(binary ? {} : { encoding: "utf8" }), mode: 0o600, flag: "wx" });
    commitPrivateFile(temporary, file);
    try { fs.chmodSync(file, 0o600); } catch {}
  } finally {
    try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch {}
  }
}

function encrypt(value, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: encrypted.toString("base64") };
}

function decrypt(value, key) {
  if (!value?.iv || !value?.tag || !value?.ciphertext) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

function cleanModel(value) {
  const model = String(value || "deepseek-v4-flash").trim();
  if (!MODELS.has(model)) throw problem("MODEL_SETTINGS_INVALID_MODEL", "只支持当前 DeepSeek V4 正式模型");
  return model;
}

function cleanKey(value) {
  const key = String(value || "").trim();
  if (key.length < 8 || key.length > 512 || /\s/.test(key)) throw problem("MODEL_SETTINGS_INVALID_KEY", "API Key 格式无效");
  return key;
}

export function createAdminModelSettingsStore({ stateDir, env = process.env, now = () => Date.now() } = {}) {
  if (!stateDir) throw new Error("stateDir is required");
  const directory = path.resolve(stateDir);
  const settingsPath = path.join(directory, "model-settings.json");
  const installKeyPath = path.join(directory, "install-key.bin");

  function installationKey() {
    safeMkdir(directory);
    if (!fs.existsSync(installKeyPath)) atomicWrite(installKeyPath, crypto.randomBytes(32), true);
    const value = fs.readFileSync(installKeyPath);
    if (value.length !== 32) throw problem("MODEL_SETTINGS_KEY_INVALID", "本地密钥文件无效", 503);
    return value;
  }

  function readState() {
    if (!fs.existsSync(settingsPath)) return { schema_version: 1, model: cleanModel(env.DEEPSEEK_MODEL), thinking: env.DEEPSEEK_THINKING !== "false", secret: null, verified_at: null };
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      return { schema_version: 1, model: cleanModel(parsed.model), thinking: parsed.thinking !== false, secret: parsed.secret || null, verified_at: parsed.verified_at || null };
    } catch (error) {
      if (error.code?.startsWith("MODEL_SETTINGS_")) throw error;
      throw problem("MODEL_SETTINGS_STATE_INVALID", "模型设置文件无法读取", 503);
    }
  }

  function writeState(state) {
    atomicWrite(settingsPath, `${JSON.stringify(state, null, 2)}\n`);
  }

  function storedKey(state = readState()) {
    if (!state.secret) return "";
    try { return decrypt(state.secret, installationKey()); }
    catch { throw problem("MODEL_SETTINGS_DECRYPT_FAILED", "模型密钥无法解密，请重新保存", 503); }
  }

  function runtime() {
    const state = readState();
    return {
      api_key: storedKey(state) || String(env.DEEPSEEK_API_KEY || "").trim(),
      base_url: BASE_URL,
      model: state.model,
      thinking: state.thinking,
    };
  }

  function summary() {
    const state = readState();
    return {
      provider: "deepseek",
      base_url: BASE_URL,
      model: state.model,
      thinking: state.thinking,
      api_key_configured: Boolean(storedKey(state) || String(env.DEEPSEEK_API_KEY || "").trim()),
      verified_at: state.verified_at,
    };
  }

  function update(input = {}) {
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !["api_key", "model", "thinking"].includes(key))) {
      throw problem("MODEL_SETTINGS_INVALID_INPUT", "模型设置包含未知字段");
    }
    const current = readState();
    const apiKey = cleanKey(input.api_key);
    const next = {
      schema_version: 1,
      model: cleanModel(input.model),
      thinking: input.thinking !== false,
      secret: encrypt(apiKey, installationKey()),
      verified_at: null,
      updated_at: new Date(now()).toISOString(),
    };
    writeState(next);
    return summary();
  }

  function clearKey() {
    const state = readState();
    writeState({ ...state, secret: null, verified_at: null, updated_at: new Date(now()).toISOString() });
    return summary();
  }

  async function testConnection({ fetchImpl = fetch } = {}) {
    const current = runtime();
    if (!current.api_key) throw problem("MODEL_NOT_CONFIGURED", "请先保存 DeepSeek API Key", 409);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let response;
    try {
      response = await fetchImpl(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.api_key}` },
        body: JSON.stringify({ model: current.model, messages: [{ role: "user", content: "只回复：连接成功" }], thinking: { type: "disabled" }, max_tokens: 8, stream: false }),
        signal: controller.signal,
      });
    } catch (error) {
      throw problem("MODEL_CONNECTION_FAILED", error?.name === "AbortError" ? "连接 DeepSeek 超时" : "当前无法连接 DeepSeek", 503);
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const messages = { 401: "API Key 无效", 402: "DeepSeek 账户余额不足", 429: "DeepSeek 请求过于频繁" };
      throw problem("MODEL_CONNECTION_FAILED", messages[response.status] || `DeepSeek 返回错误（${response.status}）`, 502);
    }
    let payload = {};
    try { payload = await response.json(); } catch {}
    const state = readState();
    const verifiedAt = new Date(now()).toISOString();
    writeState({ ...state, verified_at: verifiedAt });
    return { ok: true, model: String(payload.model || current.model).slice(0, 100), verified_at: verifiedAt };
  }

  return Object.freeze({ summary, runtime, update, clearKey, testConnection });
}
