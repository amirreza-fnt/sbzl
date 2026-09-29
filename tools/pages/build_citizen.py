#!/usr/bin/env python3
"""citizen-services.html (خدمات شهروندی, desktop 1366x2708) — live hero, cards, FAQ, promo (CSS/SVG).
usage: build_citizen.py [--fit N]"""
import os, sys, re, json, numpy as np
import pagekit as K
from live_common import save_crop, save_cutout_1x, card_mask_data_uri, FIGMA
from citizen_svgs import CARD_ICONS
W, H = 1366, 2708
MID0, MID1, FOOT_OFF = 164, 2197, 4306 - 2708
REF = K.load(os.path.join(K.HERE, 'src/citizen-ref@1x.png'))
OUT_A = os.path.join(K.SITE, 'assets/citizen'); os.makedirs(OUT_A, exist_ok=True)
T = []
def text(tid, html, rect, **k):
    box = K.ink_box(REF, rect, thr=k.pop('thr', 40)); assert box, tid
    T.append(dict(id=tid, html=html, ref=tuple(int(v) for v in box), **k)); return T[-1]
NAVY = '#233157'
# ---- hero + section titles
text('h-title', 'خدمات شهروندی', (608, 264, 757, 294), fs=18, fw=700, tag='h1', color='#ffffff')
text('h-sub', 'لورم ایپسوم یا طرح‌نما به متنی آزمایشی و بی‌معنی در صنعت چاپ، صفحه‌آرایی و طراحی گرافیک گفته می‌شود. طراح گرافیک از این متن به عنوان است.', (330, 299, 1036, 327), fs=13, align='c')
text('s-smart', 'فهرست خدمات هوشمند', (1018, 487, 1224, 520), fs=18, fw=700, tag='h2')
text('s-city', 'فهرست خدمات شهروندی', (1012, 860, 1224, 893), fs=18, fw=700, tag='h2')
# ---- cards: (x, y) of the card box incl. shadow ring, title, subtitle, link
SUB = ['اتوبوسرانی شهری هوشمند', 'عوارض پارک حاشیه خیابان', 'پرداخت غیرحضوری و سریع']
CARDS = [(1078, 560, 'راهـیــار', SUB[0], 'service-app.html', 'smart'), (884, 560, 'پـارکیــار', SUB[1], 'service-app.html', 'smart'),
         (690, 560, 'عـوارض خـودرو', SUB[2], 'service-app.html', 'smart')]
for i, t in enumerate(['سامانه ۱۳۷', 'سامانه شفافیت', 'پیگیری نامه‌های اداری', 'ساختمان و شهرسازی', 'عوارض کسب‌وکار', 'عوارض نوسازی']):
    CARDS.append((1078 - 194 * i, 933, t, SUB[i % 3], 'service-app.html', 'city'))
CARDS.append((1078, 1191, 'ترافیک آنلاین', SUB[0], 'service-app.html', 'city'))
CW, CH = 179, 219
for i, (x, y, tt, st, _, kind) in enumerate(CARDS):
    cx = x + CW / 2; P = (x - 2, y - 2, CW + 4)
    text(f'c{i}-t', tt, (int(cx - 70), y + 90, int(cx + 70), y + 122), fs=16 if kind == 'smart' else 15, fw=700 if kind == 'smart' else 500, align='c', parent=P)
    text(f'c{i}-s', st, (int(cx - 80), y + 125, int(cx + 80), y + 146), fs=12, align='c', parent=P)
# ---- FAQ
text('faq-h', 'سوالات متداول', (1150, 1512, 1280, 1542), fs=18, fw=700, tag='h2')
text('faq-all', 'مشاهده سوالات متداول', (58, 1516, 182, 1537), fs=12, parent=(46, 1512, 142))
Q = 'صورت سوال در اینجا درج می‌شود، لورم ایپسوم یا طرح‌نما به متنی آزمایشی کنید؟'
ROWS = [1556, 1620, 1684, 1748, 1812]; RX0, RX1 = 681, 1314
for k, y in enumerate(ROWS):
    text(f'q{k}', Q, (800, y + 18, 1262, y + 43) if k == 0 else (820, y + 18, 1262, y + 46), fs=14, fw=600 if k == 0 else 400, parent=(RX0, y, RX1 - RX0))
