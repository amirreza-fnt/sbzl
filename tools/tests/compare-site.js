#!/usr/bin/env node
// node tools/tests/compare-site.js [homeRef.png] [outDir]
// Re-measures BOTH pages of the combined site via file:// with exactly the settings of their own repos:
//   index.html        1366px full page vs Figma frame 44:49 (default /workspace/pixelmatch/figma/frame@1x.png; not shipped)
//   service-app.html  375px full page vs tools/service-app/src/figma-export@1x.png (shipped)
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright-core'); const { PNG } = require('pngjs');
let pm = require('pixelmatch'); pm = pm.default || pm; const { launch } = require('../service-app/chrome');
const ROOT = path.resolve(__dirname, '../..');
const HREF = process.argv[2] || '/workspace/pixelmatch/figma/frame@1x.png', OUT = path.resolve(process.argv[3] || path.join(ROOT, 'out/compare-site'));
const HS = [['header', 0, 164], ['hero', 164, 563], ['quick', 563, 853], ['services', 853, 1460], ['news', 1460, 2177], ['orgs', 2177, 2679], ['blank', 2679, 3273], ['smart', 3273, 3795], ['footer', 3795, 4306]];
const AS = [['header', 0, 94], ['banner', 94, 244], ['grid', 244, 610], ['actions', 610, 876], ['locked', 876, 1128], ['faq', 1128, 1300], ['tabbar', 1300, 1377]];
const exe = [process.env.CHROME, '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
function pad(img, w, h) { if (img.width === w && img.height === h) return img; const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(img, o, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0); return o; }
function band(img, W, y0, y1) { const o = new PNG({ width: W, height: y1 - y0 }); o.data.fill(255); const h = Math.max(0, Math.min(y1, img.height) - y0); if (h > 0) PNG.bitblt(img, o, 0, y0, Math.min(W, img.width), h, 0, 0); return o; }
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const res = {};
  // homepage: same as compare-file.js + tools/homepage/sections.js
  let b = await chromium.launch(exe ? { executablePath: exe } : {}); let pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const err = []; pg.on('pageerror', e => err.push(e.message)); pg.on('requestfailed', r => err.push('failed ' + r.url()));
  await pg.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
  await pg.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 500)); window.scrollTo(0, 0); });
  await pg.waitForTimeout(1000); await pg.screenshot({ path: path.join(OUT, 'home-impl.png'), fullPage: true }); await b.close();
  { const A = PNG.sync.read(fs.readFileSync(HREF)), B = PNG.sync.read(fs.readFileSync(path.join(OUT, 'home-impl.png'))); const W = 1366;
    const w = Math.max(A.width, B.width), h = Math.max(A.height, B.height); const d = new PNG({ width: w, height: h });
    const n = pm(pad(A, w, h).data, pad(B, w, h).data, d.data, w, h, { threshold: 0.1, alpha: 0.3 }); fs.writeFileSync(path.join(OUT, 'home-diff.png'), PNG.sync.write(d));
    const sec = {}; let tot = 0; for (const [nm, y0, y1] of HS) { const m = pm(band(A, W, y0, y1).data, band(B, W, y0, y1).data, null, W, y1 - y0, { threshold: 0.1, alpha: 0.3 }); tot += m; sec[nm] = +(100 * m / (W * (y1 - y0))).toFixed(2); }
    res.home = { height: B.height, full: +(100 * n / (w * h)).toFixed(2), sectionsTotal: +(100 * tot / (W * 4306)).toFixed(2), sections: sec, errors: err.slice() }; }
  // service app: same as tools/service-app/compare.js
  b = await launch(); pg = await b.newPage({ viewport: { width: 375, height: 1377 }, deviceScaleFactor: 1 }); const err2 = [];
  pg.on('pageerror', e => err2.push(e.message)); pg.on('requestfailed', r => err2.push('failed ' + r.url()));
  await pg.goto('file://' + path.join(ROOT, 'service-app.html'), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500);
  await pg.screenshot({ path: path.join(OUT, 'app-impl.png'), fullPage: true }); await b.close();
  { const r = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'tools/service-app/src/figma-export@1x.png'))), a = PNG.sync.read(fs.readFileSync(path.join(OUT, 'app-impl.png')));
    const w = r.width, h = r.height, A = pad(a, w, h), d = new PNG({ width: w, height: h }); const tot = pm(A.data, r.data, d.data, w, h, { threshold: 0.1, alpha: 0.3 });
    fs.writeFileSync(path.join(OUT, 'app-diff.png'), PNG.sync.write(d)); const sec = {};
    for (const [nm, y0, y1] of AS) { const x = band(A, w, y0, y1), y = band(r, w, y0, y1); sec[nm] = +(100 * pm(x.data, y.data, null, w, y1 - y0, { threshold: 0.1 }) / w / (y1 - y0)).toFixed(2); }
    res.app = { height: a.height, total: +(100 * tot / w / h).toFixed(2), sections: sec, errors: err2 }; }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
