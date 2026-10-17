"""Sunday: make sure next week's plan exists, render and upload it, gather last week's numbers,
then email the brief at 11:00 London.

  python3 weekly.py            full run (waits until 11:00 London to send)
  python3 weekly.py --no-wait  send as soon as it's ready
  python3 weekly.py --dry-run  everything except uploading, posting and emailing (writes brief.html)
"""
import datetime, html, json, os, pathlib, smtplib, subprocess, sys, time
from email.message import EmailMessage
from common import DATA, ROOT, SITE, http, ig, ig_token, ig_user, load_json, now_london, save_json, social_key, upload
import fallback, validate

DRY = "--dry-run" in sys.argv
OUT = ROOT / "social-out"
METRICS = ["views", "reach", "likes", "comments", "saved", "shares", "total_interactions"]


def next_monday(today):
    return today + datetime.timedelta(days=(7 - today.weekday()) % 7 or 7)


def ensure_plan(monday):
    path = DATA / "plans" / f"{monday}.json"
    plan = load_json(path)
    source = "creative director"
    if plan:
        errs = validate.check(plan)
        if errs:
            print("Plan has errors, using the automatic plan instead:", *errs, sep="\n  ")
            plan, source = None, "automatic (the creative director's plan had errors)"
    if not plan:
        plan = fallback.make(monday); source = source if source != "creative director" else "automatic (no plan from the creative director)"
        save_json(path, plan)
    return plan, source


def render_and_upload(plan, monday):
    mpath = DATA / "media" / f"{monday}.json"
    existing = load_json(mpath)
    if existing and all(p["id"] in existing["posts"] and existing["posts"][p["id"]].get("urls") for p in plan["posts"]):
        return existing
    subprocess.run([sys.executable, str(ROOT / "tools/social/render.py"), str(DATA / "plans" / f"{monday}.json"), str(OUT)], check=True)
    manifest = json.loads((OUT / "manifest.json").read_text())
    for pid, entry in manifest["posts"].items():
        entry["urls"] = [f"{SITE}/api/social/media/{f}" if DRY else upload(OUT / f, f) for f in entry["files"]]
    if not DRY: save_json(mpath, manifest)
    return manifest


def schedule_in_buffer(plan, manifest, monday):
    """Hand the week to Buffer, once per post. Returns a short note for the brief."""
    import buffer
    from daily import caption_of
    done = load_json(DATA / "log" / "buffer.json", {})
    try:
        chan = buffer.instagram_channel()
    except RuntimeError as e:
        return f"Couldn't reach Buffer: {e}"
    ok, failed = 0, []
    for p in plan["posts"]:
        if p["id"] in done: ok += 1; continue
        try:
            done[p["id"]] = buffer.schedule(p, manifest["posts"][p["id"]]["urls"], chan["id"], caption_of(p)); ok += 1
        except Exception as e:
            failed.append(f"{p['id']}: {e}")
    save_json(DATA / "log" / "buffer.json", done)
    note = f"{ok} of {len(plan['posts'])} posts are scheduled in Buffer and will publish automatically."
    if chan.get("isQueuePaused"): note += " Your Buffer queue is paused, so nothing will publish until you unpause it."
    if failed: note += " Not scheduled: " + "; ".join(failed)[:600]
    return note


def insights_for(token, media_id):
    out = {}
    for m in METRICS:
        try:
            r = ig("GET", f"{media_id}/insights", token, metric=m)
            vals = r.get("data", [])
            if vals: out[m] = vals[0].get("values", [{}])[0].get("value", vals[0].get("total_value", {}).get("value"))
        except RuntimeError:
            pass
    return out


