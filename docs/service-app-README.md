# سامانه خدمات شهرداری سبزوار — نسخه موبایل (Figma 415:5)

Open `index.html` directly (double-click, file://) or serve the folder. No network requests, no fetch, no external CSS masks.

- `index.html`, `css/app.css`, `js/app.js`, `assets/` (prescaled @1x/@2x PNG layers), `fonts/` (Peyda, PeydaWeb FaNum — the user's fonts)
- Generated: `python3 tools/build.py` (needs Node + playwright-core + Chrome); `node tools/fit.js` refits letter-spacing.
- `./run.sh <name>` = build + pixel comparison per section (reference: Figma export if present, else the provisional render).
- `node tools/test.js` = interaction checks via file://.

Interactive: service tiles (hover lift, press, disabled tile with badge + message), promo banner link, header menu / notifications / profile
buttons, «مشاهده همه» buttons, «آخرین اقدامات شما» card slider (RTL, infinite loop, mouse drag, touch swipe, flick, keyboard ←/→, snap,
click suppressed after drag), locked section → login, «سوالات متداول», fixed bottom tab bar (active state, sliding indicator, home/FAQ scroll).
Destinations that do not exist in this static build show a short toast (no backend).
