// Turns a reading into a deck of cards, plus the "consulting the sky" steps shown before it.
// Big text is plain and human; astrology terms sit in the small print with a definition.
import { lonOf, sep, ayanamsa, signOf } from "./astro.js";
import { PLANET_GLYPHS, NAKSHATRA_LORE } from "./data.js";
import { whatsNext, aheadTitle } from "./ahead.js";
import { threadLine, PLANET_ROLE, ROLE_VERB, NATAL_PLAIN, CONCRETE, timingLine, arcPill, memoryLine, echoTitle, questionFor, PHASE_MEANING, moonNext } from "./story.js";
import {
  pickBy, TRANSIT_HEADLINES, TRANSIT_PLAIN, FEEL_BRIDGE, PLAIN_PLANET, PLAIN_NATAL, ASPECT_DEFS, ASPECT_WORD,
  NATAL_DEF, RISING_DEF, timingPill, NAKSHATRA_PLAIN, togetherPlain, spaceWeatherPlain, CLOSING_LINES,
  THEME_PLAIN, OPEN_LINES, PLAIN_SINGULAR, WEATHER_LINES, weatherKind, weatherShort, CARE, careLine,
} from "./voice.js";

const MIN_CROWD = 25;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ASPECT_GLYPH = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍" };
const glyph = p => (p === "Ascendant" ? "AC" : PLANET_GLYPHS[p]);
const proper = p => (p === "Sun" || p === "Moon" ? `the ${p}` : p);
const hours = n => (n === 1 ? "an hour" : `${n} hours`);
function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

// Is the aspect still building or easing off, when did it start, and when does it fade?
function arc(s, natal, now) {
  const target = s.n === "Ascendant" ? natal.asc : natal.pos[s.n].lon;
  const maxOrb = s.t === "Moon" ? 5 : s.t === "Sun" ? 3 : 2.5;
  const orbAt = d => Math.abs(sep(lonOf(s.t, d), target) - s.asp.angle);
  const o0 = orbAt(now), o1 = orbAt(new Date(now.getTime() + 864e5));
  const speed = Math.abs(o0 - o1);
  const t = (o1 < o0 && speed > 0.001) ? { days: o0 / speed, building: true } : { days: o0 < 0.3 ? 0 : null, building: false };
  if (s.t === "Moon") {
    let h = 0; while (h < 48 && orbAt(new Date(now.getTime() + h * 36e5)) <= maxOrb) h++;
    return { ...t, hours: true, endHours: h, end: new Date(now.getTime() + h * 36e5) };
  }
  const D = 864e5, cap = 150;
  let back = 0; while (back < cap && orbAt(new Date(now.getTime() - (back + 1) * D)) <= maxOrb) back++;
  let fwd = 0; while (fwd < cap && orbAt(new Date(now.getTime() + (fwd + 1) * D)) <= maxOrb) fwd++;
  let best = Infinity, peak = now;
  for (let i = -back; i <= fwd; i++) { const d = new Date(now.getTime() + i * D), o = orbAt(d); if (o < best) { best = o; peak = d; } }
  return { ...t, start: back > 0 ? new Date(now.getTime() - back * D) : null, end: fwd < cap ? new Date(now.getTime() + fwd * D) : null, peak };
}

