import fs from "node:fs";
import crypto from "node:crypto";

function clean(value) {
  return String(value || "").trim();
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function fromCredentialText(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
  const result = {};
  const aliases = new Map([
    ["secretid", "TENCENT_SECRET_ID"], ["secret_id", "TENCENT_SECRET_ID"], ["tencent_secret_id", "TENCENT_SECRET_ID"],
    ["secretkey", "TENCENT_SECRET_KEY"], ["secret_key", "TENCENT_SECRET_KEY"], ["tencent_secret_key", "TENCENT_SECRET_KEY"],
    ["appid", "TENCENT_APP_ID"], ["app_id", "TENCENT_APP_ID"], ["tencent_app_id", "TENCENT_APP_ID"]
  ]);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const inline = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*(.+)$/);
    if (inline && aliases.has(inline[1].toLowerCase())) {
      result[aliases.get(inline[1].toLowerCase())] = inline[2].trim();
      continue;
    }
    const label = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*$/);
    if (!label || !aliases.has(label[1].toLowerCase())) continue;
    const value = lines.slice(index + 1).find((candidate) => candidate.trim());
    if (value) result[aliases.get(label[1].toLowerCase())] = value.trim();
  }
  return result;
}

export function readTencentCredentialFile(file) {
  const credentialPath = clean(file);
  if (!credentialPath) return {};
  try {
    const bytes = fs.readFileSync(credentialPath);
    const isUtf16Le = bytes.length >= 2 && (bytes[0] === 0xff && bytes[1] === 0xfe || (bytes.length > 3 && bytes[1] === 0 && bytes[3] === 0));
    const isUtf16Be = bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff;
    let text;
    if (isUtf16Be) {
      const swapped = Buffer.from(bytes);
      for (let index = 0; index + 1 < swapped.length; index += 2) [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
      text = swapped.subarray(2).toString("utf16le");
    } else text = bytes.toString(isUtf16Le ? "utf16le" : "utf8");
    return fromCredentialText(text);
  }
  catch { return {}; }
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function tc3Authorization({ secretId, secretKey, service, host, action, version, region, payload, now }) {
  const date = new Date(now).toISOString().slice(0, 10);
  const timestamp = Math.floor(now / 1000);
  const hashedPayload = sha256(payload);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, service);
  const secretSigning = hmac(secretService, "tc3_request");
  const signature = hmac(secretSigning, stringToSign, "hex");
  return {
    timestamp,
    authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      Authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Timestamp": String(timestamp),
      ...(region ? { "X-TC-Region": region } : {})
    }
  };
}

function asrSocketUrl(credentials, engineModelType, now, { hotwordList = "", hotwordId = "" } = {}) {
  const timestamp = Math.floor(now / 1000);
  const parameters = {
    engine_model_type: engineModelType,
    expired: String(timestamp + 300),
    filter_modal: "0",
    filter_punc: "0",
    needvad: "1",
    nonce: String(crypto.randomInt(100000000, 999999999)),
    secretid: credentials.secretId,
    timestamp: String(timestamp),
    voice_format: "1",
    voice_id: crypto.randomUUID()
  };
  if (hotwordList) {
    parameters.hotword_list = hotwordList;
    parameters.reinforce_hotword = "1";
  } else if (hotwordId) parameters.hotword_id = hotwordId;
  // 签名原文必须使用排序后的原始参数值。只有最终 URL 才做百分号编码。
  // 若先用 URLSearchParams 编码再签名，热词等参数会改变签名原文，腾讯云返回 4002。
  const keys = Object.keys(parameters).sort();
  const canonicalQuery = keys.map((key) => `${key}=${parameters[key]}`).join("&");
  const source = `asr.cloud.tencent.com/asr/v2/${credentials.appId}?${canonicalQuery}`;
  const signature = crypto.createHmac("sha1", credentials.secretKey).update(source).digest("base64");
  const requestQuery = keys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
    .concat(`signature=${encodeURIComponent(signature)}`)
    .join("&");
  return `wss://asr.cloud.tencent.com/asr/v2/${credentials.appId}?${requestQuery}`;
}

