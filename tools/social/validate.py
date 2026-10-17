"""Check a weekly plan before it is rendered and posted. Exit 1 on errors."""
import json, re, sys, datetime

BANNED = [r"\bÆther\b", r"\bAether\b(?! App)", r"\bdonat", r"\bguarantee", r"\bscientifically\b", r"\bproven\b", r"\bcure\b"]
LIMITS = {"beat": 60, "headline": 70, "body": 220, "caption": 2200}


def check(plan):
    errs = []
    def text_ok(where, s, limit=None):
        if not isinstance(s, str) or not s.strip(): errs.append(f"{where}: empty"); return
        if limit and len(s) > limit: errs.append(f"{where}: {len(s)} chars, limit {limit}")
        for pat in BANNED:
            if re.search(pat, s, re.I if "Æ" not in pat else 0): errs.append(f"{where}: contains banned wording /{pat}/")
    try: monday = datetime.date.fromisoformat(plan["week"])
    except Exception: return ["week: must be YYYY-MM-DD"]
    if monday.weekday() != 0: errs.append("week: must be a Monday")
    posts = plan.get("posts") or []
    if not 5 <= len(posts) <= 14: errs.append(f"posts: {len(posts)} (want 5–14)")
    ids = set()
    for i, p in enumerate(posts):
        w = f"posts[{i}] {p.get('id')}"
        if not re.fullmatch(r"[a-z0-9-]{3,60}", p.get("id", "")): errs.append(f"{w}: id must be lowercase letters, digits, hyphens")
        if p.get("id") in ids: errs.append(f"{w}: duplicate id")
        ids.add(p.get("id"))
        try:
            d = datetime.date.fromisoformat(p["date"])
            if not -7 <= (d - monday).days <= 6: errs.append(f"{w}: date outside the week (posts may move up to a week early)")
        except Exception: errs.append(f"{w}: bad date")
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", p.get("time", "")): errs.append(f"{w}: time must be HH:MM")
        fmt = p.get("format")
        if fmt == "reel":
            beats = p.get("beats") or []
            if not 2 <= len(beats) <= 3: errs.append(f"{w}: reels need 2–3 beats")
            for k, b in enumerate(beats): text_ok(f"{w} beat {k}", b, LIMITS["beat"])
        elif fmt == "carousel":
            sl = p.get("slides") or []
            if not 3 <= len(sl) <= 10: errs.append(f"{w}: carousels need 3–10 slides")
            if sl and sl[0].get("kind") != "cover": errs.append(f"{w}: first slide must be cover")
            if sl and sl[-1].get("kind") != "cta": errs.append(f"{w}: last slide must be cta")
            for k, s in enumerate(sl):
                if s.get("kind") not in ("cover", "text", "cta"): errs.append(f"{w} slide {k}: kind must be cover, text or cta")
                if s.get("kind") != "cta" or s.get("headline"): text_ok(f"{w} slide {k} headline", s.get("headline", "Your free reading is waiting"), LIMITS["headline"])
                if s.get("body"): text_ok(f"{w} slide {k} body", s["body"], LIMITS["body"])
        elif fmt == "quote":
            q = p.get("quote") or {}
            text_ok(f"{w} quote", q.get("text"), 200)
        elif fmt == "single":
            s = p.get("slide") or {}
            if s.get("kind") not in ("cover", "text", "cta"): errs.append(f"{w}: single slide kind must be cover, text or cta")
            text_ok(f"{w} headline", s.get("headline"), LIMITS["headline"])
        else:
            errs.append(f"{w}: format must be reel, carousel, quote or single")
        cap = p.get("caption", "")
        text_ok(f"{w} caption", cap, LIMITS["caption"])
        if "myaether.info" not in cap and "link in bio" not in cap.lower(): errs.append(f"{w}: caption needs a call to action (myaether.info or link in bio)")
        tags = p.get("hashtags") or []
        if not 1 <= len(tags) <= 15: errs.append(f"{w}: 1–15 hashtags")
        if any(not re.fullmatch(r"[A-Za-z0-9_]+", t.lstrip("#")) for t in tags): errs.append(f"{w}: hashtags must be letters, digits or _")
    return errs


if __name__ == "__main__":
    errs = check(json.load(open(sys.argv[1])))
    for e in errs: print("ERROR", e)
    print("ok" if not errs else f"{len(errs)} error(s)")
    sys.exit(1 if errs else 0)