function transitCard(s, r, natal, seed, opts) {
  const h = String(Math.sign(s.asp.harmony));
  const n = PLAIN_NATAL[s.n];
  const a = arc(s, natal, r.now);
  const headline = pickBy(TRANSIT_HEADLINES[s.t][h], seed).replace("{n}", n);
  const meaning = `${PLANET_ROLE[s.t]} ${pickBy(ROLE_VERB[h], seed + 1)} ${NATAL_PLAIN[s.n]}.`;
  const concrete = pickBy(CONCRETE[s.n][h], seed + 2);
  const when = timingLine(a, r.now);
  // On the first card, say how this connects to the way they said today feels.
  const bridge = opts.first ? pickBy(FEEL_BRIDGE[r.bucket][h], seed + 3) : "";
  const point = s.n === "Ascendant" ? "your rising sign" : `your natal ${s.n}`;
  let thread = null;
  if (["Sun", "Moon", "Ascendant"].includes(s.n) && !opts.threads.has(s.n)) {
    const lon = s.n === "Ascendant" ? natal.asc : natal.pos[s.n].lon;
    if (lon != null) { thread = threadLine(s.n, signOf(lon)); opts.threads.add(s.n); }
  }
  return {
    type: "transit",
    kicker: s.n === "Ascendant" ? "How you come across" : `About ${n}`,
    title: headline,
    pill: arcPill(a, r.now),
    lead: [meaning, concrete, when, bridge].filter(Boolean).join(" "),
    thread,
    tech: {
      glyphs: [glyph(s.t), ASPECT_GLYPH[s.asp.name], glyph(s.n)],
      name: `${cap(proper(s.t))} ${ASPECT_WORD[s.asp.name]} ${point}`,
      text: `${ASPECT_DEFS[s.asp.name]} ${s.n === "Ascendant" ? RISING_DEF : NATAL_DEF}`,
    },
    focus: { sky: [s.t], natal: [s.n], link: true, zoom: 0.8, tone: s.asp.harmony },
  };
}

function moonCard(r) {
  const sig = r.sig, nak = sig.moonNak;
  const [deity, symbol] = NAKSHATRA_LORE[nak.index];
  const span = 360 / 27, sidStart = nak.index * span;
  const ay = ayanamsa(r.now);
  return {
    type: "moon",
    kicker: "Tonight's Moon",
    title: NAKSHATRA_PLAIN[nak.index],
    pill: `${sig.phase.name}, ${Math.round(sig.phase.illum * 100)}% lit`,
    lead: `${sig.phase.name === "New Moon" ? "Tonight is a new moon" : sig.phase.name === "Full Moon" ? "Tonight the Moon is full" : `The Moon is in her ${sig.phase.name.toLowerCase()} phase`}: ${PHASE_MEANING[sig.phase.name] || "a time to listen inward"}. She changes signs ${moonNext(sig.moonLeft)}, and the mood shifts with her.`,
    phase: sig.phase,
    tech: {
      name: `Moon in ${nak.name}, ${nak.gloss}`,
      text: `In Vedic astrology the Moon walks through 27 "lunar mansions" each month. ${nak.name} is ruled by ${deity}; its symbol is ${symbol}. Today is the ${sig.phase.tithi.name} tithi (the ${ordinal(sig.phase.tithi.number)} lunar day of the ${sig.phase.tithi.paksha}). In the Western zodiac the Moon is in ${sig.moonSign}.`,
    },
    focus: { sky: ["Moon"], arc: [sidStart + ay, sidStart + span + ay], zoom: 0.85 },
  };
}

function togetherCard(r, kp) {
  const c = r.sig.collective[0];
  const sw = spaceWeatherPlain(kp);
  const techBits = [];
  if (c) techBits.push(`${cap(proper(c.t))} ${ASPECT_WORD[c.asp.name]} ${proper(c.n)} in today's sky. ${ASPECT_DEFS[c.asp.name]}`);
  if (r.sig.retro.includes("Mercury")) techBits.push("Mercury is retrograde, which astrologers link to crossed wires and second thoughts.");
  if (kp != null) techBits.push(`Planetary K-index ${kp.toFixed(1)} from NOAA's Space Weather Prediction Center.`);
  return {
    type: "together",
    kicker: "Everyone under this sky",
    title: "It's not just you",
    crowd: r.crowd,
    lead: [togetherPlain(c), sw].filter(Boolean).join(" "),
    kp,
    tech: techBits.length ? { name: "In the sky", text: techBits.join(" ") } : null,
    focus: c ? { sky: [c.t, c.n], link: true, zoom: 0.7, tone: c.asp.harmony } : { wide: true },
  };
}

function closingLine(r) {
  const seed = Math.floor(r.now.getTime() / 864e5) + (r.quote || "").length + Math.round(r.feel * 10);
  return pickBy(CLOSING_LINES[r.bucket], seed);
}

