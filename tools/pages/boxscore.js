// node boxscore.js <ref.png> <impl.png> <boxes.json>  -> JSON array of pixelmatch counts per box [x0,y0,x1,y1]
// (same options as tools/tests/compare-pages.js, so the fit pickers optimise the reported metric, AA-exclusion included)
const fs = require('fs'); const { PNG } = require('pngjs'); let pm = require('pixelmatch'); pm = pm.default || pm;
const [refP, implP, boxP] = process.argv.slice(2);
const R = PNG.sync.read(fs.readFileSync(refP)), A = PNG.sync.read(fs.readFileSync(implP)), boxes = JSON.parse(fs.readFileSync(boxP));
const cut = (img, x0, y0, w, h) => { const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(img, o, x0, y0, Math.min(w, img.width - x0), Math.min(h, img.height - y0), 0, 0); return o; };
console.log(JSON.stringify(boxes.map(([x0, y0, x1, y1]) => { const w = x1 - x0, h = y1 - y0; return pm(cut(A, x0, y0, w, h).data, cut(R, x0, y0, w, h).data, null, w, h, { threshold: 0.1, alpha: 0.3 }); })));
