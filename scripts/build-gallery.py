"""Refresh gallery previews from the actual scenes. No bundler or dependencies required."""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]
template = (ROOT / 'scripts/gallery-template.html').read_text()
worlds = []
for page in sorted(ROOT.glob('[0-9][0-9]-*.html')):
    source = page.read_text()
    world = json.loads(re.search(r'window.WORLD=(.*?);</script>', source)[1])
    svg = re.search(r'<svg\b[^>]*id="art".*?</svg>\s*<div class="scene-copy"', source, re.S)[0]
    svg = svg[:svg.rfind('<div class="scene-copy"')].strip()
    world['svg'] = svg
    worlds.append(world)

def preview(index, serial):
    world = worlds[index]
    svg = world['svg']
    # Each preview has its own IDs, gradients and clip paths. Inlining permits local raster assets.
    ids = re.findall(r'\bid="([^"]+)"', svg)
    for value in sorted(ids, key=len, reverse=True):
        svg = svg.replace(f'id="{value}"', f'id="preview-{serial}-{value}"')
        svg = svg.replace(f'url(#{value})', f'url(#preview-{serial}-{value})')
        svg = svg.replace(f'href="#{value}"', f'href="#preview-{serial}-{value}"')
    theme = re.search(r'<body style="([^"]+)"', (ROOT / (world['id'] + '.html')).read_text())[1]
    svg = re.sub(r'viewBox="[^"]+"', 'viewBox="435 40 755 625"', svg, count=1)
    svg = re.sub(r'\s(?:role|tabindex|aria-labelledby|aria-label|data-act|data-drag|data-draw)="[^"]*"', '', svg)
    svg = svg.replace('class="art"', f'class="preview-art" style="{theme}" aria-hidden="true"', 1)
    return svg

order = [1, 0, 4] + list(range(10))
for serial, index in enumerate(order):
    template = template.replace(f'{{{{PREVIEW_{serial}}}}}', preview(index, serial))
manifest = {world['id']: {'file': world['id'] + '.html', 'name': world['name']} for world in worlds}
template = template.replace('{{WORLD_MANIFEST}}', json.dumps(manifest, ensure_ascii=False))
for filename in ['index.html', 'slow_island_collection.html']:
    (ROOT / filename).write_text(template)
print('Updated index.html and slow_island_collection.html from all 10 current scenes.')