def analytics(last_monday):
    """Numbers for the week that just ended (Mon–Sun)."""
    rep = {"week": last_monday.isoformat(), "posts": [], "account": {}, "site": {}, "errors": []}
    since = datetime.datetime.combine(last_monday, datetime.time(0), tzinfo=datetime.timezone.utc)
    until = since + datetime.timedelta(days=7)
    try:
        token = ig_token(); user, me = ig_user(token)
        rep["account"] = {"username": me.get("username"), "followers": me.get("followers_count"), "posts": me.get("media_count")}
        media = ig("GET", f"{user}/media", token, fields="id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count", limit=50).get("data", [])
        for m in media:
            ts = datetime.datetime.fromisoformat(m["timestamp"].replace("+0000", "+00:00"))
            if since <= ts < until:
                rep["posts"].append({**{k: m.get(k) for k in ("id", "media_type", "media_product_type", "timestamp", "permalink", "like_count", "comments_count")},
                                     "caption": (m.get("caption") or "").split("\n")[0][:90], "insights": insights_for(token, m["id"])})
        for metric in ["reach", "views", "profile_views", "follows_and_unfollows", "website_clicks", "profile_links_taps"]:
            try:
                r = ig("GET", f"{user}/insights", token, metric=metric, period="day", metric_type="total_value",
                       since=int(since.timestamp()), until=int(until.timestamp()))
                d = r.get("data", [])
                if d: rep["account"][metric] = d[0].get("total_value", {}).get("value")
            except RuntimeError as e:
                rep["errors"].append(f"{metric}: unavailable")
    except (RuntimeError, SystemExit) as e:
        rep["errors"].append(f"Instagram: {e}")
    try:
        stats = http("GET", f"{SITE}/api/stats", headers={"x-social-key": social_key()})
        days = {d["day"]: d for d in stats.get("days", [])}
        wk = [days.get((last_monday + datetime.timedelta(days=i)).isoformat(), {}) for i in range(7)]
        rep["site"] = {k: sum(d.get(k, 0) for d in wk) for k in ("open", "reading", "instagram")}
    except (RuntimeError, SystemExit) as e:
        rep["errors"].append(f"Site stats: {e}")
    prev = load_json(DATA / "analytics" / f"{last_monday - datetime.timedelta(days=7)}.json")
    if prev and prev.get("account", {}).get("followers") is not None and rep["account"].get("followers") is not None:
        rep["account"]["followers_change"] = rep["account"]["followers"] - prev["account"]["followers"]
    return rep


# ---------- The email ----------
E = html.escape
DAYNAME = lambda iso: datetime.date.fromisoformat(iso).strftime("%a %-d %b")
FMT = {"reel": "Reel", "carousel": "Carousel", "quote": "Quote card", "single": "Single image"}


def headline_of(p):
    if p["format"] == "reel": return p["beats"][0]
    if p["format"] == "carousel": return p["slides"][0].get("headline", "")
    if p["format"] == "quote": return "“" + p["quote"]["text"] + "”"
    return p["slide"].get("headline", "")


def num(v):
    return "–" if v is None else f"{v:,}" if isinstance(v, int) else str(v)


