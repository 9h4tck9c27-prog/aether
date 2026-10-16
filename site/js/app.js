import { CITIES } from "./data.js";
import {
  natalChart, todaySignals, homeForecast, positions, writeReading, conditionOf, CONDITIONS, signOf, nakshatraOf, dayKey, moonPhase,
} from "./astro.js";
import { Sky } from "./sky3d.js";

const A = window.Astronomy;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TIP_URL = ""; // Ko-fi page goes here once it exists.

// ---------- Storage (on this device only) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem("aether:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("aether:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem("aether:" + k); } catch { } },
};
let profile = store.get("profile", null);
let entries = store.get("entries", []);
let prefs = store.get("prefs", { phase: "auto", useHere: false, here: null, installAskedAt: 0 });
let natal = null, kp = null, phaseOverride = null;

function toast(msg, ms = 3200) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}

// ---------- Sky ----------
const sky = new Sky($("#sky"));
sky.setSky(positions(new Date()));

// ---------- Time of day ----------
function sunAltitude(date, lat, lon) {
  const obs = new A.Observer(lat, lon, 0);
  const eq = A.Equator("Sun", date, obs, true, true);
  return A.Horizon(date, obs, eq.ra, eq.dec, "normal").altitude;
}
function placeForColour() {
  if (prefs.useHere && prefs.here) return prefs.here;
  if (profile) return { lat: profile.lat, lon: profile.lon };
  return { lat: 51.5074, lon: -0.1278 };
}
function computePhase() {
  const forced = phaseOverride || (prefs.phase !== "auto" ? prefs.phase : null);
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
  sky.setLight(p === "day" || p === "dawn");
  const theme = { night: "#120a24", dusk: "#33245e", dawn: "#f6eefb", day: "#f7f2fb" }[p];
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme);
}
applyPhase();
setInterval(applyPhase, 5 * 60 * 1000);

// ---------- Tilt ----------
function listenTilt() {
  addEventListener("deviceorientation", e => { if (e.beta != null) sky.setTilt(e.beta, e.gamma || 0); });
}
const needsPermission = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";
if (needsPermission) {
  const btn = $("#tiltBtn");
  if (!store.get("tiltOk", false)) btn.hidden = false; else listenTilt();
  btn.addEventListener("click", async () => {
    try {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r === "granted") { listenTilt(); btn.hidden = true; store.set("tiltOk", true); toast("Tilt your phone to turn the sky."); }
      else toast("Motion is off. You can still drag the sky to turn it.");
    } catch { btn.hidden = true; listenTilt(); }
  });
} else if ("DeviceOrientationEvent" in window) listenTilt();

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

// ---------- Icons ----------
const ICONS = {
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>',
  golden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="13" r="5"/><path d="M18.5 3.5v4M16.5 5.5h4M3 13h1.5M11 4.5V6M5 7l1 1"/></svg>',
  gusty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/></svg>',
  electric: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M13 2 5 13.5h6L10 22l8-11.5h-6z"/></svg>',
  misty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 8h16M2 12h14M6 16h16M4 20h10"/></svg>',
};
function dialSvg(v) {
  const r = 18, cx = 22, cy = 23, a0 = Math.PI, a1 = Math.PI + Math.PI * Math.max(0.04, Math.min(1, v));
  const p = a => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return `<svg viewBox="0 0 44 26" aria-hidden="true"><path d="M${p(a0)} A${r} ${r} 0 0 1 ${p(0)}" fill="none" stroke="var(--line)" stroke-width="4" stroke-linecap="round"/><path d="M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/></svg>`;
}

// ---------- Home ----------
function renderHome() {
  if (!profile || !natal) return;
  const now = new Date();
  const sig = todaySignals(natal, now);
  sky.setSky(sig.sky);
  const f = homeForecast(sig);
  const opts = { weekday: "long", day: "numeric", month: "long" };
  $("#dateline").textContent = `${now.toLocaleDateString(undefined, opts)}. ${sig.phase.name} Moon in ${sig.moonSign}.`;
  $("#condIcon").innerHTML = ICONS[f.cond];
  $("#condLabel").textContent = CONDITIONS[f.cond].label;
  $("#forecastText").textContent = f.text;

  const pc = conditionOf(sig.personal.length ? sig.personal : sig.collective);
  const cc = conditionOf(sig.collective);
  const pv = Math.min(1, (sig.personal[0]?.score || 0.3) / 1.8);
  const cv = Math.min(1, (sig.collective[0]?.score || 0.3) / 1.8);
  const earth = kp != null
    ? { v: kp / 9, w: kp >= 5 ? "Stormy" : kp >= 4 ? "Unsettled" : "Calm", n: "Space weather" }
    : { v: sig.phase.illum, w: `${Math.round(sig.phase.illum * 100)}% lit`, n: "The Moon" };
  const word = c => CONDITIONS[c].label.replace(" sky", "");
  $("#dials").innerHTML = [
    { n: "You", w: word(pc), v: pv },
    { n: "Everyone", w: word(cc), v: cv },
    earth,
  ].map(d => `<div class="dial">${dialSvg(d.v)}<span class="dial-word">${esc(d.w)}</span><span class="dial-name">${esc(d.n)}</span></div>`).join("");
}