ANS = ['پاسخ سوال در اینجا درج می‌شود، لورم ایپسوم یا طرح‌نما به متنی آزمایشی و بی‌معنی در صنعت چاپ، صفحه‌آرایی',
       'و طراحی گرافیک گفته می‌شود. طراح گرافیک از این متن به عنوان عنصری از ترکیب بندی برای پر کردن',
       'صفحه و ارایه اولیه شکل ظاهری و کلی طرح سفارش گرفته شده استفاده می نماید. لورم ایپسوم یا طرح‌نما به',
       'متنی آزمایشی و بی‌معنی در صنعت چاپ، صفحه‌آرایی و طراحی گرافیک گفته می‌شود. طراح گرافیک از این متن',
       'به عنوان عنصری از ترکیب بندی برای پر کردن صفحه و ارایه اولیه شکل ظاهری و کلی طرح سفارش گرفته شده',
       'استفاده می نماید.']
for j, line in enumerate(ANS):
    y = 1590 + 28 * j
    text(f'a{j}', line, (70, y - 2, 652, y + 20), fs=14, just=j < 5, parent=(49, 1556, 632))
text('help', 'اگر هنوزم مشکلتون حل نشده با صدای شهروند ۱۳۷ تلفظ تماس بگیرید.', (250, 1819, 620, 1844), fs=13, ff="'PeydaWeb FaNum'", color='#ffffff', parent=None)
text('help-btn', 'تماس با پشتیبانی', (84, 1820, 188, 1845), fs=13, parent=(78, 1812, 118))
# ---- promo
text('p-off', '۲۰ درصد تخفیف نقدی', (812, 2006, 1052, 2046), fs=24, fw=800, ff="'PeydaWeb FaNum'", color='#ffffff', thr=60)
text('p-off2', 'در صورت پرداخت تا آخر خرداد', (815, 2050, 1050, 2082), fs=16, color='#ffffff', thr=60)
text('p-title', 'پرداخت عوارض شهرداری سبزوار', (304, 2008, 586, 2041), fs=22, fw=700, color='#ffffff', thr=60)
text('p-sub', 'به روش هوشمند', (362, 2051, 526, 2081), fs=18, color='#ffffff', thr=60)
text('p-btn', 'پرداخت آنلاین', (1128, 2071, 1241, 2100), fs=14, fw=600, color='#ffffff', thr=60, parent=(1119, 2065, 175))

# ---- background: erase texts (+ the design's mouse-cursor sketch in FAQ row 1)
bg = REF.copy()
for t in T: x0, y0, x1, y1 = t['ref']; K.fill_rect(bg, (x0 - 2, y0 - 2, x1 + 2, y1 + 2))
# the design's mouse-cursor sketch over FAQ rows 1/2 (+ its soft shadow): rows are horizontally uniform there,
# so rebuild the block from the text-free column just right of it
bg[1590:1645, 1236:1269] = bg[1590:1645, 1234:1235]
for t in T:
    if 'color' not in t: t['color'] = K.ink_color(REF, bg, t['ref'])
# erase card areas + FAQ rows for decorative extractions
for i, (x, y, *_r) in enumerate(CARDS):
    bg[y - 2:y + CH + 2, x - 2:x + CW + 2] = 255
for y in ROWS:
    bg[y:y + 84, RX0:RX1] = 255
bg[49:1876, 49:681] = 255
bg[1900:2140, :] = 255
BG = bg

