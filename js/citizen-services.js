/* citizen-services.html: FAQ accordion (one open question, answer panel on the left); the footer newsletter form keeps the homepage markup's own inline handler */
(function () {
  var qs = [].slice.call(document.querySelectorAll('.cs-q')), ans = document.getElementById('ans');
  var p = ans && ans.querySelector('.cs-ans-p');
  var ANSWERS = [null,
    'برای پیگیری درخواست‌ها، کد رهگیری را در بخش «پیگیری نامه‌های اداری» وارد کنید. وضعیت هر مرحله همراه با تاریخ و واحد مسئول نمایش داده می‌شود و در صورت نیاز به مدارک تکمیلی، پیامک اطلاع‌رسانی ارسال خواهد شد.',
    'پرداخت عوارض از طریق درگاه‌های بانکی عضو شتاب و به‌صورت آنلاین انجام می‌شود. پس از پرداخت، رسید الکترونیکی صادر می‌شود و نیازی به مراجعهٔ حضوری نیست.',
    'برای ثبت شکایت یا پیشنهاد می‌توانید با سامانهٔ ۱۳۷ تماس بگیرید یا از بخش «سامانه ۱۳۷» درخواست خود را به‌صورت آنلاین ثبت کنید. پاسخ در کوتاه‌ترین زمان به شماره موبایل شما اعلام می‌شود.',
    'اطلاعات شفافیت شامل بودجه، قراردادها و مصوبات شورای شهر در «سامانه شفافیت» منتشر می‌شود و همهٔ شهروندان بدون نیاز به ثبت نام به آن دسترسی دارند.'];
  var original = p ? p.innerHTML : '';
  function open(i) {
    qs.forEach(function (b, k) { var on = k === i; b.classList.toggle('is-on', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    if (!p) return;
    ans.setAttribute('aria-labelledby', 'q' + i);
    if (i === 0) { p.className = 'cs-ans-p'; p.innerHTML = original; }
    else { p.className = 'cs-ans-p flow'; p.textContent = ANSWERS[i]; }
  }
  qs.forEach(function (b, i) {
    b.addEventListener('click', function () { open(i); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (d) { e.preventDefault(); var n = qs[(i + d + qs.length) % qs.length]; n.focus(); }
    });
  });
})();
