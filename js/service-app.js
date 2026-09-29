/* Sabzevar service app — behaviour (vanilla, no fetch; works from file://) */
(function () {
  'use strict';
  var root = document.documentElement, app = document.querySelector('.app');
  /* 1) scale the 375px Figma stage to the viewport (phones 320-480px; wider screens show it at 480px, centred) */
  var k = 1;
  function fit() {
    var w = Math.min(root.clientWidth || window.innerWidth, 480);
    k = w / 375; root.style.setProperty('--k', k.toFixed(5));
  }
  fit(); window.addEventListener('resize', fit);

  /* 2) toast for demo-only destinations (no backend in this static build) */
  var toast = document.querySelector('.toast'), tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('is-on'); }, 2200); }

  /* 3) service tiles */
  document.querySelectorAll('.tile').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var name = a.querySelector('.t').textContent.replace(/\s+/g, ' ').replace(/ـ/g, '').trim();
      if (a.dataset.disabled) say('خدمت «' + name + '» در حال حاضر غیرفعال است.');
      else say('ورود به خدمت «' + name + '»');
    });
  });
  var DEMO = { '#menu': 'منوی اصلی', '#messages': 'پیام‌ها و اعلانات', '#login': 'پنل کاربری', '#login-form': 'ورود به پنل کاربری', '#pay': 'پرداخت آنلاین عوارض', '#acts-all': 'همه اقدامات شما', '#faq-list': 'سوالات متداول' };
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (a.classList.contains('tile') || a.classList.contains('tab')) return;
    if (DEMO[h] || /^#act-/.test(h)) a.addEventListener('click', function (e) { e.preventDefault(); say((DEMO[h] || 'جزئیات اقدام') + ' — در نسخه نمایشی در دسترس نیست'); });
  });

  /* 4) bottom tab bar: active state + indicator; home/faq scroll, others demo */
  var ind = document.querySelector('.tab-ind'), tabs = [].slice.call(document.querySelectorAll('.tab'));
  function setTab(t) {
    tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    var ic = t.querySelector('.tab-ic'); ind.style.left = (t.offsetLeft + ic.offsetLeft + (ic.offsetWidth - ind.offsetWidth) / 2) + 'px';
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault(); setTab(t);
      var key = t.dataset.tab;
      if (key === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (key === 'faq') document.getElementById('faq').scrollIntoView({ behavior: 'smooth', block: 'center' });
      else say((key === 'panel' ? 'پنل کاربری' : 'پیام‌ها و اعلانات') + ' — در نسخه نمایشی در دسترس نیست');
    });
  });

  /* 5) «آخرین اقدامات شما» slider: RTL, infinite loop (clones), drag/swipe, keyboard, snap */
  var sl = document.querySelector('.sl'); if (!sl) return;
  var track = sl.querySelector('.sl-track'), real = [].slice.call(track.querySelectorAll('.card'));
  real.forEach(function (c) { var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.classList.add('is-clone'); d.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; }); track.appendChild(d); });
  var cards = [].slice.call(track.querySelectorAll('.card')), n = cards.length;
  var pitch = +sl.dataset.pitch, x0 = +sl.dataset.x0, span = n * pitch, off = 0, anim = null;
  var cw = cards[0].offsetWidth, lo = (375 - cw) / 2 - span / 2;   // wrap window centred on the viewport (every visible slot filled)
  function mod(a, m) { return ((a % m) + m) % m; }
  function layout() {
    cards.forEach(function (c, i) {
      var x = x0 - i * pitch + off;            // RTL: next card to the left
      x = mod(x - lo, span) + lo;
      c.style.transform = 'translate3d(' + x + 'px,0,0)';
      c.classList.toggle('is-pre', x > x0 + pitch / 2);   // the looped 'previous' card right of the first one
    });
  }
  function animateTo(target, ms) {
    cancelAnimationFrame(anim); var from = off, t0 = performance.now(); ms = ms || 380;
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      off = from + (target - from) * e; layout();
      if (p < 1) anim = requestAnimationFrame(step); else { off = mod(off, span); layout(); }
    })(t0);
  }
  function go(dir) { animateTo(Math.round(off / pitch) * pitch + dir * pitch); }   // dir +1 = next (content moves right)
  var sx = 0, so = 0, drag = false, moved = 0, pid = null, st = 0, vx = 0, lastX = 0, lastT = 0;
  sl.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return; cancelAnimationFrame(anim);
    sl.classList.add('is-live'); drag = true; moved = 0; pid = e.pointerId; sx = lastX = e.clientX; so = off; lastT = st = performance.now(); vx = 0;
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== pid) return;
    var dx = (e.clientX - sx) / k; moved = Math.max(moved, Math.abs(dx));
    if (moved > 4 && !sl.classList.contains('is-drag')) { sl.classList.add('is-drag'); try { sl.setPointerCapture(pid); } catch (_) {} }
    var now = performance.now(); if (now > lastT) { vx = (e.clientX - lastX) / k / (now - lastT); lastX = e.clientX; lastT = now; }
    off = so + dx; layout();
  });
  function end(e) {
    if (!drag || (e && e.pointerId !== pid)) return; drag = false; sl.classList.remove('is-drag');
    var d = off - so, target = Math.round(off / pitch) * pitch;
    if (Math.abs(d) > 30 || Math.abs(vx) > 0.35) target = (d > 0 || vx > 0.35 ? Math.ceil(off / pitch) : Math.floor(off / pitch)) * pitch;
    animateTo(target);
  }
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  sl.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  sl.addEventListener('dragstart', function (e) { e.preventDefault(); });
  sl.addEventListener('keydown', function (e) {
    sl.classList.add('is-live');
    if (e.key === 'ArrowLeft') { go(1); e.preventDefault(); }       // RTL: left = next
    else if (e.key === 'ArrowRight') { go(-1); e.preventDefault(); }
  });
  layout();
  window.__app = { go: function (d) { sl.classList.add('is-live'); go(d); }, get off() { return off; }, pitch: pitch };
})();
