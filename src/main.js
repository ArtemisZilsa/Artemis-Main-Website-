import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { readTheme, dotTexture, smoothstep, rng } from './theme.js';
import { glowPointsMaterial, pointScale } from './fx.js';
import { stops, cameraFor } from './camera-path.js';
import { createBacksound } from './audio.js';
import * as hero from './stations/hero.js';
import * as about from './stations/about.js';
import * as website from './stations/website.js';
import * as automation from './stations/automation.js';
import * as video from './stations/video.js';
import * as consultant from './stations/consultant.js';
import * as process from './stations/process.js';
import * as folio from './stations/folio.js';
import * as target from './stations/target.js';

// id section → objek 3D. Menambah stasiun: buat file di stations/, daftarkan di sini + camera-path.js.
const stations = { hero, about, website, automation, video, consultant, process, folio, target };

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 760;
const pad = (n) => String(n).padStart(2, '0');

const params = new URLSearchParams(location.search);
const LANGS = { id: 'ID', en: 'EN', ja: '日本語' }; // tambah bahasa: buat content/<kode>.json + satu entri di sini
const lang = LANGS[params.get('lang')] ? params.get('lang') : 'id';
root.lang = lang;
const content = await fetch(`content/${lang}.json`).then((r) => r.json());
const ids = content.sections.map((s) => s.id);
const path = ids.map((id, i) => stops[id] ?? { at: [0, 0, -60 * i], dist: 9, side: 'center' });
const sectionEls = renderContent(content);
let enteredAt = null;
const sound = createBacksound();

try {
  startWorld();
} catch (err) {
  console.warn('3D dimatikan, memakai tampilan statis:', err);
  root.classList.add('no-3d');
}
runLoader();

// Rel kanan: tandai section yang sedang dilihat (jalan juga tanpa WebGL).
const railLinks = [...$('rail').children];
const updateRail = () => {
  const idx = Math.round(scrollF());
  railLinks.forEach((a, i) => a.classList.toggle('active', i === idx));
};
addEventListener('scroll', updateRail, { passive: true });
updateRail();

// ---------------------------------------------------------------- konten
function renderContent(c) {
  document.title = c.meta.title;
  document.querySelector('meta[name="description"]').content = c.meta.description;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const ctaLink = (cls) => Object.assign(el('a', cls, c.cta.label), { href: c.cta.href, target: '_blank', rel: 'noopener' });

  $('nav-links').append(...c.nav.map((n) => Object.assign(el('a', null, n.label), { href: n.href })));
  $('lang').append(...Object.entries(LANGS).map(([code, label]) => {
    const a = Object.assign(el('a', code === lang ? 'active' : null, label), { href: code === 'id' ? './' : `?lang=${code}`, hreflang: code });
    if (code === lang) a.setAttribute('aria-current', 'true');
    return a;
  }));
  $('nav-cta').replaceWith(ctaLink('btn btn-sm'));

  const els = c.sections.map((s, i) => {
    const sec = el('section', 'section');
    sec.id = s.id;
    sec.dataset.id = s.id;
    const side = path[i].side;
    sec.dataset.text = side === 'right' ? 'left' : side === 'left' ? 'right' : 'center';
    const panel = el('div', 'panel');
    panel.append(el('p', 'eyebrow', s.eyebrow), el(i === 0 ? 'h1' : 'h2', null, s.title));
    if (s.body) panel.append(el('p', 'body', s.body));
    if (s.items) {
      const ul = el('ul', 'items');
      for (const it of s.items) {
        const li = el('li');
        li.append(el('span', 'label', it.label), el('span', 'value', it.value));
        ul.append(li);
      }
      panel.append(ul);
    }
    if (s.note) panel.append(el('p', 'note', s.note));
    if (s.cta) panel.append(ctaLink('btn'));
    sec.append(panel);
    $('sections').append(sec);
    return sec;
  });

  $('footer').textContent = c.footer;
  // Rel kanan: nomor + nama section (nama tampil saat aktif, gaya Resn).
  $('rail').append(...c.sections.map((s, i) => {
    const a = Object.assign(el('a'), { href: `#${s.id}`, title: s.eyebrow });
    a.append(el('span', 'rail-label', s.eyebrow.split('·').pop().trim()), el('b', null, pad(i + 1)));
    return a;
  }));
  $('hud-orbit-label').textContent = c.hud.orbit;
  $('hud-velocity-label').textContent = c.hud.velocity;
  $('hud-session-label').textContent = c.hud.session;

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting && !e.target.classList.contains('in')) glitchIn(e.target.querySelector('h1, h2'));
      e.target.classList.toggle('in', e.isIntersecting);
    }),
    { threshold: 0.2 },
  );
  els.forEach((s) => io.observe(s));
  return els;
}