const OPEN_SOFT = {
  heavy: ["Whatever happened, you don't have to carry it alone tonight.", "Hard days are part of the weather, not a verdict on you."],
  mixed: ["Some days are a bit of everything. That's allowed.", "Not every day needs a single word. Here's what's in the air."],
  golden: ["Good days deserve to be noticed. Here's where the light is coming from.", "Let yourself enjoy this one. Here's what's helping."],
};

export function buildDeck(r, natal, kp, { weather = null, care = false, history = [], feelWord = "", name = "" } = {}) {
  const seed = Math.floor(r.now.getTime() / 36e5);
  const theme = (r.themes || [])[0];
  const today = { day: r.now.toISOString().slice(0, 10), feel: r.feel };
  const memory = memoryLine(history, today, r.themes || []);
  const memoryIsTheme = memory && /this week\. It's clearly on your heart/.test(memory);
  const second = theme && !memoryIsTheme ? THEME_PLAIN[theme][r.bucket] : (memory ? "" : pickBy(OPEN_SOFT[r.bucket], seed));
  const cards = [{
    type: "open",
    kicker: r.now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    title: feelWord ? echoTitle(r.bucket, feelWord, name, seed) : r.headline,
    quote: r.quote,
    lead: [memory, second].filter(Boolean).join(" "),
    weather: weather && weather.temp != null
      ? { short: weatherShort(weather), line: pickBy(WEATHER_LINES[r.bucket][weatherKind(weather.symbol)], seed) }
      : null,
    focus: { wide: true, natalGlow: true },
  }];
  const day = Math.floor(r.now.getTime() / 864e5);
  const threads = new Set();
  const picks = [];
  for (const s of r.ranked) { if (!picks.length || (picks.length < 2 && s.n !== picks[0].n)) picks.push(s); if (picks.length === 2) break; }
  if (picks.length < 2 && r.ranked[1]) picks.push(r.ranked[1]);
  picks.forEach((s, i) => cards.push(transitCard(s, r, natal, day + i * 7, { first: i === 0, threads })));
  cards.push(moonCard(r));
  // Only show "people near you" when there are enough real check-ins to count.
  if (r.crowd && r.crowd.count >= MIN_CROWD) cards.push(togetherCard(r, kp));
  // A few heavy days in a row: a gentle, skippable note with a way to reach a real person.
  if (care) cards.push({ type: "care", ...CARE, help: careLine(), focus: { wide: true } });
  // What's next: the coming week's real sky, so the reading looks forward as well as back.
  const ahead = whatsNext(natal, r.now);
  cards.push({ type: "ahead", kicker: "What's next", title: aheadTitle(ahead, r.now), items: ahead,
    focus: ahead.length ? { sky: [...new Set(ahead.flatMap(e => (e.title.match(/\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/g) || [])))].slice(0, 2), zoom: 0.5 } : { wide: true } });
  cards.push({ type: "reflect", kicker: "A question to sit with", title: questionFor(r.bucket, r.themes || [], day + Math.round(r.feel * 10)),
    lead: "No need to answer here. Let it keep you company tonight.", focus: { wide: true, natalGlow: true } });
  const line = closingLine(r);
  const links = [
    ...r.ranked.slice(0, 3).map(s => [["sky", s.t], ["natal", s.n]]),
    ...r.sig.collective.slice(0, 2).map(s => [["sky", s.t], ["sky", s.n]]),
  ];
  cards.push({ type: "close", kicker: "To carry with you", line, bucket: r.bucket, focus: { wide: true, showLinks: links } });
  return cards;
}

// Steps shown while the sky is "consulting". Plain words, real details.
export function consultSteps(r, natal, profile, kp, weather = null) {
  const aspects = r.sig.personal.length + r.sig.collective.length;
  return [
    "Finding every planet, right now",
    `Laying today's sky over the sky you were born under`,
    `Measuring the angles between them: ${aspects} ${aspects === 1 ? "connection" : "connections"} found`,
    `Following the Moon into ${r.sig.moonNak.name}`,
    kp != null ? "Checking the Sun's weather" : "Listening to the quiet between the stars",
    ...(weather && weather.temp != null ? ["Looking out the window where you are"] : []),
    "Putting it into words",
  ];
}

export { signOf };
