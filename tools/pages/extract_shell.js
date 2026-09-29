// node extract_shell.js -> shell-home.json: outerHTML of the homepage's header (y<164) and footer (y>=3795) stage children
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const pg = await b.newPage({ viewport: { width: 1366, height: 900 } });
  await pg.goto('file://' + path.resolve(__dirname, '../../index.html'), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => {
    const st = document.querySelector('.stage'), S = st.getBoundingClientRect(); const out = { header: [], footer: [], straddle: [] };
    for (const e of st.children) {
      const q = e.getBoundingClientRect(); const t = q.top - S.top, bt = q.bottom - S.top;
      const rec = { html: e.outerHTML, top: t, bottom: bt, cls: e.className, id: e.dataset.id || e.id, tag: e.tagName, h: q.height };
      if (q.height === 0 && q.width === 0) { rec.zero = 1; }
      if (bt <= 166 && t >= -2) out.header.push(rec); else if (t >= 3790) out.footer.push(rec); else if (t < 166 || bt > 3790) out.straddle.push(rec);
    }
    return out;
  });
  fs.writeFileSync(path.join(__dirname, 'shell-home.json'), JSON.stringify(r));
  console.log('header', r.header.length, 'footer', r.footer.length);
  for (const s of r.straddle) console.log('straddle', s.tag, s.cls, s.id, s.top.toFixed(0), s.bottom.toFixed(0));
  await b.close();
})();