// Judul muncul huruf demi huruf: tersembunyi → kotak putih berkedip → huruf asli (gaya Resn).
// Tiap huruf dibungkus span sementara supaya tata letak tidak bergeser; selesai → teks biasa lagi.
function glitchIn(h) {
  if (!h || reduced) return;
  const text = (h.dataset.text ??= h.textContent);
  cancelAnimationFrame(h._raf);
  h.setAttribute('aria-label', text);
  h.textContent = '';
  const chars = [...text].map((ch, i, all) => {
    if (ch === ' ') { h.append(' '); return null; }
    const s = document.createElement('span');
    s.textContent = ch;
    s.setAttribute('aria-hidden', 'true');
    h.append(s);
    return { s, start: (i / all.length) * 0.55 + Math.random() * 0.15 };
  }).filter(Boolean);
  const t0 = performance.now();
  const DUR = 1100;
  const step = (now) => {
    const p = (now - t0) / DUR;
    if (p >= 1) { h.textContent = text; h.removeAttribute('aria-label'); return; }
    for (const c of chars) {
      const k = p - c.start;
      c.s.className = k < 0 ? 'gl-h' : k < 0.22 ? (Math.random() < 0.7 ? 'gl-b' : 'gl-h') : '';
    }
    h._raf = requestAnimationFrame(step);
  };
  h._raf = requestAnimationFrame(step);
}

// Posisi scroll → angka section pecahan (0 = hero di tengah layar, 1 = about, ...).
function scrollF() {
  const y = scrollY + innerHeight / 2;
  const last = sectionEls.length - 1;
  for (let i = 0; i <= last; i++) {
    const { offsetTop: top, offsetHeight: h } = sectionEls[i];
    if (y < top + h || i === last) return Math.min(Math.max(i + (y - top - h / 2) / h, 0), last);
  }
  return 0;
}

// ---------------------------------------------------------------- loader
function runLoader() {
  const count = $('loader-count');
  const btn = $('loader-enter');
  const silent = $('loader-silent');
  btn.textContent = content.loader.enterPlain;
  silent.textContent = content.loader.silent;
  $('loader-hint').textContent = content.loader.hint;
  // Tombol musik di nav + label loader mengikuti ada/tidaknya file musik.
  const toggle = $('sound');
  toggle.addEventListener('click', () => sound.toggle());
  sound.subscribe(({ on, available }) => {
    toggle.hidden = !available;
    toggle.classList.toggle('on', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? content.sound.on : content.sound.off);
    btn.textContent = available ? content.loader.enter : content.loader.enterPlain;
    silent.hidden = !available;
  });
  sound.probe();
  const t0 = performance.now();
  const dur = reduced ? 0 : 1600;
  const fonts = document.fonts?.ready ?? Promise.resolve();
  let fontsReady = false;
  fonts.then(() => (fontsReady = true));
  (function step(now) {
    const k = dur ? Math.min((now - t0) / dur, 1) : 1;
    count.textContent = String(Math.round(k * 100)).padStart(3, '0');
    if (k < 1 || !fontsReady) return requestAnimationFrame(step);
    $('loader-status').textContent = content.loader.ready;
    btn.disabled = false;
    btn.focus({ preventScroll: true });
  })(t0);
  const enter = (withSound) => {
    $('loader').classList.add('gone');
    glitchIn($('sections').querySelector('h1')); // judul hero baru terlihat setelah loader hilang
    enteredAt = performance.now();
    if (withSound) sound.play();
  };
  btn.addEventListener('click', () => enter(true));
  silent.addEventListener('click', () => enter(false));
  if (params.has('enter')) enter(false); // ?enter = lewati loader (untuk screenshot/QA)
}

