"""Create a ready-to-upload, dependency-free static site ZIP."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
files = sorted(root.glob('*.html')) + [root / '.nojekyll']
files += sorted(p for p in (root / 'assets').iterdir() if p.suffix in {'.js', '.css', '.png', '.svg', '.webp'})
destination = root / 'slow-island-deploy.zip'
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, path.relative_to(root))
print(f'{destination.name}: {len(files)} files, {destination.stat().st_size / 1024 / 1024:.2f} MiB')
