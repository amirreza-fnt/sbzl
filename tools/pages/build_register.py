#!/usr/bin/env python3
"""register.html (ثبت نام, mobile 360x761) from the reference export src/register-ref@1x.png.
bg.png = the reference with every live text erased; tabbar.png = its tab bar strip (fixed element);
every text is live (Peyda / PeydaWeb FaNum from ../fonts), fitted to the reference ink boxes.
usage: build_register.py [--fit N]   (N fit rounds: render, measure, update fit-register.json)"""
import os, sys, numpy as np
import pagekit as K
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

# ---- background: erase every live text (2px ring), cut the tab bar strip out as its own image
bg = REF.copy()
for t in T: x0, y0, x1, y1 = t['ref']; K.fill_rect(bg, (x0 - 2, y0 - 2, x1 + 2, y1 + 2))
K.save(bg[TAB_Y:], os.path.join(OUT_A, 'tabbar.png'))
page_bg = bg.copy(); page_bg[TAB_Y:] = np.median(bg[TAB_Y - 6:TAB_Y - 2].reshape(-1, 3), 0)
K.save(page_bg, os.path.join(OUT_A, 'bg.png'))
for t in T:
    if 'color' not in t: t['color'] = K.ink_color(REF, bg, t['ref'])

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
        flds.append(f'<div class="fld" style="top:{y}px"><input id="f-{fid}" name="{fid}" {ATTR[fid]} placeholder=" " aria-describedby="e-{fid}" aria-label="{ph}">'
                    f'{sp("ph-" + fid, extra_style="").replace("<span", "<label for=\"f-" + fid + "\"", 1).replace("</span>", "</label>")}'
                    f'<p class="err" id="e-{fid}" role="alert">{ERR[fid]}</p></div>')
    tabs = ''.join(f'<a class="tab {cls}" href="{href}" style="left:{r[0] - 14}px;width:{r[2] - r[0] + 28}px"{" aria-current=\"page\"" if cls else ""}>'
                   f'{sp(f"tab{i}").replace(f"left:", "left:", 1)}</a>' for i, (_, r, href, cls) in enumerate(TABS))
    # tab labels are positioned relative to .tabbar-in; inside the <a> they need the a's own offset removed
    tabs = ''.join(f'{sp(f"tab{i}")}' for i in range(len(TABS))) + ''.join(
        f'<a class="tab" href="{href}" style="left:{r[0] - 14}px;width:{r[2] - r[0] + 28}px" aria-label="{lab}"{" aria-current=\"page\"" if cls else ""}></a>'
        for lab, r, href, cls in TABS)
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
<div class="bg" aria-hidden="true"></div>
<a class="back" href="service-app.html" aria-label="بازگشت به فهرست خدمات"></a>
<form class="reg" id="reg" action="#" novalidate aria-labelledby="reg-title">
{sp('title', extra_style='').replace('data-t="title"', 'data-t="title" id="reg-title"')}
<p class="sub">{sp('sub1')}{sp('sub2')}</p>
{''.join(flds)}
<div class="terms" id="terms"><input class="chk" type="checkbox" id="f-terms" name="terms" required aria-describedby="e-terms"><span class="chk-box"></span>
<label for="f-terms" class="lbl-wrap">{sp('chk1')}{sp('chk2')}</label>
<p class="err" id="e-terms" role="alert">برای ادامه، شرایط و مقررات را بپذیرید.</p></div>
<button class="go" type="submit">{sp('go')}</button>
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
