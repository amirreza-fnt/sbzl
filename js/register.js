/* ثبت نام — client-side only (no backend, works from file://): scaling like the service app,
   national-code checksum, Iranian mobile 09xxxxxxxxx, optional email, required terms, error/success states. */
(function () {
  'use strict';
  var root = document.documentElement;
  function fit() { var w = Math.min(root.clientWidth || window.innerWidth, 480); root.style.setProperty('--k', (w / 360).toFixed(5)); }
  fit(); window.addEventListener('resize', fit);

  var FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  function toEn(s) { return String(s).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); }); }
  function nationalCodeOk(v) {
    if (!/^\d{10}$/.test(v) || /^(\d)\1{9}$/.test(v)) return false;
    for (var s = 0, i = 0; i < 9; i++) s += +v[i] * (10 - i);
    var r = s % 11, c = +v[9];
    return r < 2 ? c === r : c === 11 - r;
  }
  function mobileNorm(v) { v = toEn(v).replace(/[\s-]/g, ''); return v.replace(/^(\+98|0098|98)(?=9\d{9}$)/, '0'); }
  var RULES = {
    name: function (v) { v = v.trim().replace(/\s+/g, ' '); return v.length >= 3 && /^[\u0600-\u06FF\u200c a-zA-Z.'-]+$/.test(v); },
    nid: function (v) { return nationalCodeOk(toEn(v).replace(/\D/g, '')); },
    mobile: function (v) { return /^09\d{9}$/.test(mobileNorm(v)); },
    email: function (v) { v = v.trim(); return !v || /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v); }
  };
  var MSG = {
    name: ['نام و نام خانوادگی را وارد کنید.', 'نام و نام خانوادگی را کامل و با حروف وارد کنید.'],
    nid: ['کد ملی را وارد کنید.', 'کد ملی معتبر نیست (۱۰ رقم با رقم کنترل درست).'],
    mobile: ['شماره موبایل را وارد کنید.', 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.'],
    email: ['', 'قالب ایمیل درست نیست (مثال: name@example.com).']
  };
  var form = document.getElementById('reg'), touched = {};
  function field(id) { return document.getElementById('f-' + id); }
  function check(id, show) {
    var el = field(id), box = el.parentNode, v = el.value, ok = RULES[id](v);
    if (show) {
      box.classList.toggle('is-err', !ok); box.classList.toggle('is-ok', ok && !!v.trim());
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      document.getElementById('e-' + id).textContent = MSG[id][v.trim() ? 1 : 0] || MSG[id][1];
    }
    return ok;
  }
  // digits: accept Persian/Arabic digits, keep only digits in code/mobile
  ['nid', 'mobile'].forEach(function (id) {
    field(id).addEventListener('input', function () {
      var el = this, pos = el.selectionStart, v = toEn(el.value);
      var clean = id === 'mobile' ? v.replace(/[^\d+]/g, '') : v.replace(/\D/g, '');
      if (clean !== el.value) { el.value = clean; try { el.setSelectionRange(pos, pos); } catch (e) {} }
    });
  });
  Object.keys(RULES).forEach(function (id) {
    var el = field(id);
    el.addEventListener('blur', function () { if (el.value.trim() || touched[id]) { touched[id] = true; check(id, true); } });
    el.addEventListener('input', function () { if (touched[id]) check(id, true); });
  });
  var terms = document.getElementById('f-terms'), tbox = document.getElementById('terms');
  terms.addEventListener('change', function () { if (terms.checked) tbox.classList.remove('is-err'); });

  function openDlg(d) { d.classList.add('is-on'); var f = d.querySelector('button,a'); if (f) f.focus(); }
  function closeDlg(d) { d.classList.remove('is-on'); }
  var dTerms = document.getElementById('dlg-terms'), dOk = document.getElementById('dlg-ok');
  document.getElementById('terms-link').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openDlg(dTerms); });
  [dTerms, dOk].forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || e.target.hasAttribute('data-close')) { closeDlg(d); if (d === dTerms) document.getElementById('terms-link').focus(); } });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') [dTerms, dOk].forEach(closeDlg); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    Object.keys(RULES).forEach(function (id) { touched[id] = true; if (!check(id, true) && !first) first = field(id); });
    var tOk = terms.checked; tbox.classList.toggle('is-err', !tOk);
    if (!tOk && !first) first = terms;
    if (first) { first.focus(); return; }
    field('mobile').value = mobileNorm(field('mobile').value);
    var name = field('name').value.trim().replace(/\s+/g, ' ');
    document.getElementById('do-p').textContent = name + ' عزیز، ثبت نام شما با شماره ' + field('mobile').value + ' انجام شد.';
    openDlg(dOk);
    form.reset(); touched = {};
    form.querySelectorAll('.fld').forEach(function (f) { f.classList.remove('is-err', 'is-ok'); });
  });
  window.__reg = { nationalCodeOk: nationalCodeOk, mobileNorm: mobileNorm };
})();
