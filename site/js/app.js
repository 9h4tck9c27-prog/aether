import { CITIES, MOOD_WORDS } from "./data.js";
import { buildDeck, consultSteps } from "./reading.js";
import { pickBy, HOME_HEADLINES, HOME_SUPPORT, ASPECT_WORD, CLOSING_LINES, weatherShort } from "./voice.js";
import {
  natalChart, todaySignals, homeForecast, positions, writeReading, conditionOf, CONDITIONS, signOf, nakshatraOf, dayKey, moonPhase, findThemes,
} from "./astro.js";
import { Sky } from "./sky3d.js";
import { REAL_HOME_HEADLINES } from "./voice-real.js";

const A = window.Astronomy;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TIP_URL = "https://ko-fi.com/aetherapp";
const SITE = "https://myaether.info";
const INSTAGRAM = "https://www.instagram.com/_aether.aether_";
const IG_HANDLE = "@_aether.aether_";

// ---------- Storage (on this device only) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem("aether:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("aether:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem("aether:" + k); } catch { } },
};
let profile = store.get("profile", null);
let entries = store.get("entries", []);
let prefs = store.get("prefs", { phase: "auto", useHere: false, here: null, installAskedAt: 0 });
let natal = null, kp = null, weather = null, phaseOverride = null;
if (prefs.phase && prefs.phase !== "auto") { prefs.phase = "auto"; store.set("prefs", prefs); }
// How the sky talks to you: "soft" (the original voice) or "real" (real talk: blunter, funnier, still kind).
const tone = () => (prefs.tone === "real" ? "real" : "soft");
function setTone(t) {
  prefs.tone = t; store.set("prefs", prefs);
  document.body.classList.toggle("tone-real", t === "real");
  document.querySelectorAll(".tone-switch [data-tone]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tone === t)));
}
document.body.classList.toggle("tone-real", tone() === "real");

function toast(msg, ms = 3200) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}

// ---------- Sky ----------
const sky = new Sky($("#sky"));
sky.useSticker();
sky.setSky(positions(new Date()));
// The sphere is drawn inside .sphere-wrap's box; keep it in sync with the layout.
function updateSlot(instant = false) {
  const r = document.querySelector(".sphere-wrap").getBoundingClientRect();
  if (r.width > 0 && r.height > 0) sky.setSlot(r, instant);
}
addEventListener("resize", () => updateSlot());
if (window.visualViewport) visualViewport.addEventListener("resize", () => updateSlot());

// ---------- Time of day ----------
function sunAltitude(date, lat, lon) {
  const obs = new A.Observer(lat, lon, 0);
  const eq = A.Equator("Sun", date, obs, true, true);
  return A.Horizon(date, obs, eq.ra, eq.dec, "normal").altitude;
}
// Where the sky colours follow: your exact spot if you allowed it, otherwise your phone's own time zone.
function placeForColour() {
  if (prefs.useHere && prefs.here) return prefs.here;
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { }
  const city = CITIES.find(c => c[4] === tz);
  if (city) return { lat: city[2], lon: city[3] };
  // Unknown zone: estimate longitude from the clock offset (15 degrees per hour) at a mid latitude.
  return { lat: 40, lon: Math.max(-180, Math.min(180, -new Date().getTimezoneOffset() / 4)) };
}
function computePhase() {
  const forced = phaseOverride;
  if (forced) return forced;
  const { lat, lon } = placeForColour(), now = new Date();
  const alt = sunAltitude(now, lat, lon);
  const rising = sunAltitude(new Date(now.getTime() + 6e5), lat, lon) > alt;
  if (alt < -8) return "night";
  if (alt > 8) return "day";
  return rising ? "dawn" : "dusk";
}
function applyPhase() {
  const p = computePhase();
  document.body.dataset.phase = p;
  sky.setLight(p === "day" || p === "dawn", p === "night");
  const theme = { night: "#1D1A3C", dusk: "#FFEDB8", dawn: "#FFE3EF", day: "#E9E2FF" }[p];
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme);
}
applyPhase();
setInterval(applyPhase, 5 * 60 * 1000);

// ---------- Tilt ----------
function listenTilt() {
  addEventListener("deviceorientation", e => { if (e.beta != null) sky.setTilt(e.beta, e.gamma || 0); });
}
const needsPermission = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";
let tilting = false;
function startTilt() { if (!tilting) { tilting = true; listenTilt(); } $("#tiltBtn").hidden = true; }
// Must be called straight from a tap: iPhone only shows the motion prompt inside a user gesture.
function requestMotion(quiet) {
  if (!needsPermission || tilting) return;
  let req;
  try { req = DeviceOrientationEvent.requestPermission(); } catch { return; }
  req.then(r => {
    if (r === "granted") { store.set("tiltOk", true); startTilt(); if (!quiet) toast("Tilt your phone to turn the sky."); }
    else { store.set("tiltOk", false); $("#tiltBtn").hidden = true; store.set("tiltDenied", true); if (!quiet) toast("Motion is off, so drag the sky to turn it. You can allow motion in Safari's site settings."); }
  }).catch(() => { $("#tiltBtn").hidden = true; });
}
if (needsPermission) {
  if (store.get("tiltOk", false)) requestMotion(true); // re-grant silently where Safari allows it
  $("#tiltBtn").addEventListener("click", () => requestMotion(false));
  // Tapping the sphere also asks, once.
  $("#sky").addEventListener("pointerup", () => { if (!tilting && !store.get("tiltDenied", false)) requestMotion(false); });
} else if ("DeviceOrientationEvent" in window) startTilt();
function showTiltHint() { return;
  if (needsPermission && !tilting && !store.get("tiltDenied", false) && !document.body.classList.contains("onboarding")) $("#tiltBtn").hidden = false;
}

// ---------- Space weather (NOAA, free public feed) ----------
async function loadKp() {
  try {
    const r = await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", { cache: "no-store" });
    const data = await r.json();
    const last = data[data.length - 1];
    const v = Array.isArray(last) ? parseFloat(last[1]) : parseFloat(last.Kp ?? last.kp ?? last.kp_index);
    if (!Number.isNaN(v)) { kp = v; renderHome(); }
  } catch { /* offline or blocked: the reading simply skips space weather */ }
}

// ---------- Weather where you are (MET Norway, via our own tiny proxy) ----------
// Sends rough coordinates only if you turned on "use where I am"; otherwise the server
// uses its own city-level guess from the request and keeps nothing.
async function loadWeather() {
  const cached = store.get("weather", null);
  if (cached && Date.now() - cached.at < 30 * 6e4 && cached.useHere === !!prefs.useHere) { weather = cached.w; renderHome(); return; }
  try {
    const q = prefs.useHere && prefs.here ? `?lat=${prefs.here.lat.toFixed(1)}&lon=${prefs.here.lon.toFixed(1)}` : "";
    const r = await fetch(`/api/weather${q}`);
    if (!r.ok) return;
    const w = await r.json();
    if (w.temp == null) return;
    weather = w; store.set("weather", { at: Date.now(), useHere: !!prefs.useHere, w });
    renderHome();
  } catch { /* offline or not deployed: readings simply skip the weather */ }
}

