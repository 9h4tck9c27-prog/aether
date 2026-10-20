// The living celestial sphere: iridescent armillary rings with the real planets on them.
// It can zoom into parts of the sky, draw the angle between two planets, and "consult" before a reading.
import * as THREE from "../vendor/three.module.min.js";
import { PLANETS, PLANET_GLYPHS, SIGN_GLYPHS } from "./data.js";

const DEG = Math.PI / 180;
const RING_R = 2.0, NATAL_R = 1.38;
const BASE_DIST = 7.6;

const ringVert = `
  varying float vAngle;
  varying vec2 vUv;
  void main() {
    vAngle = atan(position.y, position.x);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const ringFrag = `
  uniform float uTime, uOffset, uLight, uAlpha, uShift, uAlongUv, uFlat;
  uniform vec3 uColor;
  varying float vAngle;
  varying vec2 vUv;
  vec3 brand(float t) {
    t = fract(t) * 4.0;
    vec3 lilac = vec3(0.72, 0.64, 1.0), mint = vec3(0.62, 0.90, 0.83), apricot = vec3(1.0, 0.72, 0.60), rose = vec3(0.98, 0.78, 0.92);
    if (t < 1.0) return mix(lilac, mint, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(mint, apricot, smoothstep(0.0, 1.0, t - 1.0));
    if (t < 3.0) return mix(apricot, rose, smoothstep(0.0, 1.0, t - 2.0));
    return mix(rose, lilac, smoothstep(0.0, 1.0, t - 3.0));
  }
  void main() {
    float a = mix(vAngle / 6.28318, vUv.x, uAlongUv);
    float t = a + uOffset + uTime * 0.025 + uShift;
    vec3 c = brand(t);
    c = mix(c, c * vec3(0.42, 0.36, 0.62), uLight);
    c = mix(c, uColor, uFlat);
    gl_FragColor = vec4(c, uAlpha);
  }`;

// Textures are drawn large so they stay smooth when the camera flies right past them.
let ANISO = 1;
function finishTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = ANISO;
  return t;
}
function glowTexture() {
  const S = 512, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // A soft, many-stop falloff (roughly gaussian) so there are no visible bands.
  for (let i = 0; i <= 16; i++) { const x = i / 16; grad.addColorStop(x, `rgba(255,255,255,${(Math.exp(-x * x * 9) * (1 - x)).toFixed(4)})`); }
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  return finishTexture(c);
}

function glyphTexture(glyph, color) {
  const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  const size = glyph.length > 2 ? 90 : 150;
  g.font = `${size}px "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols", "DejaVu Sans", serif`;
  g.fillText(glyph, S / 2, S / 2 + 10);
  return finishTexture(c);
}

// Sticker style: a flat dot with an ink rim, tinted per planet.
function dotTexture() {
  const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  g.beginPath(); g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2);
  g.fillStyle = "#ffffff"; g.fill();
  g.lineWidth = S * 0.075; g.strokeStyle = "#141218"; g.stroke();
  return finishTexture(c);
}
const STICKER_DOTS = {
  Sun: 0xffd84d, Moon: 0xffffff, Mercury: 0x6ee7b7, Venus: 0xff6fae, Mars: 0xff7a45,
  Jupiter: 0xffb020, Saturn: 0xc9b8ff, Uranus: 0x7de3ff, Neptune: 0x8fa2ff, Pluto: 0xb98cff, Ascendant: 0xffffff,
};

const PLANET_COLORS = {
  Sun: 0xffd9a8, Moon: 0xf7f2fb, Mercury: 0xcfe9ff, Venus: 0xffc2d6, Mars: 0xff9b85,
  Jupiter: 0xffe3a3, Saturn: 0xd8c7ff, Uranus: 0x9ee6d4, Neptune: 0xa8c4ff, Pluto: 0xc9a7ff, Ascendant: 0xffffff,
};
const lerp = (a, b, k) => a + (b - a) * k;
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

export class Sky {
  constructor(canvas) {
    this.canvas = canvas;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    ANISO = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, BASE_DIST);
    this.glow = glowTexture();
    this.ringMats = [];
    this.light = 0;
    this.time = 0;
    this.speed = 1;
    this.tilt = { x: 0, y: 0 };
    this.cur = { x: 0, y: 0 };
    this.drag = { yaw: 0, vel: 0, active: false, lastX: 0 };
    this.spin = 0;
    this.spinTarget = null;
    this.pulse = 0;
    this.baseDist = BASE_DIST;
    this.vw = 1; this.vh = 1;
    this.slot = null; this.slotCur = null;   // where on screen the sphere sits
    this.introStart = null; this.introDur = 3000;
    this.camGoal = { look: new THREE.Vector3(), pos: new THREE.Vector3(0, 0, BASE_DIST) };
    this.camLook = new THREE.Vector3();
    this.focusSpec = null;
    this.links = [];
    this.natalLon = {};
    this.skyLon = {};
    this.build();
    this.bindPointer();
    this.resize();
    addEventListener("resize", () => this.resize());
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  material(offset, alpha, alongUv = 0) {
    return new THREE.ShaderMaterial({
      vertexShader: ringVert, fragmentShader: ringFrag, transparent: true, depthWrite: false,
      blending: this.light || this.sticker ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOffset: { value: offset }, uLight: { value: this.light }, uAlpha: { value: alpha }, uShift: { value: 0 }, uAlongUv: { value: alongUv }, uFlat: { value: this.sticker ? 1 : 0 }, uColor: { value: new THREE.Color(this.sticker ? this.edgeHex() : 0xffffff) } },
    });
  }

  ring(radius, tube, offset, alpha) {
    const mat = this.material(offset, alpha);
    this.ringMats.push(mat);
    return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 720), mat);
  }

  sprite(map, color, scale, opacity = 1, additive = true) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.scale.setScalar(scale);
    s.userData.baseScale = scale;
    s.userData.opacityGoal = opacity;
    s.userData.scaleGoal = 1;
    return s;
  }

  build() {
    this.root = new THREE.Group();
    this.root.rotation.x = -1.08;
    this.root.rotation.y = 0.42;
    this.scene.add(this.root);

    this.ecliptic = new THREE.Group();
    this.root.add(this.ecliptic);
    this.mainRing = this.ring(RING_R, 0.014, 0.0, 0.95);
    this.ecliptic.add(this.mainRing);

    const eq = this.ring(RING_R, 0.007, 0.33, 0.45);
    eq.rotation.x = 23.44 * DEG;
    this.root.add(eq);
    const m1 = this.ring(RING_R * 1.06, 0.006, 0.6, 0.35); m1.rotation.y = 90 * DEG; this.root.add(m1);
    const m2 = this.ring(RING_R * 1.06, 0.005, 0.85, 0.25); m2.rotation.y = 90 * DEG; m2.rotation.x = 90 * DEG; this.root.add(m2);
    this.outerRings = [eq, m1, m2];

    this.natalRing = this.ring(NATAL_R, 0.008, 0.15, 0.0);
    this.natalRing.userData.alphaGoal = 0;
    this.ecliptic.add(this.natalRing);

    this.tickMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * DEG;
      pts.push(new THREE.Vector3(Math.cos(a) * (RING_R - 0.09), Math.sin(a) * (RING_R - 0.09), 0));
      pts.push(new THREE.Vector3(Math.cos(a) * (RING_R + 0.09), Math.sin(a) * (RING_R + 0.09), 0));
    }
    this.ecliptic.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), this.tickMat));
    this.signSprites = [];
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 + 15) * DEG;
      const s = this.sprite(glyphTexture(SIGN_GLYPHS[i], "#ffffff"), 0xffffff, 0.2, 0.42, false);
      s.position.set(Math.cos(a) * (RING_R + 0.3), Math.sin(a) * (RING_R + 0.3), 0);
      this.ecliptic.add(s);
      this.signSprites.push(s);
    }

    this.core = this.sprite(this.glow, 0xf7f2fb, 0.55);
    this.root.add(this.core);

    // Sky planets (outer ring) and natal points (inner ring), each a glow plus a glyph.
    const makePoint = (p, big, natal) => {
      const g = new THREE.Group();
      const glow = this.sprite(this.glow, PLANET_COLORS[p], natal ? (big ? 0.34 : 0.24) : (big ? 0.62 : 0.4), natal ? 0 : 1);
      const label = this.sprite(glyphTexture(p === "Ascendant" ? "AC" : PLANET_GLYPHS[p], "#ffffff"), 0xffffff, natal ? 0.19 : (big ? 0.26 : 0.21), natal ? 0 : 1, false);
      g.add(glow); g.add(label);
      g.userData = { glow, label, natal };
      g.visible = false;
      this.ecliptic.add(g);
      return g;
    };
    this.planets = {}; this.natal = {};
    for (const p of PLANETS) {
      const big = p === "Sun" || p === "Moon";
      this.planets[p] = makePoint(p, big, false);
      this.natal[p] = makePoint(p, big, true);
    }
    this.natal.Ascendant = makePoint("Ascendant", true, true);

    // Highlighted stretch of the zodiac (used for the Moon's mansion).
    this.arcMat = this.material(0.2, 0);
    this.arc = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.045, 10, 64, 1), this.arcMat);
    this.arc.visible = false;
    this.ecliptic.add(this.arc);

    // Anchor that the camera follows when zoomed in.
    this.anchor = new THREE.Object3D();
    this.ecliptic.add(this.anchor);

    const N = 700, arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 12 + Math.random() * 10;
      const s = Math.sqrt(1 - u * u);
      arr.set([r * s * Math.cos(th), r * s * Math.sin(th), r * u], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    this.starMat = new THREE.PointsMaterial({ size: 0.07, map: this.glow, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
    this.stars = new THREE.Points(sg, this.starMat);
    this.scene.add(this.stars);
  }

  localPos(ring, p) {
    const lon = ring === "natal" ? this.natalLon[p] : this.skyLon[p];
    const r = ring === "natal" ? NATAL_R : RING_R;
    if (lon == null) return null;
    return new THREE.Vector3(Math.cos(lon * DEG) * r, Math.sin(lon * DEG) * r, 0);
  }

  setSky(pos) {
    for (const p of PLANETS) {
      this.skyLon[p] = pos[p].lon;
      this.planets[p].position.copy(this.localPos("sky", p));
      this.planets[p].visible = true;
    }
  }

  setNatal(pos, asc) {
    for (const p of PLANETS) {
      this.natalLon[p] = pos[p].lon;
      this.natal[p].position.copy(this.localPos("natal", p));
      this.natal[p].visible = true;
      this.natal[p].userData.glow.userData.opacityGoal = 0.75;
    }
    if (asc != null) {
      this.natalLon.Ascendant = asc;
      this.natal.Ascendant.position.copy(this.localPos("natal", "Ascendant"));
      this.natal.Ascendant.visible = true;
    }
    this.natalRing.userData.alphaGoal = 0.7;
  }

  edgeHex() { return this.night ? 0xffffff : 0x141218; }

  // The sticker look: a flat cobalt globe with an outline, a thick pink ecliptic, and planets as outlined dots.
  useSticker() {
    if (this.sticker) return;
    this.sticker = true;
    const edge = () => this.edgeHex();
    for (const m of [...this.ringMats, this.arcMat]) { m.uniforms.uFlat.value = 1; m.blending = THREE.NormalBlending; m.needsUpdate = true; }
    // Ecliptic: thick pink band with an ink outline drawn just behind it.
    this.mainRing.geometry.dispose();
    this.mainRing.geometry = new THREE.TorusGeometry(RING_R, 0.05, 16, 720);
    this.mainRing.material.uniforms.uColor.value.setHex(0xff6fae);
    this.mainRing.renderOrder = 3;
    this.ringOutlineMat = this.material(0, 1); this.ringOutlineMat.uniforms.uFlat.value = 1;
    this.ringOutline = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.078, 16, 720), this.ringOutlineMat);
    this.ringOutline.renderOrder = 2;
    this.ecliptic.add(this.ringOutline);
    // Thin rings become crisp ink lines.
    const thin = [[this.outerRings[0], 0.012], [this.outerRings[1], 0.01], [this.outerRings[2], 0.01]];
    for (const [r, tube] of thin) { r.geometry.dispose(); r.geometry = new THREE.TorusGeometry(r === this.outerRings[0] ? RING_R : RING_R * 1.06, tube, 10, 540); }
    this.natalRing.geometry.dispose(); this.natalRing.geometry = new THREE.TorusGeometry(NATAL_R, 0.022, 12, 540);
    this.natalRing.material.uniforms.uColor.value.setHex(0xffd84d);
    this.arcMat.uniforms.uColor.value.setHex(0xffd84d);
    // The globe itself, with an outline drawn from its back faces.
    this.globe = new THREE.Group();
    this.globeOutlineMat = new THREE.MeshBasicMaterial({ color: edge(), side: THREE.BackSide });
    this.globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.98, 64, 48), this.globeOutlineMat));
    this.globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.92, 64, 48), new THREE.MeshBasicMaterial({ color: 0x3d3bff })));
    // A white shine on the upper left, like a printed highlight.
    const sc = document.createElement("canvas"); sc.width = sc.height = 256;
    const sg = sc.getContext("2d"); sg.strokeStyle = "rgba(255,255,255,.6)"; sg.lineWidth = 22; sg.lineCap = "round";
    sg.beginPath(); sg.arc(128, 128, 92, Math.PI * 1.08, Math.PI * 1.42); sg.stroke();
    this.shine = new THREE.Sprite(new THREE.SpriteMaterial({ map: finishTexture(sc), transparent: true, depthTest: false }));
    this.shine.scale.setScalar(1.84); this.shine.renderOrder = 4;
    this.globe.add(this.shine);
    this.scene.add(this.globe);
    this.core.visible = false;
    // Planets: outlined dots with the glyph printed on top.
    const dot = dotTexture();
    for (const [p, g] of [...Object.entries(this.planets), ...Object.entries(this.natal)]) {
      const { glow, label, natal } = g.userData;
      glow.material.map = dot; glow.material.color.setHex(STICKER_DOTS[p] || 0xffffff);
      glow.material.blending = THREE.NormalBlending; glow.material.needsUpdate = true;
      glow.userData.baseScale *= natal ? 0.62 : 0.5; glow.scale.setScalar(glow.userData.baseScale);
      glow.renderOrder = 6; label.renderOrder = 7;
      label.material.depthTest = false; glow.material.depthTest = true;
      label.userData.baseScale *= 0.82;
    }
    this.starMat.opacity = 0;
    this.applyStickerEdge();
  }
  applyStickerEdge() {
    const e = this.edgeHex();
    this.ringOutlineMat.uniforms.uColor.value.setHex(e);
    for (const r of this.outerRings) r.material.uniforms.uColor.value.setHex(e);
    this.globeOutlineMat.color.setHex(e);
    this.tickMat.color.setHex(e); this.tickMat.opacity = 0.7;
    for (const s of this.signSprites) s.material.color.setHex(e);
    for (const g of Object.values(this.natal)) g.userData.label.material.color.setHex(0x141218);
    for (const g of Object.values(this.planets)) g.userData.label.material.color.setHex(0x141218);
    for (const l of this.links) l.mesh.material.uniforms.uColor.value.setHex(e);
  }

  setLight(isLight, night = false) {
    if (this.sticker) { this.night = night; this.applyStickerEdge(); return; }
    this.light = isLight ? 1 : 0;
    const blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    const mats = [...this.ringMats, this.arcMat, ...this.links.map(l => l.mesh.material)];
    for (const m of mats) { m.uniforms.uLight.value = this.light; m.blending = blend; m.needsUpdate = true; }
    this.tickMat.color.setHex(isLight ? 0x2a1b4a : 0xffffff);
    for (const s of this.signSprites) s.material.color.setHex(isLight ? 0x2a1b4a : 0xffffff);
    for (const g of [...Object.values(this.planets), ...Object.values(this.natal)]) {
      const { glow, label } = g.userData;
      glow.material.blending = blend; glow.material.needsUpdate = true;
      label.material.color.setHex(isLight ? 0x2a1b4a : 0xffffff);
    }
    this.core.material.color.setHex(isLight ? 0x8f7ae6 : 0xf7f2fb);
    this.core.material.blending = blend; this.core.material.needsUpdate = true;
    this.starMat.opacity = isLight ? 0 : 0.8;
  }

  setTilt(beta, gamma) {
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    this.tilt.x = clamp((beta - 50) * DEG * 0.55, 0.6);
    this.tilt.y = clamp(gamma * DEG * 0.7, 0.75);
  }

  bloom() { this.pulse = 1; }

  // ---------- Links: the glowing angle between two points ----------
  addLink(a, b, { duration = 1.1, fade = 0 } = {}) {
    if (!a || !b) return;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lift = Math.max(0.35, a.distanceTo(b) * 0.35);
    mid.z += lift;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 120, this.sticker ? 0.024 : 0.016, 10, false);
    const mat = this.material(Math.random(), 0.95, 1);
    const mesh = new THREE.Mesh(geo, mat);
    geo.setDrawRange(0, 0);
    this.ecliptic.add(mesh);
    const link = { mesh, born: this.time, duration, fade, total: geo.index.count };
    this.links.push(link);
    return link;
  }
  clearLinks() {
    for (const l of this.links) { this.ecliptic.remove(l.mesh); l.mesh.geometry.dispose(); l.mesh.material.dispose(); }
    this.links = [];
  }

  // ---------- Focus: zoom into a region of the sky ----------
  focus(spec) {
    this.focusSpec = spec || null;
    this.clearLinks();
    this.drag.yaw = 0; this.drag.vel = 0;
    const all = [...Object.values(this.planets), ...Object.values(this.natal)];
    const chosen = new Set();
    const points = [];
    if (spec && !spec.wide) {
      for (const p of spec.sky || []) { chosen.add(this.planets[p]); const v = this.localPos("sky", p); if (v) points.push(v); }
      for (const p of spec.natal || []) { chosen.add(this.natal[p]); const v = this.localPos("natal", p); if (v) points.push(v); }
    }
    const dim = chosen.size > 0;
    for (const g of all) {
      const on = chosen.has(g);
      const { glow, label, natal } = g.userData;
      const baseGlow = natal ? (Object.keys(this.natalLon).length ? 0.75 : 0) : 1;
      glow.userData.opacityGoal = dim ? (on ? 1 : baseGlow * 0.18) : baseGlow;
      glow.userData.scaleGoal = on ? 1.7 : 1;
      label.userData.opacityGoal = natal ? (on ? 1 : 0) : (dim ? (on ? 1 : 0.15) : 1);
      label.userData.scaleGoal = on ? 1.6 : 1;
    }
    for (const s of this.signSprites) s.userData.opacityGoal = dim ? 0.18 : 0.42;
    this.natalRing.userData.alphaGoal = Object.keys(this.natalLon).length ? (spec && spec.natalGlow ? 1 : dim && !(spec.natal || []).length ? 0.25 : 0.7) : 0;

    // Arc highlight
    if (spec && spec.arc) {
      const [s0, s1] = spec.arc;
      this.arc.geometry.dispose();
      this.arc.geometry = new THREE.TorusGeometry(RING_R, 0.024, 12, 48, (s1 - s0) * DEG);
      this.arc.rotation.z = s0 * DEG;
      this.arc.visible = true;
      this.arcMat.uniforms.uAlpha.value = 0;
      const mid = (s0 + s1) / 2 * DEG;
      if (!points.length) points.push(new THREE.Vector3(Math.cos(mid) * RING_R, Math.sin(mid) * RING_R, 0));
    } else this.arc.visible = false;

    if (points.length) {
      // Centre on the actual middle of the points, turn it toward the viewer,
      // and zoom less when the points are far apart so both stay in view.
      const mean = new THREE.Vector3();
      for (const v of points) mean.add(v);
      mean.multiplyScalar(1 / points.length);
      let spread = 0;
      for (const a of points) for (const b of points) spread = Math.max(spread, a.distanceTo(b));
      if (mean.length() < 0.15) mean.copy(points[0]).multiplyScalar(0.15);
      this.anchor.position.copy(mean);
      this.spinTarget = -Math.PI / 2 - Math.atan2(mean.y, mean.x);
      const fit = Math.max(0.12, Math.min(1, 1.15 - spread / 3.0));
      this.zoom = (spec.zoom ?? 0.6) * fit;
    } else {
      this.spinTarget = null;
      this.zoom = 0;
    }
    this.far = !!(spec && spec.far);

    // Final card: draw every connection in today's reading, one after another, and keep them.
    if (spec && spec.showLinks) {
      clearTimeout(this._linksTimer);
      const list = spec.showLinks.slice();
      const step = () => {
        if (this.focusSpec !== spec || !list.length) return;
        const pr = list.shift();
        this.addLink(this.localPos(pr[0][0], pr[0][1]), this.localPos(pr[1][0], pr[1][1]), { duration: 1.1 });
        this._linksTimer = setTimeout(step, 450);
      };
      this._linksTimer = setTimeout(step, 400);
    }

    if (spec && spec.link) {
      const pts = [];
      for (const p of spec.sky || []) pts.push(this.localPos("sky", p));
      for (const p of spec.natal || []) pts.push(this.localPos("natal", p));
      if (pts.length >= 2) setTimeout(() => this.addLink(pts[0], pts[1], { duration: 1.4 }), 500);
    }
  }

  // ---------- Consult: the sky "calculating" before a reading ----------
  consult(pairs, duration = 5700) {
    this.focus(null);
    this.consulting = true;
    this.consultStart = performance.now();
    this.consultDur = duration;
    this.scene.updateMatrixWorld();
    const toCam = this.camera.position.clone().applyMatrix4(new THREE.Matrix4().copy(this.ecliptic.matrixWorld).invert());
    this.consultStartAngle = Math.atan2(toCam.y, toCam.x) - 0.5;
    this.natalRing.userData.alphaGoal = 1;
    let i = 0;
    const next = () => {
      if (!this.consulting) return;
      const pr = pairs[i % Math.max(1, pairs.length)];
      if (pr) {
        const a = this.localPos(pr[0][0], pr[0][1]), b = this.localPos(pr[1][0], pr[1][1]);
        this.addLink(a, b, { duration: 0.45, fade: 0.9 });
        const g = pr[1][0] === "natal" ? this.natal[pr[1][1]] : this.planets[pr[1][1]];
        if (g) { g.userData.glow.userData.scaleGoal = 2.2; setTimeout(() => (g.userData.glow.userData.scaleGoal = 1), 500); }
      }
      i++;
      this._consultTimer = setTimeout(next, 420);
    };
    next();
  }
  endConsult() {
    this.consulting = false;
    clearTimeout(this._consultTimer);
    this.clearLinks();
    this.bloom();
  }

  bindPointer() {
    const c = this.canvas;
    c.addEventListener("pointerdown", e => { this.drag.active = true; this.drag.lastX = e.clientX; try { c.setPointerCapture(e.pointerId); } catch { } });
    c.addEventListener("pointermove", e => {
      if (!this.drag.active) return;
      const dx = e.clientX - this.drag.lastX; this.drag.lastX = e.clientX;
      this.drag.vel = dx * 0.006; this.drag.yaw += this.drag.vel;
    });
    const end = () => { this.drag.active = false; };
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
  }

  // The canvas covers the whole screen; the sphere is drawn inside a "slot" rectangle.
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.vw = w; this.vh = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.slot) this.slot = { x: 0, y: 0, w, h };
    if (!this.slotCur) this.slotCur = { ...this.slot };
  }

  setSlot(rect, instant = false) {
    this.slot = { x: rect.left ?? rect.x, y: rect.top ?? rect.y, w: Math.max(1, rect.width ?? rect.w), h: Math.max(1, rect.height ?? rect.h) };
    if (instant || !this.slotCur) this.slotCur = { ...this.slot };
  }

  // Three-second opening: fly out from inside the rings, then settle into the slot.
  intro(duration = 3000) {
    if (this.reduced) return;
    this.introDur = duration;
    this.introStart = performance.now();
    this.spin -= 2.4;
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const targetSpeed = this.consulting ? 2.2 : 1;
    this.speed += (targetSpeed - this.speed) * (1 - Math.pow(0.1, dt));
    this.time += dt * this.speed;
    const k = 1 - Math.pow(0.04, dt);
    const slow = 1 - Math.pow(0.25, dt);
    this.cur.x += (this.tilt.x - this.cur.x) * k;
    this.cur.y += (this.tilt.y - this.cur.y) * k;
    if (!this.drag.active) { this.drag.yaw += this.drag.vel; this.drag.vel *= Math.pow(0.08, dt); }

    // Intro progress: A = the fly-out, B = settling into the slot.
    let introA = 1, introB = 1;
    if (this.introStart != null) {
      const t = (performance.now() - this.introStart) / this.introDur;
      if (t >= 1) this.introStart = null;
      else {
        introA = Math.min(1, t / 0.7);
        introB = Math.max(0, Math.min(1, (t - 0.6) / 0.4));
        if (!this._introBloomed && t > 0.55) { this._introBloomed = true; this.pulse = 1; }
      }
    } else this._introBloomed = false;
    const easeOut = p => 1 - Math.pow(1 - p, 3);
    const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const eA = easeOut(introA), eB = easeInOut(introB);

    // Slot: where the sphere sits on screen, eased toward its target.
    if (this.slot && this.slotCur) {
      if (introB < 1) {
        const full = { x: 0, y: 0, w: this.vw, h: this.vh };
        for (const key of ["x", "y", "w", "h"]) this.slotCur[key] = lerp(full[key], this.slot[key], eB);
      } else for (const key of ["x", "y", "w", "h"]) this.slotCur[key] += (this.slot[key] - this.slotCur[key]) * slow;
      const sw = this.slotCur.w, sh = this.slotCur.h;
      this.baseDist = Math.max(7.6, 7.6 * 0.95 / Math.max(0.3, sw / sh)) * (this.vh / Math.max(1, sh));
    }

    // Spin: drift slowly, or turn the focused region toward the viewer.
    if (this.spinTarget != null) this.spin += angDiff(this.spin, this.spinTarget) * slow;
    else if (!this.reduced) this.spin += dt * 0.035 * this.speed;
    if (introA < 1) this.spin += dt * 9 * Math.pow(1 - introA, 2);
    this.root.rotation.x = -1.08 + this.cur.x * (this.zoom ? 0.4 : 1) - (1 - eA) * 0.75;
    this.root.rotation.y = 0.42 * (1 - (this.zoom || 0) * 0.6) + this.cur.y * (this.zoom ? 0.4 : 1);
    this.ecliptic.rotation.z = this.spin + this.drag.yaw;
    this.stars.rotation.y = this.cur.y * 0.3 + this.spin * 0.15;
    this.stars.rotation.x = this.cur.x * 0.3;

    // Camera: zoom toward the anchor when focused.
    this.scene.updateMatrixWorld();
    const z = this.zoom || 0;
    if (z > 0) {
      const w = new THREE.Vector3(); this.anchor.getWorldPosition(w);
      this.camGoal.look.copy(w).multiplyScalar(0.9 * z);
      this.camGoal.pos.set(this.camGoal.look.x * 0.6, this.camGoal.look.y * 0.6 + 0.4 * z, this.baseDist * (1 - 0.5 * z));
    } else {
      const breathe = this.consulting ? Math.sin(this.time * 0.6) * 0.5 - 0.9 : 0;
      this.camGoal.look.set(0, 0, 0);
      this.camGoal.pos.set(0, 0, this.baseDist * (this.far ? 1.12 : 1) + breathe);
    }
    if (introA < 1) {
      // Start just inside the rings and pull back through them.
      this.camera.position.set(0, (1 - eA) * 0.35, this.baseDist * (0.14 + 0.86 * eA));
      this.camLook.set(0, 0, 0);
    } else if (this.consulting && this.consultStart != null && !this.reduced) {
      // Consulting: glide down onto the outer rim and fly along it, so the zodiac signs
      // stream past the lens, then rise back out. Every frame is a pure function of time
      // (no chasing a moving target), which keeps the motion smooth.
      const p = Math.min(1, (performance.now() - this.consultStart) / this.consultDur);
      const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * t * (t * (t * 6 - 15) + 10); };
      const w = smooth(0, 0.22, p) * (1 - smooth(0.8, 1, p));          // how far "on the rim" we are
      // Travel angle along the ring: gentle start, steady glide, gentle finish.
      const travel = smooth(0.04, 0.96, p);
      const startA = this.consultStartAngle ?? 0;
      const a = startA + travel * Math.PI * 1.55;
      // In the ring's own plane: just outside the sign glyphs, a little above the plane.
      const R = RING_R * 1.32, up = 0.32 + 0.12 * Math.sin(p * Math.PI * 2);
      const camLocal = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, up);
      const ahead = a + 0.62;
      const lookLocal = new THREE.Vector3(Math.cos(ahead) * RING_R * 0.92, Math.sin(ahead) * RING_R * 0.92, 0.02);
      this.ecliptic.updateMatrixWorld();
      const camW = camLocal.applyMatrix4(this.ecliptic.matrixWorld);
      const lookW = lookLocal.applyMatrix4(this.ecliptic.matrixWorld);
      const base = new THREE.Vector3(0, 0, this.baseDist);
      this.camera.position.copy(base).lerp(camW, w);
      this.camLook.set(0, 0, 0).lerp(lookW, w);
      // Bank with the ring: the camera's "up" leans toward the ring's axis while gliding.
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(this.ecliptic.matrixWorld);
      this.camera.up.set(0, 1, 0).lerp(normal, w * 0.85).normalize();
    } else {
      this.camera.position.lerp(this.camGoal.pos, slow);
      this.camLook.lerp(this.camGoal.look, slow);
    }
    if (!(this.consulting && this.consultStart != null && !this.reduced)) this.camera.up.lerp(new THREE.Vector3(0, 1, 0), slow).normalize();
    this.camera.lookAt(this.camLook);

    // Shift the projection so the sphere's centre lands in the middle of its slot.
    this.camera.updateProjectionMatrix();
    if (this.slotCur) {
      const cx = this.slotCur.x + this.slotCur.w / 2, cy = this.slotCur.y + this.slotCur.h / 2;
      const e = this.camera.projectionMatrix.elements;
      e[8] = -(cx / this.vw * 2 - 1);
      e[9] = (cy / this.vh * 2 - 1);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    }

    this.pulse *= Math.pow(0.25, dt);
    const shift = this.cur.y * 0.35 + this.cur.x * 0.25;
    const t = this.reduced ? 0 : this.time;
    for (const m of this.ringMats) { m.uniforms.uTime.value = t; m.uniforms.uShift.value = shift; }
    this.arcMat.uniforms.uTime.value = t * 3;
    if (this.arc.visible) this.arcMat.uniforms.uAlpha.value += (0.75 - this.arcMat.uniforms.uAlpha.value) * slow;

    const na = this.natalRing.material.uniforms.uAlpha;
    na.value += ((this.natalRing.userData.alphaGoal || 0) - na.value) * slow;

    // Sprites ease toward their opacity and scale goals.
    const ease = s => {
      const goalO = s.userData.opacityGoal ?? 1, goalS = (s.userData.baseScale || 1) * (s.userData.scaleGoal || 1);
      s.material.opacity += (goalO * (this.light && s.material.blending === THREE.NormalBlending && s !== this.core ? 1 : 1) - s.material.opacity) * k;
      s.scale.setScalar(s.scale.x + (goalS - s.scale.x) * k);
    };
    for (const g of [...Object.values(this.planets), ...Object.values(this.natal)]) { ease(g.userData.glow); ease(g.userData.label); }
    for (const s of this.signSprites) ease(s);

    // Links draw on, then optionally fade.
    for (const l of [...this.links]) {
      const age = (this.time - l.born) / this.speed;
      const p = Math.min(1, age / l.duration);
      const eased = 1 - Math.pow(1 - p, 3);
      l.mesh.geometry.setDrawRange(0, Math.floor(l.total * eased / 3) * 3);
      l.mesh.material.uniforms.uTime.value = t * 2;
      if (l.fade && age > l.duration) {
        const f = Math.max(0, 1 - (age - l.duration) / l.fade);
        l.mesh.material.uniforms.uAlpha.value = 0.95 * f;
        if (f === 0) { this.ecliptic.remove(l.mesh); l.mesh.geometry.dispose(); l.mesh.material.dispose(); this.links.splice(this.links.indexOf(l), 1); }
      }
    }

    const breath = this.reduced ? 1 : 1 + Math.sin(this.time * 1.4) * 0.06;
    this.core.scale.setScalar((0.55 + this.pulse * 0.9 + (this.consulting ? 0.25 : 0)) * breath);
    if (this.globe) { this.globe.scale.setScalar(1 + this.pulse * 0.12 + (this.reduced ? 0 : Math.sin(this.time * 1.4) * 0.015)); }
    // In reading mode the sphere is clipped to its slot so it never runs behind the cards.
    if (this.clip && this.slotCur) {
      const r = this.slotCur;
      this.renderer.setScissorTest(false); this.renderer.clear();
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(r.x, this.vh - r.y - r.h, r.w, r.h);
    } else this.renderer.setScissorTest(false);
    this.renderer.render(this.scene, this.camera);
  }
}
