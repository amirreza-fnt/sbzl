#!/usr/bin/env node
// node tools/tests/compare-pages.js [register|citizen|all] [outDir]
// Pixel-compare vs 1x refs (tools/pages/src) and 2x refs (ref/figma); per-section % + triptych in docs/.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
let pm = require('pixelmatch');
pm = pm.default || pm;
const { launch, chromePath } = require('../service-app/chrome');

const ROOT = path.resolve(__dirname, '../..');
const which = process.argv[2] || 'all';
const OUT = path.resolve(process.argv[3] || path.join(ROOT, 'out/compare-pages'));
const DOCS = path.join(ROOT, 'docs');
const ART = '/opt/cursor/artifacts';

const PAGES = {
  register: {
    html: 'register.html',
    ref1: 'tools/pages/src/register-ref@1x.png',
    ref2: 'ref/figma/register_2x.png',
    w: 360,
    h: 761,
    sa: true,
    full: false,
    S: [
      ['header', 0, 100],
      ['intro', 100, 195],
      ['fields', 195, 400],
      ['space', 400, 570],
      ['terms', 570, 622],
      ['button', 622, 680],
      ['tabbar', 680, 761],
    ],
  },
  citizen: {
    html: 'citizen-services.html',
    ref1: 'tools/pages/src/citizen-ref@1x.png',
    ref2: 'ref/figma/services_2x.png',
    w: 1366,
    h: 2708,
    sa: false,
    full: true,
    S: [
      ['header', 0, 164],
      ['hero', 164, 420],
      ['smart', 420, 760],
      ['services', 760, 1450],
      ['faq', 1450, 1900],
      ['promo', 1900, 2140],
      ['footer', 2140, 2708],
    ],
  },
};

function pad(img, w, h) {
  if (img.width === w && img.height === h) return img;
  const o = new PNG({ width: w, height: h });
  o.data.fill(255);
  PNG.bitblt(img, o, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0);
  return o;
}

function comparePair(R, A, S) {
  const w = R.width,
    h = R.height;
  A = pad(A, w, h);
  const d = new PNG({ width: w, height: h });
  const tot = pm(A.data, R.data, d.data, w, h, { threshold: 0.1, alpha: 0.3 });
  const sec = {};
  for (const [nm, y0, y1] of S) {
    const cut = (img) => {
      const o = new PNG({ width: w, height: y1 - y0 });
      PNG.bitblt(img, o, 0, y0, w, y1 - y0, 0, 0);
      return o;
    };
    sec[nm] = +(100 * pm(cut(A).data, cut(R).data, null, w, y1 - y0, { threshold: 0.1, alpha: 0.3 }) / w / (y1 - y0)).toFixed(2);
  }
  const t = new PNG({ width: w * 3 + 40, height: h });
  t.data.fill(255);
  PNG.bitblt(R, t, 0, 0, w, h, 0, 0);
  PNG.bitblt(A, t, 0, 0, w, h, w + 20, 0);
  PNG.bitblt(d, t, 0, 0, w, h, 2 * w + 40, 0);
  return {
    total: +(100 * tot / w / h).toFixed(2),
    sections: sec,
    triptych: PNG.sync.write(t),
    height: A.height,
  };
}

async function shot(P, dsf) {
  const exe = chromePath();
  const b = P.sa ? await launch() : await chromium.launch({ executablePath: exe });
  const pg = await b.newPage({
    viewport: { width: P.w, height: P.sa ? P.h : 900 },
    deviceScaleFactor: dsf,
  });
  const err = [];
  pg.on('pageerror', (e) => err.push(e.message));
  pg.on('requestfailed', (r) => err.push('failed ' + r.url()));
  await pg.goto('file://' + path.join(ROOT, P.html), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(600);
  const implP = path.join(OUT, `${path.basename(P.html, '.html')}-impl@${dsf}x.png`);
  await pg.screenshot({ path: implP, fullPage: P.full });
  await b.close();
  return { implP, err };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DOCS, { recursive: true });
  fs.mkdirSync(ART, { recursive: true });
  const res = {};
  for (const [name, P] of Object.entries(PAGES)) {
    if (which !== 'all' && which !== name) continue;
    if (!fs.existsSync(path.join(ROOT, P.html))) {
      res[name] = { missing: true };
      continue;
    }
    const out = { scale1: null, scale2: null, errors: [] };
    for (const [label, dsf, refRel] of [
      ['1x', 1, P.ref1],
      ['2x', 2, P.ref2],
    ]) {
      const refPath = path.join(ROOT, refRel);
      if (!fs.existsSync(refPath)) {
        out[label] = { skip: refRel };
        continue;
      }
      const { implP, err } = await shot(P, dsf);
      out.errors.push(...err);
      const R = PNG.sync.read(fs.readFileSync(refPath));
      const A0 = PNG.sync.read(fs.readFileSync(implP));
      const cmp = comparePair(R, A0, P.S);
      const tripName = `${name}-figma-ours-diff@${label}.png`;
      const tripPath = path.join(OUT, tripName);
      fs.writeFileSync(tripPath, cmp.triptych);
      fs.copyFileSync(tripPath, path.join(DOCS, tripName));
      fs.copyFileSync(tripPath, path.join(ART, tripName));
      out[label] = { total: cmp.total, sections: cmp.sections, height: cmp.height, triptych: tripPath };
    }
    res[name] = out;
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(res, null, 2));
  fs.writeFileSync(path.join(DOCS, 'compare-pages-result.json'), JSON.stringify(res, null, 2));
  console.log(JSON.stringify(res, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
