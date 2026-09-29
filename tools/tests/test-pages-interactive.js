// Playwright interaction tests for register.html and citizen-services.html (file://)
const path = require('path');
const { chromium } = require('playwright-core');
const { launch, chromePath } = require('../service-app/chrome');

const ROOT = path.resolve(__dirname, '../..');
const R = [];
const ok = (n, c, info) => {
  R.push([n, !!c]);
  console.log(c ? 'PASS' : 'FAIL', n, info || '');
};

(async () => {
  const exe = chromePath();

  // --- register (360)
  const br = await launch();
  const pg = await br.newPage({ viewport: { width: 360, height: 800 } });
  await pg.goto('file://' + path.join(ROOT, 'register.html'), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.click('.go');
  ok('register: submit shows validation errors', await pg.$eval('.fld.is-err', (e) => !!e));
  await pg.fill('#f-name', 'علی رضایی');
  await pg.fill('#f-nid', '0000000000');
  await pg.fill('#f-mobile', '09121234567');
  await pg.click('.go');
  ok('register: invalid national code', await pg.$eval('#e-nid', (e) => e.offsetParent !== null || getComputedStyle(e.parentElement).className.includes('is-err')));
  await pg.fill('#f-nid', '0499370899');
  await pg.check('#f-terms');
  await pg.click('.go');
  await pg.waitForSelector('#dlg-ok.is-on');
  ok('register: success dialog', await pg.$eval('#dlg-ok', (e) => e.classList.contains('is-on')));
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(200);
  await pg.hover('.go');
  ok('register: button hover style', await pg.$eval('.go', (e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  await pg.hover('.tab');
  ok('register: tab hover', await pg.$eval('.tab', (e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  await br.close();

  // --- citizen (1366)
  const bc = await chromium.launch({ executablePath: exe });
  const pc = await bc.newPage({ viewport: { width: 1366, height: 900 } });
  await pc.goto('file://' + path.join(ROOT, 'citizen-services.html'), { waitUntil: 'load' });
  await pc.evaluate(() => document.fonts.ready);
  await pc.waitForTimeout(300);
  const cardLoc = pc.locator('.cs-card').first();
  await cardLoc.scrollIntoViewIfNeeded();
  await cardLoc.dispatchEvent('mouseover');
  const green = await pc.evaluate(() => {
    const c = document.querySelector('.cs-card');
    const g = c && c.querySelector('.cs-card-go');
    if (!g) return '';
    const inline = g.style.backgroundColor;
    const comp = getComputedStyle(g).backgroundColor;
    return inline || comp;
  });
  ok('citizen: card hover circle green', /183,\s*87|#00b757/i.test(green), green);
  const href = await pc.locator('.cs-card').first().getAttribute('href');
  ok('citizen: card is link', !!href && href.includes('service-app'));
  await pc.click('#q1');
  ok('citizen: faq accordion opens', await pc.$eval('#q1', (e) => e.getAttribute('aria-expanded') === 'true'));
  await pc.hover('.cs-q');
  ok('citizen: faq row hover', true);
  await pc.click('.cs-promo-btn');
  ok('citizen: promo button clickable', true);
  for (const w of [1280, 1920, 2560]) {
    await pc.setViewportSize({ width: w, height: 900 });
    const hs = await pc.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    ok(`citizen: no horizontal scroll at ${w}`, !hs);
  }
  await bc.close();

  const fails = R.filter((x) => !x[1]).length;
  console.log(fails ? 'SOME FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
