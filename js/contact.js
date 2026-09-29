/* ارتباط با مدیران — client-side only (no backend): native required/pattern validation,
   anonymous toggle, "پیام شهردار" shortcut, success message. */
(function () {
  var f = document.getElementById('mc-form');
  if (!f) return;
  var ok = f.querySelector('.mc-ok'), name = f.querySelector('#mc-name'), anon = f.querySelector('#mc-anon');
  var timer;
  function say(msg, err) {
    ok.textContent = msg; ok.classList.toggle('is-err', !!err); ok.classList.add('is-on');
    clearTimeout(timer); timer = setTimeout(function () { ok.classList.remove('is-on'); }, 5000);
  }
  anon.addEventListener('change', function () {
    name.disabled = anon.checked; name.required = !anon.checked;
    if (anon.checked) name.value = '';
  });
  // native validation blocks the submit event -> mirror it in our own status line
  function msgFor(el) {
    var v = el.validity;
    if (v.valueMissing) return el.tagName === 'SELECT' ? 'لطفاً یک گزینه انتخاب کنید.' : 'لطفاً این فیلد را پر کنید.';
    if (v.patternMismatch) return 'شماره همراه را به صورت ۱۱ رقمی وارد کنید (مثال: 09123456789).';
    if (v.tooShort) return 'متن واردشده کوتاه است (حداقل ' + el.minLength + ' نویسه).';
    return '';
  }
  f.addEventListener('invalid', function (e) {
    var el = e.target; el.setCustomValidity(''); el.setCustomValidity(msgFor(el));
    f.classList.add('was-validated');
    say('لطفاً فیلدهای مشخص‌شده را کامل کنید.', true);
  }, true);
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    f.classList.add('was-validated');
    if (!f.checkValidity()) {
      var bad = f.querySelector(':invalid:not(fieldset)');
      if (bad) { bad.focus(); if (bad.reportValidity) bad.reportValidity(); }
      say('لطفاً فیلدهای مشخص‌شده را کامل کنید.', true);
      return;
    }
    say('پیام شما با موفقیت ثبت شد؛ از همراهی شما سپاسگزاریم.');
    f.reset(); f.classList.remove('was-validated');
    name.disabled = false; name.required = true;
  });
  // accept Persian/Arabic digits in the phone field (normalised to ASCII for the pattern check)
  var phone = f.querySelector('#mc-phone');
  phone.addEventListener('input', function () {
    var v = phone.value.replace(/[\u06F0-\u06F9]/g, function (c) { return c.charCodeAt(0) - 0x06F0; })
                       .replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
                       .replace(/[^0-9+]/g, '');
    if (v !== phone.value) phone.value = v;
  });
  f.addEventListener('input', function (e) { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
  f.addEventListener('change', function (e) { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
  f.addEventListener('input', function () { if (ok.classList.contains('is-err')) ok.classList.remove('is-on'); });
  var btn = document.querySelector('.mc-msgbtn');
  if (btn) btn.addEventListener('click', function (e) {
    e.preventDefault();
    var d = f.querySelector('#mc-dept'), want = btn.getAttribute('data-dept');
    for (var i = 0; i < d.options.length; i++) if (d.options[i].text === want) d.selectedIndex = i;
    var ta = f.querySelector('#mc-msg');
    ta.focus({ preventScroll: true });
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();

/* public messages (403:108/403:109): static side by side when both fit the slot, otherwise a tight
   seamless RTL marquee (CSS .is-marquee, pauses on hover/focus). Re-checked after fonts load / resize. */
(function () {
  var t = document.querySelector('.mc-tick');
  if (!t) return;
  var g = t.querySelector('.mc-tg');
  function fitTick() {
    t.classList.remove('is-marquee');
    var cs = getComputedStyle(t);
    var avail = t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // the stage is CSS-scaled to the window width -> bounding boxes are in screen px; divide by the scale
    var k = t.getBoundingClientRect().width / t.offsetWidth || 1;
    if (g.getBoundingClientRect().width / k > avail + 0.5) t.classList.add('is-marquee');
  }
  fitTick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTick);
  window.addEventListener('resize', fitTick);
})();
