#!/usr/bin/env python3
"""Assemble the ONE combined site from the two generator repos.

  python3 tools/assemble.py [HOME_REPO] [APP_REPO]
  defaults: /workspace/pixelmatch/work  /workspace/pixelmatch/service-app

Result (relative to this repo root; every path relative -> works via file:// / double-click):
  index.html                 homepage (1366 desktop), from HOME_REPO/index.html
  service-app.html           service app (375 mobile), from APP_REPO/index.html
  css/style.css  js/{main,slider,contact}.js  assets/**      homepage
  css/service-app.css  js/service-app.js  assets/service/*  service app
  fonts/**                   SHARED: the service app's 10 font files are byte-identical to
                             fonts/Peyda/* and fonts/PeydaWebFaNum_from_RecycleBin/*, so it points there
  tools/homepage/  tools/service-app/   generator sources (reference copies, build caches excluded)
The only change to the pages themselves: the homepage's existing invisible hit area over the
design's 'همه خدمات' button now links to service-app.html (was #services) -> zero pixel change."""
import os, sys, shutil, filecmp, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '/workspace/pixelmatch/work')
APP = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else '/workspace/pixelmatch/service-app')
IGN = shutil.ignore_patterns('__pycache__', '_*', 'node_modules', '.git')

def J(*p): return os.path.join(ROOT, *p)
def put(rel, text):
    os.makedirs(os.path.dirname(J(rel)), exist_ok=True)
    open(J(rel), 'w', encoding='utf-8').write(text)
def sub1(s, old, new, n=1):
    c = s.count(old)
    assert c == n, f'expected {n}x {old!r}, found {c}'
    return s.replace(old, new)
def fresh(rel, src):
    if os.path.exists(J(rel)): shutil.rmtree(J(rel))
    shutil.copytree(src, J(rel), ignore=IGN)

# ---- homepage (root) ----
for d in ('assets', 'fonts', 'js'): fresh(d, os.path.join(HOME, d))
os.makedirs(J('css'), exist_ok=True)
shutil.copy2(os.path.join(HOME, 'css/style.css'), J('css/style.css'))
home = open(os.path.join(HOME, 'index.html'), encoding='utf-8').read()
home = sub1(home, '<a class="hit" href="#services" aria-label="همه خدمات"', '<a class="hit" href="service-app.html" aria-label="همه خدمات"')
put('index.html', home)

# ---- service app (second page) ----
FONT_MAP = {}
for f in sorted(os.listdir(os.path.join(APP, 'fonts'))):
    for sub in ('Peyda', 'PeydaWebFaNum_from_RecycleBin'):
        cand = J('fonts', sub, f)
        if os.path.exists(cand) and filecmp.cmp(cand, os.path.join(APP, 'fonts', f), shallow=False):
            FONT_MAP[f] = f'{sub}/{f}'
    assert f in FONT_MAP, f'font {f} has no byte-identical shared copy'
app = open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
app = sub1(app, 'href="css/app.css"', 'href="css/service-app.css"')
app = sub1(app, 'src="js/app.js"', 'src="js/service-app.js"')
app = re.sub(r'(?<![\w/.])assets/', 'assets/service/', app)
app = re.sub(r'(?<![\w/.])fonts/([\w.\-]+)', lambda m: 'fonts/' + FONT_MAP[m.group(1)], app)
app = sub1(app, '</title>', '</title>\n<link rel="home" href="index.html">')     # non-visual relation to the homepage
put('service-app.html', app)
css = open(os.path.join(APP, 'css/app.css'), encoding='utf-8').read()
css = css.replace('../assets/', '../assets/service/')
css = re.sub(r'\.\./fonts/([\w.\-]+)', lambda m: '../fonts/' + FONT_MAP[m.group(1)], css)
put('css/service-app.css', css)
shutil.copy2(os.path.join(APP, 'js/app.js'), J('js/service-app.js'))
fresh('assets/service', os.path.join(APP, 'assets'))

# ---- generator sources + their logs ----
fresh('tools/homepage', os.path.join(HOME, 'tools'))
fresh('tools/service-app', os.path.join(APP, 'tools'))
shutil.copy2(os.path.join(APP, 'run.sh'), J('tools/service-app/run.sh'))
os.makedirs(J('docs'), exist_ok=True)
for src, dst in [(HOME, 'homepage'), (APP, 'service-app')]:
    for f in ('PROGRESS.md', 'README-fa.md', 'README.md'):
        if os.path.exists(os.path.join(src, f)): shutil.copy2(os.path.join(src, f), J('docs', f'{dst}-{f}'))

# ---- combined-site copies of the page tests (paths rewritten to this layout) ----
os.makedirs(J('tools/tests'), exist_ok=True)
def retarget(src, dst, pairs):
    t = open(J(src), encoding='utf-8').read()
    for a, b in pairs: t = sub1(t, a, b, t.count(a) or 1)
    put(dst, t)
retarget('tools/homepage/test-contact.js', 'tools/tests/test-contact.js', [
    ("path.resolve(__dirname, '../index.html')", "path.resolve(__dirname, '../../index.html')"),
    ("// node tools/test-contact.js", "// node tools/tests/test-contact.js (combined site)"),
    ("const R = []; const ok", "require('fs').mkdirSync(path.resolve(__dirname, '../../out/interactive'), { recursive: true });\n  const R = []; const ok")])
retarget('tools/homepage/test-interactive.js', 'tools/tests/test-interactive.js', [
    ("const root = path.resolve(__dirname, '..'),", "const root = path.resolve(__dirname, '../..'),")])
retarget('tools/service-app/test.js', 'tools/tests/test-service-app.js', [
    ("path.resolve(__dirname, '../index.html')", "path.resolve(__dirname, '../../service-app.html')"),
    ("'../js/app.js'", "'../../js/service-app.js'"), ("'../out/interactive", "'../../out/interactive"),
    ("require('./chrome')", "require('../service-app/chrome')")])

# ---- sanity: every local url in both pages / both stylesheets resolves ----
def local(u):
    u = u.strip().strip('\'"').split('?')[0].split('#')[0]
    return u if u and not u.startswith(('data:', 'http:', 'https:', 'mailto:', 'tel:')) else None
bad = []
for f in ('index.html', 'service-app.html', 'css/style.css', 'css/service-app.css'):
    s = open(J(f), encoding='utf-8').read(); base = os.path.dirname(J(f))
    for u in re.findall(r'(?:src|href)="([^"]+)"', s) + re.findall(r'url\(([^)]+)\)', s):
        u = local(u)
        if u and not os.path.exists(os.path.normpath(os.path.join(base, u))): bad.append((f, u[:80]))
print('fonts shared:', len(FONT_MAP), '| broken refs:', bad or 'none')
sys.exit(1 if bad else 0)
