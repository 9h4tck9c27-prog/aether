// The living celestial sphere: iridescent armillary rings with the real planets on them.
import * as THREE from "../vendor/three.module.min.js";
import { PLANETS, PLANET_GLYPHS, SIGN_GLYPHS } from "./data.js";

const DEG = Math.PI / 180;
const RING_R = 2.0, NATAL_R = 1.38;

const ringVert = `
  varying float vAngle;
  void main() {
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const ringFrag = `
  uniform float uTime, uOffset, uLight, uAlpha, uShift;
  varying float vAngle;
  vec3 brand(float t) {
    t = fract(t) * 4.0;
    vec3 lilac = vec3(0.72, 0.64, 1.0), mint = vec3(0.62, 0.90, 0.83), apricot = vec3(1.0, 0.72, 0.60), rose = vec3(0.98, 0.78, 0.92);
    if (t < 1.0) return mix(lilac, mint, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(mint, apricot, smoothstep(0.0, 1.0, t - 1.0));
    if (t < 3.0) return mix(apricot, rose, smoothstep(0.0, 1.0, t - 2.0));
    return mix(rose, lilac, smoothstep(0.0, 1.0, t - 3.0));
  }
  void main() {
    float t = vAngle / 6.28318 + uOffset + uTime * 0.025 + uShift;
    vec3 c = brand(t);
    c = mix(c, c * vec3(0.42, 0.36, 0.62), uLight);
    gl_FragColor = vec4(c, uAlpha);
  }`;

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.22)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function glyphTexture(glyph, color) {
  const c = document.createElement("canvas"); c.width = c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = '56px "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols", "DejaVu Sans", serif';
  g.fillText(glyph, 48, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const PLANET_COLORS = {
  Sun: 0xffd9a8, Moon: 0xf7f2fb, Mercury: 0xcfe9ff, Venus: 0xffc2d6, Mars: 0xff9b85,
  Jupiter: 0xffe3a3, Saturn: 0xd8c7ff, Uranus: 0x9ee6d4, Neptune: 0xa8c4ff, Pluto: 0xc9a7ff,
};

export class Sky {
  constructor(canvas) {
    this.canvas = canvas;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, 7.4);
    this.glow = glowTexture();
    this.ringMats = [];
    this.light = 0;
    this.time = 0;
    this.tilt = { x: 0, y: 0 };      // target from device motion
    this.cur = { x: 0, y: 0 };       // smoothed
    this.drag = { yaw: 0, vel: 0, active: false, lastX: 0 };
    this.pulse = 0;
    this.build();
    this.bindPointer();
    this.resize();
    addEventListener("resize", () => this.resize());
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  ring(radius, tube, offset, alpha) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: ringVert, fragmentShader: ringFrag, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOffset: { value: offset }, uLight: { value: 0 }, uAlpha: { value: alpha }, uShift: { value: 0 } },
    });
    mat.userData.baseAlpha = alpha;
    this.ringMats.push(mat);
    return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 260), mat);
  }

  build() {
    // Whole instrument, gently tipped toward the viewer.
    this.root = new THREE.Group();
    this.root.rotation.x = -1.08;
    this.root.rotation.y = 0.42;
    this.scene.add(this.root);

    // Ecliptic plane group: planets and zodiac live here.
    this.ecliptic = new THREE.Group();
    this.root.add(this.ecliptic);
    this.ecliptic.add(this.ring(RING_R, 0.014, 0.0, 0.95));

    // Celestial equator, tilted 23.44 degrees from the ecliptic.
    const eq = this.ring(RING_R * 1.0, 0.007, 0.33, 0.45);
    eq.rotation.x = 23.44 * DEG;
    this.root.add(eq);

    // Two meridian rings for the armillary feel.
    const m1 = this.ring(RING_R * 1.06, 0.006, 0.6, 0.35); m1.rotation.y = 90 * DEG; this.root.add(m1);
    const m2 = this.ring(RING_R * 1.06, 0.005, 0.85, 0.25); m2.rotation.y = 90 * DEG; m2.rotation.x = 90 * DEG; this.root.add(m2);

    // Natal ring (inner): the sky you were born under.
    this.natalRing = this.ring(NATAL_R, 0.008, 0.15, 0.0);
    this.ecliptic.add(this.natalRing);

    // Zodiac ticks and glyphs.
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
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(SIGN_GLYPHS[i], "#ffffff"), transparent: true, opacity: 0.42, depthWrite: false }));
      s.position.set(Math.cos(a) * (RING_R + 0.3), Math.sin(a) * (RING_R + 0.3), 0);
      s.scale.setScalar(0.2);
      this.ecliptic.add(s);
      this.signSprites.push(s);
    }

    // Centre: you.
    this.core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0xf7f2fb, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.core.scale.setScalar(0.55);
    this.root.add(this.core);

    // Planets (sky) and natal points.
    this.planets = {}; this.natal = {};
    for (const p of PLANETS) {
      const big = p === "Sun" || p === "Moon";
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: PLANET_COLORS[p], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(big ? 0.62 : 0.4);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(PLANET_GLYPHS[p], "#ffffff"), transparent: true, depthWrite: false }));
      label.scale.setScalar(big ? 0.26 : 0.21);
      const g = new THREE.Group(); g.add(glow); g.add(label);
      label.position.z = 0.001;
      g.userData = { glow, label };
      g.visible = false;
      this.ecliptic.add(g);
      this.planets[p] = g;

      const n = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: PLANET_COLORS[p], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      n.scale.setScalar(big ? 0.34 : 0.24);
      this.ecliptic.add(n);
      this.natal[p] = n;
    }

    // Distant stars.
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

  setSky(pos) {
    for (const p of PLANETS) {
      const a = pos[p].lon * DEG, g = this.planets[p];
      g.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0);
      g.visible = true;
    }
  }

  setNatal(pos) {
    for (const p of PLANETS) {
      const a = pos[p].lon * DEG;
      this.natal[p].position.set(Math.cos(a) * NATAL_R, Math.sin(a) * NATAL_R, 0);
    }
    this.natalTarget = 1;
  }

  // 0 = dark sky (night, dusk), 1 = light sky (dawn, day)
  setLight(isLight) {
    this.light = isLight ? 1 : 0;
    const blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    for (const m of this.ringMats) { m.uniforms.uLight.value = this.light; m.blending = blend; m.needsUpdate = true; }
    const ink = isLight ? 0x2a1b4a : 0xffffff;
    this.tickMat.color.setHex(ink);
    for (const s of this.signSprites) { s.material.color.setHex(isLight ? 0x2a1b4a : 0xffffff); }
    for (const p of PLANETS) {
      const { glow, label } = this.planets[p].userData;
      glow.material.blending = blend; glow.material.opacity = isLight ? 0.55 : 1; glow.material.needsUpdate = true;
      label.material.color.setHex(isLight ? 0x2a1b4a : 0xffffff);
      this.natal[p].material.blending = blend; this.natal[p].material.needsUpdate = true;
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

  // A short glow pulse, used when a reading appears or a day is bottled.
  bloom() { this.pulse = 1; }

  bindPointer() {
    const c = this.canvas;
    c.addEventListener("pointerdown", e => { this.drag.active = true; this.drag.lastX = e.clientX; c.setPointerCapture(e.pointerId); });
    c.addEventListener("pointermove", e => {
      if (!this.drag.active) return;
      const dx = e.clientX - this.drag.lastX; this.drag.lastX = e.clientX;
      this.drag.vel = dx * 0.006; this.drag.yaw += this.drag.vel;
    });
    const end = () => { this.drag.active = false; };
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = Math.max(7.6, 7.6 * 0.95 / Math.max(0.3, w / h) );
    this.camera.updateProjectionMatrix();
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const k = 1 - Math.pow(0.04, dt);
    this.cur.x += (this.tilt.x - this.cur.x) * k;
    this.cur.y += (this.tilt.y - this.cur.y) * k;
    if (!this.drag.active) { this.drag.yaw += this.drag.vel; this.drag.vel *= Math.pow(0.08, dt); }
    const spin = this.reduced ? 0 : this.time * 0.035;
    this.root.rotation.x = -1.08 + this.cur.x;
    this.root.rotation.y = 0.42 + this.cur.y;
    this.ecliptic.rotation.z = spin + this.drag.yaw;
    this.stars.rotation.y = this.cur.y * 0.3 + spin * 0.15;
    this.stars.rotation.x = this.cur.x * 0.3;

    this.pulse *= Math.pow(0.25, dt);
    const shift = this.cur.y * 0.35 + this.cur.x * 0.25;
    for (const m of this.ringMats) {
      m.uniforms.uTime.value = this.reduced ? 0 : this.time;
      m.uniforms.uShift.value = shift;
    }
    if (this.natalTarget) {
      const nm = this.natalRing.material;
      nm.uniforms.uAlpha.value += (0.7 - nm.uniforms.uAlpha.value) * k * 0.6;
      for (const p of PLANETS) {
        const m = this.natal[p].material; m.opacity += ((this.light ? 0.5 : 0.75) - m.opacity) * k * 0.6;
      }
    }
    const breath = this.reduced ? 1 : 1 + Math.sin(this.time * 1.4) * 0.06;
    this.core.scale.setScalar((0.55 + this.pulse * 0.9) * breath);
    // Keep glyph labels facing the viewer at a readable size regardless of tilt.
    this.renderer.render(this.scene, this.camera);
  }
}
