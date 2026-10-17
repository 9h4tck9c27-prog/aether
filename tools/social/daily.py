"""Post anything that's due. Runs every 30 minutes; posts each item once, within 6 hours of its time."""
import datetime, json, sys, time
from common import DATA, LONDON, ig, ig_token, ig_user, load_json, now_london, save_json, monday_of

DRY = "--dry-run" in sys.argv


def caption_of(post):
    tags = " ".join("#" + t.lstrip("#") for t in post.get("hashtags", []))
    return (post["caption"].strip() + ("\n\n" + tags if tags else ""))[:2200]


def wait_ready(token, cid, limit=600):
    t0 = time.time()
    while True:
        st = ig("GET", cid, token, fields="status_code,status").get("status_code")
        if st == "FINISHED": return
        if st in ("ERROR", "EXPIRED"): raise RuntimeError(f"container {cid} {st}")
        if time.time() - t0 > limit: raise RuntimeError(f"container {cid} still {st} after {limit}s")
        time.sleep(20)


def publish(token, user, post, urls):
    fmt = post["format"]
    cap = caption_of(post)
    if fmt == "reel":
        video, cover = urls[0], (urls[1] if len(urls) > 1 else None)
        params = dict(media_type="REELS", video_url=video, caption=cap, share_to_feed="true")
        if cover: params["cover_url"] = cover
        cid = ig("POST", f"{user}/media", token, **params)["id"]
    elif fmt == "carousel":
        kids = [ig("POST", f"{user}/media", token, image_url=u, is_carousel_item="true")["id"] for u in urls]
        for k in kids: wait_ready(token, k, 180)
        cid = ig("POST", f"{user}/media", token, media_type="CAROUSEL", children=",".join(kids), caption=cap)["id"]
    else:
        params = dict(image_url=urls[0], caption=cap)
        if post.get("alt"): params["alt_text"] = post["alt"][:1000]
        cid = ig("POST", f"{user}/media", token, **params)["id"]
    wait_ready(token, cid)
    mid = ig("POST", f"{user}/media_publish", token, creation_id=cid)["id"]
    info = ig("GET", mid, token, fields="permalink,timestamp")
    return {"media_id": mid, "permalink": info.get("permalink"), "at": info.get("timestamp")}


def main():
    now = now_london()
    if (DATA / "PAUSE").exists():
        print("Paused: delete PAUSE on the social branch to resume."); return
    log = load_json(DATA / "log" / "posted.json", {})
    due = []
    for monday in {monday_of(now.date()), monday_of(now.date() - datetime.timedelta(days=1))}:
        plan = load_json(DATA / "plans" / f"{monday}.json")
        media = load_json(DATA / "media" / f"{monday}.json")
        if not plan or not media: continue
        for post in plan["posts"]:
            when = datetime.datetime.fromisoformat(f"{post['date']}T{post['time']}").replace(tzinfo=LONDON)
            if post["id"] in log or not (when <= now < when + datetime.timedelta(hours=6)): continue
            due.append((post, media["posts"].get(post["id"], {}).get("urls", [])))
    if not due:
        print(now.isoformat(), "nothing due"); return
    token = None if DRY else ig_token()
    user = None if DRY else ig_user(token)[0]
    for post, urls in due:
        if not urls: print("no media for", post["id"]); continue
        if DRY: print("would post", post["id"], urls); continue
        try:
            log[post["id"]] = publish(token, user, post, urls)
            print("posted", post["id"], log[post["id"]].get("permalink"))
        except Exception as e:
            print("FAILED", post["id"], e)
            fails = load_json(DATA / "log" / "failures.json", [])
            fails.append({"id": post["id"], "at": now.isoformat(), "error": str(e)[:500]})
            save_json(DATA / "log" / "failures.json", fails[-50:])
    save_json(DATA / "log" / "posted.json", log)


if __name__ == "__main__":
    main()
