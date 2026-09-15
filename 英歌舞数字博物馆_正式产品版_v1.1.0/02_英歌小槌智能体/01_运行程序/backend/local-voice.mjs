import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(moduleDir, "..");
const ASR_DIRECTORY = "sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30";
const KWS_DIRECTORY = "sherpa-onnx-kws-zipformer-wenetspeech-3.3M-2024-01-01";
const TTS_DIRECTORY = "kokoro-int8-multi-lang-v1_1";
export const DEFAULT_TTS_SID = 75; // Kokoro zm_041：中文男声，中位基频约 180Hz

let sherpaModule;
function getSherpa() {
  if (!sherpaModule) sherpaModule = require("sherpa-onnx-node");
  return sherpaModule;
}

function filesExist(files) {
  return files.every(file => fs.existsSync(file));
}

function readWave(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw Object.assign(new Error("音频数据不是有效的 WAV"), { code: "INVALID_AUDIO" });
  }
  let format;
  let dataOffset = -1;
  let dataLength = 0;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt " && size >= 16) {
      format = {
        encoding: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bits: buffer.readUInt16LE(body + 14)
      };
    }
    if (id === "data") {
      dataOffset = body;
      dataLength = Math.min(size, buffer.length - body);
      break;
    }
    offset = body + size + (size % 2);
  }
  if (!format || dataOffset < 0 || !format.channels || !format.sampleRate) {
    throw Object.assign(new Error("WAV 缺少音频格式或数据"), { code: "INVALID_AUDIO" });
  }
  const bytesPerSample = format.bits / 8;
  if (![1, 3].includes(format.encoding) || ![16, 32].includes(format.bits) || !Number.isInteger(bytesPerSample)) {
    throw Object.assign(new Error("只支持 16 位 PCM 或 32 位浮点 WAV"), { code: "INVALID_AUDIO_FORMAT" });
  }
  const frames = Math.floor(dataLength / (bytesPerSample * format.channels));
  const samples = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < format.channels; channel += 1) {
      const offset = dataOffset + (frame * format.channels + channel) * bytesPerSample;
      sum += format.encoding === 3 ? buffer.readFloatLE(offset) : buffer.readInt16LE(offset) / 32768;
    }
    samples[frame] = Math.max(-1, Math.min(1, sum / format.channels));
  }
  return { samples, sampleRate: format.sampleRate };
}

function waveBuffer(samples, sampleRate) {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    pcm.writeInt16LE(value < 0 ? Math.round(value * 32768) : Math.round(value * 32767), index * 2);
  }
  const wave = Buffer.alloc(44 + pcm.length);
  wave.write("RIFF", 0, "ascii");
  wave.writeUInt32LE(36 + pcm.length, 4);
  wave.write("WAVE", 8, "ascii");
  wave.write("fmt ", 12, "ascii");
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(sampleRate, 24);
  wave.writeUInt32LE(sampleRate * 2, 28);
  wave.writeUInt16LE(2, 32);
  wave.writeUInt16LE(16, 34);
  wave.write("data", 36, "ascii");
  wave.writeUInt32LE(pcm.length, 40);
  pcm.copy(wave, 44);
  return wave;
}

