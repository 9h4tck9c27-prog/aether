"""Render Skymood's icons and link-preview image from tools/art.html with headless Chromium."""
import pathlib, sys
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
out = root / "site"
(out / "icons").mkdir(parents=True, exist_ok=True)
jobs = [
    ("icon", 512, "icons/icon-512.png"),
    ("icon", 192, "icons/icon-192.png"),
    ("maskable", 512, "icons/icon-maskable-512.png"),
    ("icon", 180, "icons/apple-touch-icon.png"),
    ("icon", 32, "icons/favicon-32.png"),
    ("og", 0, "og-image.png"),
]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--allow-file-access-from-files"])
    for kind, size, name in jobs:
        page = b.new_page()
        page.goto(f"file://{root}/tools/art.html?kind={kind}&size={size}")
        page.wait_for_function("document.title === 'ready'")
        page.locator("#art").screenshot(path=str(out / name))
        page.close()
        print("made", name)
    b.close()
