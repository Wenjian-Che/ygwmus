import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const editorialCss = read('web/museum-editorial.css');
const app = read('web/app.js');
const archiveFragment = read('web/archive-fragment.html');
const content = read('web/content.html');
const watch = read('web/watch.html');
const characters = read('web/characters.html');
const formation = read('web/formation.html');
const sound = read('web/sound.html');
const regions = read('web/regions.html');
const spread = read('web/spread.html');
const frameworkShell = read('web/framework-museum.html');

const fontDir = path.join(root, 'web/assets/fonts/source-han-serif');
assert.ok(fs.statSync(path.join(fontDir, 'SourceHanSerifCN-VF.otf.woff2')).size > 10_000_000,
  'the official Source Han Serif CN variable WOFF2 must be self-hosted');
assert.match(read('web/assets/fonts/source-han-serif/LICENSE.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
assert.match(read('docs/FONT_LICENSES.md'), /SourceHanSerifCN-VF\.otf\.woff2/);
assert.match(read('docs/FONT_LICENSES.md'), /2\.003R/);

assert.match(editorialCss, /@font-face\s*\{[\s\S]*SourceHanSerifCN-VF\.otf\.woff2/);
assert.match(editorialCss, /--font-reading:/);
assert.match(editorialCss, /line-break:\s*strict/);
assert.match(editorialCss, /text-wrap:\s*pretty/);
assert.match(editorialCss, /\.source-note[\s\S]*font-size:\s*clamp\((?:1[4-9]|[2-9]\d)px/,
  'source and boundary notes must remain readable despite frontier.css');
assert.match(editorialCss, /max-width:\s*1280px/,
  'the global museum header needs a stable desktop measure');

assert.match(app, /function normalizeMuseumNavigation\(/);
assert.match(app, /馆藏总览/);
assert.match(app, /认识英歌/);
assert.match(app, /专题展馆/);
assert.match(app, /在线展馆/);
assert.match(app, /aria-current/);
const navFunction = app.match(/function normalizeMuseumNavigation\([\s\S]*?\n\}/)?.[0] ?? '';
assert.ok(navFunction.includes('replaceChildren'), 'navigation should be rebuilt with DOM APIs');
assert.ok(!navFunction.includes('innerHTML'), 'navigation must not interpolate markup with innerHTML');

for (const page of [spread, frameworkShell]) {
  assert.match(page, /museum-editorial\.css/,
    'standalone public shells must load the shared editorial system');
}
for (const label of ['首页', '馆藏总览', '认识英歌', '英歌出海', '专题展馆', '在线展馆']) {
  assert.ok(spread.includes(label), `spread navigation is missing ${label}`);
  assert.ok(frameworkShell.includes(label), `framework navigation is missing ${label}`);
}

assert.match(archiveFragment, /project_details\/12901\.html/);
assert.doesNotMatch(archiveFragment, /来源一[\s\S]{0,300}project_details\/12902\.html/);
assert.match(archiveFragment, /mct\.gov\.cn\/whzx\/ggtz\/200606\/t20060609_694679\.htm/);

assert.doesNotMatch(content, /先看一场完整英歌|进入影像展厅|从完整影像开始/);
assert.doesNotMatch(watch, /关键片段|英歌表演观看导览画面/);
assert.match(watch, /现场照片只能帮助观察一个瞬间/);
assert.match(characters, /提供醒目的视觉线索/);
assert.doesNotMatch(characters, /服装档案图/);
assert.match(formation, /不复刻任何一支队伍的完整套路/);
assert.match(sound, /具体对应仍需按队伍、片段和时间码核对/);
assert.match(sound, /聆听方法/);
assert.match(regions, /2011 年列入第三批国家级非物质文化遗产扩展项目/);
assert.match(spread, /三种并列的跨境交流形态/);

console.log('museum editorial, navigation and content-boundary tests passed');