// ---------------------------------------------------------------- dunia 3D
function startWorld() {
  const low = isMobile() || (navigator.hardwareConcurrency || 8) <= 4;
  // Satu tempat untuk mengatur kualitas grafis.
  const quality = { low, dpr: Math.min(devicePixelRatio, low ? 1.25 : 2), stars: low ? 900 : 2600 };

  const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(quality.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const theme = readTheme();
  const scene = new THREE.Scene();
  scene.background = theme.bg;
  scene.fog = new THREE.FogExp2(theme.bg, 0.022);
  const pmrem = new THREE.PMREMGenerator(renderer);
  theme.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); // dari kiri-belakang → bulan tampak sabit
  key.position.set(-6, 1.5, -0.8);
  scene.add(key);
  scene.add(makeStars(theme, quality.stars));
  scene.add(makeBokeh(theme, low ? 90 : 220, pointScale(quality.dpr)));
  const streaks = makeStreaks(theme, low ? 80 : 180);
  scene.add(streaks.mesh);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
  const list = ids.flatMap((id, i) => {
    if (!stations[id]) return [];
    const st = stations[id].create(theme, quality, content.sections[i]);
    st.group.position.fromArray(path[i].at);
    scene.add(st.group);
    return [{ i, st, items: sectionEls[i].querySelectorAll('.items li'), shown: -2 }];
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55 * theme.neonStrength, 0.3, 0.92));
  const lens = new ShaderPass(lensShader());
  composer.addPass(lens);
  composer.addPass(new OutputPass());

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    lens.uniforms.uAspect.value = camera.aspect;
  };
  addEventListener('resize', resize);
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  });

  const hud = { t: 0, fps: 60, orbit: $('hud-orbit'), name: $('hud-name'), vel: $('hud-velocity'), pos: $('hud-pos'), session: $('hud-session'), fpsEl: $('hud-fps') };
  const look = new THREE.Vector3();
  const lastCam = new THREE.Vector3();
  let speed = 0;
  let camF = scrollF();
  let last = performance.now();
  let time = 0;
  let shake = 0; // diisi station lewat properti `shake` (mis. panah melesat)

  renderer.setAnimationLoop((now) => {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1); // timestamp rAF bisa lebih awal dari setup
    last = now;
    if (!reduced) time += dt;
    camF += (scrollF() - camF) * (reduced ? 1 : 1 - Math.exp(-dt * 3.2));
    const ease = 1 - Math.exp(-dt * 4);
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;

    // Kamera berhenti sebentar di tiap stasiun lalu meluncur ke berikutnya.
    const mobile = isMobile();
    const i0 = Math.min(Math.floor(camF), ids.length - 2);
    const k = smoothstep(0.12, 0.88, camF - i0);
    const a = cameraFor(path[i0], mobile);
    const b = cameraFor(path[i0 + 1], mobile);
    camera.position.lerpVectors(a.pos, b.pos, k);
    look.lerpVectors(a.look, b.look, k);
    camera.position.x += mouse.x * 0.5 + (reduced ? 0 : Math.sin(now * 0.091) * Math.sin(now * 0.037) * shake);
    camera.position.y += mouse.y * 0.3 + (reduced ? 0 : Math.sin(now * 0.077) * Math.sin(now * 0.053) * shake);
    camera.lookAt(look);
    // Kecepatan dunia (unit/detik) → garis warp saat kamera meluncur antar stasiun.
    speed += (camera.position.distanceTo(lastCam) / Math.max(dt, 1e-3) - speed) * 0.2;
    lastCam.copy(camera.position);
    streaks.update(camera.position, reduced ? 0 : speed, 1 - smoothstep(0.8, 1.2, camF)); // warp berwarna api saat panah melesat
    sound.update(speed);

    shake = 0;
    for (const s of list) {
      const local = camF - s.i;
      s.st.group.visible = Math.abs(local) < 1.05;
      if (!s.st.group.visible) continue;
      s.st.update(time, { local, mouse, quality, reduced });
      if (s.st.shake) shake = Math.max(shake, s.st.shake);
      // Station boleh menandai item teks yang sedang aktif (mis. langkah automasi).
      if ('activeItem' in s.st && s.st.activeItem !== s.shown) {
        s.shown = s.st.activeItem;
        s.items.forEach((li, k) => li.classList.toggle('active', k === s.shown));
      }
    }
    // Lensa: aberasi warna makin kuat saat meluncur; sapuan diagonal di tengah perpindahan section.
    const moving = reduced ? 0 : smoothstep(8, 40, speed);
    lens.uniforms.uAberr.value = 0.012 + moving * 0.05;
    lens.uniforms.uWipe.value = smoothstep(0.3, 0.7, camF - Math.floor(camF));
    lens.uniforms.uWipeOn.value = moving;
    composer.render();

    hud.fps += (1 / Math.max(dt, 1e-3) - hud.fps) * 0.05;
    hud.t += dt;
    if (hud.t > 0.2) {
      hud.t = 0;
      const idx = Math.round(camF);
      hud.orbit.textContent = `${pad(idx + 1)}/${pad(ids.length)}`;
      hud.name.textContent = ids[idx];
      hud.vel.textContent = speed.toFixed(1);
      const p = camera.position;
      hud.pos.textContent = `X:${p.x.toFixed(0)} Y:${p.y.toFixed(0)} Z:${p.z.toFixed(0)}`;
      hud.fpsEl.textContent = Math.round(hud.fps);
      const s = enteredAt ? Math.floor((now - enteredAt) / 1000) : 0;
      hud.session.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    }
  });
}