def brief_html(plan, source, manifest, rep, buffer_note=None):
    handoff = not os.environ.get("IG_TOKEN") and not buffer_note
    handoff_box = ("""<div style="background:#fff4ec;border:1px solid #ffd2b8;border-radius:12px;padding:12px 14px;margin:6px 0 14px;font-size:14px;line-height:1.5">
      <b>Hand-off mode:</b> Instagram isn't connected yet, so the robot can't post for you this week. Tap each post's download link, then schedule it in
      Meta Business Suite (or the Instagram app: + → Advanced settings → Schedule) and paste in the caption and hashtags. About 5 minutes for the week.</div>""" if handoff else "")
    css = "font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1230"
    rows = []
    for p in plan["posts"]:
        m = manifest["posts"].get(p["id"], {}); urls = m.get("urls", [])
        thumb = next((u for u in urls if u.endswith(".jpg")), None)
        link = urls[0] if urls else "#"
        extra = f"{len(urls)} slides" if p["format"] == "carousel" else ("video" if p["format"] == "reel" else "")
        rows.append(f"""<tr><td style="padding:14px 0;border-top:1px solid #e7e1f1;vertical-align:top;width:120px">
          <a href="{E(link)}"><img src="{E(thumb or '')}" width="108" style="border-radius:10px;display:block" alt=""></a></td>
          <td style="padding:14px 0 14px 14px;border-top:1px solid #e7e1f1;vertical-align:top">
          <div style="font-size:12px;color:#6a5f80;letter-spacing:.04em;text-transform:uppercase">{E(DAYNAME(p['date']))} · {E(p['time'])} · {E(FMT[p['format']])}{' · ' + extra if extra else ''} · {E(p.get('pillar',''))}</div>
          <div style="font-family:Georgia,serif;font-size:19px;line-height:1.3;margin:6px 0 8px">{E(headline_of(p))}</div>
          <div style="font-size:14px;line-height:1.5;color:#3d3352;white-space:pre-line">{E(p['caption'][:420])}{'…' if len(p['caption']) > 420 else ''}</div>
          <div style="font-size:13px;color:#6A52D1;margin-top:6px">{E(' '.join('#' + t for t in p.get('hashtags', [])))}</div>
          <div style="font-size:13px;margin-top:6px">{' · '.join(f'<a href="{E(u)}" style="color:#6A52D1">{"Download video" if u.endswith(".mp4") else ("Download cover" if "-cover" in u else ("Download slide " + str(k + 1) if p["format"] == "carousel" else "Download image"))}</a>' for k, u in enumerate(urls))}</div></td></tr>""")
    # Analytics
    a = rep.get("account", {}); s = rep.get("site", {})
    posts = sorted(rep.get("posts", []), key=lambda x: -(x["insights"].get("reach") or x["insights"].get("views") or 0))
    prow = "".join(f"""<tr><td style="padding:8px 6px;border-top:1px solid #e7e1f1"><a href="{E(x.get('permalink') or '#')}" style="color:#1C1230">{E(x['caption'] or x['media_product_type'] or '')}</a></td>
        {''.join(f'<td style="padding:8px 6px;border-top:1px solid #e7e1f1;text-align:right">{num(x["insights"].get(k, x.get(k2)))}</td>' for k, k2 in [("reach", None), ("views", None), ("likes", "like_count"), ("comments", "comments_count"), ("saved", None), ("shares", None)])}</tr>""" for x in posts)
    best = posts[0] if posts else None
    tiles = [("Followers", a.get("followers"), a.get("followers_change")), ("Accounts reached", a.get("reach"), None), ("Profile views", a.get("profile_views"), None),
             ("Visits from Instagram", s.get("instagram"), None), ("App opens", s.get("open"), None), ("Readings", s.get("reading"), None)]
    t = [tiles[i:i + 3] for i in (0, 3)]
    tile_rows = "".join("<tr>" + "".join(f"""<td style="padding:10px;background:#f6f2fb;border:4px solid #fff;border-radius:14px;text-align:center"><div style="font-size:24px;font-weight:600">{num(v)}</div><div style="font-size:12px;color:#6a5f80">{E(lbl)}{f' ({"+" if d >= 0 else ""}{d})' if isinstance(d, int) else ''}</div></td>""" for lbl, v, d in row) + "</tr>" for row in t)
    errs = "".join(f"<li>{E(e)}</li>" for e in rep.get("errors", []))
    return f"""<!doctype html><html><body style="margin:0;background:#f3eff8"><div style="max-width:640px;margin:0 auto;background:#fff;{css}">
  <div style="background:#1C1230;color:#F7F2FB;padding:28px 28px 22px"><div style="font-family:Georgia,serif;font-style:italic;font-size:30px">æther</div>
  <div style="font-size:15px;opacity:.85;margin-top:4px">Your Sunday brief · week of {E(datetime.date.fromisoformat(plan['week']).strftime('%-d %B %Y'))}</div></div>
  <div style="padding:22px 28px">
  <p style="font-size:16px;line-height:1.55;margin:0 0 6px"><b>This week:</b> {E(plan.get('theme',''))}</p>
  <p style="font-size:14px;line-height:1.55;color:#3d3352;margin:0 0 4px"><b>What changed and why:</b> {E(plan.get('notes',''))}</p>
  {handoff_box}
  {f'<div style="background:#eefaf6;border:1px solid #bfe9db;border-radius:12px;padding:12px 14px;margin:6px 0 14px;font-size:14px;line-height:1.5"><b>Buffer:</b> {E(buffer_note)}</div>' if buffer_note else ''}
  <p style="font-size:12px;color:#6a5f80;margin:0 0 18px">Plan by: {E(source)}. {"Schedule each post for the time shown (London time)." if handoff else "Posts go out automatically at the times below (London time)."}</p>
  <h2 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:18px 0 4px">The week's posts</h2>
  <table style="width:100%;border-collapse:collapse">{''.join(rows)}</table>
  <h2 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:28px 0 8px">How last week went</h2>
  <table style="width:100%;border-collapse:separate">{tile_rows}</table>
  {f'<p style="font-size:14px;line-height:1.5;margin:14px 0">Best post: <a href="{E(best.get("permalink") or "#")}" style="color:#6A52D1">{E(best["caption"])}</a>, reaching {num(best["insights"].get("reach"))} accounts.</p>' if best else '<p style="font-size:14px;color:#6a5f80">No posts went out last week, so there are no post numbers yet.</p>'}
  {f'<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#6a5f80;text-align:right"><th style="text-align:left;padding:6px">Post</th><th style="padding:6px">Reach</th><th style="padding:6px">Views</th><th style="padding:6px">Likes</th><th style="padding:6px">Comments</th><th style="padding:6px">Saves</th><th style="padding:6px">Shares</th></tr>{prow}</table>' if posts else ''}
  {f'<p style="font-size:12px;color:#6a5f80;margin-top:16px">Some numbers were unavailable (Instagram only shares some figures once an account has 100 followers):</p><ul style="font-size:12px;color:#6a5f80">{errs}</ul>' if errs else ''}
  <p style="font-size:12px;color:#6a5f80;margin-top:22px">To pause posting, ask Claude to pause æther's Instagram, or add a file called PAUSE to the <i>social</i> branch of the repo.</p>
  </div></div></body></html>"""