// ---------- Anonymous counts: one ping per day per event, nothing that identifies you ----------
function countOnce(e) {
  const day = dayKey(), seen = store.get("counted", {});
  // Test links (branch deploys like sticker--aetherize.netlify.app) are not counted.
  if (seen[e] === day || /^(localhost|127\.)|--/.test(location.hostname)) return;
  seen[e] = day; store.set("counted", seen);
  try { fetch("/api/hit", { method: "POST", body: JSON.stringify({ e }), keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => { }); } catch { }
}

// ---------- Home ----------
function renderHome() {
  if (!profile || !natal) return;
  const now = new Date();
  const sig = todaySignals(natal, now);
  sky.setSky(sig.sky);
  const f = homeForecast(sig);
  const daySeed = Math.floor((now.getTime() - now.getTimezoneOffset() * 6e4) / 864e5);
  $("#dateline").textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("#forecastText").textContent = pickBy((tone() === "real" ? REAL_HOME_HEADLINES : HOME_HEADLINES)[f.cond], daySeed);
  $("#forecastSupport").textContent = pickBy(HOME_SUPPORT[f.cond], daySeed + 1);
  // The astrology behind it, in small print.
  const top = sig.personal[0];
  const bits = [];
  const ws = weatherShort(weather);
  if (ws) bits.push(`Outside: ${ws}`);
  if (top) bits.push(`${top.t === "Sun" || top.t === "Moon" ? "The " + top.t : top.t} ${ASPECT_WORD[top.asp.name]} your natal ${top.n === "Ascendant" ? "rising sign" : top.n}`);
  bits.push(`Moon in ${sig.moonSign} and the Vedic mansion ${sig.moonNak.name}`);
  bits.push(`${sig.phase.name}, ${Math.round(sig.phase.illum * 100)}% lit`);
  $("#forecastTech").textContent = bits.join(" · ");
}

// ---------- Birthplace search ----------
const normPlace = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const placeShards = {};
async function loadShard(key) {
  if (!placeShards[key]) placeShards[key] = fetch(`/places/${key}.json`).then(r => { if (!r.ok) throw new Error("places"); return r.json(); }).catch(e => { delete placeShards[key]; throw e; });
  return placeShards[key];
}
async function searchPlaces(raw) {
  const q = normPlace(raw.split(",")[0]);
  const key = /^[a-z]/.test(q) ? q[0] : "other";
  let sh;
  try { sh = await loadShard(key); } catch { return []; }
  const major = new Set(CITIES.map(c => normPlace(c[0]) + "|" + c[1]));
  const out = [];
  for (const row of sh.c) {
    const n = normPlace(row[0]);
    if (!n.startsWith(q)) continue;
    const region = sh.r[row[3]];
    const country = region.split(", ").pop();
    out.push({ name: row[0], region, lat: row[1] / 100, lon: row[2] / 100, tz: sh.t[row[4]],
      score: (n === q ? 0 : 2) + (major.has(n + "|" + country) || CITIES.some(c => normPlace(c[0]) === n && region.includes(c[1].split(", ")[0])) ? -1 : 0) + n.length / 100 });
    if (out.length > 400) break;
  }
  out.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return out.slice(0, 8);
}

// ---------- Onboarding ----------
function showStep(i) {
  document.querySelectorAll(".ob-step").forEach(s => (s.hidden = +s.dataset.step !== i));
  const first = document.querySelector(`.ob-step[data-step="${i}"] input, .ob-step[data-step="${i}"] button`);
  if (first && i > 0) setTimeout(() => first.focus({ preventScroll: true }), 350);
}
let obEditing = false;
function startOnboarding() {
  const ob = $("#onboard"); ob.hidden = false; document.body.classList.add("onboarding"); showStep(0);
  requestAnimationFrame(() => updateSlot());
  const draft = {};
  ob.querySelector("[data-next]").onclick = () => showStep(1);
  $("#obNoTime").onchange = e => { $("#obTime").disabled = e.target.checked; if (e.target.checked) $("#obTime").value = ""; };
  ob.querySelector('[data-step="1"]').onsubmit = e => {
    e.preventDefault();
    draft.birthDate = $("#obDate").value;
    draft.birthTime = $("#obNoTime").checked ? "" : $("#obTime").value;
    if (!draft.birthDate) return toast("Add your birth date to continue.");
    showStep(2);
  };
  // Birthplace search over every town in GeoNames, loaded a letter at a time.
  let chosenPlace = null;
  const cityInput = $("#obCity"), list = $("#placeList");
  const showPlaces = items => {
    list.innerHTML = items.map((p, i) => `<li role="option" id="pl${i}" data-i="${i}"><b>${esc(p.name)}</b><span>${esc(p.region)}</span></li>`).join("");
    list.hidden = !items.length; cityInput.setAttribute("aria-expanded", String(!!items.length));
    list._items = items;
  };
  let searchSeq = 0;
  cityInput.oninput = async () => {
    chosenPlace = null;
    const q = cityInput.value;
    const seq = ++searchSeq;
    if (normPlace(q).length < 2) return showPlaces([]);
    const res = await searchPlaces(q);
    if (seq === searchSeq) showPlaces(res);
  };
  list.onclick = e => {
    const li = e.target.closest("li"); if (!li) return;
    chosenPlace = list._items[+li.dataset.i];
    cityInput.value = `${chosenPlace.name}, ${chosenPlace.region}`;
    showPlaces([]);
    $("#cityHint").textContent = "Got it.";
  };
  ob.querySelector('[data-step="2"]').onsubmit = e => {
    e.preventDefault();
    if (!chosenPlace && list._items && list._items.length === 1) chosenPlace = list._items[0];
    if (!chosenPlace) { $("#cityHint").textContent = navigator.onLine === false ? "You're offline. Connect to the internet to search for your birthplace." : "Choose your town from the list as you type."; return; }
    Object.assign(draft, { city: chosenPlace.name, region: chosenPlace.region, lat: chosenPlace.lat, lon: chosenPlace.lon, tz: chosenPlace.tz });
    showStep(3);
  };
  let pron = "";
  $("#obPronouns").onclick = e => {
    const b = e.target.closest(".chip"); if (!b) return;
    pron = b.dataset.v;
    $("#obPronouns").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b));
  };
  ob.querySelector('[data-step="3"]').onsubmit = e => {
    e.preventDefault();
    draft.name = $("#obName").value.trim();
    draft.pronouns = pron;
    if (obEditing) {
      // Editing from the menu: save and go home, no reading.
      obEditing = false;
      profile = { ...draft }; store.set("profile", profile);
      natal = natalChart(profile); sky.setNatal(natal.pos, natal.asc); sky.bloom();
      ob.hidden = true; document.body.classList.remove("onboarding");
      requestAnimationFrame(() => updateSlot()); renderHome(); toast("Birth details updated.");
      return;
    }
    showStep(4);
  };
  // How today feels, asked once during setup so the first reading starts right after the reveal.
  const obFeel = $("#obFeel");
  const obUpdate = () => {
    const v = obFeel.value / 100;
    $("#obFeelWord").textContent = moodWord(v);
    const tint = document.querySelector(".mood-tint");
    tint.style.setProperty("--tint", v < 0.5 ? "rgba(110, 130, 190, .55)" : "rgba(255, 184, 154, .55)");
    tint.style.opacity = Math.abs(v - 0.5) * 1.6;
  };
  obFeel.oninput = obUpdate; obUpdate();
  ob.querySelector('[data-step="4"]').onsubmit = e => {
    e.preventDefault();
    draft.feel = obFeel.value / 100; draft.words = $("#obWords").value;
    profile = { ...draft }; delete profile.feel; delete profile.words;
    store.set("profile", profile);
    natal = natalChart(profile);
    sky.setNatal(natal.pos, natal.asc); sky.bloom();
    const pos = natal.pos;
    const who = profile.name ? `${profile.name}, you` : "You";
    $("#revealText").textContent = `${who} arrived with the Sun in ${signOf(pos.Sun.lon)}, the Moon in ${signOf(pos.Moon.lon)}${natal.hasTime ? `, and ${signOf(natal.asc)} rising` : ""}.`;
    let sub = `In Vedic astrology, your Moon sits in ${natal.moonNak.name}, ${natal.moonNak.gloss}.`;
    if (natal.nightBirth != null) sub += natal.nightBirth ? " You were born at night, so the Moon leads your chart." : " You were born by day, so the Sun leads your chart.";
    $("#revealSub").textContent = sub;
    showStep(5);
  };
  // Straight from the reveal into the first reading.
  ob.querySelector("[data-finish]").onclick = () => {
    requestMotion(false);
    ob.hidden = true; document.body.classList.remove("onboarding");
    document.querySelector(".mood-tint").style.opacity = 0;
    renderHome();
    beginReading(draft.feel ?? 0.55, draft.words || "");
  };
}

