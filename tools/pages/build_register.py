#!/usr/bin/env python3
"""register.html (ثبت نام, mobile 360x761) — live header, inputs, tab bar; texts ink-fitted.
Decorative crops from ref/figma/register_2x.png @2x shown @1x. usage: build_register.py [--fit N]"""
import os, sys, numpy as np
import pagekit as K
from live_common import save_crop, FIGMA
W, H = 360, 761
REF = K.load(os.path.join(K.HERE, 'src/register-ref@1x.png'))
OUT_A = os.path.join(K.SITE, 'assets/register'); os.makedirs(OUT_A, exist_ok=True)
TAB_Y = 686
FLD = [('name', 205, 'نام و نام خانوادگی', (248, 216, 314, 235)), ('nid', 256, 'کد ملی', (277, 266, 312, 285)),
       ('mobile', 305, 'شماره موبایل', (267, 316, 316, 335)), ('email', 354, 'ایمیل (اختیاری)', (262, 363, 316, 382))]
T = []
def text(tid, html, rect, **k):
    box = K.ink_box(REF, rect); assert box, tid
    T.append(dict(id=tid, html=html, ref=tuple(int(v) for v in box), **k)); return T[-1]
text('title', 'ثبت نام', (284, 118, 338, 143), fs=16, fw=800, tag='h1', cls='h')
text('sub1', 'برای استفاده از خدمات اپلیکیشن شهرداری سبزوار،', (172, 144, 336, 157), fs=10)
text('sub2', 'لطفاً اطلاعات خود را وارد کنید.', (236, 156, 338, 171), fs=10)
for fid, y, ph, r in FLD: text('ph-' + fid, ph, r, fs=10, cls='ph', parent=(23, y, 316))
text('chk1', 'با مطالعه و پذیرش <a href="#terms" id="terms-link">شرایط و مقررات</a> استفاده از خدمات شهرداری', (88, 577, 314, 596), fs=10, cls='lbl', parent=(22, 576, 316), nocolor=True, color_from='chk2')
text('chk2', 'سبزوار موافقت می‌کنم.', (234, 595, 330, 611), fs=10, cls='lbl', parent=(22, 576, 316))
text('go', 'ادامه', (173, 641, 208, 661), fs=13, fw=700, color='#ffffff', align='c', parent=(22, 630, 316))
TABS = [('صفحه نخست', (286, 735, 342, 752), 'service-app.html', 'is-on'), ('سوالات متداول', (194, 735, 255, 752), 'service-app.html#faq', ''),
        ('پیام‌ها و اعلانات', (106, 735, 168, 752), 'service-app.html#messages', ''), ('پنل کاربری', (27, 735, 70, 752), 'service-app.html#login', '')]
for i, (lab, r, _, _) in enumerate(TABS): text(f'tab{i}', lab, r, fs=10, align='c', parent=(0, TAB_Y, W))

def extract_assets(page_bg):
    ref2 = os.path.join(FIGMA, 'register_2x.png')
    if os.path.isfile(ref2):
        save_crop(ref2, (128, 36, 226, 92), os.path.join(OUT_A, 'emblem@2x.png'))
        save_crop(ref2, (82, 86, 278, 116), os.path.join(OUT_A, 'wordmark@2x.png'))
    K.save(page_bg[:TAB_Y], os.path.join(OUT_A, 'backdrop@2x.png'))
    tb = page_bg[TAB_Y:].copy()
    for t in T:
        if t['id'].startswith('tab'):
            x0, y0, x1, y1 = t['ref']
            K.fill_rect(tb, (x0 - 2, y0 - TAB_Y - 2, x1 + 2, y1 - TAB_Y + 2))
    K.save(tb, os.path.join(OUT_A, 'tabbar.png'))

# backdrop: reference with live text + field boxes + emblem/wordmark erased
bg = REF.copy()
for t in T: x0, y0, x1, y1 = t['ref']; K.fill_rect(bg, (x0 - 2, y0 - 2, x1 + 2, y1 + 2))
for _fid, y, _ph, _r in FLD:
    K.fill_rect(bg, (23, y, 339, y + 38))
