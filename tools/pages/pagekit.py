"""pagekit: shared helpers for the pages built from a reference export (no Figma JSON available):
ink detection, text erasing (Coons-patch fill from the surrounding pixels), live-text spans with an
ink-based fit (horizontal scale + position + size) measured against the reference, like the homepage
fit-text / service-app inkfit methods."""
import json, os, subprocess, numpy as np
from PIL import Image
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def save(a, p, **kw): Image.fromarray(np.clip(a + .5, 0, 255).astype(np.uint8)).save(p, optimize=True, **kw)

def ink_box(img, rect, thr=40, med=15):
    """tight ink bbox inside rect=(x0,y0,x1,y1) of the reference, ink = deviation from a local median."""
    x0, y0, x1, y1 = rect; A = img[y0:y1, x0:x1]
    M = np.stack([nd.median_filter(A[..., c], size=med) for c in range(3)], -1)
    m = np.abs(A - M).max(2) > thr
    ys, xs = np.where(m)
    if len(xs) < 3: return None
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)

def ink_vs(img, bg, rect, thr=30):
    """ink bbox of img against the text-free background bg inside rect"""
    x0, y0, x1, y1 = [int(round(v)) for v in rect]
    x0 = max(0, x0); y0 = max(0, y0); x1 = min(img.shape[1], x1); y1 = min(img.shape[0], y1)
    m = np.abs(img[y0:y1, x0:x1] - bg[y0:y1, x0:x1]).max(2) > thr
    ys, xs = np.where(m)
    if len(xs) < 3: return None
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)

def ink_color(img, bg, box, q=0.12):
    x0, y0, x1, y1 = box; A = img[y0:y1, x0:x1]; B = bg[y0:y1, x0:x1]
    d = np.abs(A - B).max(2); k = max(3, int(d.size * q))
    idx = np.argsort(d.ravel())[-k:]
    c = np.median(A.reshape(-1, 3)[idx], 0)
    return '#%02x%02x%02x' % tuple(int(round(v)) for v in c)

def fill_rect(a, rect, band=2):
    """Coons-patch fill of rect from the pixels just outside it (median of `band` px rings)"""
    x0, y0, x1, y1 = [int(v) for v in rect]
    H, W = a.shape[:2]; x0 = max(band, x0); y0 = max(band, y0); x1 = min(W - band, x1); y1 = min(H - band, y1)
    if x1 <= x0 or y1 <= y0: return
    T = np.median(a[y0 - band:y0, x0 - 1:x1 + 1], 0); B = np.median(a[y1:y1 + band, x0 - 1:x1 + 1], 0)
    L = np.median(a[y0 - 1:y1 + 1, x0 - band:x0], 1); R = np.median(a[y0 - 1:y1 + 1, x1:x1 + band], 1)
    w, h = x1 - x0 + 2, y1 - y0 + 2
    u = np.linspace(0, 1, w)[None, :, None]; v = np.linspace(0, 1, h)[:, None, None]
    P = (1 - v) * T[None] + v * B[None] + (1 - u) * L[:, None] + u * R[:, None] \
        - ((1 - u) * (1 - v) * T[0] + u * (1 - v) * T[-1] + (1 - u) * v * B[0] + u * v * B[-1])
    a[y0:y1, x0:x1] = P[1:-1, 1:-1]

class Fit:
    """per-text fit state (tools/pages/fit-<page>.json): dx, dy offsets, sx scale, fs size"""
    def __init__(self, name):
        self.p = os.path.join(HERE, f'fit-{name}.json')
        self.d = json.load(open(self.p)) if os.path.exists(self.p) else {}
    def get(self, tid, fs):
        return self.d.setdefault(tid, {'dx': 0.0, 'dy': 0.0, 'sx': 1.0, 'fs': fs})
    def save(self): json.dump(self.d, open(self.p, 'w'), indent=0, sort_keys=True)

