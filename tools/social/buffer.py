"""Schedule the week's posts in Buffer (buffer.com), which publishes them to Instagram for us.

Used instead of the Instagram API when BUFFER_API_KEY is set: no Meta developer account needed.
Docs: https://developers.buffer.com (GraphQL at https://api.buffer.com, Bearer API key).
"""
import datetime, json, os
from common import LONDON, http

API = "https://api.buffer.com"


def gql(query):
    key = os.environ["BUFFER_API_KEY"]
    r = http("POST", API, json.dumps({"query": query}).encode(), {"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    if r.get("errors"): raise RuntimeError("Buffer: " + "; ".join(e.get("message", "?") for e in r["errors"]))
    return r["data"]


def s(v):
    return json.dumps(v, ensure_ascii=False)  # a JSON string is a valid GraphQL string literal


def instagram_channel():
    orgs = gql("query { account { organizations { id name } } }")["account"]["organizations"]
    for org in orgs:
        chans = gql(f"query {{ channels(input: {{ organizationId: {s(org['id'])} }}) {{ id name service isQueuePaused }} }}")["channels"]
        for c in chans:
            if c["service"].lower() == "instagram":
                return c
    raise RuntimeError("Buffer: no Instagram channel connected. In Buffer, connect @_aether.aether_ first.")


def schedule(post, urls, channel_id, caption):
    when = datetime.datetime.fromisoformat(f"{post['date']}T{post['time']}").replace(tzinfo=LONDON).astimezone(datetime.timezone.utc)
    fmt = post["format"]
    if fmt == "reel":
        assets = f"[{{ video: {{ url: {s(urls[0])}, metadata: {{ thumbnailOffset: 2600 }} }} }}]"
        meta = "{ instagram: { type: reel, shouldShareToFeed: true } }"
    else:
        alt = (post.get("alt") or "æther post")[:1000]
        assets = "[" + ", ".join(f"{{ image: {{ url: {s(u)}, metadata: {{ altText: {s(alt)} }} }} }}" for u in urls) + "]"
        meta = "{ instagram: { type: post, shouldShareToFeed: true } }"
    q = f"""mutation {{ createPost(input: {{
      text: {s(caption)}, channelId: {s(channel_id)}, schedulingType: automatic, mode: customScheduled,
      dueAt: {s(when.strftime('%Y-%m-%dT%H:%M:%S.000Z'))}, assets: {assets}, metadata: {meta}
    }}) {{ ... on PostActionSuccess {{ post {{ id dueAt }} }} ... on MutationError {{ message }} }} }}"""
    r = gql(q)["createPost"]
    if r.get("message"): raise RuntimeError("Buffer: " + r["message"])
    return {"buffer_id": r["post"]["id"], "due": r["post"]["dueAt"]}
