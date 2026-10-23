"""Render every slide in posts.html to a JPEG for Instagram. Usage: python render_posts.py OUTDIR"""
import pathlib, sys
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--allow-file-access-from-files"])
    page = b.new_page(viewport={"width": 1080, "height": 1920})
    page.goto(f"file://{here}/posts.html")
    page.wait_for_function("document.title === 'ready'", timeout=30000)
    for el in page.query_selector_all("section.slide"):
        name = el.get_attribute("id")
        el.screenshot(path=str(out / f"{name}.png"))
        print("made", name)
    b.close()