def extract_assets():
    ref2 = os.path.join(FIGMA, 'services_2x.png')
    if not os.path.isfile(ref2):
        return
    save_crop(ref2, (420, 220, 940, 380), os.path.join(OUT_A, 'hero-pattern@2x.png'))
    save_crop(ref2, (0, 1900, 420, 2140), os.path.join(OUT_A, 'promo-car@2x.png'))
    save_cutout_1x(os.path.join(K.HERE, 'src/citizen-ref@1x.png'), (900, 1900, 1366, 2140),
                   os.path.join(OUT_A, 'promo-coins@2x.png'), tol=26)

extract_assets()

HERO_IC = '''<svg class="cs-hero-ic" viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="4" width="14" height="14" rx="2" fill="currentColor"/><rect x="22" y="4" width="14" height="14" rx="2" fill="currentColor"/><rect x="4" y="22" width="14" height="14" rx="2" fill="currentColor"/><rect x="22" y="22" width="14" height="14" rx="2" fill="currentColor"/></svg>'''
HERO_NOTCH = '<div class="cs-hero-notch" aria-hidden="true"><svg viewBox="0 0 54 14" preserveAspectRatio="none"><path fill="currentColor" d="M0 0h54L42 14H12L0 0z"/></svg></div>'
SEC_ORN = '''<svg class="cs-orn" viewBox="0 0 28 28" aria-hidden="true"><circle cx="8" cy="14" r="3" fill="currentColor"/><circle cx="14" cy="14" r="3" fill="currentColor"/><circle cx="20" cy="14" r="3" fill="currentColor"/></svg>'''
Q_ARR = '<span class="cs-q-arr" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></span>'
PROMO_IC = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;right:14px;top:50%;margin-top:-9px"><path fill="#fff" d="M7 2h10a2 2 0 0 1 2 2v16l-4-2.5L11 20l-4-2.5V4a2 2 0 0 1 2-2Z"/></svg>'
CARD_GO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'

SHELL = json.load(open(os.path.join(K.HERE, 'shell-home.json')))
def relink(h):
    def fix(m):
        a = m.group(0); lab = re.search(r'aria-label="([^"]*)"', a); lab = lab.group(1) if lab else ''
        if lab == 'خدمات شهروندی': return re.sub(r'href="[^"]*"', 'href="citizen-services.html" aria-current="page"', a)
        if lab in ('صفحه نخست', 'شهرداری سبزوار - صفحه نخست'): return a.replace('href="#top"', 'href="index.html"')
        return re.sub(r'href="#(services|news)"', r'href="index.html#\1"', a)
    return re.sub(r'<a [^>]*>', fix, h)
HEAD = '\n'.join(relink(e['html']) for e in SHELL['header'])
FOOT = '\n'.join(relink(e['html']) for e in SHELL['footer'])