def span(t, f, W, extra_style='', parent=None):
    """absolute live text line. t: id, html, ref (ink box), ff, fw, color, align, lh.
    parent=(px, py, pw): the span sits inside an absolutely positioned box at px,py of width pw"""
    x0, y0, x1, y1 = t['ref']; fs = f['fs']; lh = t.get('lh', round(fs * 1.6, 2))
    px, py, pw = parent or (0, 0, W)
    top = (y0 + y1) / 2 - lh / 2 + fs * t.get('base', 0.06) + f['dy'] - py
    al = t.get('align', 'r'); st = f'top:{top:.2f}px;'
    if al == 'r': st += f'right:{(px + pw) - x1 + f["dx"]:.2f}px;transform-origin:100% 50%;'
    elif al == 'l': st += f'left:{x0 + f["dx"] - px:.2f}px;transform-origin:0 50%;'
    else:
        cx = (x0 + x1) / 2 + f['dx'] - px; bw = max(400, round((x1 - x0) * 1.6)); st += f'left:{cx - bw / 2:.2f}px;width:{bw}px;text-align:center;transform-origin:50% 50%;'
    st += f"font:{f.get('fw') or t.get('fw', 400)} {fs}px/{lh}px {f.get('ff') or t.get('ff', 'Peyda')};color:{f.get('c') or t['color']};"
    if abs(f['sx'] - 1) > 0.002: st += f'transform:scaleX({f["sx"]:.4f});'
    if f.get('sh'): st += f"text-shadow:{f['sh']};"
    tag = t.get('tag', 'span'); cls = ('tx ' + t.get('cls', '')).strip()
    return f'<{tag} class="{cls}" data-t="{t["id"]}"{t.get("attrs", "")} style="{st}{extra_style}">{t["html"]}</{tag}>'

def refit(texts, fit, ref, bg, impl, rounds_left, pad=(6, 4)):
    """one fit iteration: compare ink boxes of every live text in impl vs ref (both against bg)"""
    worst = 0
    for t in texts:
        if t.get('nofit'): continue
        x0, y0, x1, y1 = t['ref']; f = fit.get(t['id'], t['fs'])
        o = ink_vs(impl, bg, (x0 - pad[0] - t.get('padx', 0), y0 - pad[1], x1 + pad[0] + t.get('padx', 0), y1 + pad[1]))
        if not o: continue
        rw, rh, ow, oh = x1 - x0, y1 - y0, o[2] - o[0], o[3] - o[1]
        al = t.get('align', 'r')
        if al == 'r': f['dx'] += o[2] - x1
        elif al == 'l': f['dx'] -= o[0] - x0
        else: f['dx'] -= (o[0] + o[2]) / 2 - (x0 + x1) / 2
        f['dy'] -= (o[1] + o[3]) / 2 - (y0 + y1) / 2
        if ow > 2 and not t.get('noscale'):
            tgt = f['sx'] * rw / ow                       # total horizontal factor wanted
            if rounds_left > 1 and abs(tgt - 1) > 0.05 and not t.get('fixfs'):
                nfs = max(6, round(f['fs'] * max(0.75, min(1.35, tgt)) * 2) / 2)  # bounded step (a wrong ink match must not run away)  # most of it through the font size (glyph height follows width)
                tgt = tgt * f['fs'] / nfs; f['fs'] = nfs
            f['sx'] = max(0.85, min(1.15, tgt))
        worst = max(worst, abs(o[2] - x1), abs(o[0] - x0), abs(o[1] - y0), abs(o[3] - y1))
    return worst

