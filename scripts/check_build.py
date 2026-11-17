#!/usr/bin/env python3
"""Structural checks for the built static portfolio. No runtime dependencies."""
from html.parser import HTMLParser
from pathlib import Path

DIST = Path(__file__).resolve().parent.parent / "dist"


class PortfolioParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.images = []
        self.main_count = 0
        self.h1_count = 0

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(data["id"])
        if tag == "a" and data.get("href"):
            self.links.append(data["href"])
        if tag == "img":
            self.images.append(data.get("src", ""))
        if tag == "main":
            self.main_count += 1
        if tag == "h1":
            self.h1_count += 1


def main():
    html = (DIST / "index.html").read_text(encoding="utf-8")
    parser = PortfolioParser()
    parser.feed(html)
    assert parser.main_count == 1, f"Expected one main, got {parser.main_count}"
    assert parser.h1_count == 1, f"Expected one h1, got {parser.h1_count}"
    assert len(set(parser.ids)) == len(parser.ids), "Duplicate HTML ids"
    for link in parser.links:
        if link.startswith("#"):
            assert link[1:] in parser.ids, f"Broken page anchor: {link}"
    for image in parser.images:
        assert image.endswith(".webp"), f"Unoptimized image reference: {image}"
        assert (DIST / image).resolve().is_file(), f"Image missing: {image}"
    assert "og:image" in html and "rel=\"canonical\"" in html, "Missing SEO metadata"
    assert "project-stories-title" in parser.ids, "Missing project studies"
    assert (DIST / "assets" / "favicon.svg").is_file(), "Missing favicon"
    for path in ["robots.txt", "sitemap.xml", ".nojekyll"]:
        assert (DIST / path).exists(), f"Missing deployment asset: {path}"
    print("Build structure and SEO checks passed.")


if __name__ == "__main__":
    main()