def build(fit):
    S = {t['id']: t for t in T}
    def sp(tid, **kw):
        t = S[tid]; f = fit.get(tid, t['fs']); extra = kw.pop('extra_style', '')
        if t.get('just'):   # justified answer lines: box width from the reference ink, no horizontal scale
            x0, y0, x1, y1 = t['ref']
            return K.span(dict(t, align='l'), dict(f, sx=1.0), W, parent=t['parent'], extra_style=f'width:{x1 - x0}px;text-align:justify;text-align-last:justify;' + extra)
        return K.span(t, f, W, parent=t.get('parent'), extra_style=extra, **kw)
    sec_hd = lambda cls: f'<div class="cs-sec-hd {cls}" aria-hidden="true">{SEC_ORN}<span class="cs-line-r"></span><span class="cs-line-l"></span></div>'
    cards = []
    for i, (x, y, tt, st, href, kind) in enumerate(CARDS):
        cards.append(
            f'<a class="cs-card cs-card-{kind}" href="{href}" style="left:{x - 2}px;top:{y - 2}px">'
            f'<span class="cs-card-in">{CARD_ICONS[i]}'
            f'<span class="cs-card-go">{CARD_GO}</span></span>{sp(f"c{i}-t")}{sp(f"c{i}-s")}</a>')
    rows = []
    for k, y in enumerate(ROWS):
        on = k == 0
        rows.append(
            f'<button class="cs-q{" is-on" if on else ""}" type="button" id="q{k}" aria-expanded="{"true" if on else "false"}" aria-controls="ans" data-q="{k}" '
            f'style="position:absolute;left:0;top:{y - ROWS[0]}px;width:{RX1 - RX0}px">'
            f'<span class="cs-q-mark" aria-hidden="true">?</span>{Q_ARR}{sp(f"q{k}")}</button>')
    ans = ''.join(sp(f'a{j}') for j in range(len(ANS)))
    return f'''<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>خدمات شهروندی | شهرداری سبزوار</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/citizen-services.css">
</head>
<body>
  <div class="stage-outer cs-outer">
    <main class="stage cs-stage" id="top">
{HEAD}
<section class="cs-hero" aria-labelledby="cs-h"><div class="cs-hero-bg" aria-hidden="true"></div><div class="cs-hero-ic-wrap">{HERO_IC}</div>{HERO_NOTCH}
{sp('h-title').replace('data-t="h-title"', 'data-t="h-title" id="cs-h"')}<p class="cs-p">{sp('h-sub')}</p></section>
<section class="cs-sec" aria-label="فهرست خدمات هوشمند">{sec_hd('cs-hd-smart')}{sp('s-smart')}{''.join(cards[:3])}</section>
<section class="cs-sec" aria-label="فهرست خدمات شهروندی">{sec_hd('cs-hd-city')}{sp('s-city')}{''.join(cards[3:])}</section>
<section class="cs-faq" id="faq" aria-labelledby="faq-h-t">{sp('faq-h').replace('data-t="faq-h"', 'data-t="faq-h" id="faq-h-t"')}
<span class="cs-faq-badge" aria-hidden="true">?</span>
<a class="cs-all" href="service-app.html#faq" style="left:46px;top:1512px;width:142px;height:30px">{sp('faq-all', extra_style='')}</a>
<div class="cs-faq-list">{''.join(rows)}</div>
<div class="cs-ans" id="ans" role="region" aria-live="polite" aria-labelledby="q0"><p class="cs-ans-p" data-default="1">{ans}</p></div>
<div class="cs-help-bar" aria-hidden="true"></div>
<p class="cs-help">{sp('help')}</p><a class="cs-help-btn" href="tel:137" style="left:78px;top:1812px;width:118px;height:40px">{sp('help-btn')}</a>
</section>
<section class="cs-promo" aria-label="پرداخت عوارض با ۲۰ درصد تخفیف">
<div class="cs-promo-bg" aria-hidden="true"></div>
<img class="cs-promo-car" src="assets/citizen/promo-car@2x.png" width="420" height="240" alt="">
<img class="cs-promo-coins" src="assets/citizen/promo-coins@2x.png" width="466" height="240" alt="">
<p class="cs-promo-t">{sp('p-off')}{sp('p-off2')}</p><p class="cs-promo-t">{sp('p-title')}{sp('p-sub')}</p>
<a class="cs-promo-btn" href="service-app.html" style="left:1119px;top:2065px;width:175px;height:42px">{PROMO_IC}{sp('p-btn')}</a></section>
<div class="cs-foot">
{FOOT}
</div>
    </main>
  </div>
  <script src="js/main.js"></script>
  <script src="js/citizen-services.js" defer></script>
</body>
</html>
'''

