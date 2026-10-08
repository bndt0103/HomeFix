import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { topics, groups } from '../manual/topics.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'BIN/manual-build');
const artifact = path.join(root, 'BIN/HomeFix-User-Manual.chm');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.dirname(artifact), { recursive: true });
fs.copyFileSync(path.join(root, 'SRC/manual/manual.css'), path.join(output, 'manual.css'));
const escape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
// Thanh mục lục và chỉ mục dùng chữ không dấu để tránh lỗi bảng mã của CHM.
const navigationText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .replace(/[^\x20-\x7e]/g, '');
const sitemap = (name, local) =>
  `<OBJECT type="text/sitemap"><param name="Name" value="${escape(navigationText(name))}">${local ? `<param name="Local" value="${local}.html">` : ''}</OBJECT>`;
for (const [i, topic] of topics.entries()) {
  const previous = topics[i - 1],
    next = topics[i + 1];
  fs.writeFileSync(
    path.join(output, topic.id + '.html'),
    `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${escape(topic.title)}</title><link rel="stylesheet" href="manual.css"></head><body><div class="page"><div class="brand">HomeFix<small>USER MANUAL · HƯỚNG DẪN SỬ DỤNG</small></div><div class="content"><h1>${escape(topic.title)}</h1>${topic.body}</div><div class="navigation"><a href="welcome.html">Bắt đầu</a>${previous ? `<a href="${previous.id}.html">← Mục trước</a>` : ''}${next ? `<a href="${next.id}.html">Mục tiếp →</a>` : ''}</div><div class="footer">HomeFix 1.0 · Cài đặt, vận hành và nghiệp vụ người dùng</div></div></body></html>`,
  );
}
fs.writeFileSync(
  path.join(output, 'contents.hhc'),
  '<!DOCTYPE HTML><html><body><ul>' +
    groups
      .map(
        (group) =>
          `<li>${sitemap(group.title)}<ul>${group.pages
            .map((id) => {
              const topic = topics.find((x) => x.id === id);
              return `<li>${sitemap(topic.title, id)}`;
            })
            .join('')}</ul>`,
      )
      .join('') +
    '</ul></body></html>',
);
const keywords = topics
  .flatMap((topic) => topic.keywords.map((keyword) => ({ keyword, id: topic.id })))
  .sort((a, b) => navigationText(a.keyword).localeCompare(navigationText(b.keyword), 'en'));
fs.writeFileSync(
  path.join(output, 'index.hhk'),
  '<!DOCTYPE HTML><html><body><ul>' +
    keywords.map((row) => `<li>${sitemap(row.keyword, row.id)}`).join('') +
    '</ul></body></html>',
);
fs.writeFileSync(
  path.join(output, 'manual.hhp'),
  `[OPTIONS]\nCompatibility=1.1 or later\nCompiled file=${artifact}\nContents file=contents.hhc\nIndex file=index.hhk\nDefault topic=welcome.html\nDefault Window=main\nDisplay compile progress=No\nFull-text search=Yes\nLanguage=0x42a Vietnamese\nTitle=HomeFix - User Manual\n\n[WINDOWS]\nmain="HomeFix - User Manual","contents.hhc","index.hhk","welcome.html","welcome.html",,,,,0x63520,330,0x104e,[40,30,1480,930],,,,,,,0\n\n[FILES]\nmanual.css\n${topics.map((topic) => topic.id + '.html').join('\n')}\n`,
);
if (process.argv.includes('--html-only')) {
  console.log(output);
  process.exit(0);
}
const compiler = process.env.HHC_PATH || 'C:/Program Files (x86)/HTML Help Workshop/hhc.exe';
if (!fs.existsSync(compiler))
  throw new Error('Chưa có trình biên dịch CHM. Cài HTML Help Workshop hoặc đặt HHC_PATH.');
if (fs.existsSync(artifact)) fs.unlinkSync(artifact);
const result = spawnSync(compiler, ['manual.hhp'], {
  cwd: output,
  encoding: 'utf8',
  timeout: 60000,
});
fs.writeFileSync(path.join(output, 'compile.log'), (result.stdout || '') + (result.stderr || ''));
if (
  result.error ||
  !fs.existsSync(artifact) ||
  fs.statSync(artifact).size < 4096 ||
  fs.readFileSync(artifact).subarray(0, 4).toString() !== 'ITSF'
) {
  throw new Error(
    'Không tạo được CHM: ' + (result.error?.message || result.stderr || result.stdout),
  );
}
console.log(`Đã tạo ${artifact} (${topics.length} mục).`);
if (!fs.readFileSync(artifact).includes(Buffer.from('$FIftiMain'))) {
  throw new Error(
    'CHM chưa có dữ liệu tìm kiếm. Cài đầy đủ HTML Help Workshop để đăng ký itcc.dll rồi biên dịch lại.',
  );
}
// Xóa đúng thư mục trang tạm sau khi đã kiểm tra tệp CHM.
if (!output.startsWith(path.join(root, 'BIN') + path.sep))
  throw new Error('Thư mục tạm không hợp lệ.');
fs.rmSync(output, { recursive: true, force: true });
