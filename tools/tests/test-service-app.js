// node tools/test.js -> interaction checks via file:// (375x812 phone viewport, touch + mouse)
const path = require('path'), fs = require('fs'); const { launch } = require('../service-app/chrome');
(async () => {
  const b = await launch(); const R = []; const ok = (n, c) => R.push([n, !!c]);
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const failed = []; pg.on('requestfailed', r => failed.push(r.url()));
  await pg.goto('file://' + path.resolve(__dirname, '../../service-app.html'), { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
  ok('page height 1377', (await pg.evaluate(() => document.documentElement.scrollHeight)) === 1377);
  ok('fonts loaded (Peyda + PeydaWeb FaNum)', await pg.evaluate(() => document.fonts.check('400 12px "PeydaWeb FaNum"') && document.fonts.check('400 12px Peyda') && [...document.fonts].filter(f => f.status === 'loaded').length >= 3));
  ok('all images load via file://', await pg.evaluate(() => Promise.all([...new Set([...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).join(' ').match(/url\("?([^")]+)/g) || [])].map(u => new Promise(r => { const i = new Image(); i.onload = () => r(1); i.onerror = () => r(0); i.src = u.replace(/^url\("?/, ''); }))).then(a => a.length > 10 && a.every(Boolean))));
  ok('no external / fetch requests', failed.length === 0 && !fs.readFileSync(path.resolve(__dirname, '../../js/service-app.js'), 'utf8').match(/fetch\(|XMLHttpRequest/));
  ok('tab bar fixed at bottom', await pg.evaluate(() => Math.round(document.querySelector('.tabbar-in').getBoundingClientRect().bottom) === innerHeight));
  // slider
  const pos = () => pg.evaluate(() => [...document.querySelectorAll('.card:not(.is-clone)')].map(c => Math.round(new DOMMatrix(getComputedStyle(c).transform).m41)));
  const front = () => pg.evaluate(() => [...document.querySelectorAll('.card')].filter(c => Math.round(new DOMMatrix(getComputedStyle(c).transform).m41) === 87).map(c => c.dataset.i).join(''));
  const p0 = await pos(); ok('cards start at Figma x (87, -189) ' + p0, p0[0] === 87 && p0[1] === -189);
  await pg.evaluate(() => scrollTo(0, 400)); await pg.waitForTimeout(300); const sl = await (await pg.$('.sl')).boundingBox(); const y = sl.y + sl.height / 2;
  await pg.mouse.move(100, y); await pg.mouse.down(); for (let x = 100; x <= 260; x += 20) await pg.mouse.move(x, y); await pg.mouse.up(); await pg.waitForTimeout(600);
  let p1 = await pos(); ok('mouse drag right -> next card slides in from the left (RTL) ' + p1, p1[1] === 87);
  await pg.mouse.move(100, y); await pg.mouse.down(); for (let x = 100; x <= 260; x += 20) await pg.mouse.move(x, y); await pg.mouse.up(); await pg.waitForTimeout(600);
  p1 = await front(); ok('loops back to the first card (card 0 in front) ' + p1, p1 === '0');
  const vis = await pg.evaluate(() => { const xs = [...document.querySelectorAll('.card')].map(c => new DOMMatrix(getComputedStyle(c).transform).m41); return [0, 100, 200, 300, 370].every(px => xs.some(x => px >= x - 12 && px <= x + 282)); });
  ok('no empty gap in the slider while looping', vis);
  // touch swipe
  const cdp = await ctx.newCDPSession(pg);
  const touch = async (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', 300); for (let x = 300; x >= 150; x -= 25) await touch('touchMove', x); await touch('touchEnd'); await pg.waitForTimeout(600);
  p1 = await front(); ok('touch swipe left -> previous (wraps to card 1) ' + p1, p1 === '1');
  await pg.focus('.sl'); await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(600); p1 = await front(); ok('keyboard ArrowLeft = next (card 0) ' + p1, p1 === '0');
  // drag must not trigger card link
  await pg.mouse.move(150, y); await pg.mouse.down(); for (let x = 150; x <= 330; x += 30) await pg.mouse.move(x, y); await pg.mouse.up(); await pg.waitForTimeout(500);
  ok('drag does not show a toast (click suppressed)', !(await pg.$eval('.toast', e => e.classList.contains('is-on'))));
  await pg.evaluate(() => window.__app.go(-1)); await pg.waitForTimeout(500);
  // tiles
  await pg.click('.tile[data-id="418:70"]'); ok('tile click -> toast', /راهیار|را هیا ر|ورود به خدمت/.test(await pg.$eval('.toast', e => e.textContent)));
  await pg.click('.tile.is-off', { force: true }); ok('disabled tile -> disabled message', /غیرفعال/.test(await pg.$eval('.toast', e => e.textContent)));
  ok('disabled tile aria-disabled', await pg.$eval('.tile.is-off', e => e.getAttribute('aria-disabled') === 'true'));
  await pg.hover('.tile[data-id="418:71"]'); await pg.waitForTimeout(250);
  ok('tile hover lifts', await pg.$eval('.tile[data-id="418:71"] .tile-img', e => new DOMMatrix(getComputedStyle(e).transform).m42 < 0));
  // tabs
  await pg.click('.tab[data-tab="faq"]'); await pg.waitForTimeout(900);
  ok('faq tab active + indicator moved + scrolled', await pg.evaluate(() => document.querySelector('.tab[data-tab="faq"]').classList.contains('is-on') && Math.abs(document.querySelector('.tab-ind').getBoundingClientRect().left - document.querySelector('.tab[data-tab="faq"] .tab-ic').getBoundingClientRect().left) < 8 && scrollY > 300));
  await pg.click('.tab[data-tab="home"]'); await pg.waitForTimeout(900); ok('home tab scrolls to top', await pg.evaluate(() => scrollY === 0));
  await pg.click('.hit.btn-menu'); ok('menu button responds', /منو/.test(await pg.$eval('.toast', e => e.textContent)));
  ok('links/buttons count >= 20', (await pg.$$('a[href]')).length >= 20);
  ok('no JS errors ' + errs.join('|'), errs.length === 0);
  // scaled viewport (412px phone)
  await pg.setViewportSize({ width: 412, height: 900 }); await pg.waitForTimeout(200);
  ok('scales to 412px wide viewport', await pg.evaluate(() => Math.abs(document.querySelector('.app').getBoundingClientRect().width - 412) < 1 && document.documentElement.scrollWidth <= 412));
  fs.mkdirSync(path.resolve(__dirname, '../../out/interactive'), { recursive: true });
  await pg.setViewportSize({ width: 375, height: 812 }); await pg.evaluate(() => scrollTo(0, 560)); await pg.waitForTimeout(300);
  await pg.mouse.move(100, 200); await pg.mouse.down(); await pg.mouse.move(180, 200, { steps: 5 });
  await pg.screenshot({ path: path.resolve(__dirname, '../../out/interactive/slider-dragging.png') }); await pg.mouse.up();
  for (const [n, c] of R) console.log(c ? 'PASS' : 'FAIL', n);
  console.log(R.filter(r => r[1]).length + '/' + R.length); await b.close();
})();
