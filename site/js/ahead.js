// "What's next": the real sky over the coming week, and what it might mean for you.
// Uses the same astronomy as the reading, so every date here is real.
import { positions, signOf, sep, moonPhase } from "./astro.js";
import { PLANETS, ASPECTS } from "./data.js";

const DAY = 864e5;
const A = () => window.Astronomy;

// A few words for each sign's mood, used when a planet changes sign.
const SIGN_MOOD = {
  Aries: "bolder and more impatient", Taurus: "slower, steadier and more sensual", Gemini: "chattier and more curious",
  Cancer: "softer and more home-focused", Leo: "warmer, louder and more playful", Virgo: "tidier and more practical",
  Libra: "gentler and more focused on balance", Scorpio: "deeper, more private and more honest", Sagittarius: "more adventurous and optimistic",
  Capricorn: "more serious and ambitious", Aquarius: "more independent and unconventional", Pisces: "dreamier and more tender",
};
// What each planet colours, as the subject of a sentence, with its verb agreeing (singular or plural).
const PLANET_AREA = {
  Mercury: ["Conversations and plans", "turn", "slow down"], Venus: ["Love, pleasure and taste", "turn", "slow down"],
  Mars: ["Drive and tempers", "turn", "slow down"], Jupiter: ["Luck and growth", "turn", "slow down"],
  Saturn: ["Pressure and responsibility", "turn", "slow down"], Uranus: ["Surprises", "turn", "slow down"],
  Neptune: ["Dreams and intuition", "turn", "slow down"], Pluto: ["Deep change", "turns", "slows down"],
};
const RETRO_LINES = {
  Mercury: ["turns retrograde", "A three-week stretch for rereading, reconnecting and second drafts. Back things up and give plans extra time."],
  Venus: ["turns retrograde", "Old loves and old tastes come back for review. Go slowly with big decisions about the heart or money."],
  Mars: ["turns retrograde", "Energy turns inward for a while. Revisit, rather than start, the big fights and big projects."],
};
const DIRECT_LINE = "turns direct. Things that felt stuck start to move again.";
const LUNATION = {
  "New Moon": "a fresh start. A good night to set one small intention.",
  "Full Moon": "feelings peak and things come to light. A good night to notice what you've grown, and what you're ready to release.",
};
const NATAL_PLAIN = { Sun: "your sense of who you are", Moon: "your feelings", Mercury: "the way you think and talk", Venus: "your heart", Mars: "your inner fire", Ascendant: "the way you come across" };
const TONE_PERSONAL = {
  1: ["A supportive moment for {n}. A good day to lean into it.", "An easy, open day for {n}. Say yes to what feels good."],
  "-1": ["A day that may press on {n}. Go gently, and leave a little room in your plans.", "Some friction around {n}. Not a bad day, just one to take slowly."],
  0: ["The volume goes up on {n}. Notice what comes to the surface.", "A strong day for {n}. Something may ask for your attention."],
};
const TRANSITING = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

function weekday(d, now) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((a - b) / DAY);
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