// Three or more heavy check-ins on three days in a row (today included) → a gentle care card, once per streak.
function heavyStreak() {
  const heavyDays = new Set(entries.filter(e => e.feel < 0.42).map(e => e.day));
  let n = 0; const d = new Date();
  while (heavyDays.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function beginReading(feel, text) {
  const r = writeReading({ feel, chips: [], text, natal, profile, kp, tuning: prefs.resonance || {} });
  // Earlier days, for noticing patterns (themes are worked out on this phone and never sent).
  const history = entries.filter(e => e.day !== dayKey()).map(e => ({ day: e.day, feel: e.feel, themes: e.themes || findThemes(e.text) }));
  const entry = { id: Date.now(), day: dayKey(), feel, chips: [], text: text.trim(), headline: r.headline, cond: r.cond, bottled: false,
    themes: r.themes || [], planets: r.ranked.slice(0, 2).map(s => s.t) };
  entries.push(entry); store.set("entries", entries);
  let care = false;
  if (heavyStreak() >= 3 && store.get("careShown", "") !== dayKey()) { care = true; store.set("careShown", dayKey()); }
  countOnce("reading");
  startReading(r, entry, { consult: true, care, history });
}

// ---------- Sheet ----------
function openSheet(html, onClose, footHtml = "") {
  $("#sheetBody").innerHTML = html;
  const foot = $("#sheetFoot"); foot.innerHTML = footHtml; foot.hidden = !footHtml;
  const sheet = $("#sheet");
  sheet.style.transform = "";
  sheet.hidden = false; $("#scrim").hidden = false;
  $("#sheetBody").scrollTop = 0;
  openSheet._onClose = onClose;
}
function closeSheet() {
  if ($("#sheet").hidden) return;
  $("#sheet").hidden = true; $("#scrim").hidden = true;
  document.querySelector(".mood-tint").style.opacity = 0;
  const cb = openSheet._onClose; openSheet._onClose = null; if (cb) cb();
}
$("#sheetClose").addEventListener("click", e => { e.stopPropagation(); closeSheet(); });
$("#scrim").addEventListener("click", closeSheet);
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("#sheet").hidden) closeSheet(); else if (!$("#stage").hidden) endReading();
});
// Swipe the sheet down by its header to close it.
(() => {
  const head = $("#sheetHead"), sheet = $("#sheet"); let y0 = null;
  head.addEventListener("touchstart", e => { if (!e.target.closest("button")) y0 = e.touches[0].clientY; }, { passive: true });
  head.addEventListener("touchmove", e => { if (y0 != null) sheet.style.transform = `translateY(${Math.max(0, e.touches[0].clientY - y0)}px)`; }, { passive: true });
  head.addEventListener("touchend", e => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null; sheet.style.transform = "";
    if (dy > 70) closeSheet();
  });
})();

// ---------- Check-in ----------
const moodWord = v => MOOD_WORDS[Math.min(MOOD_WORDS.length - 1, Math.floor(v * MOOD_WORDS.length))];
// Did the last reading feel true? Asked once, the next time they check in. Kept on this phone and used to tune future readings.
function resonancePrompt() {
  const last = [...entries].reverse().find(e => e.day !== dayKey());
  if (!last || last.resonance || !last.planets || (Date.now() - last.id) > 4 * 864e5) return "";
  return `<div class="resonance" id="resonance"><p>Did your last reading feel true?</p><div class="res-row">
    <button type="button" data-res="yes">Yes</button><button type="button" data-res="little">A little</button><button type="button" data-res="no">Not really</button></div></div>`;
}
function bindResonance() {
  const box = $("#resonance"); if (!box) return;
  box.querySelectorAll("[data-res]").forEach(b => (b.onclick = () => {
    const last = [...entries].reverse().find(e => e.day !== dayKey());
    if (!last) return;
    last.resonance = b.dataset.res; store.set("entries", entries);
    const w = { yes: 1, little: 0.4, no: -0.6 }[b.dataset.res];
    prefs.resonance = prefs.resonance || {};
    for (const p of last.planets || []) prefs.resonance[p] = Math.max(-3, Math.min(3, (prefs.resonance[p] || 0) + w));
    store.set("prefs", prefs);
    box.innerHTML = `<p class="res-thanks">${b.dataset.res === "no" ? "Thank you. æther will listen more closely." : "Thank you. That helps æther know you."}</p>`;
  }));
}
function openCheckin() {
  openSheet(`
    ${resonancePrompt()}
    <h2 id="sheetTitle">How's today?</h2>
    <p class="feel-word" id="feelWord"></p>
    <input class="feel-range" id="feel" type="range" min="0" max="100" value="55" aria-label="How today feels, from heavy to golden">
    <div class="ends"><span>Heavy</span><span>Golden</span></div>
    <textarea id="words" placeholder="Tell the sky what happened, in a sentence or two (optional)" maxlength="400"></textarea>
    <p class="privacy-note">Your words stay on this phone. They are never sent anywhere.</p>
  `, null, `<button class="primary" id="readBtn">Read my sky</button>`);
  const tint = document.querySelector(".mood-tint");
  const feel = $("#feel");
  const update = () => {
    const v = feel.value / 100;
    $("#feelWord").textContent = moodWord(v);
    tint.style.setProperty("--tint", v < 0.5 ? "rgba(110, 130, 190, .55)" : "rgba(255, 184, 154, .55)");
    tint.style.opacity = Math.abs(v - 0.5) * 1.6;
  };
  feel.oninput = update; update();
  bindResonance();
  $("#readBtn").onclick = () => {
    const text = $("#words").value;
    closeSheet();
    beginReading(feel.value / 100, text);
  };
}

// ---------- The reading: consult the sky, then swipe through cards ----------
let reading = null;
const CONSULT_STEP_MS = 1150;

function startReading(r, entry, { consult = true, care = false, history = [] } = {}) {
  document.body.classList.add("reading-mode");
  sky.clip = false;
  $("#stage").hidden = false;
  $("#cards").hidden = true; $("#cards").innerHTML = ""; $("#bars").innerHTML = "";
  sky.setSky(r.sig.sky);
  requestAnimationFrame(() => updateSlot());
  const deckOpts = { weather, care, history, feelWord: moodWord(r.feel), name: profile.name || "" };
  reading = { r, entry, deckOpts, deck: buildDeck(r, natal, kp, { ...deckOpts, tone: tone() }), index: -1 };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!consult || reduced) { $("#consult").hidden = true; showDeck(); return; }

  $("#consult").hidden = false;
  const steps = consultSteps(r, natal, profile, kp, weather);
  const pairs = [
    ...r.sig.personal.slice(0, 6).map(s => [["sky", s.t], ["natal", s.n === "Ascendant" && natal.asc == null ? "Sun" : s.n]]),
    ...r.sig.collective.slice(0, 4).map(s => [["sky", s.t], ["sky", s.n]]),
  ];
  sky.consult(pairs.length ? pairs : [[["sky", "Sun"], ["sky", "Moon"]]], steps.length * CONSULT_STEP_MS);
  let i = 0;
  const stepEl = $("#consultStep"), fill = $("#consultFill");
  fill.style.transitionDuration = "0s"; fill.style.width = "0%"; void fill.offsetWidth; fill.style.transitionDuration = "";
  const tick = () => {
    if (!reading || reading.consultDone) return;
    if (i >= steps.length) return finishConsult();
    stepEl.classList.remove("in"); void stepEl.offsetWidth;
    stepEl.textContent = steps[i]; stepEl.classList.add("in");
    fill.style.width = `${((i + 1) / steps.length) * 100}%`;
    i++;
    reading.timer = setTimeout(tick, CONSULT_STEP_MS);
  };
  tick();
  $("#consult").onclick = () => { if (i >= 2) finishConsult(); };
}

