// Dump every distinct sentence the app can produce (across many charts, dates and both voices) for a grammar read-through.
import * as Astronomy from "astronomy-engine";
globalThis.Astronomy = Astronomy; globalThis.window = globalThis;
const { natalChart, writeReading } = await import("../../site/js/astro.js");
const { buildDeck } = await import("../../site/js/reading.js");
const { MOOD_WORDS } = await import("../../site/js/data.js");
const N = +(process.argv[2] || 1500);
let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const TEXTS = ["", "Long week at work", "missed my mum", "great date!", "so anxious", "friend cancelled", "got paid", "painting", "moving", "tired"];
const out = new Map();
const add = (k, t) => { if (!t) return; for (const sent of String(t).split(/(?<=[.!?])\s+/)) { const norm = sent.replace(/\b(Ram|Ana|Jo|Sam)\b/g, "NAME").replace(/\d+/g, "#"); if (!out.has(norm)) out.set(norm, k); } };
for (let i = 0; i < N; i++) {
  const y = 1960 + Math.floor(rnd() * 45), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
  const profile = { birthDate: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, birthTime: rnd() < 0.8 ? "09:30" : "", city: "X", lat: -40 + rnd() * 100, lon: -120 + rnd() * 240, tz: "UTC", name: rnd() < 0.6 ? pick(["Ram", "Ana"]) : "" };
  const natal = natalChart(profile);
  const now = new Date(Date.UTC(2026, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28), 8 + Math.floor(rnd() * 12)));
  const feel = rnd();
  const r = writeReading({ feel, chips: [], text: pick(TEXTS), natal, profile, kp: rnd() < .5 ? rnd() * 7 : null, now });
  const history = []; for (let k = 1; k <= 5; k++) if (rnd() < 0.6) history.push({ day: new Date(now - k * 864e5).toISOString().slice(0, 10), feel: rnd(), themes: rnd() < 0.3 ? r.themes : [] });
  history.reverse();
  const deck = buildDeck(r, natal, rnd() < .5 ? rnd() * 7 : null, { history, feelWord: MOOD_WORDS[Math.min(11, Math.floor(feel * 12))], name: profile.name, care: rnd() < .1, tone: rnd() < .5 ? "real" : "soft", weather: rnd() < .5 ? { temp: 12, symbol: pick(["rain", "clearsky_day", "fog", "cloudy", "snow", "heavyrainandthunder"]) } : null });
  for (const c of deck) {
    add(c.type + ".title", c.title); add(c.type + ".lead", c.lead); add(c.type + ".thread", c.thread); add(c.type + ".pill", c.pill);
    if (c.tech) { add(c.type + ".tech", c.tech.name); add(c.type + ".tech", c.tech.text); }
    if (c.weather) add("weather", c.weather.line);
    if (c.items) for (const it of c.items) { add("ahead.title", it.title); add("ahead.text", it.text); }
    if (c.line) add("close", c.line.text);
  }
}
for (const [t, k] of [...out].sort((a, b) => a[1].localeCompare(b[1]))) console.log(k.padEnd(14), t);