page_bg = bg.copy()
page_bg[TAB_Y:] = np.median(bg[TAB_Y - 6:TAB_Y - 2].reshape(-1, 3), 0)
extract_assets(page_bg)
for t in T:
    if 'color' not in t: t['color'] = K.ink_color(REF, bg, t['ref'])

BACK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
GO_ARR = '<svg class="go-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
FLD_IC = {
    'name': '<svg class="fld-ic" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 10.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Zm-5.2 7.3c0-2.9 2.3-5.3 5.2-5.3s5.2 2.4 5.2 5.3v.4H4.8v-.4Z"/></svg>',
    'nid': '<svg class="fld-ic" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M3 4.5h14v11H3v-11Zm1.5 1.5v8h11v-8h-11Zm1.2 1.2h3.3v1.5H5.7V7.2Zm0 2.5h5.8v1.5H5.7V9.7Zm0 2.5h4.5v1.5H5.7v-1.5Z"/></svg>',
    'mobile': '<svg class="fld-ic" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M6.5 2h7a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 13.5 18h-7A1.5 1.5 0 0 1 5 16.5v-13A1.5 1.5 0 0 1 6.5 2Zm0 1.3a.2.2 0 0 0-.2.2v13c0 .1.1.2.2.2h7c.1 0 .2-.1.2-.2v-13a.2.2 0 0 0-.2-.2h-7Zm3.5 11.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"/></svg>',
    'email': '<svg class="fld-ic" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Zm1.2.8 5.3 4.2 5.3-4.2H3.7Zm11.1 1.4-5.1 4-5.1-4v6.8c0 .1.1.2.2.2h12c.1 0 .2-.1.2-.2V7.7Z"/></svg>',
}
TAB_MASK = {
    'home': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 23'%3E%3Cpath fill='%23000' d='M3 9.5 12.5 2l9.5 7.5V21a1 1 0 0 1-1 1h-5.5v-6H10v6H4a1 1 0 0 1-1-1V9.5Z'/%3E%3C/svg%3E\")",
    'faq': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 11.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM9.8 9.3A3.2 3.2 0 0 1 12 8.2c1.4 0 2.4.8 2.4 1.9 0 .9-.5 1.4-1.5 1.9l-.3.1c-.6.3-.8.6-.8 1.1V14h-1.8v-.2c0-1 .5-1.5 1.3-1.9l.4-.2c.6-.3.8-.5.8-1 0-.5-.4-.9-1.2-.9-.8 0-1.3.4-1.4 1.1H9.8Z'/%3E%3C/svg%3E\")",
    'bell': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 22a2.2 2.2 0 0 0 2.1-1.5H9.9A2.2 2.2 0 0 0 12 22Zm7-4.5V11a5 5 0 0 0-4-4.9V5.5a2 2 0 1 0-4 0v.6A5 5 0 0 0 7 11v6.5l-1.2 1.2V20h14.4v-1.3L19 17.5Z'/%3E%3C/svg%3E\")",
    'user': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z'/%3E%3C/svg%3E\")",
}
TAB_POS = [('home', 272, 84), ('faq', 180, 89), ('bell', 92, 90), ('user', 13, 71)]