function finishConsult() {
  if (!reading || reading.consultDone) return;
  reading.consultDone = true;
  clearTimeout(reading.timer);
  sky.endConsult();
  $("#consult").hidden = true;
  showDeck();
}

function rv(html, d) { return html ? html.replace(/^<(\w+)/, `<$1 style="--d:${d}"`).replace(/class="/, 'class="rv ') : ""; }

function moonSvg(phase) {
  const r = 34, cx = 40, cy = 40, k = Math.cos(phase.angle * Math.PI / 180), rx = Math.abs(k) * r;
  const waxing = phase.angle < 180;
  const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx} ${r} 0 0 ${k > 0 ? 0 : 1} ${cx} ${cy - r}Z`;
  return `<svg class="moon-svg" viewBox="0 0 80 80" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" class="moon-dark"/><path d="${lit}" class="moon-lit" ${waxing ? "" : `transform="translate(80 0) scale(-1 1)"`}/></svg>`;
}

// Small print: the astrology behind a card, with a definition.
function techBlock(tech) {
  if (!tech) return "";
  const glyphs = tech.glyphs ? `<span class="tech-glyphs" aria-hidden="true">${tech.glyphs.map((g, i) => `<span${i === 1 ? ' class="asp"' : ""}>${g}</span>`).join("")}</span>` : "";
  // The astrology sits behind a small toggle, so the card reads cleanly and the detail is one tap away.
  return `<details class="tech"><summary class="tech-name">${glyphs}<span>${esc(tech.name)}</span><span class="tech-more" aria-hidden="true">+</span></summary><p class="tech-text">${esc(tech.text)}</p></details>`;
}

// "Is this you?" on each personal card. The answer tunes which planets æther listens to for you.
const RES_WEIGHT = { yes: 1, little: 0.4, no: -0.6 };
function resCard(c) {
  const done = (reading.entry.cardRes || {})[c.planet];
  if (done) return `<div class="res-card"><span class="res-done">${done === "no" ? "noted. æther will listen closer." : "noted. that helps æther know you."}</span></div>`;
  return `<div class="res-card" data-planet="${esc(c.planet)}"><span>is this you?</span><button type="button" data-res="yes">so me</button><button type="button" data-res="little">kinda</button><button type="button" data-res="no">nope</button></div>`;
}
function bindCardRes(root) {
  root.querySelectorAll(".res-card[data-planet] [data-res]").forEach(b => (b.onclick = () => {
    const box = b.closest(".res-card"), planet = box.dataset.planet, v = b.dataset.res;
    const en = reading.entry;
    en.cardRes = { ...(en.cardRes || {}), [planet]: v };
    if (!en.resonance) en.resonance = v;   // counts as the "did it feel true?" answer for this reading
    store.set("entries", entries);
    prefs.resonance = prefs.resonance || {};
    prefs.resonance[planet] = Math.max(-3, Math.min(3, (prefs.resonance[planet] || 0) + RES_WEIGHT[v]));
    store.set("prefs", prefs);
    box.innerHTML = `<span class="res-done">${v === "no" ? "noted. æther will listen closer." : "noted. that helps æther know you."}</span>`;
    box.removeAttribute("data-planet");
  }));
}

function renderCard(c, i, r) {
  let d = 0;
  const kicker = rv(`<p class="kicker">${esc(c.kicker)}</p>`, d++);
  let inner = "";
  if (c.type === "open") {
    inner = kicker
      + rv(`<h2 class="card-title big">${esc(c.title)}</h2>`, d++)
      + (c.quote ? rv(`<p class="quote">${esc(c.quote)}</p>`, d++) : "")
      + rv(`<p class="lead">${esc(c.lead)}</p>`, d++)
      + (c.weather ? rv(`<p class="weather-line"><span class="pill">Outside: ${esc(c.weather.short)}</span> ${esc(c.weather.line)}</p>`, d++) : "")
      + rv(`<button class="tap-big" type="button" data-act="next"><span>Tap to continue</span><span class="chevs" aria-hidden="true"><i>›</i><i>›</i><i>›</i></span></button>`, d++);
  } else if (c.type === "transit") {
    inner = kicker
      + rv(`<h2 class="card-title">${esc(c.title)}</h2>`, d++)
      + rv(`<p class="pill">${esc(c.pill)}</p>`, d++)
      + rv(`<p class="lead">${esc(c.lead)}</p>`, d++)
      + (c.thread ? rv(`<p class="thread">${esc(c.thread)}</p>`, d++) : "")
      + rv(techBlock(c.tech), d++)
      + rv(resCard(c), d++);
  } else if (c.type === "reflect") {
    inner = kicker
      + rv(`<h2 class="card-title big question">${esc(c.title)}</h2>`, d++)
      + rv(`<p class="lead soft">${esc(c.lead)}</p>`, d++)
      ;
  } else if (c.type === "ahead") {
    inner = kicker
      + rv(`<h2 class="card-title">${esc(c.title)}</h2>`, d++)
      + rv(`<ol class="ahead-list">${c.items.map(it => `<li class="${it.personal ? "personal" : ""}"><span class="ahead-day">${esc(it.day)}${it.personal ? " · for you" : ""}</span><b>${esc(it.title)}</b><span class="ahead-text">${esc(it.text)}</span></li>`).join("")}</ol>`, d++);
  } else if (c.type === "moon") {
    inner = kicker
      + rv(`<div class="moon-row">${moonSvg(c.phase)}<h2 class="card-title">${esc(c.title)}</h2></div>`, d++)
      + rv(`<p class="pill">${esc(c.pill)}</p>`, d++)
      + rv(`<p class="lead">${esc(c.lead)}</p>`, d++)
      + rv(techBlock(c.tech), d++);
  } else if (c.type === "together") {
    inner = kicker
      + rv(`<h2 class="card-title">${esc(c.title)}</h2>`, d++)
      + rv(`<div class="crowd-big"><strong data-count="${c.crowd.count}">0</strong><span>people near you logged a ${esc(c.crowd.label)} day too</span></div>`, d++)
      + rv(`<p class="lead">${esc(c.lead)}</p>`, d++)
      + rv(techBlock(c.tech), d++);
  } else if (c.type === "care") {
    inner = kicker
      + rv(`<h2 class="card-title">${esc(c.title)}</h2>`, d++)
      + rv(`<p class="lead">${esc(c.lead)}</p>`, d++)
      + rv(`<div class="care-help"><p>${esc(c.more)}</p><a class="primary care-btn" href="${esc(c.help.href)}"${c.help.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(c.help.label)}</a><small>${esc(c.help.note)}</small></div>`, d++)
      + rv(`<p class="care-skip">Tap anywhere to keep going.</p>`, d++);
  } else if (c.type === "close") {
    const saved = reading.entry.bottled;
    inner = kicker
      + rv(`<blockquote class="closing-line">${esc(c.line.text)}</blockquote>`, d++)
      + (c.line.author ? rv(`<p class="cite">${esc(c.line.author)}${c.line.work ? `, <i>${esc(c.line.work)}</i>` : ""}</p>`, d++) : "")
      + rv(`<div class="card-actions">
          <button class="primary share-btn" data-act="share"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>Share</button>
          <div class="row">${isStandalone() ? "" : `<button class="ghost" data-act="install">Add æther to home screen</button>`}<button class="ghost" data-act="save"${saved ? " disabled" : ""}>${saved ? "Saved to journal" : "Save to journal"}</button></div>
          ${c.bucket !== "golden" ? `<button class="breathe-btn" data-act="breathe"><span class="breathe-dot" aria-hidden="true"></span>${c.bucket === "heavy" ? "Take a slow breath with the sky" : "Take a quiet minute to settle"}</button>` : ""}
        </div>`, d++)
      + (c.bucket === "golden" ? rv(`<div class="card-tip"><button class="tip-btn" type="button"><span class="tip-heart" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.8c0 5.7-7.5 10.3-7.5 10.3z"/></svg></span><span class="tip-text"><b>Chip in to keep æther free</b><small>No ads, no paywall. Tips keep the sky turning.</small></span><span class="tip-arrow" aria-hidden="true">›</span></button></div>`, d++) : "");
  }
  return `<article class="card card-${c.type}" aria-roledescription="card" aria-label="Card ${i + 1} of ${reading.deck.length}"><div class="card-inner"><div class="card-content">${inner}</div></div></article>`;
}

function showDeck() {
  const { deck, r } = reading;
  const cards = $("#cards");
  cards.innerHTML = deck.map((c, i) => renderCard(c, i, r)).join("");
  $("#bars").innerHTML = deck.map(() => "<span></span>").join("");
  cards.hidden = false;
  reading.index = -1;
  fitCards();
  setActive(0);
  // Tap anywhere to continue; tap the left edge to go back. Swiping also works.
  cards.onclick = e => {
    if (e.target.closest("button, a, input, label, textarea, summary, details")) return;
    if (e.clientX / innerWidth < 0.22) goCard(-1); else goCard(1);
  };
  let sx = null, sy = null;
  cards.ontouchstart = e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
  cards.ontouchend = e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { e.preventDefault(); goCard(dx < 0 ? 1 : -1); }
  };
  cards.querySelectorAll("[data-act]").forEach(b => (b.onclick = () => cardAction(b)));
  bindCardRes(cards);
  cards.querySelectorAll("details.tech").forEach(d => d.addEventListener("toggle", () => fitCards()));
}