// ---------- Onboarding ----------
function showStep(i) {
  document.querySelectorAll(".ob-step").forEach(s => (s.hidden = +s.dataset.step !== i));
  const first = document.querySelector(`.ob-step[data-step="${i}"] input, .ob-step[data-step="${i}"] button`);
  if (first && i > 0) setTimeout(() => first.focus({ preventScroll: true }), 350);
}
function startOnboarding() {
  const ob = $("#onboard"); ob.hidden = false; document.body.classList.add("onboarding"); showStep(0);
  $("#cityList").innerHTML = CITIES.map(c => `<option value="${esc(c[0])}, ${esc(c[1])}"></option>`).join("");
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
  ob.querySelector('[data-step="2"]').onsubmit = e => {
    e.preventDefault();
    const q = $("#obCity").value.trim().toLowerCase();
    const c = CITIES.find(c => `${c[0]}, ${c[1]}`.toLowerCase() === q) || CITIES.find(c => c[0].toLowerCase() === q.split(",")[0].trim());
    if (!c) { $("#cityHint").textContent = "That city isn't in the prototype list yet. Pick the nearest one from the suggestions."; return; }
    Object.assign(draft, { city: c[0], lat: c[2], lon: c[3], tz: c[4] });
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
    profile = draft; store.set("profile", profile);
    natal = natalChart(profile);
    sky.setNatal(natal.pos); sky.bloom();
    const pos = natal.pos;
    const who = profile.name ? `${profile.name}, you` : "You";
    $("#revealText").textContent = `${who} arrived with the Sun in ${signOf(pos.Sun.lon)}, the Moon in ${signOf(pos.Moon.lon)}${natal.hasTime ? `, and ${signOf(natal.asc)} rising` : ""}.`;
    let sub = `Vedic astrology places your Moon in ${natal.moonNak.name}, ${natal.moonNak.gloss}.`;
    if (natal.nightBirth != null) sub += natal.nightBirth
      ? " You were born at night, so in the Hellenistic tradition the Moon leads your chart."
      : " You were born by day, so in the Hellenistic tradition the Sun leads your chart.";
    $("#revealSub").textContent = sub;
    showStep(4);
  };
  ob.querySelector("[data-finish]").onclick = () => { ob.hidden = true; document.body.classList.remove("onboarding"); sky.resize(); renderHome(); };
}

// ---------- Sheet ----------
function openSheet(html, onClose) {
  $("#sheetBody").innerHTML = html;
  $("#sheet").hidden = false; $("#scrim").hidden = false;
  $("#sheetBody").scrollTop = 0;
  openSheet._onClose = onClose;
  setTimeout(() => $("#sheetClose").focus({ preventScroll: true }), 50);
}
function closeSheet() {
  $("#sheet").hidden = true; $("#scrim").hidden = true;
  document.querySelector(".mood-tint").style.opacity = 0;
  const cb = openSheet._onClose; openSheet._onClose = null; if (cb) cb();
}
$("#sheetClose").onclick = closeSheet;
$("#scrim").onclick = closeSheet;
addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

