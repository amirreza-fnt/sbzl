// Headless Chrome test of the interactive layer: arrows, dots, drag (mouse, scaled stage), touch swipe,
// keyboard, autoplay, hover states. Screenshots -> out/interactive/
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '../..'), OUT = path.resolve(__dirname, '../../out/interactive');
fs.mkdirSync(OUT, { recursive: true });
const port = 8931;
const types = { '.css': 'text/css', '.svg': 'image/svg+xml', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(port);
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); console.log(cond ? 'PASS' : 'FAIL', name, info || ''); };
const CLIP = { hmain: [410, 190, 916, 380], hside: [40, 190, 375, 380], services: [60, 1255, 1250, 215], films: [680, 1960, 585, 205], orgs: [20, 2290, 1340, 400] };
const state = (pg, n) => pg.evaluate(n => { const s = window.__sliders[n]; return { idx: s.idx, o: s.o || 0, dot: s.dots.findIndex(b => b.classList.contains('is-on')) }; }, n);
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const url = process.env.FILE ? 'file://' + path.join(root, 'index.html') : `http://localhost:${port}/index.html`;
  // ---------------- desktop 1366
  let ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  let pg = await ctx.newPage(); await pg.goto(url, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready);
  const shot = async (name, clip) => pg.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } });
  const click = async sel => { await pg.locator(sel).first().click(); await wait(800); };
  await pg.mouse.move(1360, 5);
  for (const n of ['hmain', 'hside', 'services', 'films', 'orgs']) {
    await pg.locator(`[data-sl-target="${n}"]`).first().scrollIntoViewIfNeeded();
    await pg.mouse.move(1360, 5); await wait(300);
    const hasArrow = await pg.locator(`.sl-arrow[data-sl-target="${n}"]`).count() > 0;
    await shot(`${n}-slide1`, CLIP[n]);
    const s0 = await state(pg, n);
    if (hasArrow) await click(`.sl-arrow[data-sl-target="${n}"][data-dir="1"]`);
    else { const d = await pg.locator(`.sl-dots[data-sl-target="${n}"] button`).count(); await click(`.sl-dots[data-sl-target="${n}"] button >> nth=${(s0.dot + 1) % d}`); }
    await pg.mouse.move(1360, 5); await wait(200);
    const s1 = await state(pg, n);
    ok(`${n}: ${hasArrow ? 'next arrow' : 'next dot'}`, s1.idx === (s0.idx + 1) % (await pg.evaluate(n => window.__sliders[n].n, n)), JSON.stringify([s0, s1]));
    await shot(`${n}-slide2`, CLIP[n]);
    if (await pg.locator(`.sl-arrow[data-sl-target="${n}"][data-dir="-1"]`).count()) {
      await click(`.sl-arrow[data-sl-target="${n}"][data-dir="-1"]`); const s2 = await state(pg, n); ok(`${n}: prev arrow`, s2.idx === s0.idx, JSON.stringify(s2));
    }
    if (await pg.locator(`.sl-dots[data-sl-target="${n}"] button`).count()) {
      const d = await pg.locator(`.sl-dots[data-sl-target="${n}"] button`).count();
      const tgt = (s0.dot + 1) % d; await pg.locator(`.sl-dots[data-sl-target="${n}"] button`).nth(tgt).click(); await wait(800);
      const s3 = await state(pg, n); ok(`${n}: dot ${tgt} click`, s3.dot === tgt, JSON.stringify(s3));
      await shot(`${n}-dot${tgt}`, CLIP[n]);
      // back to the start state via dots
      await pg.locator(`.sl-dots[data-sl-target="${n}"] button`).nth(s0.dot).click(); await wait(800);
    }
    // mouse drag (to the right = next in RTL)
    const c = CLIP[n], sx = c[0] + c[2] * 0.45, sy = c[1] + c[3] * 0.5;
    const r0 = await pg.evaluate(() => document.querySelector('.stage').getBoundingClientRect().top);
    const before = await state(pg, n);
    await pg.mouse.move(sx, sy + r0); await pg.mouse.down();
    for (let i = 1; i <= 12; i++) { await pg.mouse.move(sx + i * 20, sy + r0); await wait(16); }
    await pg.mouse.up(); await wait(900);
    const after = await state(pg, n);
    ok(`${n}: mouse drag right -> next`, after.idx !== before.idx, JSON.stringify([before, after]));
    // keyboard: focus an arrow and press ArrowLeft (= next in RTL)
    await pg.locator(`[data-sl-target="${n}"] button, button[data-sl-target="${n}"]`).first().focus();
    const k0 = await state(pg, n); await pg.keyboard.press('ArrowLeft'); await wait(800); const k1 = await state(pg, n);
    ok(`${n}: keyboard ArrowLeft`, k1.idx !== k0.idx, JSON.stringify([k0, k1]));
    await pg.evaluate(() => document.activeElement.blur());
  }
  // hover states
  await pg.goto(url, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready);
  await pg.locator('[data-sl-name="orgs"]').scrollIntoViewIfNeeded();
  const card = pg.locator('.org-card .card-link[aria-label*="توحیدشهر"]');
  const bb = await card.boundingBox(); await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await wait(500);
  const op = await pg.evaluate(() => [...document.querySelectorAll('.org-card')].map(c => getComputedStyle(c.querySelector('.org-go')).opacity));
  ok('orgs: hover shows green button on hovered card only', op.filter(v => v === '1').length === 1, op.join(','));
  const o = await pg.evaluate(() => { const r = document.querySelector('[data-sl-name="orgs"]').getBoundingClientRect(); return r.top + scrollY; });
  await pg.screenshot({ path: `${OUT}/orgs-card-hover.png`, clip: { x: 20, y: o - 70, width: 1340, height: 400 }, fullPage: true });
  await pg.mouse.move(1360, 5); await wait(400);
  await pg.screenshot({ path: `${OUT}/orgs-card-nohover.png`, clip: { x: 20, y: o - 70, width: 1340, height: 400 }, fullPage: true });
  const chip = pg.locator('.chip').nth(1); await chip.scrollIntoViewIfNeeded(); const cb = await chip.boundingBox();
  await pg.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await wait(400);
  const cy = await pg.evaluate(() => document.querySelector('.chip').getBoundingClientRect().top + scrollY);
  await pg.screenshot({ path: `${OUT}/chip-hover.png`, clip: { x: 40, y: cy - 30, width: 520, height: 100 }, fullPage: true });
  await chip.click(); await pg.mouse.move(1360, 5); await wait(400);
  ok('chips: click selects', await pg.evaluate(() => document.querySelectorAll('.chip')[1].classList.contains('is-active')));
  await pg.screenshot({ path: `${OUT}/chip-selected.png`, clip: { x: 40, y: cy - 30, width: 520, height: 100 }, fullPage: true });
  // tabs
  await pg.locator('.tab-btn').nth(2).click(); await wait(500);
  ok('news tabs: click moves underline', await pg.evaluate(() => document.querySelectorAll('.tab-btn')[2].getAttribute('aria-selected') === 'true'));
  const ty = await pg.evaluate(() => document.querySelector('.tab-btn').getBoundingClientRect().top + scrollY);
  await pg.screenshot({ path: `${OUT}/news-tab.png`, clip: { x: 600, y: ty - 10, width: 700, height: 60 }, fullPage: true });
  // news list next to the video: scrollable with wheel, thumb follows, thumb draggable
  await pg.goto(url, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready);
  const nl = pg.locator('.news-scroll'); await nl.scrollIntoViewIfNeeded(); await wait(300);
  const nlTop = await pg.evaluate(() => document.querySelector('.news-scroll').getBoundingClientRect().top + scrollY);
  const nclip = { x: 100, y: nlTop - 10, width: 570, height: 540 };
  await pg.screenshot({ path: `${OUT}/newslist-top.png`, clip: nclip, fullPage: true });
  const nb = await nl.boundingBox(); await pg.mouse.move(nb.x + 200, nb.y + 200); await pg.mouse.wheel(0, 250); await wait(900);
  const st1 = await pg.evaluate(() => [document.querySelector('.news-scroll').scrollTop, getComputedStyle(document.querySelector('.nl-thumb')).transform]);
  ok('news list: wheel scrolls, thumb follows', st1[0] > 100 && st1[1] !== 'none', JSON.stringify(st1));
  await pg.screenshot({ path: `${OUT}/newslist-scrolled.png`, clip: nclip, fullPage: true });
  await pg.evaluate(() => { const b = document.querySelector('.news-scroll'); b.style.scrollBehavior = 'auto'; b.scrollTop = 0; b.style.scrollBehavior = ''; }); await wait(300);
  const tb = await pg.locator('.nl-thumb').boundingBox();
  await pg.mouse.move(tb.x + 2, tb.y + 20); await pg.mouse.down(); await pg.mouse.move(tb.x + 2, tb.y + 20 + 400, { steps: 8 }); await pg.mouse.up(); await wait(300);
  const st2 = await pg.evaluate(() => { const b = document.querySelector('.news-scroll'); return [b.scrollTop, b.scrollHeight - b.clientHeight]; });
  ok('news list: thumb drag scrolls to the end', Math.abs(st2[0] - st2[1]) < 2, JSON.stringify(st2));
  await pg.screenshot({ path: `${OUT}/newslist-end.png`, clip: nclip, fullPage: true });
  // orgs: every card incl. the formerly off-canvas 7th, after one step
  await pg.locator('.sl-arrow[data-sl-target="orgs"][data-dir="1"]').click(); await pg.mouse.move(1360, 5); await wait(900);
  const oy = await pg.evaluate(() => document.querySelector('[data-sl-name="orgs"]').getBoundingClientRect().top + scrollY);
  await pg.screenshot({ path: `${OUT}/orgs-card7-button.png`, clip: { x: 40, y: oy + 180, width: 480, height: 130 }, fullPage: true });
  const b7 = await pg.evaluate(() => { const c = [...document.querySelectorAll('.org-card')].find(c => c.textContent.includes('عمران')); const r = c.querySelector('.org-btn7').getBoundingClientRect(); return [r.width, r.height, getComputedStyle(c.querySelector('.org-btn7')).backgroundImage.slice(0, 200)]; });
  ok('orgs: card 7 has the same grey button', b7[0] > 20 && /sprites/.test(b7[2]), JSON.stringify(b7));
  // services logo in the bump
  await pg.screenshot({ path: `${OUT}/services-logo-bump.png`, clip: { x: 440, y: 900, width: 490, height: 130 }, fullPage: true });
  await pg.screenshot({ path: `${OUT}/services-card-bottom.png`, clip: { x: 560, y: 1280, width: 250, height: 190 }, fullPage: true });
  await ctx.close();

  // ---------------- autoplay (fresh page, pointer away)
  ctx = await b.newContext({ viewport: { width: 1366, height: 3000 } });
  pg = await ctx.newPage(); await pg.goto(url, { waitUntil: 'networkidle' });
  const a0 = {}; for (const n of ['hmain', 'hside', 'orgs']) a0[n] = await state(pg, n);
  await wait(3000); const early = await state(pg, 'hside');
  ok('autoplay: no change during first 3s (compare-safe)', early.idx === a0.hside.idx);
  await wait(5500);
  for (const n of ['hmain', 'hside', 'orgs']) { const s = await state(pg, n); ok(`${n}: autoplay advanced`, s.idx !== a0[n].idx, JSON.stringify([a0[n], s])); }
  // pause on hover
  const hs = await state(pg, 'hside'); await pg.mouse.move(200, 380); await wait(7000);
  ok('hside: autoplay paused on hover', (await state(pg, 'hside')).idx === hs.idx);
  await ctx.close();

  // ---------------- wide screens: stage scaled UP to the window width (full-bleed), mouse drag / anchors / hover / ticker
  for (const VW of [1920, 2560]) {
    ctx = await b.newContext({ viewport: { width: VW, height: 1000 }, deviceScaleFactor: 1 });
    pg = await ctx.newPage(); await pg.goto(url, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready);
    const g = await pg.evaluate(() => { const r = document.querySelector('.stage').getBoundingClientRect(), d = document.documentElement; return { l: r.left, rr: d.clientWidth - r.right, k: r.width / 1366, h: d.scrollHeight, hs: d.scrollWidth > d.clientWidth }; });
    ok(`wide ${VW}: full-bleed, no side gap, no h-scroll (k=${g.k.toFixed(4)}, h=${g.h})`, g.l <= 0 && g.l > -1.5 && g.rr <= 0 && g.rr > -1.5 && !g.hs && Math.abs(g.h - Math.round(4306 * g.k)) <= 1, JSON.stringify(g));
    for (const n of ['services', 'orgs', 'hmain']) {
      await pg.locator(`[data-sl-target="${n}"]`).first().scrollIntoViewIfNeeded(); await wait(300);
      const top = await pg.evaluate(() => document.querySelector('.stage').getBoundingClientRect().top);
      const c = CLIP[n]; const s0 = await state(pg, n); const pitch = await pg.evaluate(n => window.__sliders[n].p || 0, n);
      const x0 = (c[0] + c[2] * 0.4) * g.k, y0 = (c[1] + c[3] * 0.5) * g.k + top, dx = (pitch || 120) * g.k;
      await pg.mouse.move(x0, y0); await pg.mouse.down();
      for (let i = 1; i <= 12; i++) { await pg.mouse.move(x0 + dx * i / 12, y0); await wait(16); }
      await pg.mouse.up(); await wait(900); const s1 = await state(pg, n);
      ok(`wide ${VW} ${n}: mouse drag of one scaled pitch moves one card`, s1.idx === (s0.idx + 1) % (await pg.evaluate(n => window.__sliders[n].n, n)), JSON.stringify([s0, s1]));
    }
    await pg.evaluate(() => window.scrollTo(0, 0)); await wait(200);
    await pg.locator('a.hit[aria-label="اتاق خبر"]').first().click(); await wait(1200);
    const an = await pg.evaluate(() => { const e = document.getElementById('news'); return e ? Math.abs(e.getBoundingClientRect().top) : -1; });
    ok(`wide ${VW}: anchor #news scrolls to the (scaled) section`, an >= 0 && an < 3, String(an));
    const tk = await pg.evaluate(() => document.querySelector('.mc-tick').classList.contains('is-marquee'));
    ok(`wide ${VW}: public messages stay static (scale-aware fit)`, !tk);
    await pg.locator('#mc-name').scrollIntoViewIfNeeded(); await pg.fill('#mc-name', 'علی رضایی'); await pg.fill('#mc-phone', '09123456789');
    await pg.selectOption('#mc-dept', { index: 1 }); await pg.selectOption('#mc-cat', { index: 1 }); await pg.fill('#mc-msg', 'سلام، لطفا وضعیت آسفالت را بررسی کنید.');
    await pg.click('.mc-btn'); await wait(150);
    ok(`wide ${VW}: contact form submits`, await pg.$eval('.mc-ok', e => /موفقیت/.test(e.textContent)));
    if (VW === 1920) await pg.screenshot({ path: `${OUT}/wide-1920-contact.png` });
    await ctx.close();
  }

  // ---------------- narrow screen (scaled stage) with touch
  ctx = await b.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  pg = await ctx.newPage(); await pg.goto(url, { waitUntil: 'networkidle' });
  const k = await pg.evaluate(() => document.querySelector('.stage').getBoundingClientRect().width / 1366);
  const cdp = await ctx.newCDPSession(pg);
  const swipe = async (x0, y0, dx) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / 10, y: y0 }] }); await wait(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(900);
  };
  for (const n of ['services', 'orgs', 'hmain']) {
    await pg.locator(`[data-sl-target="${n}"]`).first().scrollIntoViewIfNeeded(); await wait(300);
    const top = await pg.evaluate(() => document.querySelector('.stage').getBoundingClientRect().top);
    const c = CLIP[n]; const s0 = await state(pg, n);
    const pitch = await pg.evaluate(n => window.__sliders[n].p || 0, n);
    // slow swipe of exactly one pitch in screen px (pitch * scale): must move exactly one card
    await swipe((c[0] + c[2] * 0.4) * k, (c[1] + c[3] * 0.5) * k + top, (pitch || 120) * k);
    const s1 = await state(pg, n);
    ok(`${n}: touch swipe on scaled stage (k=${k.toFixed(3)})`, s1.idx === (s0.idx + 1) % (await pg.evaluate(n => window.__sliders[n].n, n)), JSON.stringify([s0, s1]));
    if (n === 'services') await pg.screenshot({ path: `${OUT}/narrow-services-after-swipe.png` });
  }
  await ctx.close();
  await b.close(); srv.close();
  fs.writeFileSync(`${OUT}/test-results.txt`, results.map(r => r.join('\t')).join('\n') + '\n');
  console.log(results.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASS');
})();
