import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sherpa = require('sherpa-onnx-node');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const model = path.join(root, 'backend/models/sherpa-onnx-kws-zipformer-wenetspeech-3.3M-2024-01-01');
const spotter = new sherpa.KeywordSpotter({
  featConfig: { sampleRate: 16000, featureDim: 80 },
  modelConfig: {
    transducer: {
      encoder: path.join(model, 'encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx'),
      decoder: path.join(model, 'decoder-epoch-12-avg-2-chunk-16-left-64.onnx'),
      joiner: path.join(model, 'joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx')
    },
    tokens: path.join(model, 'tokens.txt'), numThreads: 2, provider: 'cpu', modelingUnit: 'ppinyin'
  },
  maxActivePaths: 4, numTrailingBlanks: 1, keywordsScore: 1, keywordsThreshold: .25,
  keywordsFile: path.join(model, 'test_wavs/test_keywords.txt')
});
const wave = fs.readFileSync(path.join(model, 'test_wavs/3.wav'));
const rate = wave.readUInt32LE(24), channels = wave.readUInt16LE(22);
let dataOffset = 44, dataLength = wave.length - 44;
for (let cursor = 12; cursor + 8 <= wave.length;) {
  const id = wave.toString('ascii', cursor, cursor + 4), size = wave.readUInt32LE(cursor + 4);
  if (id === 'data') { dataOffset = cursor + 8; dataLength = size; break; }
  cursor += 8 + size + (size % 2);
}
const pcm = new Int16Array(wave.buffer, wave.byteOffset + dataOffset, Math.floor(dataLength / 2));
const stream = spotter.createStream(), block = Math.floor(rate * channels * .5);
for (let offset = 0; offset < pcm.length; offset += block) {
  const mono = Float32Array.from(pcm.subarray(offset, Math.min(pcm.length, offset + block)), value => value / 32768);
  stream.acceptWaveform({ samples: mono, sampleRate: rate });
  while (spotter.isReady(stream)) spotter.decode(stream);
  const result = spotter.getResult(stream);
  if (result.keyword) { console.log(JSON.stringify(result)); process.exit(0); }
}
stream.inputFinished();while (spotter.isReady(stream)) spotter.decode(stream);
console.log(JSON.stringify(spotter.getResult(stream)));process.exit(1);
