"""Extract decorative crops from Figma exports (@2x source, displayed @1x)."""
import base64
import os
from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIGMA = os.path.join(SITE, 'ref', 'figma')


def save_crop(src_path, box, out_path, scale=0.5):
    """box in 1x coordinates; src is 2x when scale=0.5."""
    im = Image.open(src_path).convert('RGBA')
    x0, y0, x1, y1 = [int(round(v / scale)) for v in box]
    im.crop((x0, y0, x1, y1)).save(out_path, optimize=True)


def card_mask_data_uri(w=179, h=219, r=12, notch_r=18, notch_y=200):
    """Rounded card with bottom-center semicircular notch (for file:// CSS mask)."""
    cx, cy = w / 2, notch_y
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<path fill="#fff" d="M{r} 0 H{w - r} a{r} {r} 0 0 1 {r} {r} V{notch_y - notch_r}
 a{notch_r} {notch_r} 0 0 0 -{notch_r * 2} 0
 V{h - r} a{r} {r} 0 0 1 -{r} {r} H{r} a{r} {r} 0 0 1 -{r} -{r} V{r} a{r} {r} 0 0 1 {r} -{r} Z"/>
</svg>'''
    b64 = base64.b64encode(svg.encode('utf-8')).decode('ascii')
    return f'url("data:image/svg+xml;base64,{b64}")'
