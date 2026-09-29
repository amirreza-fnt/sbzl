// node tools/tests/test-site.js  -> combined-site checks via file:// (both pages load every local file; the link works)
const path = require('path'); const { chromium } = require('playwright-core');
const ROOT = path.resolve(__dirname, '../..');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const R = []; const ok = (n, c) => R.push([n, !!c]);
  for (const [page, vw, fonts] of [['index.html', 1366, ['400 12px Peyda', '400 12px "PeydaWeb FaNum"']], ['service-app.html', 375, ['400 12px Peyda', '400 12px "PeydaWeb FaNum"']]]) {
    const pg = await b.newPage({ viewport: { width: vw, height: 900 } }); const bad = [], files = new Set();
    pg.on('requestfailed', r => bad.push(r.url())); pg.on('pageerror', e => bad.push('js: ' + e.message)); pg.on('requestfinished', r => files.add(r.url()));
    await pg.goto('file://' + path.join(ROOT, page), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(800);
    // the service app's <link rel=preload crossorigin> font is refused under file:// (null origin) exactly as in its own repo;
    // harmless because @font-face then loads the same file -> only count failures whose URL never loaded
    const real = bad.filter(u => !files.has(u));
    ok(`${page}: all local files load (${files.size} files) ${real.join('|')}`, real.length === 0 && files.size > 5);
    ok(`${page}: shared fonts loaded`, await pg.evaluate(f => f.every(x => document.fonts.check(x)) && [...document.fonts].some(x => x.status === 'loaded'), fonts));
    const fontUrls = [...files].filter(u => /\.woff2?$/.test(u)).map(u => u.split('/fonts/')[1]);
    ok(`${page}: fonts come from shared fonts/ (${fontUrls.join(', ')})`, fontUrls.length > 0 && fontUrls.every(u => /^(Peyda|PeydaWeb|PeydaWebFaNum_from_RecycleBin|IRANYekanXFaNum)\//.test(u)));
    if (page === 'index.html') {
      const a = await pg.$('a.hit[aria-label="همه خدمات"]'); ok('homepage "همه خدمات" -> service-app.html', (await a.getAttribute('href')) === 'service-app.html');
      await pg.evaluate(() => window.scrollTo(0, 0)); await a.scrollIntoViewIfNeeded(); await Promise.all([pg.waitForNavigation(), a.click()]);
      ok('click lands on service-app.html (' + pg.url().split('/').pop() + ')', pg.url().endsWith('/service-app.html') && await pg.title() === 'فهرست خدمات شهرداری سبزوار');
    } else ok('service-app.html has <link rel=home href=index.html>', await pg.$eval('link[rel=home]', l => l.getAttribute('href')) === 'index.html');
    await pg.close();
  }
  for (const [n, c] of R) console.log(c ? 'PASS' : 'FAIL', n); console.log(R.filter(r => r[1]).length + '/' + R.length); await b.close();
})();
