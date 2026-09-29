# Service app (Figma 415:5 "Services - Mobile [FINAL]", 375 x 1377) — progress

Reference status: rows 1-5 **PROVISIONAL** (own render); from row 6 on: **REAL Figma export** `/workspace/pixelmatch/ref/app-figma@1x.png` (375x1377; @2x = app-figma@2x.png, the -b copy differs in 40 px by 1 level, identical downscaled vs 1x).

Original note: Figma image export is rate-limited (HTTP 429, retry-after ≈ 88 h from 29 Sep 09:45 Tehran), so the reference
`ref/provisional@1x.png` is rendered by `tools/ref.py` from the same node JSON (geometry=paths), the 3 original image fills and SVG text
(Chrome, the user's fonts, Figma box widths enforced). It validates geometry/positions/colours/text placement, NOT Figma's own rasteriser.
When `/workspace/pixelmatch/ref/app-figma@1x.png` exists, `./run.sh` switches to it automatically (real comparison).
Visual check vs the user's screenshot (278 px wide, webp): same layout; sampled colours within 1-3 RGB levels (except webp/scale edges).

| # | section(s) | before % | after % | total % | what / why |
|---|---|---|---|---|---|
| 1 | all | – | 9.87 (prov.) | 9.87 | first build from node JSON: raster layers (bg, 10 tiles, 2 cards, tab bar @1x/@2x) via tools/figlib.py, 64 texts live |
| 2 | all | 9.87 | 3.20 (prov.) | 3.20 | inline image-set() quoting broke the tile/card backgrounds; tab bar is position:fixed -> compare with a 1377px viewport (bar lands on its Figma place 1311-1377) |
| 3 | header, faq, tabbar | 4.8 / 5.2 / 4.0 | 0.52 / 0.20 / 1.87 (prov.) | 1.01 | font shorthand quoting in inline styles; paragraph 415:409 line breaks = user's screenshot (2 lines; Chrome wraps the 147.6px box into 3) for page and reference |
| 4 | actions, tabbar | 3.02 / 1.87 | 0.82 / 0.40 (prov.) | 0.51 | card x (crop pad 2px), tab bar crop starts at 1311 (half of the 1.3px top line), letter-spacing fitted to Figma widths for 36 single-line texts (tools/fit.js) |
| 5 | actions | 1.87 | 0.82 (prov.) | 0.51 | looping slider: wrap window centred; the looped "previous" card (right of card 1) stays hidden until the first interaction = design start state |
| 6 | all (real reference) | – | header 0.48 · banner 5.90 · grid 0.63 · actions 1.42 · locked 1.40 · faq 3.44 · tabbar 0.77 | 1.85 | switched to the Figma export: same build scored 1.85% (was 0.51% vs the provisional render) |
| 7 | all texts | 1.85 | 1.58 | 1.58 | ink-based fit against the export (tools/inkfit.py, 2x): Chrome ignores letter-spacing inside joined Persian runs -> horizontal scale about the alignment edge per text (scale.json) + ink-box shift (shift.json); e.g. 'سوال دارید؟' was 6.5px, the FAQ paragraph 5.5px, the lock text 7px too wide |
| 8 | banner, locked, faq, header | 5.90 / 1.48 / 3.51 / 0.51 | 0.00 / 1.13 / 2.33 / 0.49 | 0.88 | static background = Figma's own rasterisation (export @1x/@2x) wherever nothing live sits on top; our text-free render is kept under live texts (+3px), tile/card/tab-bar layers and the whole slider strip (cards move) -> image resampling + background blur now exactly Figma's; 'مشاهده همه' +1px down |
| 9 | locked, faq | 1.13 / 2.33 | 1.01 / 2.07 | **0.82** | Figma's negative letter-spacing (-0.6 / -0.36) also narrows word gaps: word-spacing -1.2 / -0.72 (and -0.66 on the lock text) chosen by sweep, then re-fitted. Final (file://, exact 1377): header 0.49, banner 0.00, grid 0.48, actions 0.97, locked 1.01, faq 2.07, tabbar 0.58; remaining = glyph rasterisation (Figma vs Chrome) |
