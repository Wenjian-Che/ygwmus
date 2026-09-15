import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const web = path.join(root, 'web');
const files = ['index.html', 'learn.html', 'archive.html', 'characters.html', 'content.html', 'formation.html', 'regions.html', 'sound.html', 'watch.html'];
for (const name of files) {
  const target = path.join(web, name);
  const source = fs.readFileSync(target, 'utf8');
  const next = source.replaceAll('app.js?v=20260828-voice9', 'app.js?v=20260828-voice10');
  if (next !== source) fs.writeFileSync(target, next, 'utf8');
}
