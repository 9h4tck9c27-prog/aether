// Æther astrology engine. Runs entirely in the browser using Astronomy Engine (global `Astronomy`).
import {
  SIGNS, PLANETS, PLANET_INFO, ASPECTS, NAKSHATRAS, TITHIS, ECHOES, THEMES, THEME_LINES,
} from "./data.js";

const A = window.Astronomy;
const norm = d => ((d % 360) + 360) % 360;
export const sep = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

// ---------- Time zones ----------
function tzOffsetMs(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).reduce((o, p) => (o[p.type] = p.value, o), {});
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

// Local wall-clock time in a given IANA zone -> real moment (Date).
export function localToDate(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "12:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMs(new Date(guess), tz);
  t = guess - tzOffsetMs(new Date(t), tz);
  return new Date(t);
}

export function dayKey(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------- Positions ----------
export function lonOf(body, date) {
  if (body === "Sun") return A.SunPosition(date).elon;
  if (body === "Moon") return A.EclipticGeoMoon(date).lon;
  return A.Ecliptic(A.GeoVector(body, date, true)).elon;
}

export function positions(date) {
  const later = new Date(date.getTime() + 6 * 3600 * 1000);
  const out = {};
  for (const p of PLANETS) {
    const lon = norm(lonOf(p, date));
    let retro = false;
    if (p !== "Sun" && p !== "Moon") {
      let d = norm(lonOf(p, later)) - lon;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      retro = d < 0;
    }
    out[p] = { lon, retro };
  }
  return out;
}

// Lahiri ayanamsa, a close linear approximation (good to a few arcminutes this century).
export function ayanamsa(date) {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5);
  return 23.853 + years * 0.0139683;
}

export function ascendant(date, lat, lon) {
  const lst = norm(A.SiderealTime(date) * 15 + lon) * Math.PI / 180;
  const eps = 23.4393 * Math.PI / 180, phi = lat * Math.PI / 180;
  const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm(asc * 180 / Math.PI);
}

export const signOf = lon => SIGNS[Math.floor(norm(lon) / 30)];
export const degIn = lon => Math.floor(norm(lon) % 30);

export function nakshatraOf(tropicalLon, date) {
  const sid = norm(tropicalLon - ayanamsa(date));
  const i = Math.floor(sid / (360 / 27));
  return { index: i, name: NAKSHATRAS[i][0], gloss: NAKSHATRAS[i][1] };
}

export function moonPhase(date) {
  const angle = A.MoonPhase(date);
  const names = ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  const name = names[Math.round(angle / 45) % 8];
  const t = Math.floor(angle / 12); // 0..29
  const paksha = t < 15 ? "bright half" : "dark half";
  const tithiName = t === 14 ? "Purnima" : t === 29 ? "Amavasya" : TITHIS[t % 15];
  return { angle, name, illum: (1 - Math.cos(angle * Math.PI / 180)) / 2, tithi: { number: (t % 15) + 1, name: tithiName, paksha } };
}

// Hours until the Moon enters the next sign.
export function moonSignChangeHours(date) {
  const lon = lonOf("Moon", date);
  const left = 30 - (norm(lon) % 30);
  return Math.max(1, Math.round(left / 13.18 * 24));
}

// ---------- Natal chart ----------
export function natalChart(profile) {
  const date = localToDate(profile.birthDate, profile.birthTime, profile.tz);
  const pos = positions(date);
  const chart = { date, pos, hasTime: !!profile.birthTime };
  if (chart.hasTime) chart.asc = ascendant(date, profile.lat, profile.lon);
  chart.moonNak = nakshatraOf(pos.Moon.lon, date);
  const sunAngle = sep(pos.Sun.lon, pos.Moon.lon);
  chart.nightBirth = null;
  if (chart.hasTime) {
    const obs = new A.Observer(profile.lat, profile.lon, 0);
    const hor = A.Horizon(date, obs, ...raDec(date, obs));
    chart.nightBirth = hor.altitude < 0;
  }
  chart.sunMoonAngle = sunAngle;
  return chart;
}

function raDec(date, obs) {
  const eq = A.Equator("Sun", date, obs, true, true);
  return [eq.ra, eq.dec, "normal"];
}

// ---------- Signals ----------
function aspectBetween(a, b, maxOrb) {
  const d = sep(a, b);
  let best = null;
  for (const asp of ASPECTS) {
    const orb = Math.abs(d - asp.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) best = { ...asp, orb };
  }
  return best;
}