// ---------- Check-in ----------
const FEEL_WORDS = ["Heavy", "Low", "Mixed", "Bright", "Golden"];
function openCheckin() {
  openSheet(`
    <h2 id="sheetTitle">How's today?</h2>
    <p class="feel-word" id="feelWord">Mixed</p>
    <input class="feel-range" id="feel" type="range" min="0" max="100" value="50" aria-label="How today feels, from heavy to golden">
    <div class="ends"><span>Heavy</span><span>Golden</span></div>
    <div class="chips" id="chips">
      ${["strange", "restless", "tender", "tired", "inspired"].map(c => `<button type="button" class="chip" aria-pressed="false" data-v="${c}">${c}</button>`).join("")}
    </div>
    <textarea id="words" placeholder="Tell the sky what happened, in a sentence or two (optional)" maxlength="400"></textarea>
    <p class="privacy-note">Your words stay on this phone. They are never sent anywhere.</p>
    <button class="primary" id="readBtn">Read my sky</button>
  `);
  const tint = document.querySelector(".mood-tint");
  const feel = $("#feel");
  const update = () => {
    const v = feel.value / 100;
    $("#feelWord").textContent = FEEL_WORDS[Math.min(4, Math.floor(v * 5))];
    tint.style.setProperty("--tint", v < 0.5 ? "rgba(110, 130, 190, .55)" : "rgba(255, 184, 154, .55)");
    tint.style.opacity = Math.abs(v - 0.5) * 1.6;
  };
  feel.oninput = update; update();
  $("#chips").onclick = e => { const b = e.target.closest(".chip"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); };
  $("#readBtn").onclick = () => {
    const chips = [...document.querySelectorAll("#chips .chip[aria-pressed='true']")].map(b => b.dataset.v);
    const r = writeReading({ feel: feel.value / 100, chips, text: $("#words").value, natal, profile, kp });
    const entry = { id: Date.now(), day: dayKey(), feel: feel.value / 100, chips, text: $("#words").value.trim(), headline: r.headline, cond: r.cond, bottled: false };
    entries.push(entry); store.set("entries", entries);
    sky.bloom();
    showReading(r, entry);
  };
}

function showReading(r, entry) {
  const ritualOrBottle = r.bucket === "heavy"
    ? `<button class="primary" id="ritualBtn">Breathe with the sky</button>`
    : r.bucket === "golden"
      ? `<button class="primary" id="bottleBtn">Bottle this</button>`
      : `<button class="primary" id="doneBtn">Done</button>`;
  const tip = r.bucket === "golden" ? `<p class="tip-line">Æther is free, with no ads and no paywall. <a href="#" class="tip-link">Chip in to keep it that way.</a></p>` : "";
  openSheet(`
    <article class="reading">
      <h2 id="sheetTitle">${esc(r.headline)}</h2>
      ${r.quote ? `<p class="quote">${esc(r.quote)}</p>` : ""}
      ${r.themeLine ? `<p class="theme-line">${esc(r.themeLine)}</p>` : ""}
      <h3>Why it might feel this way</h3>
      <div class="why">${r.why.map(w => `<p>${esc(w)}</p>`).join("")}<p>${esc(r.moonLine)}</p></div>
      <h3>Who else feels it</h3>
      <div class="crowd"><strong>${r.crowd.count.toLocaleString()}</strong><span>people near you logged a ${r.crowd.label} day too<em>Sample number in this prototype. The real count arrives with the live version.</em></span></div>
      ${r.whoElse.map(w => `<p>${esc(w)}</p>`).join("")}
      <h3>An ancient echo</h3>
      <p class="echo">${esc(r.echo.text)}<cite>${esc(r.echo.source)}</cite></p>
      <h3>For the rest of today</h3>
      <p class="closing">${esc(r.closing)}</p>
      <div class="actions">
        ${ritualOrBottle}
        <div class="row">
          <button class="ghost" id="shareReading">Share this sky</button>
          <button class="ghost" id="closeReading">Close</button>
        </div>
      </div>
      <div id="bottledNote"></div>
      ${tip}
    </article>
  `, () => maybeAskInstall());
  $("#closeReading").onclick = closeSheet;
  $("#shareReading").onclick = () => shareCard(r);
  const done = $("#doneBtn"); if (done) done.onclick = closeSheet;
  const rit = $("#ritualBtn"); if (rit) rit.onclick = startRitual;
  const bot = $("#bottleBtn");
  if (bot) bot.onclick = () => {
    entry.bottled = true; store.set("entries", entries);
    sky.bloom(); bot.disabled = true; bot.textContent = "Bottled";
    $("#bottledNote").innerHTML = `<p class="bottled">A new star in your journal.</p>`;
  };
}

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
  $("#ritualDone").onclick = () => { stopped = true; el.hidden = true; maybeAskInstall(); };
}