export function createTencentVoiceClient(env = process.env, { fetchFn = globalThis.fetch, WebSocketImpl = globalThis.WebSocket, now = () => Date.now() } = {}) {
  const fileCredentials = readTencentCredentialFile(env.TENCENT_CREDENTIALS_FILE);
  const credentials = {
    secretId: clean(env.TENCENT_SECRET_ID || fileCredentials.TENCENT_SECRET_ID),
    secretKey: clean(env.TENCENT_SECRET_KEY || fileCredentials.TENCENT_SECRET_KEY),
    appId: clean(env.TENCENT_APP_ID || fileCredentials.TENCENT_APP_ID)
  };
  const configured = Boolean(credentials.secretId && credentials.secretKey && credentials.appId);
  const engineModelType = clean(env.TENCENT_ASR_ENGINE_MODEL_TYPE) || "16k_zh";
  const voiceType = positiveInteger(env.TENCENT_TTS_VOICE_TYPE, 603000);
  const sampleRate = [8000, 16000, 24000].includes(Number(env.TENCENT_TTS_SAMPLE_RATE)) ? Number(env.TENCENT_TTS_SAMPLE_RATE) : 24000;
  const region = clean(env.TENCENT_REGION) || "ap-guangzhou";
  const hotwordId = clean(env.TENCENT_ASR_HOTWORD_ID);
  const hotwordList = clean(env.TENCENT_ASR_HOTWORD_LIST) || (hotwordId ? "" : "英歌舞|11,英歌小槌|11,潮汕|9,潮阳|9,潮南|9,普宁|9,揭阳|9,脸谱|9,槌法|10,锣鼓|9,阵法|9,双槌|9,蛇步|9,布田英歌|10,英歌队|8");
  async function createRecognitionSession() {
    if (!configured) throw Object.assign(new Error("腾讯云语音尚未安全配置"), { code: "TENCENT_VOICE_UNAVAILABLE" });
    if (!WebSocketImpl) throw Object.assign(new Error("当前运行环境不支持实时语音连接"), { code: "TENCENT_ASR_WEBSOCKET_UNAVAILABLE" });
    const socket = new WebSocketImpl(asrSocketUrl(credentials, engineModelType, now(), { hotwordList, hotwordId }));
    let latestText = "";
    const segments = new Map();
    let finished = false;
    let settled = false;
    let finalResolve;
    let finalReject;
    const finalResult = new Promise((resolve, reject) => { finalResolve = resolve; finalReject = reject; });
    // 腾讯云可能在调用方进入 push({ finish:true }) 前返回错误；提前挂接拒绝处理，
    // 避免 Node 将延迟消费的结果误判为未处理拒绝并终止整个 API 服务。
    finalResult.catch(() => {});
    const ready = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Object.assign(new Error("腾讯云识别连接超时"), { code: "TENCENT_ASR_TIMEOUT" })), 8000);
      socket.onopen = () => { clearTimeout(timeout); resolve(); };
      socket.onerror = () => { clearTimeout(timeout); reject(Object.assign(new Error("腾讯云识别连接失败"), { code: "TENCENT_ASR_CONNECTION_FAILED" })); };
    });
    socket.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data)); } catch { return; }
      if (Number(payload.code) !== 0) {
        if (!settled) { settled = true; finalReject(Object.assign(new Error("腾讯云识别暂时不可用"), { code: "TENCENT_ASR_FAILED", providerCode: String(payload.code), providerMessage: clean(payload.message) })); }
        return;
      }
      if (payload.result?.voice_text_str) {
        segments.set(Number(payload.result.index || 0), String(payload.result.voice_text_str).trim());
        latestText = [...segments.entries()].sort(([left], [right]) => left - right).map(([, text]) => text).join("");
      }
      if (Number(payload.final) === 1 && !settled) { settled = true; finalResolve({ text: latestText, final: true, engine: "tencent-realtime-asr" }); }
    };
    socket.onclose = () => {
      if (!settled && finished) { settled = true; finalResolve({ text: latestText, final: true, engine: "tencent-realtime-asr" }); }
    };
    await ready;
    return {
      async push(pcm, { finish = false } = {}) {
        if (finished) throw Object.assign(new Error("语音会话已结束"), { code: "TENCENT_ASR_SESSION_CLOSED" });
        const audio = Buffer.isBuffer(pcm) ? pcm : Buffer.from(pcm);
        if (audio.length) socket.send(audio);
        if (!finish) return { text: latestText, final: false, engine: "tencent-realtime-asr" };
        finished = true;
        socket.send('{"type":"end"}');
        return await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Object.assign(new Error("腾讯云识别结果超时"), { code: "TENCENT_ASR_TIMEOUT" })), 12000);
          finalResult.then((result) => { clearTimeout(timeout); resolve(result); }, (error) => { clearTimeout(timeout); reject(error); });
        });
      },
      close() { if (!finished) finished = true; try { socket.close(); } catch {} }
    };
  }
  function splitTtsText(text, limit = 120) {
    const normalized = clean(text)
      .replace(/\s*\[证据\d+\]/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
      .trim();
    if (!normalized) return [];
    const sentences = normalized.match(/[^。！？!?；;\n]+[。！？!?；;]?/g) || [normalized];
    const chunks = [];
    let current = "";
    const flush = () => { if (current.trim()) chunks.push(current.trim()); current = ""; };
    for (const sentence of sentences) {
      if (sentence.length > limit) {
        flush();
        for (let offset = 0; offset < sentence.length; offset += limit) chunks.push(sentence.slice(offset, offset + limit).trim());
      } else if ((current + sentence).length > limit) {
        flush(); current = sentence;
      } else current += sentence;
    }
    flush();
    return chunks.filter(Boolean);
  }

  function mergePcmWaves(waves) {
    if (waves.length === 1) return waves[0];
    const parsed = waves.map((wave) => {
      if (!Buffer.isBuffer(wave) || wave.length < 44 || wave.toString("ascii", 0, 4) !== "RIFF") throw new Error("invalid tts wave");
      let offset = 12;
      while (offset + 8 <= wave.length) {
        const id = wave.toString("ascii", offset, offset + 4);
        const length = wave.readUInt32LE(offset + 4);
        if (id === "data") return { wave, headerEnd: offset + 8, dataLengthOffset: offset + 4, pcm: wave.subarray(offset + 8, offset + 8 + length) };
        offset += 8 + length + (length % 2);
      }
      throw new Error("tts wave data missing");
    });
    const pcm = Buffer.concat(parsed.map((item) => item.pcm));
    const header = Buffer.from(parsed[0].wave.subarray(0, parsed[0].headerEnd));
    header.writeUInt32LE(pcm.length, parsed[0].dataLengthOffset);
    header.writeUInt32LE(header.length + pcm.length - 8, 4);
    return Buffer.concat([header, pcm]);
  }

  async function synthesizeOne(cleanText, speed) {
    const payload = JSON.stringify({
      Text: cleanText,
      SessionId: crypto.randomUUID(),
      ModelType: 1,
      VoiceType: voiceType,
      PrimaryLanguage: 1,
      SampleRate: sampleRate,
      Codec: "wav",
      Speed: Math.max(-2, Math.min(2, Number(speed || 1) - 1))
    });
    const request = tc3Authorization({
      ...credentials, service: "tts", host: "tts.tencentcloudapi.com", action: "TextToVoice", version: "2019-08-23", region, payload, now: now()
    });
    const response = await fetchFn("https://tts.tencentcloudapi.com/", { method: "POST", headers: request.headers, body: payload });
    const data = await response.json().catch(() => ({}));
    const apiError = data?.Response?.Error;
    if (!response.ok || apiError || !data?.Response?.Audio) {
      throw Object.assign(new Error("腾讯云少年音暂时不可用"), { code: "TENCENT_TTS_FAILED", providerCode: apiError?.Code || null, requestId: data?.Response?.RequestId });
    }
    return Buffer.from(data.Response.Audio, "base64");
  }

  async function synthesize(text, { speed = 1.04 } = {}) {
    if (!configured) throw Object.assign(new Error("腾讯云语音尚未安全配置"), { code: "TENCENT_VOICE_UNAVAILABLE" });
    const chunks = splitTtsText(text);
    if (!chunks.length) throw Object.assign(new Error("没有可朗读的文字"), { code: "EMPTY_TTS_TEXT" });
    if (!fetchFn) throw Object.assign(new Error("当前运行环境不支持腾讯云语音请求"), { code: "TENCENT_FETCH_UNAVAILABLE" });
    const audioParts = [];
    for (const chunk of chunks) audioParts.push(await synthesizeOne(chunk, speed));
    return { audio: mergePcmWaves(audioParts), contentType: "audio/wav", sampleRate, engine: "tencent-tts", voiceType, segments: chunks.length };
  }
  return {
    status() {
      return {
        configured,
        provider: configured ? "tencent-cloud" : "local",
        asr: { available: configured, engine: configured ? "tencent-realtime-asr" : null, engineModelType: configured ? engineModelType : null, hotwordsConfigured: configured && Boolean(hotwordList || hotwordId), hotwordMode: hotwordList ? "temporary-list" : (hotwordId ? "vocabulary-id" : "none") },
        tts: { available: configured, engine: configured ? "tencent-tts" : null, voiceType: configured ? voiceType : null, sampleRate: configured ? sampleRate : null }
      };
    },
    credentials() { return configured ? { ...credentials } : null; },
    createRecognitionSession,
    synthesize
  };
}