def build(fit):
    S = lambda tid: next(t for t in T if t['id'] == tid)
    def ff(tid):
        t = S(tid); f = fit.get(tid, t['fs'])
        if t.get('color_from') and fit.get(t['color_from'], 0).get('c'): f = dict(f, c=fit.get(t['color_from'], 0)['c'])
        return f
    sp = lambda tid, **kw: K.span(S(tid), ff(tid), W, parent=S(tid).get('parent'), **kw)
    flds = []
    ERR = {'name': 'نام و نام خانوادگی را کامل وارد کنید.', 'nid': 'کد ملی معتبر نیست.', 'mobile': 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.', 'email': 'قالب ایمیل درست نیست.'}
    ATTR = {'name': 'type="text" autocomplete="name" required minlength="3" maxlength="60"',
            'nid': 'type="text" inputmode="numeric" autocomplete="off" required maxlength="10" dir="ltr" class="ltr"',
            'mobile': 'type="tel" inputmode="numeric" autocomplete="tel" required maxlength="11" dir="ltr" class="ltr"',
            'email': 'type="email" inputmode="email" autocomplete="email" maxlength="80" dir="ltr" class="ltr"'}
    for fid, y, ph, _ in FLD:
        flds.append(f'<div class="fld" style="top:{y}px">{FLD_IC[fid]}<input id="f-{fid}" name="{fid}" {ATTR[fid]} placeholder=" " aria-describedby="e-{fid}" aria-label="{ph}">'
                    f'{sp("ph-" + fid, extra_style="").replace("<span", "<label for=\"f-" + fid + "\"", 1).replace("</span>", "</label>")}'
                    f'<p class="err" id="e-{fid}" role="alert">{ERR[fid]}</p></div>')
    tab_labels = ''.join(sp(f'tab{i}') for i in range(len(TABS)))
    tab_links = []
    for i, (lab, _r, href, cls) in enumerate(TABS):
        key, left, width = TAB_POS[i]
        m = TAB_MASK[key]
        tab_links.append(
            f'<a class="tab {cls}" href="{href}" style="left:{left}px;width:{width}px" aria-label="{lab}"'
            f'{" aria-current=\"page\"" if cls else ""}><i class="tab-ic" style="-webkit-mask-image:{m};mask-image:{m}"></i></a>')
    tabs = tab_labels + ''.join(tab_links)
    return f'''<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#04a669">
<title>ثبت نام | شهرداری سبزوار</title>
<link rel="stylesheet" href="css/register.css">
</head>
<body>
<div class="app" id="top">
<div class="reg-backdrop" aria-hidden="true"></div>
<a class="back" href="service-app.html" aria-label="بازگشت به فهرست خدمات">{BACK_SVG}</a>
<form class="reg" id="reg" action="#" novalidate aria-labelledby="reg-title">
{sp('title', extra_style='').replace('data-t="title"', 'data-t="title" id="reg-title"')}
<p class="sub">{sp('sub1')}{sp('sub2')}</p>
{''.join(flds)}
<div class="terms" id="terms"><input class="chk" type="checkbox" id="f-terms" name="terms" required aria-describedby="e-terms"><span class="chk-box"></span>
<label for="f-terms" class="lbl-wrap">{sp('chk1')}{sp('chk2')}</label>
<p class="err" id="e-terms" role="alert">برای ادامه، شرایط و مقررات را بپذیرید.</p></div>
<button class="go" type="submit">{GO_ARR}{sp('go')}</button>
</form>
<div class="dlg" id="dlg-terms" role="dialog" aria-modal="true" aria-labelledby="dt-h"><div class="dlg-card">
<h2 id="dt-h">شرایط و مقررات</h2>
<ol><li>اطلاعات واردشده فقط برای ارائهٔ خدمات شهرداری سبزوار استفاده می‌شود.</li>
<li>مسئولیت درستی کد ملی و شماره موبایل با کاربر است.</li>
<li>پیام‌های اطلاع‌رسانی خدمات به شماره موبایل ثبت‌شده ارسال می‌شود.</li></ol>
<button class="dlg-btn" type="button" data-close>متوجه شدم</button></div></div>
<div class="dlg" id="dlg-ok" role="dialog" aria-modal="true" aria-labelledby="do-h"><div class="dlg-card center">
<div class="ok-ic" aria-hidden="true"></div><h2 id="do-h">ثبت نام انجام شد</h2>
<p id="do-p">اطلاعات شما با موفقیت ثبت شد.</p>
<a class="dlg-btn" href="service-app.html">ورود به فهرست خدمات</a></div></div>
</div>
<nav class="tabbar" aria-label="نوار پایین"><div class="tabbar-in">{tabs}</div></nav>
<script src="js/register.js"></script>
</body>
</html>
'''

def write(fit):
    open(os.path.join(K.SITE, 'register.html'), 'w').write(build(fit))
    css = open(os.path.join(K.HERE, 'fonts.css')).read() + open(os.path.join(K.HERE, 'register.base.css')).read()
    open(os.path.join(K.SITE, 'css/register.css'), 'w').write(css)

fit = K.Fit('register')
rounds = int(sys.argv[sys.argv.index('--fit') + 1]) if '--fit' in sys.argv else 0
write(fit)
for r in range(rounds):
    out = '/tmp/register-fit.png'
    K.shoot(os.path.join(K.SITE, 'register.html'), out, W, H, False, True)
    worst = 0 if '--color-only' in sys.argv else K.refit(T, fit, REF, bg, K.load(out), rounds - r)
    cw = K.refit_color(T, fit, REF, bg, K.load(out)) if ('--color' in sys.argv or '--color-only' in sys.argv) else 0
    fit.save(); write(fit); print(f'fit round {r + 1}: worst edge error before update {worst:.1f}px, colour step {cw:.0f}')
def render(fz):
    write(fz); K.shoot(os.path.join(K.SITE, "register.html"), "/tmp/register-pick.png", W, H, False, True); return K.load("/tmp/register-pick.png")
if '--weights' in sys.argv:
    res = K.pick_weights(T, fit, REF, bg, render); fit.save(); write(fit)
    for k, v in res.items(): print('weight', k, v)
if '--nudge' in sys.argv:
    for r in range(2):
        mv = K.nudge(T, fit, REF, render(fit)); fit.save(); write(fit); print('nudge', r + 1, mv)
if '--sub' in sys.argv:
    res = K.pick_offsets([t for t in T if not t.get('nofit')], fit, REF, render); fit.save(); write(fit)
    for k, v in res.items(): print('sub', k, v)
if '--polish' in sys.argv:   # size, scale, offsets and colour, each kept per text only where the local diff drops
    TT = [t for t in T if not t.get('nofit')]
    steps = [('fs', ((0, 0), (.5, 0), (-.5, 0), (1, 0), (-1, 0)), ('fs', 'dy')), ('sx', ((0, 0), (.02, 0), (-.02, 0), (.05, 0), (-.05, 0)), ('sx', 'dy'))]
    for nm, deltas, keys in steps:
        res = K.pick_offsets(TT, fit, REF, render, deltas=deltas, keys=keys); fit.save(); write(fit); print(nm, len(res), 'changed')
        mv = K.nudge(TT, fit, REF, render(fit)); fit.save(); write(fit); print('nudge', len(mv))
    res = K.pick_offsets(TT, fit, REF, render); fit.save(); write(fit); print('sub', len(res))
if '--family' in sys.argv:
    res = K.pick_weights(T, fit, REF, bg, render, weights=("Peyda", "'PeydaWeb FaNum'"), key='ff'); fit.save(); write(fit)
    for k, v in res.items(): print('family', k, v)
if '--shadow' in sys.argv:
    SH = ('0 1px 2px rgba(0,0,0,.18)', '0 1px 3px rgba(0,0,0,.3)', '0 2px 4px rgba(0,0,0,.3)', '0 2px 6px rgba(0,0,0,.35)', '0 0 3px rgba(0,0,0,.25)', '0 3px 8px rgba(0,0,0,.4)')
    res = K.pick_weights(T, fit, REF, bg, render, weights=SH, key='sh', rounds=0); fit.save(); write(fit)
    for k, v in res.items():
        if v[0] != 'keep': print('shadow', k, v)
if '--pick' in sys.argv:
    def render(fz):
        write(fz); K.shoot(os.path.join(K.SITE, 'register.html'), '/tmp/register-pick.png', W, H, False, True); return K.load('/tmp/register-pick.png')
    res = K.pick_colors(T, fit, REF, render); fit.save(); write(fit)
    for k, v in res.items(): print('pick', k, v)
print('register built:', len(T), 'live texts')