// ---------- Share card ----------
function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
async function renderCard(r) {
  try { await document.fonts.load('400 64px "Fraunces"'); await document.fonts.load('italic 400 40px "Fraunces"'); await document.fonts.load('500 30px "Figtree"'); } catch { }
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const grads = { heavy: ["#140c28", "#3a4a80"], mixed: ["#140c28", "#56449a"], golden: ["#2a1d52", "#f2a88f"] }[r.bucket];
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, grads[0]); bg.addColorStop(1, grads[1]);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const halo = g.createRadialGradient(W / 2, 470, 10, W / 2, 470, 520);
  halo.addColorStop(0, "rgba(184,164,255,.35)"); halo.addColorStop(1, "rgba(184,164,255,0)");
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  // Stars
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .6 + .1})`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H * .8, Math.random() * 1.8 + .3, 0, 7); g.fill(); }
  // Rings
  const ringGrad = () => { const rg = g.createLinearGradient(240, 0, 840, 0); [["#B8A4FF", 0], ["#9EE6D4", .35], ["#FFB89A", .7], ["#F7C8E8", 1]].forEach(([col, s]) => rg.addColorStop(s, col)); return rg; };
  const ell = (rx, ry, rot, w, a) => { g.save(); g.translate(W / 2, 470); g.rotate(rot); g.globalAlpha = a; g.strokeStyle = ringGrad(); g.lineWidth = w; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke(); g.restore(); };
  ell(330, 110, -0.18, 5, 1); ell(330, 150, 0.32, 2.5, .55); ell(120, 340, 0.1, 2, .4); ell(220, 74, -0.18, 2.5, .6);
  // Planets on the main ring at their real longitudes
  for (const [p, v] of Object.entries(r.sig.sky)) {
    const a = v.lon * Math.PI / 180, x = Math.cos(a) * 330, y = Math.sin(a) * 110;
    const px = W / 2 + x * Math.cos(-0.18) - y * Math.sin(-0.18), py = 470 + x * Math.sin(-0.18) + y * Math.cos(-0.18);
    const big = p === "Sun" || p === "Moon";
    const pg = g.createRadialGradient(px, py, 0, px, py, big ? 34 : 22); pg.addColorStop(0, "rgba(255,255,255,1)"); pg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = pg; g.beginPath(); g.arc(px, py, big ? 34 : 22, 0, 7); g.fill();
  }
  const core = g.createRadialGradient(W / 2, 470, 0, W / 2, 470, 60); core.addColorStop(0, "#fff"); core.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = core; g.beginPath(); g.arc(W / 2, 470, 60, 0, 7); g.fill();
  // Text
  g.fillStyle = "rgba(247,242,251,.7)"; g.font = '500 30px "Figtree", sans-serif';
  g.fillText(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }), 90, 110);
  g.fillText(CONDITIONS[r.cond].label, 90, 152);
  g.fillStyle = "#F7F2FB"; g.font = '400 66px "Fraunces", Georgia, serif';
  const lines = wrap(g, r.headline, W - 180).slice(0, 4);
  lines.forEach((l, i) => g.fillText(l, 90, 870 + i * 80));
  g.fillStyle = "rgba(247,242,251,.75)"; g.font = '400 30px "Figtree", sans-serif';
  const moonBits = `Moon in ${r.sig.moonSign}, in ${r.sig.moonNak.name}, ${r.sig.moonNak.gloss}.`;
  wrap(g, moonBits, W - 180).slice(0, 2).forEach((l, i) => g.fillText(l, 90, 890 + lines.length * 80 + 20 + i * 42));
  g.fillStyle = "#F7F2FB"; g.font = 'italic 400 44px "Fraunces", Georgia, serif'; g.fillText("æther", 90, H - 90);
  g.fillStyle = "rgba(247,242,251,.6)"; g.font = '400 26px "Figtree", sans-serif';
  g.textAlign = "right"; g.fillText(location.host, W - 90, H - 94);
  return new Promise(res => c.toBlob(res, "image/png"));
}
async function shareCard(r) {
  const blob = await renderCard(r);
  const file = new File([blob], "aether-sky.png", { type: "image/png" });
  const text = `My sky today on Æther. ${location.origin}`;
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
  const data = { title: "Æther", text: "Your daily astrological weather. It's not just you.", url: location.origin + "/" };
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
    <div id="dayDetail">${entries.length ? `<p class="empty">${stars ? `${stars} golden ${stars === 1 ? "day" : "days"} bottled so far. ` : ""}Tap a day to reread it.</p>` : `<p class="empty">Your first check-in will appear here as a dot of colour.</p>`}</div>
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
        <div class="when">${new Date(en.id).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}. ${FEEL_WORDS[Math.min(4, Math.floor(en.feel * 5))]}${en.bottled ? ", bottled" : ""}</div>
        <div class="h">${esc(en.headline)}</div>
        ${en.text ? `<p class="quote" style="font-family:var(--serif);font-style:italic">${esc(en.text)}</p>` : ""}
      </div>`).join("") : `<p class="empty">No check-in that day.</p>`;
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
    } catch { toast("That file isn't a Æther backup."); }
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
    : deferredPrompt ? `<button class="primary" id="installNow">Add Æther</button><button class="ghost" id="notNow" style="width:100%;margin-top:10px">Not now</button>`
      : `<p>Use your browser's menu and choose Install app or Add to Home Screen.</p><button class="ghost" id="notNow" style="width:100%">Got it</button>`;
  openSheet(`
    <img class="install-icon" src="/icons/icon-192.png" alt="">
    <h2 id="sheetTitle">Keep Æther on your home screen</h2>
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
  const cur = phaseOverride || prefs.phase || "auto";
  openSheet(`
    <h2 id="sheetTitle">Æther</h2>
    <div class="menu-list">
      <button class="menu-item" id="mShare">${ic.share}<span>Share Æther<small>Send the app to a friend</small></span></button>
      ${isStandalone() ? "" : `<button class="menu-item" id="mInstall">${ic.home}<span>Add to home screen<small>Open it full-screen, like an app</small></span></button>`}
      <button class="menu-item" id="mHere">${ic.pin}<span>${prefs.useHere ? "Colour the sky for where I am" : "Use where I am for the sky colours"}<small>${prefs.useHere ? "On. Tap to use your birth city again" : "Off. Colours follow sunrise and sunset in your birth city"}</small></span></button>
      <div class="menu-item" style="display:block;cursor:default">Preview time of day<small>See all four looks. Auto follows the real Sun.</small>
        <div class="chips" id="mPhase" style="margin-top:10px">${phases.map(p => `<button type="button" class="chip" aria-pressed="${p === cur}" data-v="${p}">${p}</button>`).join("")}</div>
      </div>
      <button class="menu-item" id="mTip">${ic.heart}<span>Chip in<small>Æther is free, with no ads and no paywall</small></span></button>
      <button class="menu-item" id="mEdit">${ic.edit}<span>Edit birth details</span></button>
      <button class="menu-item" id="mErase">${ic.trash}<span>Erase everything on this phone</span></button>
    </div>
    <p class="credits">Planet positions are calculated on your phone with Astronomy Engine (open source). Space weather comes from NOAA's Space Weather Prediction Center. Lines from the traditions are paraphrased in our own words. Æther is for reflection, not prediction.</p>
  `);
  $("#mShare").onclick = shareApp;
  const inst = $("#mInstall"); if (inst) inst.onclick = openInstall;
  $("#mTip").onclick = openTip;
  $("#mPhase").onclick = e => {
    const b = e.target.closest(".chip"); if (!b) return;
    phaseOverride = null; prefs.phase = b.dataset.v; store.set("prefs", prefs);
    $("#mPhase").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x === b));
    applyPhase();
  };
  $("#mHere").onclick = () => {
    if (prefs.useHere) { prefs.useHere = false; store.set("prefs", prefs); applyPhase(); return openMenu(); }
    if (!navigator.geolocation) return toast("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(p => {
      prefs.useHere = true; prefs.here = { lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2) };
      store.set("prefs", prefs); applyPhase(); openMenu(); toast("The sky now follows the Sun where you are.");
    }, () => toast("Location wasn't shared. The sky keeps following your birth city."), { maximumAge: 36e5, timeout: 10000 });
  };
  $("#mEdit").onclick = () => { closeSheet(); startOnboarding(); showStep(1); };
  $("#mErase").onclick = () => {
    if (!confirm("Erase your birth details and every check-in on this phone? This can't be undone.")) return;
    ["profile", "entries", "prefs", "tiltOk"].forEach(store.del);
    location.reload();
  };
}

function openTip(e) {
  if (e) e.preventDefault();
  if (TIP_URL) return void open(TIP_URL, "_blank", "noopener");
  toast("The tip page opens here once the Ko-fi page is set up.");
}

// ---------- Wiring ----------
$("#checkinBtn").onclick = openCheckin;
$("#journalBtn").onclick = openJournal;
$("#menuBtn").onclick = openMenu;
document.addEventListener("click", e => { if (e.target.closest(".tip-link")) openTip(e); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) { applyPhase(); renderHome(); } });

if (profile) { natal = natalChart(profile); sky.setNatal(natal.pos); renderHome(); }
else startOnboarding();
loadKp();

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => { });

// Testing hooks for previews: ?phase=dusk
const qp = new URLSearchParams(location.search).get("phase");
if (qp && ["dawn", "day", "dusk", "night"].includes(qp)) { phaseOverride = qp; applyPhase(); }
window.__aether = { openCheckin, openJournal, openMenu, openInstall, writeReading: () => writeReading };
