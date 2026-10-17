"""A simple plan from the real sky, used only if the creative director didn't deliver one."""
import datetime, json, random, subprocess, sys
from common import ROOT

QUOTES = [
    {"text": "Hope is the thing with feathers that perches in the soul.", "author": "Emily Dickinson", "work": ""},
    {"text": "To every thing there is a season, and a time to every purpose under the heaven.", "author": "Ecclesiastes 3:1", "work": "King James Bible"},
    {"text": "I am large, I contain multitudes.", "author": "Walt Whitman", "work": "Song of Myself"},
    {"text": "The deeper that sorrow carves into your being, the more joy you can contain.", "author": "Kahlil Gibran", "work": "The Prophet"},
    {"text": "All shall be well, and all shall be well, and all manner of thing shall be well.", "author": "Julian of Norwich", "work": ""},
    {"text": "Heaven is under our feet as well as over our heads.", "author": "Henry David Thoreau", "work": "Walden"},
]
RELATABLE = ["Some weeks the sky is loud. Be gentle with yourself.", "Rest is not giving up. It's how the Moon does it too.",
             "You're allowed to be a work in progress and a masterpiece.", "If today felt heavy, it's not just you."]
CTA = {"kind": "cta", "headline": "Your free reading is waiting", "bullets": ["Totally free, always", "No account needed", "New every day", "440 planetary angles checked"], "button": "myaether.info · link in bio"}
TAGS = ["astrology", "dailyhoroscope", "spirituality", "zodiac"]


def make(monday):
    sky = json.loads(subprocess.check_output(["node", str(ROOT / "tools/social/sky.mjs"), monday.isoformat()], cwd=ROOT))
    rnd = random.Random(monday.toordinal())
    d = lambda i: (monday + datetime.timedelta(days=i)).isoformat()
    ev = sky["events"][:5] or [{"date": d(0), "plain": f"The Moon moves through {sky['days'][0]['moon']['sign']}."}]
    day_name = lambda iso: datetime.date.fromisoformat(iso).strftime("%A")
    moon = sky["days"][3]["moon"]
    nxt = sky.get("nextLunation")
    posts = [
        {"id": f"{d(0)}-promo", "date": d(0), "time": "17:00", "format": "reel", "pillar": "promo",
         "beats": ["What is the sky saying about your day?", "A free reading from the real sky and your birth chart.", "No account. No paywall. New every day."],
         "caption": "æther reads today's real sky against your birth chart and tells you what it means in plain, warm words.\n\nFree, no account, new every day. Link in bio: myaether.info", "hashtags": TAGS},
        {"id": f"{d(1)}-sky", "date": d(1), "time": "17:00", "format": "carousel", "pillar": "sky-this-week",
         "slides": [{"kind": "cover", "kicker": "This week's sky", "headline": "What's moving above you this week"}]
         + [{"kind": "text", "kicker": day_name(e["date"]), "headline": e["plain"].split(":")[0][:70], "body": e["plain"]} for e in ev[:4]] + [CTA],
         "caption": "This week's sky in plain words. How does it land in your chart? Your free reading is in the link in bio.", "hashtags": TAGS + ["weeklyhoroscope"],
         "alt": "Slides explaining this week's astrology on a night sky."},
        {"id": f"{d(2)}-quote", "date": d(2), "time": "17:00", "format": "quote", "pillar": "quote", "quote": rnd.choice(QUOTES),
         "caption": "A line to carry this week. Your free daily reading is in the link in bio.", "hashtags": ["poetry", "astrology"], "alt": "A quote on a dusk sky."},
        {"id": f"{d(3)}-moon", "date": d(3), "time": "17:00", "format": "reel", "pillar": "moon",
         "beats": [f"The Moon is in {moon['sign']}.", moon["mansionPlain"][:60], "See what it means for you."],
         "caption": f"The Moon is {moon['lit']}% lit and moving through {moon['sign']}. Your free reading follows her through all 27 lunar mansions. Link in bio.", "hashtags": ["moon", "moonphases"] + TAGS[:2]},
        {"id": f"{d(4)}-learn", "date": d(4), "time": "17:00", "format": "carousel", "pillar": "education",
         "slides": [{"kind": "cover", "kicker": "Astrology, plainly", "headline": "What is a birth chart?"},
                    {"kind": "text", "kicker": "The idea", "headline": "A map of the sky the moment you were born", "body": "Where the Sun, Moon and planets were, seen from your birthplace."},
                    {"kind": "text", "kicker": "Why it matters", "headline": "Today's sky talks to it", "body": "When today's planets make angles to your birth chart, astrologers read it as the weather of your day."},
                    CTA],
         "caption": "Your birth chart, explained in 30 seconds. See yours, free, in the link in bio.", "hashtags": TAGS + ["birthchart"], "alt": "Slides explaining a birth chart."},
        {"id": f"{d(5)}-relatable", "date": d(5), "time": "17:00", "format": "single", "pillar": "relatable",
         "slide": {"kind": "cover", "kicker": "It's not just you", "headline": rnd.choice(RELATABLE)},
         "caption": "Send this to someone who needs it. Free daily reading in the link in bio.", "hashtags": ["itsnotjustyou", "astrology"], "alt": "A short affirmation on a night sky."},
        {"id": f"{d(6)}-ahead", "date": d(6), "time": "17:00", "format": "reel", "pillar": "week-ahead",
         "beats": ["Here's what's coming next week.", (nxt["plain"] if nxt else "A fresh week under a new sky.")[:60], "Your free reading is waiting."],
         "caption": "A fresh week under a new sky. See what it means for you, free, in the link in bio.", "hashtags": TAGS + ["weeklyhoroscope"]},
    ]
    return {"week": monday.isoformat(), "timezone": "Europe/London", "theme": "Automatic plan (the creative director's plan was missing).",
            "notes": "Fallback plan generated from the real sky.", "posts": posts}


if __name__ == "__main__":
    print(json.dumps(make(datetime.date.fromisoformat(sys.argv[1])), indent=2, ensure_ascii=False))
