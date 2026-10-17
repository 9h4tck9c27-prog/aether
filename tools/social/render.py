"""Render a week's posts from a plan JSON into Instagram-ready files.

  python3 tools/social/render.py plans/2026-10-19.json out/

Reels: the app's real 3D sphere (that day's sky) + text beats + a soft original ambient
pad, 1080x1920 MP4 under 4 MB. Carousels and quote cards: 1080x1350 JPEGs.
Writes out/manifest.json listing the files for each post.
"""
import base64, json, pathlib, shutil, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PORT = 8791
FPS = 30
REEL_SECS = 15.0
BEATS_AT = [(0.4, 4.1), (4.4, 8.2), (8.5, 11.7)]
END_AT = (11.9, 15.0)


def b64file(path, data_url):
    path.write_bytes(base64.b64decode(data_url.split(",", 1)[1]))


def card(page, spec, path):
    b64file(path, page.evaluate("s => renderSpec(s)", spec))


def reel_frames(browser, date, frames_dir):
    shutil.rmtree(frames_dir, ignore_errors=True); frames_dir.mkdir(parents=True)
    page = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    page.goto(f"http://localhost:{PORT}/tools/loop.html?slotY=0.06&slotH=0.5&date={date}")
    page.wait_for_function("document.title === 'ready'", timeout=60000)
    for i in range(int(REEL_SECS * FPS)):
        b64file(frames_dir / f"f{i:04d}.jpg", page.evaluate("step()"))
    page.close()


def ambient(path, secs):
    # An original, royalty-free pad: a soft A-minor-add9 chord with slow swells.
    notes = [110.0, 164.81, 220.0, 246.94, 329.63, 440.0]
    parts = [f"0.06*sin(2*PI*{f}*t)*(0.55+0.45*sin(2*PI*{0.05 + k * 0.013:.3f}*t+{k}))" for k, f in enumerate(notes)]
    expr = "+".join(parts)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"aevalsrc={expr}:s=44100:d={secs}",
                    "-af", f"lowpass=f=1800,aecho=0.8:0.7:60:0.35,afade=t=in:d=1.5,afade=t=out:st={secs - 2.5}:d=2.5,volume=0.9",
                    "-c:a", "aac", "-b:a", "96k", str(path)], check=True)


def encode_reel(frames_dir, overlays, audio, out, crf=24, maxrate="2600k"):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames_dir / "f%04d.jpg")]
    for png, _, _ in overlays:
        cmd += ["-loop", "1", "-t", str(REEL_SECS), "-framerate", str(FPS), "-i", str(png)]
    cmd += ["-i", str(audio)]
    chains, last = [], "0:v"
    for k, (_, a, b) in enumerate(overlays, start=1):
        chains.append(f"[{k}:v]format=rgba,fade=t=in:st={a}:d=0.45:alpha=1,fade=t=out:st={b - 0.4}:d=0.4:alpha=1[o{k}]")
        chains.append(f"[{last}][o{k}]overlay=0:0:enable='between(t,{a},{b})'[v{k}]")
        last = f"v{k}"
    cmd += ["-filter_complex", ";".join(chains), "-map", f"[{last}]", "-map", f"{len(overlays) + 1}:a",
            "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-maxrate", maxrate, "-bufsize", "5200k",
            "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)


def main(plan_path, out_dir):
    plan = json.loads(pathlib.Path(plan_path).read_text())
    out = pathlib.Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    work = out / "_work"; work.mkdir(exist_ok=True)
    manifest = {"week": plan["week"], "posts": {}}
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"])
            cards = browser.new_page()
            cards.goto(f"http://localhost:{PORT}/tools/social/cards.html"); cards.wait_for_function("document.title === 'ready'")
            for post in plan["posts"]:
                pid, fmt = post["id"], post["format"]
                files = []
                if fmt == "quote":
                    q = post["quote"]
                    f = out / f"{pid}.jpg"; card(cards, {"kind": "quote", **q}, f); files = [f.name]
                elif fmt == "single":
                    f = out / f"{pid}.jpg"; card(cards, {**post["slide"], "n": 1, "total": 1}, f); files = [f.name]
                elif fmt == "carousel":
                    slides = post["slides"]
                    for n, s in enumerate(slides, start=1):
                        f = out / f"{pid}-{n:02d}.jpg"; card(cards, {**s, "n": n, "total": len(slides)}, f); files.append(f.name)
                elif fmt == "reel":
                    frames = work / f"{pid}-frames"
                    reel_frames(browser, post["date"], frames)
                    overlays = []
                    for k, (txt, (a, b)) in enumerate(zip(post["beats"][:3], BEATS_AT)):
                        png = work / f"{pid}-beat{k}.png"; card(cards, {"kind": "beat", "text": txt}, png); overlays.append((png, a, b))
                    png = work / f"{pid}-end.png"; card(cards, {"kind": "end", **post.get("end", {})}, png); overlays.append((png, *END_AT))
                    audio = work / "pad.m4a"
                    if not audio.exists(): ambient(audio, REEL_SECS)
                    mp4 = out / f"{pid}.mp4"
                    for crf, rate in [(24, "2600k"), (27, "2000k"), (30, "1500k")]:
                        encode_reel(frames, overlays, audio, mp4, crf, rate)
                        if mp4.stat().st_size < 4_200_000: break
                    poster = out / f"{pid}-cover.jpg"
                    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "2.6", "-i", str(mp4), "-frames:v", "1", "-q:v", "3", str(poster)], check=True)
                    shutil.rmtree(frames, ignore_errors=True)
                    files = [mp4.name, poster.name]
                print("rendered", pid, files, flush=True)
                manifest["posts"][pid] = {"format": fmt, "files": files}
            browser.close()
    finally:
        srv.terminate()
    shutil.rmtree(work, ignore_errors=True)
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
