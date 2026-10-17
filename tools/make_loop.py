"""Render the 3D sphere animation to frames, then MP4 with ffmpeg."""
import base64, pathlib, subprocess, sys, shutil
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
name, w, h, slotY, slotH, secs = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5], float(sys.argv[6])
date = sys.argv[8] if len(sys.argv) > 8 else ""
frames = pathlib.Path(sys.argv[7]) / name; shutil.rmtree(frames, ignore_errors=True); frames.mkdir(parents=True)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8790", "-d", str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    import time; time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        page.on("pageerror", lambda e: print("ERR", e))
        page.goto(f"http://localhost:8790/tools/loop.html?slotY={slotY}&slotH={slotH}&date={date}"); page.wait_for_function("document.title === 'ready'", timeout=30000)
        for i in range(int(secs * 30)):
            d = page.evaluate("step()")
            (frames / f"f{i:04d}.jpg").write_bytes(base64.b64decode(d.split(",")[1]))
            if i % 60 == 0: print(name, i, flush=True)
        b.close()
finally: srv.terminate()