// Events in the next 7 days (not today), most meaningful first.
export function whatsNext(natal, now = new Date()) {
  const noon = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const days = [];
  for (let i = 0; i <= 7; i++) days.push(noon(new Date(now.getTime() + i * DAY)));
  const pos = days.map(d => positions(d));
  const events = [];
  for (let i = 1; i <= 7; i++) {
    const a = pos[i - 1], b = pos[i], d = days[i];
    for (const p of PLANETS) {
      if (p === "Moon") continue;
      if (signOf(a[p].lon) !== signOf(b[p].lon)) {
        const sign = signOf(b[p].lon);
        events.push({ date: d, weight: p === "Sun" ? 6 : ["Mercury", "Venus", "Mars"].includes(p) ? 5 : 7,
          title: `${p === "Sun" ? "The Sun" : p} moves into ${sign}`,
          text: p === "Sun" ? `A new season begins, and the month ahead feels ${SIGN_MOOD[sign]}.` : `${PLANET_AREA[p][0]} ${PLANET_AREA[p][1]} ${SIGN_MOOD[sign]}.` });
      }
      if (!!a[p].retro !== !!b[p].retro) {
        const retro = !!b[p].retro;
        const line = RETRO_LINES[p];
        events.push({ date: d, weight: p === "Mercury" ? 9 : 6,
          title: `${p} ${retro ? "turns retrograde" : "turns direct"}`,
          text: retro ? (line ? line[1] : `${PLANET_AREA[p][0]} ${PLANET_AREA[p][2]} for review.`) : DIRECT_LINE.replace("turns direct. ", "") });
      }
    }
  }
  // New and full moons.
  for (const [deg, name] of [[0, "New Moon"], [180, "Full Moon"]]) {
    try {
      const r = A().SearchMoonPhase(deg, new Date(now.getTime() + 0.5 * DAY), 7.5);
      if (r) { const d = r.date; events.push({ date: d, weight: 8, title: `${name} in ${signOf(positions(d).Moon.lon)}`, text: LUNATION[name].charAt(0).toUpperCase() + LUNATION[name].slice(1) }); }
    } catch { /* no lunation this week */ }
  }
  // Planets meeting each other in the shared sky (the tightest ones only).
  const SHORT = { Sun: "the spotlight", Mercury: "words", Venus: "love", Mars: "drive", Jupiter: "growth", Saturn: "pressure" };
  const COLLECTIVE = { 1: "An easy angle between {A} ({a}) and {B} ({b}). A gentle, open moment for everyone.", "-1": "A tense angle between {A} ({a}) and {B} ({b}). Expect a little friction in the air, for everyone.", 0: "{A} ({a}) and {B} ({b}) meet. One strong note in the shared sky." };
  const SPECIAL = { "Sun|Venus|0": "A lovely moment to notice what, and who, you truly value." };
  const fast = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  for (let x = 0; x < fast.length; x++) for (let y = x + 1; y < fast.length; y++) {
    const p1 = fast[x], p2 = fast[y];
    let best = null;
    for (let i = 1; i <= 7; i++) { const dist = sep(pos[i][p1].lon, pos[i][p2].lon); for (const asp of ASPECTS) { const orb = Math.abs(dist - asp.angle); if (orb < 0.8 && (!best || orb < best.orb)) best = { orb, asp, i }; } }
    if (!best) continue;
    const today = Math.abs(sep(pos[0][p1].lon, pos[0][p2].lon) - best.asp.angle);
    if (today <= best.orb + 0.05) continue;
    const h = String(Math.sign(best.asp.harmony)), nm = q => (q === "Sun" ? "the Sun" : q);
    events.push({ date: days[best.i], weight: 5 + (p1 === "Sun" ? 1 : 0),
      title: `${p1 === "Sun" ? "The Sun" : p1} ${best.asp.verb} ${nm(p2)}`,
      text: SPECIAL[`${p1}|${p2}|${h}`] || COLLECTIVE[h].replace("{A}", nm(p1).replace(/^the/, "the")).replace("{B}", nm(p2)).replace("{a}", SHORT[p1]).replace("{b}", SHORT[p2]).replace(/^./, c => c.toUpperCase()) });
  }
  // Your own chart: a faster planet lining up exactly with one of your points this week.
  if (natal) {
    const points = ["Sun", "Moon", "Mercury", "Venus", "Mars"].concat(natal.asc != null ? ["Ascendant"] : []);
    for (const t of TRANSITING) for (const n of points) {
      const target = n === "Ascendant" ? natal.asc : natal.pos[n].lon;
      let best = null;
      for (let i = 1; i <= 7; i++) {
        const dist = sep(pos[i][t].lon, target);
        for (const asp of ASPECTS) { const orb = Math.abs(dist - asp.angle); if (orb < 1.1 && (!best || orb < best.orb)) best = { orb, asp, i }; }
      }
      if (!best) continue;
      // Skip ones already exact today: today's reading covers them.
      const today = Math.abs(sep(pos[0][t].lon, target) - best.asp.angle);
      if (today <= best.orb + 0.05) continue;
      const h = String(Math.sign(best.asp.harmony));
      const opts = TONE_PERSONAL[h], line = opts[(best.i + n.length) % opts.length];
      events.push({ date: days[best.i], weight: (t === "Sun" || t === "Mars" || t === "Venus" ? 7 : t === "Mercury" ? 6.5 : 6) + (n === "Sun" || n === "Moon" ? 1 : 0), personal: true,
        title: `${t === "Sun" ? "The Sun" : t} ${best.asp.verb} your ${n === "Ascendant" ? "rising sign" : n}`,
        text: line.replace("{n}", NATAL_PLAIN[n]) });
    }
  }
  // Pick up to three: always include one personal moment if there is one.
  events.sort((x, y) => y.weight - x.weight || x.date - y.date);
  const picked = [];
  const personal = events.find(e => e.personal);
  if (personal) picked.push(personal);
  for (const e of events) { if (picked.length >= 3) break; if (!e.personal && !picked.some(p => p.title === e.title)) picked.push(e); }
  for (const e of events) { if (picked.length >= 3) break; if (!picked.includes(e)) picked.push(e); }
  picked.sort((x, y) => x.date - y.date);
  return picked.map(e => ({ ...e, day: weekday(e.date, now) }));
}

// The card's headline, from what's coming.
export function aheadTitle(items, now) {
  if (!items.length) return "A quiet week ahead. Room to breathe.";
  const counts = {};
  for (const it of items) counts[it.day] = (counts[it.day] || 0) + 1;
  const busy = Object.entries(counts).find(([, n]) => n >= 2);
  if (busy) return `${busy[0].split(",")[0]} is a big sky day.`;
  const first = items[0];
  if (/retrograde/.test(first.title)) return `${first.title.split(" turns")[0]} goes retrograde ${first.day === "Tomorrow" ? "tomorrow" : "on " + first.day.split(",")[0]}.`;
  if (/Full Moon|New Moon/.test(first.title)) return `A ${/Full/.test(first.title) ? "Full" : "New"} Moon is coming${first.day === "Tomorrow" ? " tomorrow" : " on " + first.day.split(",")[0]}.`;
  return "Here's what's coming this week.";
}
