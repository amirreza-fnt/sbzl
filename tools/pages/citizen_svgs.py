"""Inline SVG icons for citizen service cards (design green via currentColor)."""
import os
import re

SITE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.path.join(SITE, 'assets')


def _inline_svg(path, w=48, h=40):
    raw = open(path, encoding='utf-8').read()
    raw = re.sub(r'\s(width|height)="[^"]*"', '', raw)
    raw = re.sub(r'fill="#[0-9A-Fa-f]{3,8}"', 'fill="currentColor"', raw)
    raw = re.sub(r'stroke="#[0-9A-Fa-f]{3,8}"', 'stroke="currentColor"', raw)
    if 'viewBox' not in raw:
        raw = raw.replace('<svg ', f'<svg viewBox="0 0 {w} {h}" ', 1)
    return raw.replace('<svg ', f'<svg class="cs-card-ic" width="{w}" height="{h}" ', 1)


BUS = '''<svg class="cs-card-ic" width="48" height="40" viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M8 8h32a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-2.2l-2.4 4H14.6l-2.4-4H10a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" stroke="currentColor" stroke-width="2"/><path d="M8 16h32M14 26h4M30 26h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="30" r="2" fill="currentColor"/><circle cx="34" cy="30" r="2" fill="currentColor"/></svg>'''
PARK = '''<svg class="cs-card-ic" width="48" height="40" viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M10 6h20l8 8v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2"/><path d="M18 6v10h14" stroke="currentColor" stroke-width="2"/><text x="24" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" font-family="Peyda,sans-serif">P</text></svg>'''
CAR_TAX = '''<svg class="cs-card-ic" width="48" height="40" viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M6 22h36l-4-10H10L6 22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 22v8h4v-4h24v4h4v-8" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="26" r="2.5" fill="currentColor"/><circle cx="34" cy="26" r="2.5" fill="currentColor"/></svg>'''

CARD_ICONS = [
    BUS,
    PARK,
    CAR_TAX,
    _inline_svg(os.path.join(ASSETS, 'icon-137.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-transparency.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-mail.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-building.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-business.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-renovation.svg')),
    _inline_svg(os.path.join(ASSETS, 'icon-traffic.svg')),
]
