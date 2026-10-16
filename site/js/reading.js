// Turns a reading into a deck of cards, plus the "consulting the sky" steps shown before it.
import { lonOf, sep, ayanamsa, signOf } from "./astro.js";
import {
  PLANET_GLYPHS, TRANSIT_TEXT, NATAL_TEXT, ASPECT_TEXT, FEEL_LINK, NAKSHATRA_LORE, CHIP_LINES,
} from "./data.js";

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ASPECT_GLYPH = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍" };
const pointName = p => (p === "Ascendant" ? "your rising sign" : `your ${p}`);
const glyph = p => (p === "Ascendant" ? "AC" : PLANET_GLYPHS[p]);

// Is the aspect still building or easing off, and roughly when is it exact?
function timing(s, natal, now) {
  const target = s.n === "Ascendant" ? natal.asc : natal.pos[s.n].lon;
  const orbAt = d => Math.abs(sep(lonOf(s.t, d), target) - s.asp.angle);
  const later = new Date(now.getTime() + 864e5);
  const o0 = orbAt(now), o1 = orbAt(later);
  const speed = Math.abs(o0 - o1); // degrees per day the orb changes
  if (o1 < o0 && speed > 0.001) {
    const days = o0 / speed;
    if (days < 0.6) return { text: "It is exact today, right at its peak.", building: true };
    if (days < 1.5) return { text: "It peaks within a day, so this is building now.", building: true };
    if (days < 60) return { text: `It is still building and peaks in about ${Math.round(days)} days.`, building: true };
    return { text: "It is building very slowly; this is a long chapter, not a single day.", building: true };
  }
  if (o0 < 0.3) return { text: "It is exact today, right at its peak.", building: false };
  return { text: "It is past its peak and easing off from here.", building: false };
}

function transitCard(s, r, natal) {
  const harmony = String(s.asp.harmony);
  const t = timing(s, natal, r.now);
  return {
    type: "transit",
    kicker: s.n === "Ascendant" ? "Your rising sign" : "Your chart",
    title: `${s.t === "Sun" || s.t === "Moon" ? "The " + s.t : s.t} ${s.asp.name === "conjunction" ? "meets" : s.asp.name === "opposition" ? "opposite" : s.asp.name === "square" ? "square" : s.asp.name === "trine" ? "trine" : "sextile"} ${pointName(s.n)}`,
    glyphs: [glyph(s.t), ASPECT_GLYPH[s.asp.name], glyph(s.n)],
    lead: FEEL_LINK[r.bucket][harmony],
    body: [TRANSIT_TEXT[s.t], NATAL_TEXT[s.n]],
    aspectLine: ASPECT_TEXT[s.asp.name],
    timing: t.text,
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
    kicker: "The Vedic sky",
    title: `The Moon in ${nak.name}`,
    lead: `${nak.name} is ${nak.gloss}, one of the 27 lunar mansions the Moon walks through each month.`,
    body: [
      `Its ruling deity is ${deity}, and its symbol is ${symbol}. Today is the ${sig.phase.tithi.name} tithi, the ${ordinal(sig.phase.tithi.number)} lunar day of the ${sig.phase.tithi.paksha}.`,
      `In the Western zodiac she is in ${sig.moonSign}, and moves into a new sign in about ${sig.moonLeft === 1 ? "an hour" : sig.moonLeft + " hours"}. The mood moves with her.`,
    ],
    phase: sig.phase,
    focus: { sky: ["Moon"], arc: [sidStart + ay, sidStart + span + ay], zoom: 0.85 },
  };
}

function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

function togetherCard(r, kp) {
  const c = r.sig.collective[0];
  const body = [];
  if (c) body.push(`${c.t} ${c.asp.verb} ${c.n} for everyone on Earth today. ${ASPECT_TEXT[c.asp.name]}`);
  if (r.sig.retro.includes("Mercury")) body.push("Mercury is retrograde too, so crossed wires and second thoughts are everywhere right now.");
  return {
    type: "together",
    kicker: "Everyone under this sky",
    title: "It's not just you",
    crowd: r.crowd,
    kp,
    body,
    focus: c ? { sky: [c.t, c.n], link: true, zoom: 0.7, tone: c.asp.harmony } : { wide: true },
  };
}

export function buildDeck(r, natal, kp) {
  const cards = [];
  const firstChip = (r.chips || [])[0];
  cards.push({
    type: "open",
    kicker: r.now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    title: r.headline,
    quote: r.quote,
    chipLine: firstChip ? CHIP_LINES[firstChip] : null,
    cond: r.cond,
    focus: { wide: true, natalGlow: true },
  });
  const personal = r.ranked.slice(0, 2);
  for (const s of personal) cards.push(transitCard(s, r, natal));
  cards.push(moonCard(r));
  cards.push(togetherCard(r, kp));
  cards.push({ type: "echo", kicker: "An ancient echo", title: r.echo.text, source: r.echo.source, focus: { wide: true, far: true } });
  cards.push({ type: "close", kicker: "For the rest of today", title: r.themeLine || r.closing, body: r.themeLine ? [r.closing] : [], bucket: r.bucket, focus: { wide: true } });
  return cards;
}

// Real, specific steps for the "consulting the sky" sequence.
export function consultSteps(r, natal, profile, kp) {
  const time = r.now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const aspects = r.sig.personal.length + r.sig.collective.length;
  const author = r.echo.source.split(",")[0];
  return [
    `Placing all ten planets for ${time}`,
    `Laying today's sky over the sky of ${new Date(natal.date).getFullYear()}`,
    `Measuring the angles: ${aspects} ${aspects === 1 ? "aspect" : "aspects"} in orb`,
    `Walking the Moon through ${r.sig.moonNak.name}`,
    kp != null ? `Reading the Sun's weather: Kp ${kp.toFixed(1)}` : "Listening to the space weather",
    `Asking ${author} for a second opinion`,
  ];
}

export { signOf };
