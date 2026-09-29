/* Sabzevar homepage - sliders, tabs and chips (hand-written, no dependencies).
   Works in "stage" coordinates: the 1366px stage is scaled with CSS transform on narrow screens,
   so every pointer distance is divided by the current scale factor.
   RTL: "next" moves content to the right (the left arrow is "next"), swipe right = next. */
(function () {
  'use strict';
  var stage = document.querySelector('.stage[data-interactive]');
  if (!stage) return;
  var W0 = 1366;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sliders = {}, list = [];

  function mod(a, n) { return ((a % n) + n) % n; }
  function nums(v) { return (v || '').split(',').map(Number); }
  function stageInfo() { var r = stage.getBoundingClientRect(); return { k: r.width / W0 || 1, l: r.left, t: r.top }; }
  function toStage(cx, cy) { var s = stageInfo(); return { x: (cx - s.l) / s.k, y: (cy - s.t) / s.k, k: s.k }; }
  function inRect(r, p) { return p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3]; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------ base */
  function Base(cfg) {
    this.name = cfg.dataset.slName;
    this.n = +cfg.dataset.n;
    this.rect = nums(cfg.dataset.rect);
    this.hover = nums(cfg.dataset.hover || cfg.dataset.rect);
    this.delay = reduced ? 0 : +(cfg.dataset.autoplay || 0);
    this.idx = 0;
    this.hovered = false; this.focused = false; this.visible = true;
    this.elapsed = this.delay ? this.delay - Math.max(6500, this.delay) : 0; /* first advance >= 6.5s after load */
    this.dotsEl = document.querySelector('.sl-dots[data-sl-target="' + this.name + '"]');
    this.dots = this.dotsEl ? $$('button', this.dotsEl) : [];
    this.dotInit = this.dotsEl ? +this.dotsEl.dataset.init : 0;
    var self = this;
    this.dots.forEach(function (b, j) { b.addEventListener('click', function () { self.toDot(j); self.touch(); }); });
    $$('.sl-arrow[data-sl-target="' + this.name + '"]').forEach(function (b) {
      b.addEventListener('click', function () { self.go(+b.dataset.dir); self.touch(); });
    });
  }
  Base.prototype.dotOf = function (i) { var D = this.dots.length; return (this.dotInit + Math.floor(mod(i, this.n) * D / this.n)) % D; };
  Base.prototype.syncDots = function () {
    var d = this.dotOf(this.idx);
    this.dots.forEach(function (b, j) {
      b.classList.toggle('is-on', j === d);
      if (j === d) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  };
  Base.prototype.toDot = function (j) {
    var best = null;
    for (var i = 0; i < this.n; i++) if (this.dotOf(i) === j) {
      var dlt = mod(i - this.idx + this.n / 2, this.n) - this.n / 2;
      if (best === null || Math.abs(dlt) < Math.abs(best)) best = dlt;
    }
    if (best) this.go(Math.round(best));
  };
  Base.prototype.touch = function () { this.elapsed = 0; };
  Base.prototype.paused = function () { return this.hovered || this.focused || !this.visible || document.hidden || this.dragging; };

  /* ------------------------------------------------------------------ ring (continuous carousel, infinite) */
  function Ring(cfg) {
    Base.call(this, cfg);
    var self = this;
    this.el = cfg;
    this.p = +cfg.dataset.pitch;
    this.items = $$(':scope > .sl-item', cfg).map(function (el) { return { el: el, x: +el.dataset.x, slot: +el.dataset.slot }; });
    this.L = Math.min.apply(null, this.items.map(function (i) { return i.slot; }));
    this.RL = this.items.length * this.p;
    this.o = 0; this.anim = null;
    this.layout();
    this.syncDots();
    /* focus inside an overflow:hidden box would scroll it: undo that and bring the card into view */
    cfg.addEventListener('scroll', function () { cfg.scrollLeft = 0; cfg.scrollTop = 0; });
    cfg.addEventListener('focusin', function (e) {
      var it = self.items.filter(function (i) { return i.el.contains(e.target); })[0];
      if (!it) return;
      var P = self.pos(it), w = it.el.offsetWidth, vw = cfg.clientWidth;
      if (P < 0 || P + w > vw) {
        var need = P < 0 ? Math.ceil(-P / self.p) : -Math.ceil((P + w - vw) / self.p);
        self.go(need);
      }
    });
  }
  Ring.prototype = Object.create(Base.prototype);
  Ring.prototype.pos = function (it) { return this.L + mod(it.slot + this.o - this.L, this.RL); };
  Ring.prototype.layout = function () {
    var self = this;
    this.items.forEach(function (it) {
      var d = self.pos(it) - it.x;
      it.el.style.transform = Math.abs(d) < 0.005 ? '' : 'translateX(' + d.toFixed(2) + 'px)';
    });
  };
  Ring.prototype.animateTo = function (target, ms) {
    var self = this, from = this.o, t0 = null;
    if (this.anim) cancelAnimationFrame(this.anim);
    if (reduced || ms === 0) { this.o = target; this.norm(); this.layout(); return; }
    ms = ms || 480;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / ms);
      self.o = from + (target - from) * ease(t);
      self.layout();
      if (t < 1) self.anim = requestAnimationFrame(step); else { self.anim = null; self.o = target; self.norm(); self.layout(); }
    }
    this.anim = requestAnimationFrame(step);
  };
  Ring.prototype.norm = function () { this.o = mod(this.o, this.RL); if (this.RL - this.o < 0.01) this.o = 0; };
  Ring.prototype.target = function () { return this.anim ? this._target : this.o; };
  Ring.prototype.moved = function () { if (!this.isMoved) { this.isMoved = true; this.el.classList.add('is-moved'); } };
  Ring.prototype.go = function (delta) {
    this.moved();
    var base = Math.round(this.target() / this.p) * this.p;
    this._target = base + delta * this.p;
    this.idx = mod(Math.round(this._target / this.p), this.n);
    this.syncDots();
    this.animateTo(this._target);
  };
  Ring.prototype.dragStart = function () { this.moved(); if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; } this.o0 = this.o; };
  Ring.prototype.dragMove = function (dx) { this.o = this.o0 + dx; this.layout(); };
  Ring.prototype.dragEnd = function (dx, v) {
    /* distance decides (rounded to whole cards); a short fast flick or a >40px drag still moves one card */
    var steps = Math.round(dx / this.p);
    if (steps === 0 && (Math.abs(dx) > 40 || Math.abs(v) > 0.5)) steps = (dx || v) > 0 ? 1 : -1;
    this._target = Math.round(this.o0 / this.p) * this.p + steps * this.p;
    this.idx = mod(Math.round(this._target / this.p), this.n);
    this.syncDots();
    this.animateTo(this._target, 380);
  };

  /* ------------------------------------------------------------------ fade (cross-fade slides) */
  function Fade(cfg) {
    Base.call(this, cfg);
    this.slides = $$('.sl-item[data-sl-of="' + this.name + '"]');
    this.el = this.slides[0];
    this.syncDots();
  }
  Fade.prototype = Object.create(Base.prototype);
  Fade.prototype.dotOf = function (i) { return (this.dotInit + mod(i, this.n)) % this.dots.length; };
  Fade.prototype.go = function (delta) {
    stage.classList.add('sl-moved-' + this.name);
    this.idx = mod(this.idx + delta, this.n);
    var i = this.idx;
    this.slides.forEach(function (s) {
      var on = +s.dataset.i === i;
      s.classList.toggle('is-on', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
    });
    this.syncDots();
  };
  Fade.prototype.dragStart = function () {};
  Fade.prototype.dragMove = function () {};
  Fade.prototype.dragEnd = function (dx, v) {
    if (Math.abs(dx) > 40 || Math.abs(v) > 0.4) this.go(dx > 0 ? 1 : -1);
  };

  $$('[data-sl]').forEach(function (cfg) {
    var s = cfg.dataset.sl === 'ring' ? new Ring(cfg) : new Fade(cfg);
    sliders[s.name] = s; list.push(s);
  });

  /* ------------------------------------------------------------------ pointer: drag / swipe (scale aware) */
  var drag = null, suppressClick = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || drag) return;
    if (e.target.closest('input,textarea,select,.sl-arrow,.sl-dots,.tab-btn,.chip')) return;
    var p = toStage(e.clientX, e.clientY);
    var s = list.filter(function (sl) { return inRect(sl.rect, p); })[0];
    if (!s) return;
    drag = { s: s, id: e.pointerId, x: e.clientX, y: e.clientY, k: p.k, on: false, t: e.timeStamp, lx: e.clientX, v: 0 };
    if (e.pointerType === 'mouse') e.preventDefault(); /* no text selection / native image drag */
  });
  window.addEventListener('pointermove', function (e) {
    var p = toStage(e.clientX, e.clientY);
    list.forEach(function (s) { s.hovered = e.pointerType === 'mouse' && inRect(s.hover, p); });
    if (!drag || e.pointerId !== drag.id) return;
    var dx = (e.clientX - drag.x) / drag.k, dy = (e.clientY - drag.y) / drag.k;
    if (!drag.on) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; } /* vertical: let the page scroll */
      drag.on = true; drag.s.dragging = true; drag.s.dragStart();
      document.documentElement.classList.add('is-dragging');
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
    var dt = Math.max(1, e.timeStamp - drag.t);
    drag.v = 0.7 * ((e.clientX - drag.lx) / drag.k / dt) + 0.3 * drag.v;
    drag.t = e.timeStamp; drag.lx = e.clientX;
    drag.s.dragMove(dx);
  });
  function endDrag(e, cancel) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (!d.on) return;
    document.documentElement.classList.remove('is-dragging');
    d.s.dragging = false;
    var dx = (e.clientX - d.x) / d.k;
    if (e.timeStamp - d.t > 120) d.v = 0;
    d.s.dragEnd(cancel ? 0 : dx, cancel ? 0 : d.v);
    d.s.touch();
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 0);
  }
  window.addEventListener('pointerup', function (e) { endDrag(e, false); });
  window.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  stage.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; } }, true);
  stage.addEventListener('dragstart', function (e) { if (e.target.closest('.sl-item,.hit,.card-link')) e.preventDefault(); });
  document.addEventListener('mouseleave', function () { list.forEach(function (s) { s.hovered = false; }); });

  /* ------------------------------------------------------------------ keyboard & focus pause */
  function ownerOf(el) {
    if (!el || !el.closest) return null;
    var c = el.closest('[data-sl-target]');
    if (c) return sliders[c.dataset.slTarget];
    var r = el.closest('[data-sl-name]');
    if (r) return sliders[r.dataset.slName];
    var it = el.closest('.sl-item[data-sl-of]');
    return it ? sliders[it.dataset.slOf] : null;
  }
  document.addEventListener('focusin', function (e) { list.forEach(function (s) { s.focused = false; }); var s = ownerOf(e.target); if (s) s.focused = true; });
  document.addEventListener('focusout', function (e) { var s = ownerOf(e.target); if (s && !ownerOf(e.relatedTarget)) s.focused = false; });
  stage.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var s = ownerOf(document.activeElement);
    if (!s) return;
    e.preventDefault();
    s.go(e.key === 'ArrowLeft' ? 1 : -1); /* RTL: left = next */
    s.touch();
  });

  /* ------------------------------------------------------------------ autoplay */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { list.forEach(function (s) { if (s.el === en.target) s.visible = en.isIntersecting; }); });
    });
    list.forEach(function (s) { if (s.el) io.observe(s.el); });
  }
  var last = performance.now();
  setInterval(function () {
    var now = performance.now(), dt = now - last; last = now;
    list.forEach(function (s) {
      if (!s.delay || s.paused()) return;
      s.elapsed += dt;
      if (s.elapsed >= s.delay) { s.elapsed = 0; s.go(1); }
    });
  }, 200);

  /* ------------------------------------------------------------------ news tabs */
  $$('.tabs').forEach(function (tl) {
    var ul = stage.querySelector('.' + tl.dataset.ul), btns = $$('.tab-btn', tl);
    function select(b, focus) {
      btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
      if (ul) { ul.style.left = b.dataset.ulX + 'px'; ul.style.width = b.dataset.ulW + 'px'; }
      if (focus) b.focus();
    }
    btns.forEach(function (b, i) {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
        if (d) { e.preventDefault(); e.stopPropagation(); select(btns[mod(i + d, btns.length)], true); }
      });
    });
  });

  /* ------------------------------------------------------------------ smart-city chips */
  var chips = $$('.chip');
  chips.forEach(function (c) {
    function pick() { chips.forEach(function (x) { x.classList.toggle('is-active', x === c); x.setAttribute('aria-selected', x === c ? 'true' : 'false'); }); }
    c.addEventListener('click', pick);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });

  window.__sliders = sliders; /* for tests / debugging */
})();