def send(subject, body_html):
    user, pw, to = os.environ.get("SMTP_USER"), os.environ.get("SMTP_PASS"), os.environ.get("REPORT_TO")
    if not (user and pw and to): raise SystemExit("SMTP_USER, SMTP_PASS and REPORT_TO must be set to send the brief")
    msg = EmailMessage(); msg["Subject"] = subject; msg["From"] = f"æther <{user}>"; msg["To"] = to
    msg.set_content("Your æther Sunday brief is best viewed as HTML.")
    msg.add_alternative(body_html, subtype="html")
    with smtplib.SMTP(os.environ.get("SMTP_HOST", "smtp.mail.me.com"), int(os.environ.get("SMTP_PORT", "587")), timeout=60) as s:
        s.starttls(); s.login(user, pw); s.send_message(msg)


def make_previews(manifest, monday):
    """Small copies of every post on the social branch, so Claude can show them for approval."""
    d = DATA / "preview" / str(monday); d.mkdir(parents=True, exist_ok=True)
    for pid, entry in manifest["posts"].items():
        for f in entry["files"]:
            src, dst = OUT / f, d / f
            if dst.exists() or not src.exists(): continue
            if f.endswith(".mp4"):
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "30", "-preset", "veryfast",
                                "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", str(dst)], check=True)
            else:
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", "scale=540:-2", "-q:v", "5", str(dst)], check=True)


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def main():
    today = now_london().date()
    monday = datetime.date.fromisoformat(arg("--week")) if arg("--week") else next_monday(today)
    last_monday = monday - datetime.timedelta(days=7)

    if "--schedule" in sys.argv:
        # Approved in chat: hand the rendered week to Buffer.
        plan = load_json(DATA / "plans" / f"{monday}.json"); manifest = load_json(DATA / "media" / f"{monday}.json")
        if not plan or not manifest: raise SystemExit(f"Week of {monday} isn't rendered yet")
        note = schedule_in_buffer(plan, manifest, monday)
        save_json(DATA / "log" / f"approved-{monday}.json", {"at": now_london().isoformat(), "buffer": note})
        print(note); return

    plan, source = ensure_plan(monday)
    manifest = render_and_upload(plan, monday)
    if not DRY: make_previews(manifest, monday)
    rep = analytics(last_monday) if not DRY else {"week": str(last_monday), "posts": [], "account": {}, "site": {}, "errors": ["dry run: no live numbers"]}
    if not DRY: save_json(DATA / "analytics" / f"{last_monday}.json", rep); save_json(DATA / "analytics" / "latest.json", rep)
    auto = os.environ.get("AUTO_APPROVE") == "1" and os.environ.get("BUFFER_API_KEY")
    buffer_note = schedule_in_buffer(plan, manifest, monday) if (auto and not DRY) else ("Waiting for your approval in Claude before anything is scheduled." if os.environ.get("BUFFER_API_KEY") else None)
    body = brief_html(plan, source, manifest, rep, buffer_note)
    (ROOT / "social-out").mkdir(exist_ok=True); (ROOT / "social-out" / "brief.html").write_text(body)
    save_json(DATA / "preview" / str(monday) / "summary.json", {"week": str(monday), "source": source, "buffer": buffer_note, "analytics": rep})
    if DRY: print("dry run: wrote social-out/brief.html"); return
    if not (os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS") and os.environ.get("REPORT_TO")):
        print("No email settings: the brief is reviewed in Claude instead."); return
    sent_marker = DATA / "log" / f"brief-{monday}.sent"
    if sent_marker.exists(): print("Brief already sent for", monday); return
    if "--no-wait" not in sys.argv:
        target = now_london().replace(hour=11, minute=0, second=0, microsecond=0)
        wait = (target - now_london()).total_seconds()
        if 0 < wait < 4 * 3600: print(f"waiting {wait/60:.0f} min until 11:00 London"); time.sleep(wait)
    send(f"æther · your week of {monday.strftime('%-d %B')}: {len(plan['posts'])} posts + last week's numbers", body)
    sent_marker.parent.mkdir(parents=True, exist_ok=True); sent_marker.write_text(now_london().isoformat())
    print("brief sent")


if __name__ == "__main__":
    import traceback
    record = {"started": now_london().isoformat(), "args": sys.argv[1:]}
    try:
        main(); record["status"] = "ok"
    except BaseException as e:
        record["status"] = "failed"; record["error"] = f"{type(e).__name__}: {e}"; record["trace"] = traceback.format_exc()[-3000:]
        raise
    finally:
        record["finished"] = now_london().isoformat()
        if not DRY: save_json(DATA / "log" / "last-weekly.json", record)