export function todaySignals(natal, now = new Date()) {
  const sky = positions(now);
  const personal = [];
  const natalPoints = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  for (const t of PLANETS) {
    for (const n of natalPoints.concat(natal.hasTime ? ["Ascendant"] : [])) {
      const nLon = n === "Ascendant" ? natal.asc : natal.pos[n].lon;
      const maxOrb = t === "Moon" ? 5 : t === "Sun" ? 3 : 2.5;
      const asp = aspectBetween(sky[t].lon, nLon, maxOrb);
      if (!asp) continue;
      const exact = 1 - asp.orb / maxOrb;
      const harmonyBoost = asp.harmony === 0 ? 1.1 : 1;
      personal.push({ scope: "personal", t, n, asp, score: PLANET_INFO[t].weight * (0.4 + exact) * harmonyBoost * (n === "Moon" || n === "Sun" ? 1.15 : 1) });
    }
  }
  const collective = [];
  for (let i = 1; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const a = PLANETS[i], b = PLANETS[j];
      if (a === "Moon") continue;
      const asp = aspectBetween(sky[a].lon, sky[b].lon, 3);
      if (!asp) continue;
      collective.push({ scope: "collective", t: a, n: b, asp, score: (PLANET_INFO[a].weight + PLANET_INFO[b].weight) / 2 * (0.4 + (1 - asp.orb / 3)) });
    }
  }
  personal.sort((x, y) => y.score - x.score);
  collective.sort((x, y) => y.score - x.score);
  const retro = PLANETS.filter(p => sky[p].retro && ["Mercury", "Venus", "Mars"].includes(p));
  const phase = moonPhase(now);
  const moonNak = nakshatraOf(sky.Moon.lon, now);
  return { sky, personal, collective, retro, phase, moonNak, moonSign: signOf(sky.Moon.lon), moonLeft: moonSignChangeHours(now) };
}

// Weather condition from a handful of signals.
export function conditionOf(signals) {
  let tense = 0, sweet = 0, electric = 0, misty = 0;
  for (const s of signals.slice(0, 4)) {
    const kinds = [PLANET_INFO[s.t].kind, PLANET_INFO[s.n]?.kind];
    const h = s.asp.harmony;
    const w = s.score;
    if (kinds.includes("electric")) electric += w;
    if (kinds.includes("misty")) misty += w;
    if (h < 0 || (h === 0 && (kinds.includes("malefic") || kinds.includes("deep")))) tense += w;
    if (h > 0 || (h === 0 && kinds.includes("benefic"))) sweet += w * (kinds.includes("benefic") ? 1.4 : 1);
  }
  const max = Math.max(tense, sweet, electric * 1.1, misty * 1.1, 0.6);
  if (max === 0.6) return "clear";
  if (max === sweet) return "golden";
  if (max === tense) return "gusty";
  if (max === electric * 1.1) return "electric";
  return "misty";
}

export const CONDITIONS = {
  clear: { label: "Clear sky", intensity: 0.25 },
  golden: { label: "Golden sky", intensity: 0.7 },
  gusty: { label: "Gusty sky", intensity: 0.8 },
  electric: { label: "Electric sky", intensity: 0.85 },
  misty: { label: "Misty sky", intensity: 0.55 },
};

const name = p => (p === "Ascendant" ? "your rising sign" : p === "Sun" || p === "Moon" ? `the ${p}` : p);
const natalName = p => (p === "Ascendant" ? "your rising sign" : `your ${p}`);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function signalSentence(s) {
  const T = cap(name(s.t));
  if (s.scope === "collective") {
    return `${T} ${s.asp.verb} ${name(s.n)} in the sky for everyone, mixing ${PLANET_INFO[s.t].domain} with ${PLANET_INFO[s.n].domain}.`;
  }
  const link = s.asp.harmony > 0 ? "lends a hand to" : s.asp.harmony < 0 ? "pulls against" : "fuses with";
  const domain = s.n === "Ascendant" ? "first impressions" : PLANET_INFO[s.n].domain.replace(/^your /, "");
  return `${T} ${s.asp.verb} ${natalName(s.n)}: ${PLANET_INFO[s.t].domain} ${link} your ${domain}.`;
}

// One-line home forecast.
export function homeForecast(sig) {
  const top = sig.personal[0] || sig.collective[0];
  const cond = conditionOf(sig.personal.length ? sig.personal : sig.collective);
  const opener = {
    clear: "Steady skies.",
    golden: "The light is kind today.",
    gusty: "Expect some friction in the air.",
    electric: "Expect the unexpected today.",
    misty: "Things may look softer than they are.",
  }[cond];
  const main = top ? ` ${signalSentence(top).replace(/:.*$/, ".")}` : "";
  const moon = ` The Moon walks through ${sig.moonNak.name}, ${sig.moonNak.gloss}.`;
  return { cond, text: opener + main + moon };
}