/* news list next to the video: native scrolling (wheel / touch / keyboard) + Figma's custom thumb, draggable */
(function () {
  'use strict';
  var box = document.querySelector('.news-scroll'), thumb = document.querySelector('.nl-thumb');
  if (!box || !thumb) return;
  var travel = +thumb.dataset.travel || 278;
  function frac() { var m = box.scrollHeight - box.clientHeight; return m > 0 ? box.scrollTop / m : 0; }
  function sync() { var y = frac() * travel; thumb.style.transform = y > 0.01 ? 'translateY(' + y.toFixed(2) + 'px)' : ''; }
  box.addEventListener('scroll', sync, { passive: true });
  var drag = null;
  thumb.addEventListener('pointerdown', function (e) {
    var k = document.querySelector('.stage').getBoundingClientRect().width / 1366 || 1;
    drag = { y: e.clientY, f: frac(), k: k }; thumb.classList.add('is-drag'); box.style.scrollBehavior = 'auto';
    thumb.setPointerCapture(e.pointerId); e.preventDefault();
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var f = Math.min(1, Math.max(0, drag.f + (e.clientY - drag.y) / drag.k / travel));
    box.scrollTop = f * (box.scrollHeight - box.clientHeight);
  });
  function end() { drag = null; thumb.classList.remove('is-drag'); box.style.scrollBehavior = ''; }
  thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
  sync();
})();
