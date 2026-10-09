"""Gera as variantes responsivas das fotos (public/img/*.jpg → public/img/r/).

Larguras 480/720/1080/1440, AVIF (q55, speed 4) e WebP (q78, method 6).
O componente <Picture> (src/components/Surfaces.tsx) usa esses arquivos via
srcset; o JPEG original fica como fallback.

Uso: python3 scripts/make-responsive-images.py   (requer Pillow ≥ 11.2 com AVIF,
ou `pip install pillow-avif-plugin`)
"""
from pathlib import Path
from PIL import Image

try:  # Pillow < 11.2
    import pillow_avif  # noqa: F401
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent / "public" / "img"
OUT = ROOT / "r"
WIDTHS = (480, 720, 1080, 1440)
OUT.mkdir(exist_ok=True)
for src in sorted(ROOT.glob("*.jpg")):
    im = Image.open(src).convert("RGB")
    for w in WIDTHS:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(OUT / f"{src.stem}-{w}.avif", quality=55, speed=4)
        r.save(OUT / f"{src.stem}-{w}.webp", quality=78, method=6)
    print(src.name)
