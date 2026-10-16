"""Render Æther's brand assets from tools/brand.html into brand/."""
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "brand"; out.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--allow-file-access-from-files"])
    page = b.new_page(); page.goto(f"file://{root}/tools/brand.html?kind=banner"); page.wait_for_function("document.title === 'ready'")
    kinds = page.evaluate("KINDS_LIST"); page.close()
    for k in kinds:
        page = b.new_page(); page.goto(f"file://{root}/tools/brand.html?kind={k}"); page.wait_for_function("document.title === 'ready'")
        data = page.evaluate("document.getElementById('art').toDataURL('image/png')")
        import base64; (out / f"aether-{k}.png").write_bytes(base64.b64decode(data.split(",")[1])); page.close(); print("made", k)
    b.close()