export function findThemes(text) {
  const t = ` ${(text || "").toLowerCase()} `;
  const hits = [];
  for (const [theme, words] of Object.entries(THEMES)) {
    if (words.some(w => new RegExp(`[^a-z]${w}[^a-z]`).test(t))) hits.push(theme);
  }
  return hits;
}

function echoFor(top, seed) {
  if (!top) return pick(ECHOES.general, seed);
  if (top.t === "Moon" || top.n === "Moon") return pick(ECHOES.Moon, seed);
  const kinds = [PLANET_INFO[top.t].kind, PLANET_INFO[top.n]?.kind];
  for (const k of ["benefic", "malefic", "electric", "misty", "deep"]) if (kinds.includes(k)) return pick(ECHOES[k], seed);
  return pick(ECHOES.general, seed);
}

// The full check-in reading.
export function writeReading({ feel, chips, text, natal, profile, kp, now = new Date() }) {
  const sig = todaySignals(natal, now);
  const bucket = feel < 0.42 ? "heavy" : feel > 0.62 ? "golden" : "mixed";
  const seed = Math.floor(now.getTime() / 3.6e6) + Math.round(feel * 10) + (text || "").length;
  const cond = conditionOf(sig.personal.length ? sig.personal : sig.collective);

  // Prefer signals whose tone matches how the person feels, so the reading explains their day.
  const wantHarmony = bucket === "heavy" ? -1 : bucket === "golden" ? 1 : 0;
  const ranked = [...sig.personal].sort((a, b) => {
    const fit = s => (wantHarmony === 0 ? 0 : (Math.sign(s.asp.harmony) === wantHarmony ? 0.5 : s.asp.harmony === 0 ? 0.25 : 0));
    return (b.score + fit(b)) - (a.score + fit(a));
  });
  const why = ranked.slice(0, 2).map(signalSentence);
  if (!why.length) why.push("Your chart is quiet today; most of what you feel is coming from the shared sky.");

  const nameBit = profile.name ? `${profile.name}, ` : "";
  const headlines = {
    heavy: [`${nameBit}it's not just you. The sky is leaning on today.`, `${nameBit}heavy skies have their reasons.`, `${nameBit}today has real weather in it.`],
    mixed: [`${nameBit}a day of changeable weather.`, `${nameBit}the sky is mixing its colours today.`],
    golden: [`${nameBit}the sky is in on it.`, `${nameBit}a golden day, and the sky agrees.`],
  };
  const headline = cap(pick(headlines[bucket], seed));

  const themes = findThemes(text);
  const themeLine = themes.length ? THEME_LINES[themes[0]][bucket] : null;

  const moonLine = `The Moon is in ${sig.moonSign} and in the Vedic mansion ${sig.moonNak.name}, ${sig.moonNak.gloss}. It is the ${sig.phase.tithi.name} tithi of the ${sig.phase.tithi.paksha} of the month, a ${sig.phase.name.toLowerCase()}.`;

  const coll = sig.collective[0];
  const whoElse = [];
  if (coll) whoElse.push(signalSentence(coll));
  if (sig.retro.includes("Mercury")) whoElse.push("Mercury is retrograde, so crossed wires and second thoughts are everywhere right now.");
  if (kp != null) {
    if (kp >= 5) whoElse.push(`Earth's magnetic field is stormy (Kp ${kp.toFixed(1)}): real space weather is washing over the planet.`);
    else if (kp >= 4) whoElse.push(`Earth's magnetic field is unsettled (Kp ${kp.toFixed(1)}), a little restlessness in the literal sky.`);
    else whoElse.push(`Space weather is calm (Kp ${kp.toFixed(1)}), so this one is more about the planets than the Sun.`);
  }
  const sample = 400 + ((seed * 7919) % 3600);
  const crowd = { count: sample, label: bucket === "heavy" ? "heavy" : bucket === "golden" ? "bright" : "mixed" };

  const echo = echoFor(ranked[0], seed);
  const closing = bucket === "heavy"
    ? `Nothing in the sky stays put. The Moon moves into a new sign in about ${sig.moonLeft === 1 ? "an hour" : sig.moonLeft + " hours"}, and the mood moves with her.`
    : bucket === "golden"
      ? "Days like this are worth keeping. Bottle it, and it will glow in your journal."
      : `Notice what shifts when the Moon moves on, in about ${sig.moonLeft === 1 ? "an hour" : sig.moonLeft + " hours"}.`;

  return { feel, bucket, cond, headline, quote: (text || "").trim(), why, themeLine, moonLine, whoElse, crowd, echo, closing, chips, sig, ranked, themes, now };
}
