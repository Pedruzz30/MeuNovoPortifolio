#!/usr/bin/env python3
"""Prepare the static portfolio for GitHub Pages with optimized images."""
from __future__ import annotations

from pathlib import Path
import shutil
import sys
from xml.sax.saxutils import escape

try:
    from PIL import Image, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required: python -m pip install Pillow") from exc

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SITE_URL = "https://pedruzz30.github.io/MeuNovoPortifolio/"
ASSET_FOLDERS = ("assets", "css", "js")


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    shutil.copy2(ROOT / "index.html", DIST / "index.html")
    for folder in ASSET_FOLDERS:
        shutil.copytree(ROOT / folder, DIST / folder)

    image_dir = DIST / "assets" / "images"
    conversions = []
    for original in sorted(image_dir.glob("*.png")):
        optimized = original.with_suffix(".webp")
        with Image.open(original) as source:
            image = ImageOps.exif_transpose(source)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            image.save(optimized, "WEBP", quality=88, method=6)
        if optimized.stat().st_size == 0:
            raise RuntimeError(f"Empty optimized image: {optimized}")
        conversions.append((original, optimized))

    # Rewrite both HTML image references (including social sharing tags) and
    # CSS backgrounds. Source files continue to work without a build step.
    for document in [DIST / "index.html", *DIST.glob("css/*.css")]:
        content = document.read_text(encoding="utf-8")
        for original, optimized in conversions:
            content = content.replace(original.name, optimized.name)
        document.write_text(content, encoding="utf-8")

    for original, optimized in conversions:
        print(f"image: {original.name} {original.stat().st_size:,} B -> {optimized.stat().st_size:,} B")
        original.unlink()

    (DIST / ".nojekyll").touch()
    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n",
        encoding="utf-8",
    )
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"<url><loc>{escape(SITE_URL)}</loc></url></urlset>\n",
        encoding="utf-8",
    )
    html = (DIST / "index.html").read_text(encoding="utf-8")
    if ".png" in html:
        raise RuntimeError("Production HTML unexpectedly references a PNG")
    for image_name in ("PerfilFotoHeroIMG.webp", "FundoHeroIMG.webp"):
        if not (image_dir / image_name).exists():
            raise RuntimeError(f"Missing required image: {image_name}")
    print(f"Build completed: {DIST}")


if __name__ == "__main__":
    main()