// Every card fits on one screen: if its text is taller than the space, scale it down a little.
function fitCards() {
  document.querySelectorAll("#cards .card").forEach(card => {
    const inner = card.querySelector(".card-inner"), content = card.querySelector(".card-content");
    content.style.zoom = 1;
    const cs = getComputedStyle(inner);
    const avail = inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const h = content.offsetHeight;
    content.style.zoom = h > avail ? Math.max(0.7, avail / h).toFixed(3) : 1;
  });
}
addEventListener("resize", () => { if (reading && reading.consultDone !== false) { fitCards(); const el = document.querySelectorAll("#cards .card")[reading.index]; if (el) placeScrim(el); } });
// The soft backdrop behind the text starts just above where the text begins, so the sphere stays visible above it.
function placeScrim(card) {
  const top = card.querySelector(".card-content").getBoundingClientRect().top;
  $("#stage").style.setProperty("--scrim", `${Math.max(0, top - 120)}px`);
}
$("#nextHint").onclick = () => goCard(1);

function goCard(dir) {
  if (!reading) return;
  setActive(Math.max(0, Math.min(reading.deck.length - 1, reading.index + dir)));
}

function setActive(i) {
  if (!reading || i === reading.index || i < 0 || i >= reading.deck.length) return;
  reading.index = i;
  const els = document.querySelectorAll("#cards .card");
  els.forEach((el, j) => { el.classList.toggle("active", j === i); el.inert = j !== i; el.setAttribute("aria-hidden", j !== i); });
  // Screen readers land on the new card's heading.
  const h = els[i].querySelector("h2, blockquote");
  if (h) { h.tabIndex = -1; setTimeout(() => h.focus({ preventScroll: true }), 50); }
  document.querySelectorAll("#bars span").forEach((b, j) => (b.className = j < i ? "done" : j === i ? "on" : ""));
  $("#nextHint").hidden = i === 0 || i === reading.deck.length - 1;
  $("#stage").dataset.card = reading.deck[i].type;
  placeScrim(els[i]);
  sky.focus(reading.deck[i].focus);
  const num = els[i].querySelector("[data-count]");
  if (num && !num.dataset.done) countUp(num);
}