// Garis cahaya di sekitar kamera: diam di dunia (parallax benar), memanjang dan muncul hanya saat cepat.
function makeStreaks(theme, n) {
  const L = 60; // panjang tabung tempat garis berulang
  const seeds = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 10;
    return [Math.cos(a) * r, Math.sin(a) * r * 0.7, Math.random() * L];
  });
  const pos = new Float32Array(n * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: theme.glow(theme.neon, 1.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.LineSegments(geo, mat);
  mesh.frustumCulled = false;
  const cold = mat.color.clone();
  const hot = theme.glow(theme.sun, 2);
  return {
    mesh,
    update(cam, speed, fire = 0) {
      mat.color.copy(cold).lerp(hot, fire);
      mat.opacity = smoothstep(10, 60, speed) * 0.35;
      mesh.visible = mat.opacity > 0.01;
      if (!mesh.visible) return;
      const len = Math.min(speed * 0.04, 4);
      seeds.forEach(([x, y, s], i) => {
        const z = cam.z + (((s - cam.z) % L) + L) % L - L + 6;
        pos.set([cam.x + x, cam.y + y, z, cam.x + x, cam.y + y, z + len], i * 6);
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}

function makeStars(theme, n) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 80;
    if (Math.abs(x) < 16 && Math.abs(y) < 6) x += Math.sign(x || 1) * 16; // jauhkan dari jalur kamera
    pos.set([x, y, 30 - Math.random() * 540], i * 3);
    c.copy(Math.random() < 0.12 ? theme.neon : theme.ink).multiplyScalar(0.35 + Math.random() * 0.9);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.35, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

// Lapisan lensa sinematik (setelah bloom): vignette, aberasi warna di tepi,
// dan garis cahaya diagonal yang menyapu layar saat pindah section (gaya transisi Resn).
function lensShader() {
  return {
    uniforms: { tDiffuse: { value: null }, uAberr: { value: 0.012 }, uWipe: { value: 0 }, uWipeOn: { value: 0 }, uAspect: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uAberr, uWipe, uWipeOn, uAspect; varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5;
        // Garis diagonal naik (kiri-bawah → kanan-atas) yang bergeser melintasi layar.
        float d = (vUv.x * uAspect + (1.0 - vUv.y) * 0.6) / (uAspect + 0.6);
        float edge = uWipe * 1.4 - 0.2;
        float near = (1.0 - smoothstep(0.0, 0.06, abs(d - edge))) * uWipeOn;
        vec2 uv = vUv + vec2(near * 0.012, 0.0);
        vec2 off = c * dot(c, c) * (uAberr + near * 0.04);
        vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
        col += vec3(0.55, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.004, abs(d - edge))) * uWipeOn * 1.4;
        float v = 1.0 - smoothstep(0.35, 1.05, length(c * vec2(uAspect, 1.0)));
        col *= mix(0.45, 1.0, v);
        gl_FragColor = vec4(col, 1.0);
      }`,
  };
}

// Debu bokeh: titik besar lembut di sepanjang jalur kamera, terasa seperti partikel di luar fokus.
function makeBokeh(theme, n, scale) {
  const rand = rng(99);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    pos.set([(rand() - 0.5) * 30, (rand() - 0.5) * 16, 20 - rand() * 520], i * 3);
    c.copy(rand() < 0.25 ? theme.neon : theme.ink).multiplyScalar(0.05 + rand() * 0.1);
    c.toArray(col, i * 3);
    size[i] = 0.5 + rand() * 1.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const pts = new THREE.Points(geo, glowPointsMaterial(scale));
  pts.frustumCulled = false;
  return pts;
}
