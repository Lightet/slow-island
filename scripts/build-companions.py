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
    seam, px, py, fx, fy, frx, fry = RIGS[index]
    viewport = re.search(r'<svg class="companion-art"([^>]+)>', old)[1]
    viewport = re.sub(r" data-mesh='[^']*'", '', viewport)
    region = json.loads((ROOT/'assets/animal-regions.json').read_text())['regions'][index]
    x,y,w,h,polygon=region
    clip=f'<polygon points="{polygon}"/>' if polygon else f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>'
    metadata=json.dumps(dict(index=index, region=region[:4],polygon=polygon,seam=seam,pivot=[px,py],face=[fx,fy,frx,fry]),separators=(',',':'))
    feet='<ellipse cx="203" cy="484" rx="42" ry="18" fill="black"/>' if index==0 else ''
    return f'''<g class="companion-motion" data-rig="{index}">
      <svg class="companion-art"{viewport} data-mesh='{metadata}'>
        <defs><clipPath id="companionClip">{clip}</clipPath>
          <mask id="wholeAnimal" maskUnits="userSpaceOnUse" x="0" y="0" width="1568" height="1003"><rect width="1568" height="1003" fill="white"/>{feet}</mask>
          <mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1568" height="1003"><ellipse cx="{fx}" cy="{fy}" rx="{frx}" ry="{fry}" fill="white"/></mask>
        </defs>
        <g class="rig-fallback" clip-path="url(#companionClip)">
          <image href="assets/animal-atlas.png" width="1568" height="1003" mask="url(#wholeAnimal)"/>
          <image class="companion-expression" href="assets/contented-faces.webp" width="1568" height="1003" mask="url(#faceMask)" opacity="0"/>
        </g>
        <foreignObject class="rig-surface" x="{x-40}" y="{y-40}" width="{w+80}" height="{h+80}" style="display:none"><canvas xmlns="http://www.w3.org/1999/xhtml" class="animal-canvas" style="width:100%;height:100%;display:block"></canvas></foreignObject>
        <g class="companion-head" data-pivot-x="{px}" data-pivot-y="{py}" data-face-x="{fx}" data-face-y="{fy}"></g>
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
print('Built 11 continuous animal rigs.')