export function normalizeWakeTranscript(text = "") {
  return String(text)
    .replace(/小[锤垂陲捶槌吹崔]/g, "小槌")
    .replace(/英[哥歌]/g, "英歌")
    .replace(/[\s，。！？、,.!?：:；;“”"'（）()《》<>-]/g, "");
}

export function transcriptHasWakeWord(text = "") {
  return normalizeWakeTranscript(text).includes("小槌小槌");
}

function normalizeMuseumTerms(text = "") {
  return String(text)
    .replace(/[鹰莺][哥歌]/g, "英歌")
    .replace(/[英应鹰莺]哥/g, "英歌")
    .replace(/小锤/g, "小槌")
    .replace(/锤法/g, "槌法")
    .replace(/潮男/g, "潮南")
    .replace(/朝阳/g, "潮阳")
    .replace(/[武五]宁/g, "普宁")
    .replace(/有什么(?:不)?$/g, "有什么不同")
    .replace(/潮阳河普宁/g, "潮阳和普宁")
    .replace(/脸谱有什么不同/g, "脸谱有什么区别")
    .replace(/槌法和阵$/g, "槌法和阵法")
    .trim();
}

export function createLocalVoiceEngine({ rootDir = DEFAULT_ROOT } = {}) {
  const modelRoot = path.join(rootDir, "backend", "models");
  const asrDir = path.join(modelRoot, ASR_DIRECTORY);
  const kwsDir = path.join(modelRoot, KWS_DIRECTORY);
  const ttsDir = path.join(modelRoot, TTS_DIRECTORY);
  const keywordsFile = path.join(rootDir, "backend", "voice-keywords.txt");
  const asrFiles = {
    tokens: path.join(asrDir, "tokens.txt"),
    encoder: path.join(asrDir, "encoder.int8.onnx"),
    decoder: path.join(asrDir, "decoder.onnx"),
    joiner: path.join(asrDir, "joiner.int8.onnx")
  };
  const ttsFiles = {
    model: path.join(ttsDir, "model.int8.onnx"),
    voices: path.join(ttsDir, "voices.bin"),
    tokens: path.join(ttsDir, "tokens.txt"),
    dataDir: path.join(ttsDir, "espeak-ng-data"),
    lexicon: ["lexicon-us-en.txt", "lexicon-zh.txt"].map(name => path.join(ttsDir, name)).join(","),
    ruleFsts: ["phone-zh.fst", "date-zh.fst", "number-zh.fst"].map(name => path.join(ttsDir, name)).join(",")
  };
  const kwsFiles = {
    tokens: path.join(kwsDir, "tokens.txt"),
    encoder: path.join(kwsDir, "encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx"),
    decoder: path.join(kwsDir, "decoder-epoch-12-avg-2-chunk-16-left-64.onnx"),
    joiner: path.join(kwsDir, "joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx"),
    keywords: keywordsFile
  };
  const asrAvailable = filesExist(Object.values(asrFiles));
  const kwsAvailable = filesExist(Object.values(kwsFiles));
  const ttsAvailable = filesExist([ttsFiles.model, ttsFiles.voices, ttsFiles.tokens, ttsFiles.dataDir, ...ttsFiles.lexicon.split(","), ...ttsFiles.ruleFsts.split(",")]);
  let recognizer;
  let keywordSpotter;
  let ttsPromise;

  function status() {
    return {
      asr: { available: asrAvailable, engine: "sherpa-onnx-zipformer-zh" },
      wake: { available: kwsAvailable, phrase: "小槌小槌", mode: "foreground-opt-in", engine: "sherpa-onnx-kws-ppinyin" },
      tts: { available: ttsAvailable, engine: "sherpa-onnx-kokoro-zh", speakers: 103, sampleRate: 24000, defaultSid: DEFAULT_TTS_SID }
    };
  }

  function getRecognizer() {
    if (!asrAvailable) throw Object.assign(new Error("中文本地识别模型尚未安装"), { code: "LOCAL_ASR_UNAVAILABLE" });
    if (!recognizer) {
      const sherpa = getSherpa();
      recognizer = new sherpa.OnlineRecognizer({
        featConfig: { sampleRate: 16000, featureDim: 80 },
        modelConfig: {
          transducer: { encoder: asrFiles.encoder, decoder: asrFiles.decoder, joiner: asrFiles.joiner },
          tokens: asrFiles.tokens,
          numThreads: 2,
          provider: "cpu",
          modelType: "zipformer2"
        },
        decodingMethod: "modified_beam_search",
        maxActivePaths: 4,
        enableEndpoint: 1,
        rule1MinTrailingSilence: 2.4,
        rule2MinTrailingSilence: 0.8,
        rule3MinUtteranceLength: 20
      });
    }
    return recognizer;
  }

  function getKeywordSpotter() {
    if (!kwsAvailable) throw Object.assign(new Error("中文唤醒模型尚未安装"), { code: "LOCAL_KWS_UNAVAILABLE" });
    if (!keywordSpotter) {
      const sherpa = getSherpa();
      keywordSpotter = new sherpa.KeywordSpotter({
        featConfig: { sampleRate: 16000, featureDim: 80 },
        modelConfig: {
          transducer: { encoder: kwsFiles.encoder, decoder: kwsFiles.decoder, joiner: kwsFiles.joiner },
          tokens: kwsFiles.tokens,
          numThreads: 2,
          provider: "cpu",
          modelingUnit: "ppinyin"
        },
        maxActivePaths: 4,
        numTrailingBlanks: 1,
        keywordsScore: 3.8,
        keywordsThreshold: 0.1,
        keywordsFile: kwsFiles.keywords
      });
    }
    return keywordSpotter;
  }

  function transcribeSamples(samples, sampleRate) {
    const activeRecognizer = getRecognizer();
    const stream = activeRecognizer.createStream();
    stream.acceptWaveform({ samples, sampleRate });
    stream.inputFinished();
    let turns = 0;
    while (activeRecognizer.isReady(stream) && turns < 100000) {
      activeRecognizer.decode(stream);
      turns += 1;
    }
    const result = activeRecognizer.getResult(stream);
    return {
      text: normalizeMuseumTerms(result.text),
      confidence: null,
      engine: "sherpa-onnx-zipformer-zh"
    };
  }

  function transcribeWave(buffer) {
    const wave = readWave(buffer);
    return transcribeSamples(wave.samples, wave.sampleRate);
  }

  function createSession({ mode = "transcribe" } = {}) {
    if (mode === "wake") {
      const spotter = getKeywordSpotter();
      return { mode, stream: spotter.createStream(), spotter, text: "" };
    }
    const activeRecognizer = getRecognizer();
    return { mode, stream: activeRecognizer.createStream(), recognizer: activeRecognizer, text: "" };
  }

  function acceptSession(session, samples, sampleRate, { finish = false } = {}) {
    if (session?.mode === "wake") {
      if (!session.stream || !session.spotter) throw Object.assign(new Error("唤醒会话无效"), { code: "VOICE_SESSION_INVALID" });
      session.stream.acceptWaveform({ samples, sampleRate });
      if (finish) session.stream.inputFinished();
      let turns = 0;
      while (session.spotter.isReady(session.stream) && turns < 10000) { session.spotter.decode(session.stream); turns += 1; }
      const result = session.spotter.getResult(session.stream);
      const keyword = String(result.keyword || "").trim();
      return { text: keyword, endpoint: Boolean(keyword || finish), final: Boolean(keyword || finish), awake: keyword === "小槌小槌" };
    }
    if (!session?.stream || !session?.recognizer) throw Object.assign(new Error("语音会话无效"), { code: "VOICE_SESSION_INVALID" });
    session.stream.acceptWaveform({ samples, sampleRate });
    if (finish) session.stream.inputFinished();
    let turns = 0;
    while (session.recognizer.isReady(session.stream) && turns < 10000) {
      session.recognizer.decode(session.stream);
      turns += 1;
    }
    const result = session.recognizer.getResult(session.stream);
    session.text = normalizeMuseumTerms(result.text || session.text);
    const endpoint = finish || session.recognizer.isEndpoint(session.stream);
    return {
      text: session.text,
      endpoint,
      final: Boolean(finish || result.is_final),
      awake: transcriptHasWakeWord(session.text)
    };
  }

  function resetSession(session) {
    if (session?.mode === "wake") { session.spotter.reset(session.stream);session.text = "";return; }
    if (!session?.recognizer) throw Object.assign(new Error("语音会话无效"), { code: "VOICE_SESSION_INVALID" });
    session.stream = session.recognizer.createStream();
    session.text = "";
  }

  async function getTts() {
    if (!ttsAvailable) throw Object.assign(new Error("中文本地音色模型尚未安装"), { code: "LOCAL_TTS_UNAVAILABLE" });
    if (!ttsPromise) {
      const sherpa = getSherpa();
      ttsPromise = sherpa.OfflineTts.createAsync({
        model: {
          kokoro: { model: ttsFiles.model, voices: ttsFiles.voices, tokens: ttsFiles.tokens, dataDir: ttsFiles.dataDir, lexicon: ttsFiles.lexicon },
          debug: false,
          numThreads: 2,
          provider: "cpu"
        },
        maxNumSentences: 1,
        ruleFsts: ttsFiles.ruleFsts
      });
    }
    return ttsPromise;
  }

  async function synthesize(text, { sid = DEFAULT_TTS_SID, speed = 1.05, silenceScale = 0.18 } = {}) {
    const clean = String(text || "").replace(/https?:\/\/\S+/g, "").replace(/小槌/g, "小锤").trim().slice(0, 1200);
    if (!clean) throw Object.assign(new Error("没有可朗读的文字"), { code: "EMPTY_TTS_TEXT" });
    const sherpa = getSherpa();
    const tts = await getTts();
    const generationConfig = new sherpa.GenerationConfig({
      sid: Math.max(0, Math.min(102, Number(sid) || 0)),
      speed: Math.max(0.75, Math.min(1.3, Number(speed) || 1)),
      silenceScale
    });
    const generated = await tts.generateAsync({ text: clean, generationConfig });
    return {
      audio: waveBuffer(generated.samples, generated.sampleRate),
      contentType: "audio/wav",
      engine: "sherpa-onnx-kokoro-zh",
      sampleRate: generated.sampleRate
    };
  }

  return { status, transcribeSamples, transcribeWave, createSession, acceptSession, resetSession, synthesize };
}
