"""Delete every post still waiting in Buffer's queue that our robots scheduled (log/buffer.json).
Run by .github/workflows/social-clear.yml. Writes log/cleared.json with what was removed."""
import datetime
from common import DATA, load_json, now_london, save_json
import buffer

done = load_json(DATA / "log" / "buffer.json", {})
now = datetime.datetime.now(datetime.timezone.utc)
removed, failed, past = [], {}, []
for key, v in list(done.items()):
    due = datetime.datetime.fromisoformat(v["due"].replace("Z", "+00:00"))
    if due <= now:
        past.append(key); continue
    try:
        buffer.delete(v["buffer_id"]); removed.append(key); del done[key]
    except Exception as e:
        failed[key] = str(e)[:400]
save_json(DATA / "log" / "buffer.json", done)
save_json(DATA / "log" / "cleared.json", {"at": now_london().isoformat(), "removed": removed, "failed": failed, "already_posted": past})
print("removed", removed, "failed", failed, "already posted", past)
if failed: raise SystemExit(1)
