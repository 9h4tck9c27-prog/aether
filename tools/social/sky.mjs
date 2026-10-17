// The real sky for a week: what the planets and the Moon are doing each day.
// Used by the creative director (to write about real events) and by the renderer.
// Usage: node tools/social/sky.mjs [YYYY-MM-DD monday] > sky.json
import * as Astronomy from "astronomy-engine";
globalThis.Astronomy = Astronomy; globalThis.window = globalThis;
const { positions, moonPhase, nakshatraOf, signOf } = await import("../../site/js/astro.js");
const { PLANETS, ASPECTS, NAKSHATRAS } = await import("../../site/js/data.js");
const { NAKSHATRA_PLAIN } = await import("../../site/js/voice.js");

const DAY = 864e5;
const sep = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

export function nextMonday(from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const add = (8 - d.getUTCDay()) % 7 || 7;
  return new Date(d.getTime() + add * DAY);
}

export function skyWeek(monday) {
  const start = new Date(monday); start.setUTCHours(12, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const t = new Date(start.getTime() + i * DAY);
    const pos = positions(t);
    const phase = moonPhase(t);
    const nak = nakshatraOf(pos.Moon.lon, t);
    days.push({
      date: t.toISOString().slice(0, 10),
      weekday: t.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
      moon: { sign: signOf(pos.Moon.lon), phase: phase.name, lit: Math.round(phase.illum * 100), mansion: NAKSHATRAS[nak.index]?.name ?? nak.name, mansionPlain: NAKSHATRA_PLAIN[nak.index] },
      sun: signOf(pos.Sun.lon),
      signs: Object.fromEntries(PLANETS.map(p => [p, signOf(pos[p].lon)])),
      retrograde: PLANETS.filter(p => pos[p].retro),
    });
  }
  // Events: sign changes, retrograde stations, and the tightest aspects of the week between planets (not the Moon).
  const events = [];
  for (let i = 1; i < 7; i++) {
    const a = days[i - 1], b = days[i];
    for (const p of PLANETS) {
      if (p !== "Moon" && a.signs[p] !== b.signs[p]) events.push({ date: b.date, kind: "ingress", planet: p, from: a.signs[p], to: b.signs[p], plain: `${p === "Sun" ? "The Sun" : p} moves into ${b.signs[p]}.` });
      const ra = a.retrograde.includes(p), rb = b.retrograde.includes(p);
      if (ra !== rb) events.push({ date: b.date, kind: rb ? "station-retrograde" : "station-direct", planet: p, plain: `${p} turns ${rb ? "retrograde" : "direct"}.` });
    }
  }
  const slow = PLANETS.filter(p => p !== "Moon");
  for (let i = 0; i < slow.length; i++) for (let j = i + 1; j < slow.length; j++) {
    let best = null;
    for (let h = 0; h <= 7 * 24; h += 6) {
      const t = new Date(start.getTime() - 12 * 36e5 + h * 36e5), pos = positions(t);
      const d = sep(pos[slow[i]].lon, pos[slow[j]].lon);
      for (const asp of ASPECTS) { const orb = Math.abs(d - asp.angle); if (orb < 1.2 && (!best || orb < best.orb)) best = { orb, asp: asp.name, t }; }
    }
    if (best) events.push({ date: best.t.toISOString().slice(0, 10), kind: "aspect", a: slow[i], b: slow[j], aspect: best.asp, orb: +best.orb.toFixed(2), plain: `${slow[i]} ${best.asp} ${slow[j]}: they ${best.asp === "square" || best.asp === "opposition" ? "pull against each other" : best.asp === "conjunction" ? "merge" : "work together"}.` });
  }
  // New and full moons this week.
  for (const [deg, name] of [[0, "New Moon"], [90, "First Quarter"], [180, "Full Moon"], [270, "Last Quarter"]]) {
    const r = Astronomy.SearchMoonPhase(deg, new Date(start.getTime() - 12 * 36e5), 10);
    if (r) {
      const lon = positions(r.date).Moon.lon;
      events.push({ date: r.date.toISOString().slice(0, 10), time: r.date.toISOString(), kind: "lunation", name, sign: signOf(lon), plain: `${name} in ${signOf(lon)}.` });
    }
  }
  const inWeek = new Set(days.map(d => d.date));
  const weekEvents = events.filter(e => inWeek.has(e.date)).sort((x, y) => x.date.localeCompare(y.date));
  // Lunations just after the week are worth teasing, so keep the next one separately.
  const nextLunation = events.find(e => e.kind === "lunation" && !inWeek.has(e.date)) || null;
  return { week: days[0].date, days, events: weekEvents, nextLunation };
  return { week: days[0].date, days, events };
}

// What æther checks for every reading, counted from the code (keep marketing claims true).
export const FACTS = {
  angleChecks: 10 * 6 * 5 + 28 * 5,   // 10 planets × 6 birth-chart points × 5 angles, plus 28 sky pairs × 5 angles = 440
  planets: 10, lunarMansions: 27, lunarDays: 30,
  line: "Every reading checks 440 planetary angles against your birth chart and today's sky, plus the Moon's 27 Vedic lunar mansions, live space weather and the weather where you are.",
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  const monday = arg ? new Date(arg + "T00:00:00Z") : nextMonday();
  console.log(JSON.stringify({ ...skyWeek(monday), facts: FACTS }, null, 2));
}