function countUp(el) {
  el.dataset.done = "1";
  const target = +el.dataset.count, t0 = performance.now(), dur = 1400;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function cardAction(b) {
  const act = b.dataset.act;
  if (act === "next") return goCard(1);
  if (act === "share") return shareCard(reading.r, reading.deck);
  if (act === "breathe") return startRitual();
  if (act === "done") return endReading();
  if (act === "install") return openInstall();
  if (act === "save") {
    reading.entry.bottled = true; store.set("entries", entries);
    sky.bloom(); b.disabled = true; b.textContent = "Saved to journal";
    toast("Saved to your journal.");
  }
}

function endReading() {
  if (!reading) return;
  clearTimeout(reading.timer);
  if (!reading.consultDone) sky.endConsult();
  reading = null;
  $("#stage").hidden = true;
  document.body.classList.remove("reading-mode");
  sky.clip = false;
  sky.focus(null);
  sky.setSky(positions(new Date()));
  requestAnimationFrame(() => updateSlot());
  renderHome();
  maybeAskInstall();
}
$("#stageClose").onclick = endReading;
document.querySelectorAll(".tone-switch [data-tone]").forEach(b => (b.onclick = e => {
  e.stopPropagation();
  if (b.dataset.tone === tone()) return;
  setTone(b.dataset.tone);
  renderHome();
  if (!reading) return;
  reading.deck = buildDeck(reading.r, natal, kp, { ...reading.deckOpts, tone: tone() });
  if ($("#cards").innerHTML) { const at = reading.index; showDeck(); setActive(Math.min(at, reading.deck.length - 1)); }
}));
setTone(tone());

// ---------- Breathing ritual: in 4 s, out 6 s, three rounds ----------
function startRitual() {
  closeSheet();
  const el = $("#ritual"), orb = $("#breathOrb"), word = $("#breathWord");
  el.hidden = false;
  let round = 0, stopped = false;
  const step = () => {
    if (stopped) return;
    if (round >= 3) { word.textContent = "Welcome back"; return; }
    word.textContent = "Breathe in";
    orb.animate([{ transform: "scale(.7)" }, { transform: "scale(1.25)" }], { duration: 4000, fill: "forwards", easing: "ease-in-out" });
    setTimeout(() => {
      if (stopped) return;
      word.textContent = "Breathe out";
      orb.animate([{ transform: "scale(1.25)" }, { transform: "scale(.7)" }], { duration: 6000, fill: "forwards", easing: "ease-in-out" });
      setTimeout(() => { round++; step(); }, 6000);
    }, 4000);
  };
  step();
  $("#ritualDone").onclick = () => { stopped = true; el.hidden = true; if (!reading) maybeAskInstall(); };
}

// ---------- Share card ----------
function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
// The share image: a story-sized sticker of the whole reading, with the closing line at the bottom.
// It never includes the words the person wrote.
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
async function renderShareImage(r, deck) {
  try { await Promise.all(['800 64px "Unbounded"', '700 30px "Unbounded"', '500 30px "DM Sans"', '700 30px "DM Sans"', '700 40px "Caveat"'].map(f => document.fonts.load(f))); } catch { }
  deck = deck || [];
  const real = tone() === "real";
  const low = t => (real ? t.toLowerCase() : t);
  const close = deck.find(c => c.type === "close");
  const line = close ? close.line : null;
  const items = deck.filter(c => c.type === "transit" || c.type === "moon");
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const INK = "#141218", PINK = "#FF6FAE", YEL = "#FFD84D", MINT = "#6EE7B7", COB = "#3D3BFF";
  const ground = { heavy: "#CDD3FF", mixed: "#E9E2FF", golden: "#FF9CC8" }[r.bucket] || "#E9E2FF";
  g.fillStyle = ground; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(20,18,24,.08)";
  for (let y = 12; y < H; y += 44) for (let x = 12; x < W; x += 44) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }

  // Date sticker
  const date = r.now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }).toLowerCase();
  g.save(); g.translate(84, 110); g.rotate(-0.06);
  g.font = '700 34px "Unbounded", sans-serif'; const dw = g.measureText("my sky · " + date).width + 56;
  rrect(g, 0, 0, dw, 70, 35); g.fillStyle = YEL; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  g.fillStyle = INK; g.textBaseline = "middle"; g.fillText("my sky · " + date, 28, 37); g.restore();
  g.textBaseline = "alphabetic";

  // Sticker globe with today's real planets on the ring
  const cx = W - 250, cy = 330, R = 150, rx = 220, ry = 62, rot = -0.22;
  const ringPt = lon => { const a = lon * Math.PI / 180, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot), Math.sin(a)]; };
  const ring = (from, to) => { g.save(); g.translate(cx, cy); g.rotate(rot); g.lineCap = "round";
    g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, from, to); g.stroke();
    g.strokeStyle = PINK; g.lineWidth = 20; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, from, to); g.stroke(); g.restore(); };
  const DOT = { Sun: YEL, Moon: "#fff", Mercury: MINT, Venus: PINK, Mars: "#FF7A45", Jupiter: "#FFB020", Saturn: "#C9B8FF", Uranus: "#7DE3FF", Neptune: "#8FA2FF", Pluto: "#B98CFF" };
  const dots = Object.entries(r.sig.sky).map(([p, v]) => [p, ...ringPt(v.lon)]);
  const drawDot = ([p, x, y]) => { const big = p === "Sun" || p === "Moon"; g.beginPath(); g.arc(x, y, big ? 21 : 15, 0, 7); g.fillStyle = DOT[p] || "#fff"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); };
  ring(Math.PI, Math.PI * 2);
  dots.filter(d => d[3] < 0).forEach(drawDot);
  g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = COB; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, R - 34, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
  ring(0, Math.PI);
  dots.filter(d => d[3] >= 0).forEach(drawDot);
  // A little sparkle sticker
  const spark = (x, y, s, col) => { g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * .1, -s * .3, s * .3, -s * .1, s, 0); g.bezierCurveTo(s * .3, s * .1, s * .1, s * .3, 0, s); g.bezierCurveTo(-s * .1, s * .3, -s * .3, s * .1, -s, 0); g.bezierCurveTo(-s * .3, -s * .1, -s * .1, -s * .3, 0, -s); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); g.restore(); };
  spark(150, 330, 46, YEL); spark(250, 470, 26, PINK);

  // The card
  const blocks = [{ kind: "head", text: low((deck[0] && deck[0].title) || r.headline) }];
  for (const it of items) blocks.push({ kind: "item", kicker: it.kicker, title: low(it.title), meta: it.tech ? it.tech.name : "" });
  const ahead = deck.find(c => c.type === "ahead");
  if (ahead && ahead.items.length) blocks.push({ kind: "item", kicker: "What's next", title: low(ahead.title), meta: ahead.items.slice(0, 2).map(e => `${e.day.split(",")[0]}: ${e.title}`).join("  ·  ") });
  if (line) blocks.push({ kind: "quote", text: line.text, author: line.author });
  const CX = 70, CW = W - 140, PAD = 56, TW = CW - PAD * 2, top = 610, maxH = H - 230 - top;
  const layout = k => {
    const f = { head: 70 * k, kick: 26 * k, title: 42 * k, meta: 28 * k, quote: 60 * k, author: 28 * k };
    let h = PAD; const out = [];
    for (const b of blocks) {
      if (b.kind === "head") { g.font = `800 ${f.head}px "Unbounded", sans-serif`; const ls = wrap(g, b.text, TW); out.push({ b, ls, f }); h += ls.length * f.head * 1.12 + 34 * k; }
      else if (b.kind === "item") { g.font = `700 ${f.title}px "Unbounded", sans-serif`; const ls = wrap(g, b.title, TW); g.font = `500 ${f.meta}px "DM Sans", sans-serif`; const ms = wrap(g, b.meta, TW); out.push({ b, ls, ms, f }); h += f.kick * 2.2 + ls.length * f.title * 1.18 + ms.length * f.meta * 1.4 + 30 * k; }
      else { g.font = `700 ${f.quote}px "Caveat", cursive`; const ls = wrap(g, b.text, TW); out.push({ b, ls, f }); h += 24 * k + ls.length * f.quote * 1.05 + (b.author ? f.author * 1.8 : 0); }
    }
    return { out, h: h + PAD - 20 * k };
  };
  let k = 1, L = layout(k);
  while (L.h > maxH && k > 0.6) { k -= 0.03; L = layout(k); }
  const CH = L.h;
  g.save(); g.translate(CX + CW / 2, top + CH / 2); g.rotate(-0.012); g.translate(-(CX + CW / 2), -(top + CH / 2));
  rrect(g, CX + 20, top + 20, CW, CH, 56); g.fillStyle = INK; g.fill();
  rrect(g, CX, top, CW, CH, 56); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  let y = top + PAD; const X = CX + PAD;
  for (const { b, ls, ms, f } of L.out) {
    if (b.kind === "head") {
      g.fillStyle = INK; g.font = `800 ${f.head}px "Unbounded", sans-serif`;
      ls.forEach(l => { y += f.head; g.fillText(l, X, y); y += f.head * 0.12; });
      y += 34 * k;
    } else if (b.kind === "item") {
      g.font = `700 ${f.kick}px "Unbounded", sans-serif`;
      const kw = g.measureText(b.kicker.toLowerCase()).width + 28, kh = f.kick * 1.7;
      rrect(g, X, y, kw, kh, 14); g.fillStyle = b.kicker === "What's next" ? YEL : MINT; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      g.fillStyle = INK; g.textBaseline = "middle"; g.fillText(b.kicker.toLowerCase(), X + 14, y + kh / 2 + 1); g.textBaseline = "alphabetic";
      y += f.kick * 2.2;
      g.font = `700 ${f.title}px "Unbounded", sans-serif`;
      ls.forEach(l => { y += f.title; g.fillText(l, X, y); y += f.title * 0.18; });
      g.fillStyle = "#4A4553"; g.font = `500 ${f.meta}px "DM Sans", sans-serif`;
      ms.forEach(l => { y += f.meta * 1.15; g.fillText(l, X, y); y += f.meta * 0.25; });
      y += 30 * k;
    } else {
      y += 24 * k;
      g.fillStyle = COB; g.font = `700 ${f.quote}px "Caveat", cursive`;
      ls.forEach(l => { y += f.quote * 0.95; g.fillText(l, X, y); y += f.quote * 0.1; });
      if (b.author) { g.fillStyle = "#4A4553"; g.font = `700 ${f.author}px "DM Sans", sans-serif`; y += f.author * 1.5; g.fillText(`— ${b.author}`, X, y); }
    }
  }
  g.restore();

  // Footer bar
  rrect(g, 70, H - 190, W - 140, 130, 40); g.fillStyle = INK; g.fill();
  g.fillStyle = "#fff"; g.font = '800 50px "Unbounded", sans-serif'; g.fillText("æther", 116, H - 112);
  g.fillStyle = "#E9E2FF"; g.font = '600 28px "DM Sans", sans-serif'; g.textAlign = "right";
  g.fillText("get yours free · " + SITE.replace("https://", ""), W - 116, H - 132);
  g.fillText(IG_HANDLE, W - 116, H - 92); g.textAlign = "left";
  return new Promise(res => c.toBlob(res, "image/png"));
}
async function shareCard(r, deck) {
  const blob = await renderShareImage(r, deck);
  const close = (deck || []).find(c => c.type === "close"), line = close && close.line;
  const file = new File([blob], "aether-sky.png", { type: "image/png" });
  const text = `${line && line.text ? "“" + line.text + "”" + (line.author ? " — " + line.author : "") + "\n\n" : ""}My sky today on æther: ${SITE}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); } catch { /* cancelled */ }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "aether-sky.png"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast("Saved your sky card as an image.");
}
async function shareApp() {
  const data = { title: "æther", text: "Your daily astrological weather. It's not just you.", url: SITE + "/" };
  if (navigator.share) { try { await navigator.share(data); } catch { } return; }
  try { await navigator.clipboard.writeText(data.url); toast("Link copied."); } catch { toast(data.url); }
}

// ---------- Journal ----------
let calMonth = new Date(); calMonth.setDate(1);
function feelColour(v) {
  const cs = getComputedStyle(document.body);
  const a = v < 0.5 ? cs.getPropertyValue("--heavy").trim() : "#b4a6e6", b = v < 0.5 ? "#b4a6e6" : cs.getPropertyValue("--golden").trim();
  const t = v < 0.5 ? v * 2 : (v - 0.5) * 2;
  return `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
}
function openJournal() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const byDay = {};
  for (const e of entries) (byDay[e.day] ||= []).push(e);
  const today = dayKey();
  let cells = ["M", "T", "W", "T", "F", "S", "S"].map(d => `<span class="dow" aria-hidden="true">${d}</span>`).join("");
  cells += "<span></span>".repeat(offset);
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const list = byDay[key], last = list?.[list.length - 1];
    const star = list?.some(e => e.bottled);
    cells += `<button class="${list ? "has" : ""} ${key === today ? "today" : ""} ${star ? "star" : ""}" data-day="${key}" aria-label="${key}${last ? ", " + Math.round(last.feel * 100) + " out of 100" : ""}">${last ? `<span class="dot" style="background:${feelColour(last.feel)}"></span>` : ""}<span class="num">${d}</span></button>`;
  }
  const stars = entries.filter(e => e.bottled).length;
  openSheet(`
    <h2 id="sheetTitle">Your sky journal</h2>
    <div class="cal-head">
      <strong>${first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
      <div class="cal-nav">
        <button class="icon-btn" id="calPrev" aria-label="Previous month"><svg viewBox="0 0 24 24" stroke="currentColor"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="icon-btn" id="calNext" aria-label="Next month"><svg viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
    </div>
    <div class="cal">${cells}</div>
    <div class="legend"><span>Heavy</span><span class="bar"></span><span>Golden</span></div>
    <div id="dayDetail">${entries.length ? `<p class="empty">${stars ? `${stars} ${stars === 1 ? "reading" : "readings"} saved so far. ` : ""}Tap a day to reread it.</p>` : `<p class="empty">Your first check-in will appear here as a dot of colour.</p>`}</div>
    <div class="linkrow">
      <button class="ghost" id="exportBtn">Save a backup</button>
      <label class="ghost" style="cursor:pointer">Restore a backup<input type="file" id="importInput" accept="application/json" hidden></label>
    </div>
  `);
  $("#calPrev").onclick = () => { calMonth.setMonth(calMonth.getMonth() - 1); openJournal(); };
  $("#calNext").onclick = () => { calMonth.setMonth(calMonth.getMonth() + 1); openJournal(); };
  document.querySelector(".cal").onclick = e => {
    const b = e.target.closest("button[data-day]"); if (!b) return;
    const list = byDay[b.dataset.day] || [];
    $("#dayDetail").innerHTML = list.length ? list.slice().reverse().map(en => `
      <div class="entry">
        <div class="when">${new Date(en.id).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}. ${moodWord(en.feel)}${en.bottled ? ", saved" : ""}</div>
        <div class="h">${esc(en.headline)}</div>
        ${en.text ? `<p class="quote" style="font-family:var(--serif);font-style:italic">${esc(en.text)}</p>` : ""}
        <button class="ghost small-btn" data-open="${en.id}">Open this reading</button>
      </div>`).join("") : `<p class="empty">No check-in that day.</p>`;
    $("#dayDetail").querySelectorAll("[data-open]").forEach(btn => btn.onclick = () => {
      const en = entries.find(x => x.id === +btn.dataset.open); if (!en) return;
      const r = writeReading({ feel: en.feel, chips: en.chips || [], text: en.text, natal, profile, kp: null, now: new Date(en.id) });
      closeSheet(); startReading(r, en, { consult: false });
    });
  };
  $("#exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify({ profile, entries }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `aether-journal-${dayKey()}.json`; a.click();
  };
  $("#importInput").onchange = async e => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      const known = new Set(entries.map(x => x.id));
      entries = entries.concat((data.entries || []).filter(x => !known.has(x.id))).sort((a, b) => a.id - b.id);
      store.set("entries", entries); toast("Backup restored."); openJournal();
    } catch { toast("That file isn't an æther backup."); }
  };
}

