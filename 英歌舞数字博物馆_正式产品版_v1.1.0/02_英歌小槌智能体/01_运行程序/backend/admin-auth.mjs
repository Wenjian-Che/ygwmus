import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

function problem(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

function safeMkdir(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(directory, 0o700); } catch {}
}

function commitNewPrivateFile(temporary, file) {
  try {
    fs.renameSync(temporary, file);
    return;
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
  }
  let created = false;
  try {
    fs.copyFileSync(temporary, file, fs.constants.COPYFILE_EXCL);
    created = true;
    const expected = fs.readFileSync(temporary);
    const actual = fs.readFileSync(file);
    if (!expected.equals(actual)) throw new Error("管理员账户文件复制校验失败");
    const descriptor = fs.openSync(file, "r+");
    try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
  } catch (error) {
    if (created) {
      try { fs.unlinkSync(file); } catch {}
    }
    throw error;
  }
}

function atomicJson(file, value) {
  safeMkdir(path.dirname(file));
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    commitNewPrivateFile(temporary, file);
    try { fs.chmodSync(file, 0o600); } catch {}
  } finally {
    try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch {}
  }
}

function cleanUsername(value) {
  const username = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw problem("ADMIN_USERNAME_INVALID", "账号需使用 3-32 位字母、数字、点、下划线或连字符");
  return username;
}

function cleanDisplayName(value) {
  const name = String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name || name.length > 40) throw problem("ADMIN_DISPLAY_NAME_INVALID", "显示名称需为 1-40 个字符");
  return name;
}

function cleanPassword(value) {
  const password = String(value || "");
  if (password.length < 10 || password.length > 128) throw problem("ADMIN_PASSWORD_INVALID", "密码长度需为 10-128 个字符");
  return password;
}

async function passwordHash(password, salt) {
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return Buffer.from(derived);
}

function safeActor(user) {
  return { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
}

export function createAdminAuthService({ stateDir, sessionTtlMs = 8 * 60 * 60 * 1000, now = () => Date.now() } = {}) {
  if (!stateDir) throw new Error("stateDir is required");
  const authPath = path.join(path.resolve(stateDir), "admin-auth.json");
  const sessions = new Map();

  function readState() {
    if (!fs.existsSync(authPath)) return { schema_version: 1, users: [] };
    try {
      const parsed = JSON.parse(fs.readFileSync(authPath, "utf8"));
      return parsed?.schema_version === 1 && Array.isArray(parsed.users) ? parsed : { schema_version: 1, users: [] };
    } catch {
      throw problem("ADMIN_AUTH_STATE_INVALID", "管理员账户文件无法读取", 503);
    }
  }

  function status() {
    const state = readState();
    return { setup_required: state.users.length === 0, account_count: state.users.length };
  }

  async function bootstrap(input = {}) {
    const state = readState();
    if (state.users.length) throw problem("ADMIN_SETUP_COMPLETE", "管理员首次设置已经完成", 409);
    const username = cleanUsername(input.username);
    const displayName = cleanDisplayName(input.display_name);
    const password = cleanPassword(input.password);
    const salt = crypto.randomBytes(18);
    const hash = await passwordHash(password, salt);
    const user = {
      id: `local:${username}`,
      username,
      display_name: displayName,
      role: "owner",
      password_salt: salt.toString("base64"),
      password_hash: hash.toString("base64"),
      created_at: new Date(now()).toISOString(),
    };
    atomicJson(authPath, { schema_version: 1, users: [user] });
    return { actor: safeActor(user) };
  }

  async function login(input = {}) {
    const username = cleanUsername(input.username);
    const password = cleanPassword(input.password);
    const state = readState();
    const user = state.users.find((item) => item.username === username);
    const fallbackSalt = crypto.randomBytes(18);
    const salt = user ? Buffer.from(user.password_salt, "base64") : fallbackSalt;
    const expected = user ? Buffer.from(user.password_hash, "base64") : crypto.randomBytes(64);
    const actual = await passwordHash(password, salt);
    const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    if (!user || !matches) throw problem("ADMIN_LOGIN_INVALID", "账号或密码不正确", 401);
    const sessionToken = crypto.randomBytes(32).toString("base64url");
    const expiresAt = now() + sessionTtlMs;
    sessions.set(sessionToken, { actor: safeActor(user), expires_at: expiresAt });
    return { actor: safeActor(user), session_token: sessionToken, expires_at: new Date(expiresAt).toISOString() };
  }

  function actorForToken(token) {
    const key = String(token || "");
    const session = sessions.get(key);
    if (!session) return null;
    if (session.expires_at <= now()) {
      sessions.delete(key);
      return null;
    }
    return { ...session.actor };
  }

  function logout(token) {
    sessions.delete(String(token || ""));
  }

  return Object.freeze({ status, bootstrap, login, actorForToken, logout });
}
