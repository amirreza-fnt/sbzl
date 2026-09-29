// node shot.js <html> <out.png> <w> <h> <fullPage 0|1> <serviceAppArgs 0|1>  (file://)
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright-core');
const [html, out, w, h, full, sa] = process.argv.slice(2);
(async () => {
  const exe = [process.env.CHROME, '/usr/bin/google-chrome'].filter(Boolean).find(p => fs.existsSync(p));
  const opts = { executablePath: exe }; if (sa === '1') opts.args = ['--allow-file-access-from-files', '--font-render-hinting=none'];
  const b = await chromium.launch(opts); const pg = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.resolve(html), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400);
  await pg.screenshot({ path: out, fullPage: full === '1' }); await b.close();
})();