// ---------- Install ----------
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let deferredPrompt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; });
function maybeAskInstall() {
  if (isStandalone()) return;
  if (Date.now() - (prefs.installAskedAt || 0) < 7 * 864e5) return;
  prefs.installAskedAt = Date.now(); store.set("prefs", prefs);
  setTimeout(openInstall, 500);
}
function openInstall() {
  const share = '<svg viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  const plus = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const body = isIOS ? `
      <div class="install-steps">
        <div class="install-step"><span class="badge">${share}</span><p>Tap the Share button in Safari's toolbar.</p></div>
        <div class="install-step"><span class="badge">${plus}</span><p>Scroll down and choose Add to Home Screen.</p></div>
      </div>
      <button class="ghost" id="notNow" style="width:100%">Not now</button>`
    : deferredPrompt ? `<button class="primary" id="installNow">Add æther</button><button class="ghost" id="notNow" style="width:100%;margin-top:10px">Not now</button>`
      : `<p>Use your browser's menu and choose Install app or Add to Home Screen.</p><button class="ghost" id="notNow" style="width:100%">Got it</button>`;
  openSheet(`
    <img class="install-icon" src="/icons/icon-192.png" alt="">
    <h2 id="sheetTitle">Keep æther on your home screen</h2>
    <p>It opens full-screen like an app, and your sky journal stays safer on this phone.</p>
    ${body}
  `);
  $("#notNow").onclick = closeSheet;
  const go = $("#installNow");
  if (go) go.onclick = async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; closeSheet(); };
}