def refit_color(texts, fit, ref, bg, impl, pad=3):
    """colour fit: with the same font/size the ink coverage A is the same in ref and impl, so
    sum(ref-bg) = A*(c_ref-bg) and sum(impl-bg) = A*(c-bg): estimate A from impl, solve c_ref (per channel)."""
    worst = 0
    for t in texts:
        if t.get('nocolor'): continue
        x0, y0, x1, y1 = t['ref']; f = fit.get(t['id'], t['fs'])
        c = np.array([int((f.get('c') or t['color'])[i:i + 2], 16) for i in (1, 3, 5)], float)
        sl = (slice(max(0, y0 - pad), y1 + pad), slice(max(0, x0 - pad), x1 + pad))
        R, B, I = ref[sl], bg[sl], impl[sl]
        m = np.abs(I - B).max(2) > 8
        if m.sum() < 10: continue
        bgm = B[m].mean(0); dc = c - bgm
        if np.abs(dc).max() < 25: continue
        So = (I - B).reshape(-1, 3).sum(0); Sr = (R - B).reshape(-1, 3).sum(0)
        A = float(So @ dc) / float(dc @ dc)
        if A <= 1: continue
        cn = np.clip(bgm + Sr / A, 0, 255)
        cn = c + 0.8 * (cn - c)                                  # damped
        worst = max(worst, np.abs(cn - c).max())
        f['c'] = '#%02x%02x%02x' % tuple(int(round(v)) for v in cn)
    return worst

def pm_count(a, b, t=0.1):
    """pixelmatch-like count (YIQ delta above threshold, no anti-alias exclusion)"""
    d = a - b
    y = d @ [0.29889531, 0.58662247, 0.11448223]; i = d @ [0.59597799, -0.27417610, -0.32180189]; q = d @ [0.21147017, -0.52261711, 0.31114694]
    return int(((0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q) > 35215 * t * t).sum())

def hx(c): return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], float)

_REFP = {}
def box_scores(img, ref, boxes):
    """real pixelmatch counts (boxscore.js) of img vs ref inside each box"""
    key = id(ref)
    if key not in _REFP:
        _REFP[key] = f'/tmp/boxscore-ref-{key}.png'; save(ref, _REFP[key])
    save(img, '/tmp/boxscore-impl.png'); json.dump([[int(v) for v in b] for b in boxes], open('/tmp/boxscore.json', 'w'))
    r = subprocess.run(['node', os.path.join(HERE, 'boxscore.js'), _REFP[key], '/tmp/boxscore-impl.png', '/tmp/boxscore.json'], check=True,
                       capture_output=True, text=True, env=dict(os.environ, NODE_PATH='/workspace/pixelmatch/node_modules'))
    return json.loads(r.stdout)

def tbox(t, pad, shape):
    x0, y0, x1, y1 = t['ref']; return (max(0, x0 - pad), max(0, y0 - pad), min(shape[1], x1 + pad), min(shape[0], y1 + pad))

def pick_colors(texts, fit, ref, render, steps=(0, .5, .8, 1, 1.25), pad=3):
    """per text, try colours along base(ink_color)->fitted and keep the one with the fewest diff pixels locally"""
    cand = {}
    for t in texts:
        if t.get('nocolor'): continue
        f = fit.get(t['id'], t['fs']); b = hx(t['color']); c = hx(f.get('c') or t['color'])
        cand[t['id']] = ['#%02x%02x%02x' % tuple(int(round(v)) for v in np.clip(b + k * (c - b), 0, 255)) for k in steps]
    score = {k: [] for k in cand}
    for j in range(len(steps)):
        for tid, cs in cand.items(): fit.d[tid]['c'] = cs[j]
        img = render(fit); tt = [t for t in texts if t['id'] in cand]
        for t, v in zip(tt, box_scores(img, ref, [tbox(t, pad, ref.shape) for t in tt])): score[t['id']].append(v)
    for tid, cs in cand.items():
        j = int(np.argmin(score[tid])); fit.d[tid]['c'] = cs[j]
    return {tid: (steps[int(np.argmin(v))], min(v), v[0]) for tid, v in score.items()}

