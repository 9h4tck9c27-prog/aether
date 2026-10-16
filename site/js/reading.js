// Turns a reading into a deck of cards, plus the "consulting the sky" steps shown before it.
// Big text is plain and human; astrology terms sit in the small print with a definition.
import { lonOf, sep, ayanamsa, signOf } from "./astro.js";
import { PLANET_GLYPHS, NAKSHATRA_LORE } from "./data.js";
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

// Is the aspect still building or easing off, and roughly when is it exact?
function timing(s, natal, now) {
  const target = s.n === "Ascendant" ? natal.asc : natal.pos[s.n].lon;
  const orbAt = d => Math.abs(sep(lonOf(s.t, d), target) - s.asp.angle);
  const o0 = orbAt(now), o1 = orbAt(new Date(now.getTime() + 864e5));
  const speed = Math.abs(o0 - o1);
  if (o1 < o0 && speed > 0.001) return { days: o0 / speed, building: true };
  return { days: o0 < 0.3 ? 0 : null, building: false };
}

function transitCard(s, r, natal, seed) {
  const h = String(Math.sign(s.asp.harmony));
  const n = PLAIN_NATAL[s.n];
  const t = timing(s, natal, r.now);
  const headline = pickBy(TRANSIT_HEADLINES[s.t][h], seed).replace("{n}", n);
  const plain = pickBy(TRANSIT_PLAIN[h], seed + 1).replace("{P}", cap(PLAIN_PLANET[s.t])).replace("{is}", PLAIN_SINGULAR.has(s.t) ? "is" : "are").replace("{n}", n);
  const point = s.n === "Ascendant" ? "your rising sign" : `your natal ${s.n}`;
  return {
    type: "transit",
    kicker: s.n === "Ascendant" ? "How you come across" : `About ${n}`,
    title: headline,
    pill: timingPill(t.days, t.building),
    lead: `${plain} ${pickBy(FEEL_BRIDGE[r.bucket][h], seed + 2)}`,
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
    lead: `The Moon changes signs every two or three days, and the mood of the world shifts with her. Her next move is in about ${hours(sig.moonLeft)}.`,
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

export function buildDeck(r, natal, kp, { weather = null, care = false } = {}) {
  const seed = Math.floor(r.now.getTime() / 36e5);
  const theme = (r.themes || [])[0];
  const cards = [{
    type: "open",
    kicker: r.now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    title: r.headline,
    quote: r.quote,
    lead: theme ? THEME_PLAIN[theme][r.bucket] : pickBy(OPEN_LINES[r.bucket], seed),
    weather: weather && weather.temp != null
      ? { short: weatherShort(weather), line: pickBy(WEATHER_LINES[r.bucket][weatherKind(weather.symbol)], seed) }
      : null,
    focus: { wide: true, natalGlow: true },
  }];
  const day = Math.floor(r.now.getTime() / 864e5);
  r.ranked.slice(0, 2).forEach((s, i) => cards.push(transitCard(s, r, natal, day + i * 7)));
  cards.push(moonCard(r));
  // Only show "people near you" when there are enough real check-ins to count.
  if (r.crowd && r.crowd.count >= MIN_CROWD) cards.push(togetherCard(r, kp));
  // A few heavy days in a row: a gentle, skippable note with a way to reach a real person.
  if (care) cards.push({ type: "care", ...CARE, help: careLine(), focus: { wide: true } });
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
