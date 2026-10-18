// Generate many real readings and lint the text: repeated words, clashing tone, awkward joins.
// Usage: node tools/copy/sample.mjs [count] [--print]
import * as Astronomy from "astronomy-engine";
globalThis.Astronomy = Astronomy; globalThis.window = globalThis;

const { natalChart, writeReading } = await import("../../site/js/astro.js");
const { buildDeck } = await import("../../site/js/reading.js");
const { MOOD_WORDS } = await import("../../site/js/data.js");

const N = +(process.argv[2] || 200), PRINT = process.argv.includes("--print");
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const TEXTS = ["", "", "Long week at work and my boss was rude", "missed my mum today", "had a great date!", "can't sleep, so anxious",
  "my friend cancelled again", "got paid finally", "finished a painting", "moving apartment next week", "", "just tired"];
const STOP = new Set("early mid late last it's the a an and or but to of in on at for with is are be it its this that you your yours today day may might can could will just a about as from by not no so if than then there their them they we our i me my what when who how into out up more less some any all".split(" "));
const issues = [];
const word = v => MOOD_WORDS[Math.min(11, Math.floor(v * 12))];
for (let i = 0; i < N; i++) {
  const y = 1960 + Math.floor(rnd() * 45), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
  const profile = { birthDate: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, birthTime: rnd() < 0.8 ? `${String(Math.floor(rnd() * 24)).padStart(2, "0")}:30` : "",
    city: "X", lat: -40 + rnd() * 100, lon: -120 + rnd() * 240, tz: "UTC", name: rnd() < 0.6 ? pick(["Ram", "Ana", "Jo", "Sam"]) : "" };
  const natal = natalChart(profile);
  const now = new Date(Date.UTC(2026, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28), 8 + Math.floor(rnd() * 12)));
  const feel = rnd(), text = pick(TEXTS);
  const r = writeReading({ feel, chips: [], text, natal, profile, kp: null, now });
  const history = [];
  for (let k = 1; k <= 5; k++) if (rnd() < 0.6) history.push({ day: new Date(now - k * 864e5).toISOString().slice(0, 10), feel: rnd(), themes: rnd() < 0.3 ? r.themes : [] });
  history.reverse();
  const deck = buildDeck(r, natal, null, { history, feelWord: word(feel), name: profile.name, care: false });
  if (PRINT && i < 12) {
    console.log(`\n===== #${i} feel ${feel.toFixed(2)} (${r.bucket}) "${text}"`);
    for (const c of deck) console.log(`[${c.type}] ${c.kicker} | ${c.title || ""}${c.pill ? " | " + c.pill : ""}\n   ${c.lead || ""}${c.thread ? "\n   ~ " + c.thread : ""}${c.line ? "\n   “" + c.line.text + "”" : ""}`);
  }
  for (const c of deck) {
    const txt = [c.title, c.lead, c.thread].filter(Boolean).join(" ");
    if (/\s{2,}|\s[,.]|\.\.|undefined|null|NaN|\{|\}/.test(txt)) issues.push(["format", c.type, txt]);
    if (/\bÆther\b/.test(txt)) issues.push(["name", c.type, txt]);
    const words = (c.lead || "").toLowerCase().match(/[a-z']+/g) || [];
    const counts = {}; for (const w of words) if (!STOP.has(w) && w.length > 3) counts[w] = (counts[w] || 0) + 1;
    const rep = Object.entries(counts).filter(([, n]) => n > 1).map(([w]) => w);
    if (rep.length) issues.push(["repeat", c.type, rep.join(","), c.lead]);
    const todays = (txt.match(/\btoday\b/gi) || []).length;
    if (todays > 2) issues.push(["today x" + todays, c.type, txt]);
    if (c.type === "transit" && (c.lead || "").length > 420) issues.push(["long", c.type, (c.lead || "").length, c.lead]);
    if (r.bucket === "heavy" && /\b(enjoy it|celebrat|make the most of it)\b/i.test(txt)) issues.push(["tone", c.type, txt]);
  }
}
const tally = {}; for (const i of issues) tally[i[0]] = (tally[i[0]] || 0) + 1;
const words = {}; for (const i of issues) if (i[0] === "repeat") for (const w of i[2].split(",")) words[w] = (words[w] || 0) + 1;
console.log("top repeated:", Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 15));
console.log("\nissues:", tally);
for (const i of issues.slice(0, 40)) console.log(" -", i.join(" | "));