def pick_weights(texts, fit, ref, bg, render, weights=(400, 500, 600, 700, 800), rounds=2, pad=3, key='fw', skip='noweight'):
    """per text, try each font weight (geometry re-fitted for it) and keep the weight + geometry with the fewest
    local diff pixels"""
    import copy
    base = copy.deepcopy(fit.d); best = {}
    img = render(fit); tt = [t for t in texts if not t.get(skip)]     # the current state competes too
    for t, sc in zip(tt, box_scores(img, ref, [tbox(t, pad, ref.shape) for t in tt])):
        best[t['id']] = (sc, 'keep', copy.deepcopy(fit.get(t['id'], t['fs'])))
    for w in weights:
        fit.d = copy.deepcopy(base)
        for t in texts:
            if not t.get(skip): fit.get(t['id'], t['fs'])[key] = w
        img = None
        for r in range(rounds + 1):
            img = render(fit)
            if r < rounds: refit([t for t in texts if not t.get('just')], fit, ref, bg, img, rounds - r + 1)
        tt = [t for t in texts if not t.get(skip)]
        for t, sc in zip(tt, box_scores(img, ref, [tbox(t, pad, ref.shape) for t in tt])):
            if t['id'] not in best or sc < best[t['id']][0]: best[t['id']] = (sc, w, copy.deepcopy(fit.d[t['id']]))
    fit.d = base
    for tid, (sc, w, st) in best.items(): fit.d[tid] = st
    return {tid: (w, sc) for tid, (sc, w, st) in best.items()}

def nudge(texts, fit, ref, impl, r=3, pad=4):
    """move each text by the integer shift that minimises its local diff count (ours shifted vs ref)"""
    moved = {}
    H, W = ref.shape[:2]
    for t in texts:
        if t.get('nofit'): continue
        x0, y0, x1, y1 = t['ref']; X0, Y0, X1, Y1 = max(r, x0 - pad), max(r, y0 - pad), min(W - r, x1 + pad), min(H - r, y1 + pad)
        R = ref[Y0:Y1, X0:X1]; best = (pm_count(impl[Y0:Y1, X0:X1], R), 0, 0)
        for sy in range(-r, r + 1):
            for sx in range(-r, r + 1):
                if sx == 0 and sy == 0: continue
                sc = pm_count(impl[Y0 - sy:Y1 - sy, X0 - sx:X1 - sx], R)
                if sc < best[0] - 2: best = (sc, sx, sy)
        _, sx, sy = best
        if sx or sy:
            f = fit.get(t['id'], t['fs'])
            f['dx'] += -sx if t.get('align', 'r') == 'r' else sx
            f['dy'] += sy; moved[t['id']] = (sx, sy)
    return moved

def pick_offsets(texts, fit, ref, render, deltas=((0, 0), (.5, 0), (-.5, 0), (0, .5), (0, -.5), (.25, 0), (-.25, 0)), pad=4, keys=('dx', 'dy')):
    """sub-pixel refinement: render every text with the same small offset per variant, keep the best per text"""
    import copy
    base = copy.deepcopy(fit.d); sc = {}
    for d in deltas:
        fit.d = copy.deepcopy(base)
        for t in texts:
            f = fit.get(t['id'], t['fs']); f[keys[0]] += d[0]; f[keys[1]] += d[1]
        img = render(fit)
        for t, v in zip(texts, box_scores(img, ref, [tbox(t, pad, ref.shape) for t in texts])): sc.setdefault(t['id'], []).append(v)
    fit.d = base; res = {}
    for t in texts:
        j = int(np.argmin(sc[t['id']]))
        if sc[t['id']][j] < sc[t['id']][0] - 2:
            f = fit.get(t['id'], t['fs']); f[keys[0]] += deltas[j][0]; f[keys[1]] += deltas[j][1]; res[t['id']] = (deltas[j], sc[t['id']][0], sc[t['id']][j])
    return res

def shoot(html, out, w, h, full=False, mobile_args=False):
    subprocess.run(['node', os.path.join(HERE, 'shot.js'), html, out, str(w), str(h), '1' if full else '0', '1' if mobile_args else '0'],
                   check=True, env=dict(os.environ, NODE_PATH='/workspace/pixelmatch/node_modules'))
