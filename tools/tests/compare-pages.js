#!/usr/bin/env node
// node tools/tests/compare-pages.js [register|citizen|all] [outDir]
// file:// screenshots of the new pages vs the user's reference exports (tools/pages/src), per-section pixelmatch,
// plus a Figma | ours | diff triptych png per page.
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright-core'); const { PNG } = require('pngjs');
let pm = require('pixelmatch'); pm = pm.default || pm; const { launch } = require('../service-app/chrome');
const ROOT = path.resolve(__dirname, '../..');
const which = process.argv[2] || 'all', OUT = path.resolve(process.argv[3] || path.join(ROOT, 'out/compare-pages'));
const PAGES = {
  register: { html: 'register.html', ref: 'tools/pages/src/register-ref@1x.png', w: 360, h: 761, sa: true, full: false,
    S: [['header', 0, 100], ['intro', 100, 195], ['fields', 195, 400], ['space', 400, 570], ['terms', 570, 622], ['button', 622, 680], ['tabbar', 680, 761]] },
  citizen: { html: 'citizen-services.html', ref: 'tools/pages/src/citizen-ref@1x.png', w: 1366, h: 900, sa: false, full: true,
    S: [['header', 0, 164], ['hero', 164, 420], ['smart', 420, 760], ['services', 760, 1450], ['faq', 1450, 1900], ['promo', 1900, 2140], ['footer', 2140, 2708]] } };
function pad(img, w, h) { if (img.width === w && img.height === h) return img; const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(img, o, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0); return o; }
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const res = {};
  for (const [name, P] of Object.entries(PAGES)) {
    if (which !== 'all' && which !== name) continue;
    const exe = [process.env.CHROME, '/usr/bin/google-chrome'].filter(Boolean).find(p => fs.existsSync(p));
    const b = P.sa ? await launch() : await chromium.launch({ executablePath: exe });
    const pg = await b.newPage({ viewport: { width: P.w, height: P.h }, deviceScaleFactor: 1 }); const err = [];
    pg.on('pageerror', e => err.push(e.message)); pg.on('requestfailed', r => err.push('failed ' + r.url()));
    if (!fs.existsSync(path.join(ROOT, P.html))) { res[name] = { missing: true }; await b.close(); continue; }
    await pg.goto('file://' + path.join(ROOT, P.html), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(600);
    const implP = path.join(OUT, name + '-impl.png'); await pg.screenshot({ path: implP, fullPage: P.full }); await b.close();
    const R = PNG.sync.read(fs.readFileSync(path.join(ROOT, P.ref))), A0 = PNG.sync.read(fs.readFileSync(implP));
    const w = R.width, h = R.height, A = pad(A0, w, h), d = new PNG({ width: w, height: h });
    const tot = pm(A.data, R.data, d.data, w, h, { threshold: 0.1, alpha: 0.3 }); const sec = {};
    for (const [nm, y0, y1] of P.S) { const cut = img => { const o = new PNG({ width: w, height: y1 - y0 }); PNG.bitblt(img, o, 0, y0, w, y1 - y0, 0, 0); return o; };
      sec[nm] = +(100 * pm(cut(A).data, cut(R).data, null, w, y1 - y0, { threshold: 0.1, alpha: 0.3 }) / w / (y1 - y0)).toFixed(2); }
    const t = new PNG({ width: w * 3 + 40, height: h }); t.data.fill(255);
    PNG.bitblt(R, t, 0, 0, w, h, 0, 0); PNG.bitblt(A, t, 0, 0, w, h, w + 20, 0); PNG.bitblt(d, t, 0, 0, w, h, 2 * w + 40, 0);
    fs.writeFileSync(path.join(OUT, name + '-figma-ours-diff.png'), PNG.sync.write(t));
    res[name] = { height: A0.height, total: +(100 * tot / w / h).toFixed(2), sections: sec, errors: err };
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
