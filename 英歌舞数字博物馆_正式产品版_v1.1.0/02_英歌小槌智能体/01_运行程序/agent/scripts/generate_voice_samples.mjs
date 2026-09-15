import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalVoiceEngine } from '../../backend/local-voice.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'web', 'assets', 'voice-samples');
const engine = createLocalVoiceEngine({ rootDir: root });
const phrase = '你好，我是英歌小槌。想先看动作、阵形，还是听听英歌的来历？';
const candidates = [
  { sid: 25, speaker: 'SSB0273' },
  { sid: 76, speaker: 'SSB0631' },
  { sid: 163, speaker: 'SSB1831' },
  { sid: 167, speaker: 'SSB1863' }
];

await mkdir(output, { recursive: true });
for (const candidate of candidates) {
  const wave = await engine.synthesize(phrase, { sid: candidate.sid, speed: 1.06 });
  const target = path.join(output, `xiaochui-${candidate.sid}-${candidate.speaker}.wav`);
  await writeFile(target, wave.audio);
  console.log(target);
}