// ---------- Menu ----------
function openMenu() {
  const ic = {
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    home: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
  };
  const phases = ["auto", "dawn", "day", "dusk", "night"];
  const cur = phaseOverride || "auto";
  openSheet(`
    <h2 id="sheetTitle">æther</h2>
    <div class="menu-list">
      <div class="menu-item" style="display:block;cursor:default">How should the sky talk to you?<small>Soft is gentle. Real talk is blunter and funnier, and still kind.</small>
        <div class="chips" id="mTone" style="margin-top:10px"><button type="button" class="chip" data-v="soft" aria-pressed="${tone() === "soft"}">soft</button><button type="button" class="chip" data-v="real" aria-pressed="${tone() === "real"}">real talk</button></div>
      </div>
      <button class="menu-item" id="mShare">${ic.share}<span>Share æther<small>Send the app to a friend</small></span></button>
      ${isStandalone() ? "" : `<button class="menu-item" id="mInstall">${ic.home}<span>Add to home screen<small>Open it full-screen, like an app</small></span></button>`}
      <button class="menu-item" id="mHere">${ic.pin}<span>${prefs.useHere ? "Colour the sky for where I am" : "Use where I am for colours and weather"}<small>${prefs.useHere ? "On. Tap to follow your time zone instead" : "Off. Colours follow your time zone; weather uses a rough guess of your city"}</small></span></button>
      <div class="menu-item" style="display:block;cursor:default">Preview time of day<small>Try each look for a moment. Auto follows the real Sun where you are.</small>
        <div class="chips" id="mPhase" style="margin-top:10px">${phases.map(p => `<button type="button" class="chip" aria-pressed="${p === cur}" data-v="${p}">${p}</button>`).join("")}</div>
      </div>
      <a class="menu-item" href="${INSTAGRAM}" target="_blank" rel="noopener">${ic.share.replace(/<path[\s\S]*$/, '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".6"/></svg>')}<span>Follow on Instagram<small>${IG_HANDLE}</small></span></a>
      <button class="menu-item" id="mTip">${ic.heart}<span>Chip in<small>æther is free, with no ads and no paywall</small></span></button>
      <button class="menu-item" id="mEdit">${ic.edit}<span>Edit birth details</span></button>
      <button class="menu-item" id="mErase">${ic.trash}<span>Erase everything on this phone</span></button>
      <a class="menu-item" href="mailto:aetherapp@icloud.com?subject=%C3%86ther%20feedback">${ic.share.replace(/<path[\s\S]*$/, '<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>')}<span>Send feedback<small>Ideas, bugs, kind words: we read everything</small></span></a>
      <a class="menu-item" href="/privacy.html">${ic.pin.replace('<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/>')}<span>Privacy Policy</span></a>
      <a class="menu-item" href="/terms.html">${ic.edit.replace('<path d="M4 20h4L19 9l-4-4L4 16z"/>', '<path d="M7 3h8l4 4v14H7z"/><path d="M10 12h6M10 16h6"/>')}<span>Terms of Use</span></a>
    </div>
    <p class="credits">Planet positions are calculated on your phone with Astronomy Engine (open source). Space weather comes from NOAA's Space Weather Prediction Center. Local weather is from MET Norway (CC BY 4.0). Birthplaces come from GeoNames (CC BY 4.0). Lines from the traditions are paraphrased in our own words. æther is for reflection, not prediction.</p>
  `);
  $("#mShare").onclick = shareApp;
  $("#mTone").onclick = e => {
    const b = e.target.closest(".chip"); if (!b) return;
    setTone(b.dataset.v); renderHome();
    $("#mTone").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  };
  const inst = $("#mInstall"); if (inst) inst.onclick = openInstall;
  $("#mTip").onclick = openTip;
  $("#mPhase").onclick = e => {
    const b = e.target.closest(".chip"); if (!b) return;
    phaseOverride = b.dataset.v === "auto" ? null : b.dataset.v;
    $("#mPhase").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b));
    applyPhase();
  };
  $("#mHere").onclick = () => {
    if (prefs.useHere) { prefs.useHere = false; store.set("prefs", prefs); applyPhase(); loadWeather(); return openMenu(); }
    if (!navigator.geolocation) return toast("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(p => {
      prefs.useHere = true; prefs.here = { lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2) };
      store.set("prefs", prefs); applyPhase(); loadWeather(); openMenu(); toast("The sky now follows the Sun where you are.");
    }, () => toast("Location wasn't shared. The sky keeps following your time zone."), { maximumAge: 36e5, timeout: 10000 });
  };
  $("#mEdit").onclick = () => { closeSheet(); obEditing = true; startOnboarding(); showStep(1); };
  $("#mErase").onclick = () => {
    if (!confirm("Erase your birth details and every check-in on this phone? This can't be undone.")) return;
    ["profile", "entries", "prefs", "tiltOk"].forEach(store.del);
    location.reload();
  };
}

function openTip(e) {
  if (e) e.preventDefault();
  open(TIP_URL, "_blank", "noopener");
}

// ---------- Wiring ----------
$("#checkinBtn").onclick = () => { requestMotion(true); openCheckin(); };
$("#journalBtn").onclick = openJournal;
$("#menuBtn").onclick = openMenu;
document.addEventListener("click", e => { if (e.target.closest(".tip-link, .tip-btn")) openTip(e); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) { applyPhase(); renderHome(); } });

if (profile) { natal = natalChart(profile); sky.setNatal(natal.pos, natal.asc); renderHome(); }
else startOnboarding();
loadKp();
loadWeather();
countOnce("open");
// Visits that arrive from Instagram (the bio link adds ?src=ig), counted once a day like everything else.
try { if (/[?&]src=ig\b/.test(location.search) || /instagram/i.test(document.referrer)) countOnce("instagram"); } catch { }
// Opened from the old address (or an older home-screen icon): point people to the new home.
if (location.hostname === "aetherize.netlify.app") setTimeout(() => {
  const t = $("#toast");
  toast("æther has a new home at myaether.info. Tap here to go there, then add it to your home screen again.", 12000);
  t.style.pointerEvents = "auto"; t.style.cursor = "pointer";
  t.onclick = () => { location.href = SITE + "/"; };
}, 4000);

// ---------- Opening animation: every launch ----------
function playIntro() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = $("#intro"), word = $("#introWord");
  updateSlot(true);
  if (reduced) { document.body.classList.remove("introing", "intro-wait"); setTimeout(showTiltHint, 800); return; }
  document.body.classList.add("introing");
  window.__introStart = performance.now();
  intro.hidden = false;
  sky.intro(3000);
  requestAnimationFrame(() => document.body.classList.remove("intro-wait"));
  const land = () => {
    // Fly the big wordmark into its resting place: the top bar, or the welcome screen during setup.
    const target = document.querySelector(document.body.classList.contains("onboarding") ? ".ob-step:not([hidden]) .ob-brand" : ".topbar .wordmark");
    if (!target) return;
    const from = word.getBoundingClientRect(), to = target.getBoundingClientRect();
    const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(word).fontSize);
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2), dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    intro.classList.add("leaving");
    word.style.animation = "none";
    word.animate([
      { transform: "translate(0, 0) scale(1)", color: getComputedStyle(word).color, textShadow: getComputedStyle(word).textShadow },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, color: getComputedStyle(target).color, textShadow: "0 0 0 transparent" },
    ], { duration: 950, easing: "cubic-bezier(.65, 0, .3, 1)", fill: "forwards" });
  };
  setTimeout(land, 1900);
  setTimeout(() => {
    document.body.classList.remove("introing");
    intro.hidden = true; intro.classList.remove("leaving");
    word.getAnimations().forEach(an => an.cancel()); word.style.animation = "";
    setTimeout(showTiltHint, 900);
  }, 2900);
}
(document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]) : Promise.resolve())
  .then(() => requestAnimationFrame(playIntro));

// Works offline; when a new version lands, offer a gentle refresh instead of changing things mid-reading.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("/sw.js").then(reg => {
    setInterval(() => reg.update().catch(() => { }), 60 * 6e4);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => { }); });
  }).catch(() => { });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    const t = $("#toast");
    toast("A new version of æther is ready. Tap here to refresh.", 15000);
    t.style.pointerEvents = "auto"; t.style.cursor = "pointer";
    t.onclick = () => location.reload();
  });
}