def write(fit):
    html = build(fit)
    # spans inside positioned wrappers (cards, rows, links) got parent offsets; the rest are stage-relative
    open(os.path.join(K.SITE, 'citizen-services.html'), 'w').write(html)
    css = open(os.path.join(K.HERE, 'fonts.css')).read() + open(os.path.join(K.HERE, 'citizen.base.css')).read()
    qon = fit.d.get('q0', {}).get('fw') or 600; qoff = fit.d.get('q1', {}).get('fw') or 400
    css += f'.cs-stage{{--q-on:{qon};--q-off:{qoff}}}\n'
    mask = card_mask_data_uri(CW, CH, r=12, notch_r=18, notch_y=200)
    css += f'.cs-stage{{--cs-card-mask:{mask};}}\n'
    css += '.stage.cs-stage a.cs-card.is-hover .cs-card-go,.stage.cs-stage a.cs-card:hover .cs-card-go{background-color:#00b757!important}\n'
    css += '.stage.cs-stage a.cs-card.is-hover .cs-card-go svg,.stage.cs-stage a.cs-card:hover .cs-card-go svg{color:#fff!important}\n'
    open(os.path.join(K.SITE, 'css/citizen-services.css'), 'w').write(css)

fit = K.Fit('citizen')
rounds = int(sys.argv[sys.argv.index('--fit') + 1]) if '--fit' in sys.argv else 0
write(fit)
# fitting reference background = the text-free page incl. cards (cards are re-painted by the page)
FITBG = REF.copy()
for t in T: x0, y0, x1, y1 = t['ref']; K.fill_rect(FITBG, (x0 - 2, y0 - 2, x1 + 2, y1 + 2))
FITBG[1590:1645, 1236:1269] = FITBG[1590:1645, 1234:1235]
for r in range(rounds):
    out = '/tmp/citizen-fit.png'
    K.shoot(os.path.join(K.SITE, 'citizen-services.html'), out, W, 900, True, False)
    worst = 0 if '--color-only' in sys.argv else K.refit([t for t in T if not t.get('just')], fit, REF, FITBG, K.load(out), rounds - r)
    cw = K.refit_color(T, fit, REF, FITBG, K.load(out)) if ('--color' in sys.argv or '--color-only' in sys.argv) else 0
    fit.save(); write(fit); print(f'fit round {r + 1}: worst edge error before update {worst:.1f}px, colour step {cw:.0f}')
def render(fz):
    write(fz); K.shoot(os.path.join(K.SITE, "citizen-services.html"), "/tmp/citizen-pick.png", W, 900, True, False); return K.load("/tmp/citizen-pick.png")
if '--weights' in sys.argv:
    res = K.pick_weights(T, fit, REF, FITBG, render); fit.save(); write(fit)
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
    res = K.pick_weights(T, fit, REF, FITBG, render, weights=("Peyda", "'PeydaWeb FaNum'"), key='ff'); fit.save(); write(fit)
    for k, v in res.items(): print('family', k, v)
if '--shadow' in sys.argv:
    SH = ('0 2px 8px rgba(0,0,0,.45)', '0 3px 6px rgba(0,0,0,.4)', '0 4px 10px rgba(0,0,0,.5)', '0 1px 6px rgba(0,0,0,.4)', '0 2px 5px rgba(60,20,0,.45)', '0 1px 2px rgba(0,0,0,.18)', '0 1px 3px rgba(0,0,0,.3)', '0 2px 4px rgba(0,0,0,.3)', '0 2px 6px rgba(0,0,0,.35)', '0 0 3px rgba(0,0,0,.25)', '0 3px 8px rgba(0,0,0,.4)')
    res = K.pick_weights(T, fit, REF, FITBG, render, weights=SH, key='sh', rounds=0); fit.save(); write(fit)
    for k, v in res.items():
        if v[0] != 'keep': print('shadow', k, v)
if '--pick' in sys.argv:
    def render(fz):
        write(fz); K.shoot(os.path.join(K.SITE, 'citizen-services.html'), '/tmp/citizen-pick.png', W, 900, True, False); return K.load('/tmp/citizen-pick.png')
    res = K.pick_colors(T, fit, REF, render); fit.save(); write(fit)
    for k, v in res.items(): print('pick', k, v)
print('citizen built:', len(T), 'live texts,', len(CARDS), 'cards,', len(SHELL['header']), '+', len(SHELL['footer']), 'shell elements')
