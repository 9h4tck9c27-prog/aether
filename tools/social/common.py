"""Shared helpers for the æther Instagram robot (stdlib only)."""
import datetime, json, os, pathlib, time, urllib.error, urllib.parse, urllib.request
from zoneinfo import ZoneInfo

LONDON = ZoneInfo("Europe/London")
SITE = os.environ.get("SITE_URL", "https://myaether.info")
GRAPH = "https://graph.instagram.com/" + os.environ.get("IG_API_VERSION", "v25.0")
ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = pathlib.Path(os.environ.get("SOCIAL_DATA", ROOT / "social-data"))   # checkout of the `social` branch


def now_london():
    return datetime.datetime.now(LONDON)


def monday_of(d):
    return d - datetime.timedelta(days=d.weekday())


def http(method, url, data=None, headers=None, raw=False, timeout=120):
    body = None
    headers = dict(headers or {})
    if isinstance(data, (bytes, bytearray)):
        body = data
    elif data is not None:
        body = urllib.parse.urlencode(data).encode(); headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
    req = urllib.request.Request(url, data=body, method=method, headers={"User-Agent": "aether-social/1.0", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            out = r.read()
            return out if raw else (json.loads(out) if out else None)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:600]
        raise RuntimeError(f"{method} {url.split('?')[0]} → {e.code}: {detail}") from None


def social_key():
    k = (os.environ.get("SOCIAL_KEY") or "").strip()
    if not k: raise SystemExit("SOCIAL_KEY is not set")
    return k


def kv_get(name):
    return http("GET", f"{SITE}/api/social/kv/{name}", headers={"x-social-key": social_key()})


def kv_put(name, value):
    return http("PUT", f"{SITE}/api/social/kv/{name}", json.dumps(value).encode(), {"x-social-key": social_key(), "Content-Type": "application/json"})


def upload(path, name, chunk=900_000):
    """Upload a file to the site in small parts (the site's request limit is a few MB)."""
    data = pathlib.Path(path).read_bytes()
    parts = max(1, -(-len(data) // chunk))
    for i in range(parts):
        r = http("PUT", f"{SITE}/api/social/media/{name}?part={i}&parts={parts}", data[i * chunk:(i + 1) * chunk], {"x-social-key": social_key()}, timeout=300)
    return r["url"]


def ig_token():
    """The current long-lived Instagram token. Seeded from the IG_TOKEN secret, refreshed weekly, kept on the site."""
    seed = os.environ.get("IG_TOKEN", "")
    saved = kv_get("ig-token") or {}
    if seed and saved.get("seed") != seed[-12:]:
        saved = {"token": seed, "seed": seed[-12:], "refreshed": 0}
    if not saved.get("token"): raise SystemExit("No Instagram token: add IG_TOKEN to the repository secrets")
    if time.time() - saved.get("refreshed", 0) > 7 * 86400:
        try:
            r = http("GET", "https://graph.instagram.com/refresh_access_token?" + urllib.parse.urlencode({"grant_type": "ig_refresh_token", "access_token": saved["token"]}))
            saved.update(token=r["access_token"], refreshed=time.time(), expires_in=r.get("expires_in"))
        except RuntimeError as e:
            print("token refresh failed (keeping current token):", e)
        kv_put("ig-token", saved)
    return saved["token"]


def ig(method, path, token, **params):
    params["access_token"] = token
    if method == "GET":
        return http("GET", f"{GRAPH}/{path}?" + urllib.parse.urlencode(params))
    return http(method, f"{GRAPH}/{path}", params)


def ig_user(token):
    me = ig("GET", "me", token, fields="user_id,username,followers_count,media_count")
    return me.get("user_id") or me["id"], me


def load_json(path, default=None):
    p = pathlib.Path(path)
    return json.loads(p.read_text()) if p.exists() else default


def save_json(path, value):
    p = pathlib.Path(path); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")
