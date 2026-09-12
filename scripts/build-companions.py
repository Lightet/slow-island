"""Build anchored illustration rigs; only the head and optional tail move.

The expression sheet is intentionally sampled only inside fur-covered face masks.
Bodies, paws, silhouettes and foreground scene objects retain their original art.
"""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]
# head seam, neck pivot, soft face mask (atlas coordinates)
RIGS = [
    (358, 182, 332, 182, 214, 30, 26),
    (346, 493, 327, 492, 256, 105, 59),
    (361, 786, 339, 787, 277, 97, 58),
    (347, 1095, 325, 1080, 229, 38, 28),
    (343, 1394, 322, 1392, 260, 111, 63),
    (766, 178, 739, 177, 691, 104, 50),
    (774, 481, 750, 483, 701, 103, 48),
    (806, 768, 782, 768, 716, 98, 64),
    (842, 1118, 814, 1152, 772, 74, 58),
    (813, 1391, 783, 1397, 724, 93, 54),
]

def rig(index, old):
    seam, px, py, fx, fy, rx, ry = RIGS[index]
    viewport = re.search(r'<svg class="companion-art"([^>]+)>', old)[1]
    clip = re.search(r'<clipPath id="companionClip">.*?</clipPath>', old)
    region = json.loads((ROOT/'assets/animal-regions.json').read_text())['regions'][index]
    fallback_clip = '<clipPath id="companionClip"><rect x="%s" y="%s" width="%s" height="%s"/></clipPath>' % tuple(region[:4])
    shape = ' clip-path="url(#companionClip)"'
    image = f'<image href="assets/animal-atlas.png" width="1568" height="1003"{shape}/>'
    tail = '<polygon points="608,300 669,300 669,514 576,514 580,452 600,397"/>' if index == 1 else ''
    foot_black = '<ellipse cx="203" cy="484" rx="42" ry="18" fill="black"/>' if index == 0 else ''
    tail_defs = f'<clipPath id="tailShape">{tail}</clipPath>' if tail else ''
    tail_black = tail.replace('/>', ' fill="black"/>') if tail else ''
    tail_layer = f'<g class="companion-tail" data-pivot-x="594" data-pivot-y="468"><g clip-path="url(#tailShape)">{image}</g></g>' if tail else ''
    return f'''<g class="companion-motion" data-rig="{index}">
      <svg class="companion-art"{viewport}>
        <defs>{clip[0] if clip else fallback_clip}{tail_defs}
          <linearGradient id="headFade" gradientUnits="userSpaceOnUse" x1="0" y1="{seam-18}" x2="0" y2="{seam}"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
          <linearGradient id="bodyFade" gradientUnits="userSpaceOnUse" x1="0" y1="{seam-38}" x2="0" y2="{seam-24}"><stop stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient>
          <mask id="bodyMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1568" height="1003"><rect width="1568" height="1003" fill="url(#bodyFade)"/>{tail_black}{foot_black}</mask>
          <mask id="headMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1568" height="1003"><rect width="1568" height="1003" fill="url(#headFade)"/>{tail_black}</mask>
          <filter id="faceSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
          <mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1568" height="1003"><ellipse cx="{fx}" cy="{fy}" rx="{rx}" ry="{ry}" fill="white" filter="url(#faceSoft)"/></mask>
        </defs>
        {tail_layer}
        <g mask="url(#bodyMask)">{image}</g>
        <g class="companion-head" data-pivot-x="{px}" data-pivot-y="{py}" data-face-x="{fx}" data-face-y="{fy}">
          <g mask="url(#headMask)">{image}</g>
          <image class="companion-expression" href="assets/contented-faces.webp" width="1568" height="1003" mask="url(#faceMask)" opacity="0"/>
        </g>
      </svg>
    </g>'''

for index, page in enumerate(sorted(ROOT.glob('[0-9][0-9]-*.html'))):
    source = page.read_text()
    pattern = r'<g class="companion-motion"[^>]*>.*?</svg>\s*</g>'
    # The static viewport is retained by repeated builds.
    source, count = re.subn(pattern, lambda m: rig(index, m[0]), source, count=1, flags=re.S)
    assert count == 1, page
    old_moon = '<circle cx="1027" cy="146" r="70" fill="#f1ddac" opacity=".07"/><circle cx="1027" cy="146" r="46" fill="#efddb6" /><circle cx="1044" cy="133" r="40" fill="var(--sky-top)" />'
    moon = '''<defs><radialGradient id="moonGlow"><stop stop-color="#f8e8bb" stop-opacity=".22"/><stop offset=".48" stop-color="#f8e8bb" stop-opacity=".08"/><stop offset="1" stop-color="#f8e8bb" stop-opacity="0"/></radialGradient><mask id="crescentCut" maskUnits="userSpaceOnUse" x="975" y="93" width="105" height="105"><circle cx="1027" cy="146" r="46" fill="white"/><circle cx="1044" cy="133" r="40" fill="black"/></mask></defs><circle cx="1027" cy="146" r="100" fill="url(#moonGlow)" pointer-events="none"/><circle cx="1027" cy="146" r="46" fill="#f1e1bb" mask="url(#crescentCut)"/><circle cx="1027" cy="146" r="48" fill="transparent"/>'''
    source = source.replace(old_moon, moon)
    page.write_text(source)

page = ROOT/'pelican_bicycle_relax_fixed.html'
source = page.read_text()
source, count = re.subn(r'<g class="companion-motion"[^>]*>.*?</svg>\s*</g>', lambda m: rig(0, m[0]), source, count=1, flags=re.S)
assert count == 1
page.write_text(source)
print('Built 11 anchored head rigs and repaired both crescent moons.')
