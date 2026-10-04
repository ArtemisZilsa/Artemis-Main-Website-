import * as THREE from 'three';
import { rng } from '../theme.js';

// Halaman website melayang yang bergantian tiap CYCLE detik (landing, toko, persona, trading, kafe, galeri):
// kartu depan terlempar, kartu belakang maju, desain baru muncul dengan glitch. Semua digambar di canvas.
// Menambah desain: tulis fungsi gambar baru dan masukkan ke PAGES.

const W = 1024;
const H = 628;
const FONT = 'Sora, "Noto Sans JP", sans-serif';

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function pageTexture(draw) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const run = () => {
    draw(c.getContext('2d'));
    tex.needsUpdate = true;
  };
  run();
  document.fonts?.ready.then(run);
  return tex;
}

function stars(g, rand, x, y, w, h, n) {
  g.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    g.globalAlpha = 0.3 + rand() * 0.7;
    g.beginPath();
    g.arc(x + rand() * w, y + rand() * h, 0.4 + rand() * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

function planet(g, x, y, r) {
  const body = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  body.addColorStop(0, '#bfe9ff');
  body.addColorStop(0.5, '#3a6fa8');
  body.addColorStop(1, '#0c1a33');
  g.fillStyle = body;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(x, y);
  g.rotate(-0.35);
  g.strokeStyle = 'rgba(255,255,255,0.65)';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(0, 0, r * 1.7, r * 0.38, 0, Math.PI * 0.05, Math.PI * 0.95, true);
  g.stroke();
  g.restore();
}

// Kartu gambar: pemandangan sederhana dari gradien dan bentuk.
function scene(g, x, y, w, h, kind) {
  g.save();
  rr(g, x, y, w, h, 12);
  g.clip();
  const palettes = {
    sunset: ['#2b1055', '#d76d77', '#ffaf7b'],
    ocean: ['#03203c', '#0b6e99', '#7ee8fa'],
    aurora: ['#020617', '#0f3d3e', '#3dffa2'],
    nebula: ['#0b0420', '#5b2a86', '#00d4ff'],
  };
  const [a, b, c] = palettes[kind];
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, a);
  sky.addColorStop(0.65, b);
  sky.addColorStop(1, c);
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  const rand = rng(Math.round(x + y));
  if (kind === 'sunset') {
    g.fillStyle = 'rgba(255,220,180,0.9)';
    g.beginPath(); g.arc(x + w * 0.65, y + h * 0.62, h * 0.18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a0b2e';
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.3, y + h * 0.45); g.lineTo(x + w * 0.55, y + h); g.fill();
    g.beginPath(); g.moveTo(x + w * 0.35, y + h); g.lineTo(x + w * 0.72, y + h * 0.55); g.lineTo(x + w, y + h); g.fill();
  } else if (kind === 'ocean') {
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      for (let s = 0; s <= w; s += 8) g.lineTo(x + s, y + h * (0.6 + k * 0.1) + Math.sin(s * 0.05 + k) * 4);
      g.stroke();
    }
  } else if (kind === 'aurora') {
    stars(g, rand, x, y, w, h * 0.6, 40);
    g.strokeStyle = 'rgba(61,255,162,0.55)';
    g.lineWidth = 10;
    g.beginPath();
    for (let s = 0; s <= w; s += 8) g.lineTo(x + s, y + h * 0.35 + Math.sin(s * 0.03) * 18);
    g.stroke();
  } else {
    stars(g, rand, x, y, w, h, 70);
    planet(g, x + w * 0.6, y + h * 0.5, h * 0.22);
  }
  g.restore();
}

function landing(g) {
  const rand = rng(3);
  g.fillStyle = '#07090f';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#00d4ff'; g.lineWidth = 3;
  g.beginPath(); g.arc(40, 30, 11, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#e8eef5'; g.font = `600 20px ${FONT}`; g.fillText('NOVA', 62, 37);
  g.fillStyle = 'rgba(232,238,245,0.45)';
  [560, 640, 720, 800].forEach((x) => g.fillRect(x, 27, 52, 7));
  g.fillStyle = '#00d4ff'; rr(g, 892, 16, 108, 30, 15); g.fill();
  // Hero bergambar luar angkasa
  g.save();
  rr(g, 24, 62, 976, 336, 18);
  g.clip();
  const sky = g.createLinearGradient(0, 62, 0, 398);
  sky.addColorStop(0, '#050816'); sky.addColorStop(1, '#12224a');
  g.fillStyle = sky; g.fillRect(24, 62, 976, 336);
  for (const [x, y, r, col] of [[700, 170, 280, 'rgba(120,80,255,0.45)'], [860, 300, 200, 'rgba(0,212,255,0.35)']]) {
    const neb = g.createRadialGradient(x, y, 0, x, y, r);
    neb.addColorStop(0, col); neb.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = neb; g.fillRect(24, 62, 976, 336);
  }
  stars(g, rand, 24, 62, 976, 336, 260);
  planet(g, 790, 230, 88);
  g.restore();
  g.fillStyle = '#fff'; g.font = `600 54px ${FONT}`; g.fillText('Explore Beyond', 64, 200);
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = `400 21px ${FONT}`; g.fillText('Launch your brand into orbit.', 66, 240);
  g.fillStyle = '#00d4ff'; rr(g, 64, 266, 168, 44, 22); g.fill();
  g.fillStyle = '#04050c'; g.font = `600 17px ${FONT}`; g.fillText('Get Started', 100, 294);
  ['sunset', 'ocean', 'aurora'].forEach((k, i) => {
    const x = 24 + i * 333;
    scene(g, x, 418, 310, 130, k);
    g.fillStyle = '#e8eef5'; g.font = `600 17px ${FONT}`; g.fillText(['Mountains', 'Ocean', 'Aurora'][i], x + 4, 576);
    g.fillStyle = 'rgba(232,238,245,0.35)'; g.fillRect(x + 4, 590, 180, 7);
  });
}

function trading(g) {
  const rand = rng(5);
  g.fillStyle = '#080b10';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#0e131b'; g.fillRect(0, 0, 70, H);
  for (let i = 0; i < 6; i++) { g.fillStyle = i === 1 ? '#00d4ff' : 'rgba(255,255,255,0.2)'; rr(g, 23, 30 + i * 56, 24, 24, 6); g.fill(); }
  g.fillStyle = '#e8eef5'; g.font = `600 24px ${FONT}`; g.fillText('BTC / USDT', 96, 46);
  g.fillStyle = '#3dffa2'; g.font = `600 28px ${FONT}`; g.fillText('64,210.52', 260, 47);
  g.fillStyle = 'rgba(61,255,162,0.18)'; rr(g, 420, 25, 86, 28, 14); g.fill();
  g.fillStyle = '#3dffa2'; g.font = `600 16px ${FONT}`; g.fillText('+2.41%', 436, 45);
  const X0 = 90, Y0 = 76, CW = 640, CH = 380;
  g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
  for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(X0, Y0 + (CH / 6) * i); g.lineTo(X0 + CW, Y0 + (CH / 6) * i); g.stroke(); }
  const N = 46;
  let price = 0.4;
  const candles = Array.from({ length: N }, () => {
    const open = price;
    price = Math.min(0.92, Math.max(0.12, price + (rand() - 0.42) * 0.07));
    const close = price;
    return { open, close, hi: Math.max(open, close) + rand() * 0.04, lo: Math.min(open, close) - rand() * 0.04 };
  });
  const yAt = (v) => Y0 + CH - v * CH;
  const step = CW / N;
  candles.forEach((k, i) => {
    const x = X0 + i * step + step / 2;
    g.strokeStyle = g.fillStyle = k.close >= k.open ? '#3dffa2' : '#ff4d6d';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, yAt(k.hi)); g.lineTo(x, yAt(k.lo)); g.stroke();
    g.fillRect(x - step * 0.32, yAt(Math.max(k.open, k.close)), step * 0.64, Math.max(2, Math.abs(yAt(k.open) - yAt(k.close))));
    g.globalAlpha = 0.25;
    const vol = 20 + rand() * 60;
    g.fillRect(x - step * 0.32, Y0 + CH + 100 - vol, step * 0.64, vol);
    g.globalAlpha = 1;
  });
  g.strokeStyle = '#00d4ff'; g.lineWidth = 2.5;
  g.beginPath();
  candles.forEach((k, i) => {
    const win = candles.slice(Math.max(0, i - 6), i + 1);
    g.lineTo(X0 + i * step + step / 2, yAt(win.reduce((s, c) => s + c.close, 0) / win.length));
  });
  g.stroke();
  g.fillStyle = '#0e131b'; rr(g, 748, 76, 252, 520, 12); g.fill();
  g.fillStyle = '#e8eef5'; g.font = `600 17px ${FONT}`; g.fillText('Order book', 768, 106);
  for (let i = 0; i < 15; i++) {
    const sell = i < 7;
    const y = 128 + i * 30;
    const depth = 20 + rand() * 190;
    g.fillStyle = sell ? 'rgba(255,77,109,0.16)' : 'rgba(61,255,162,0.16)';
    g.fillRect(980 - depth, y, depth, 22);
    g.font = `400 14px ${FONT}`;
    g.fillStyle = sell ? '#ff4d6d' : '#3dffa2';
    g.fillText((64250 - i * 6.5).toFixed(1), 768, y + 16);
    g.fillStyle = 'rgba(232,238,245,0.6)';
    g.fillText((rand() * 2).toFixed(3), 900, y + 16);
  }
}

function gallery(g) {
  g.fillStyle = '#0a0c12';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8eef5'; g.font = `600 30px ${FONT}`; g.fillText('Portfolio', 40, 56);
  g.fillStyle = 'rgba(232,238,245,0.4)';
  [700, 790, 880].forEach((x) => g.fillRect(x, 40, 64, 8));
  ['nebula', 'sunset', 'aurora', 'ocean', 'nebula', 'sunset'].forEach((k, i) => {
    scene(g, 40 + (i % 3) * 322, 86 + Math.floor(i / 3) * 266, 300, 240, k);
  });
}

function store(g) {
  g.fillStyle = '#0b0a10';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8eef5'; g.font = `600 22px ${FONT}`; g.fillText('LUMA', 40, 40);
  g.fillStyle = 'rgba(232,238,245,0.45)';
  [420, 500, 580, 660].forEach((x) => g.fillRect(x, 30, 56, 7));
  g.strokeStyle = '#e8eef5'; g.lineWidth = 2.5; rr(g, 930, 20, 28, 24, 5); g.stroke();
  g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(960, 20, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.font = `600 11px ${FONT}`; g.fillText('3', 957, 24);
  // Banner promo
  const ban = g.createLinearGradient(24, 0, 1000, 0);
  ban.addColorStop(0, '#2a0f3d'); ban.addColorStop(1, '#ff7a59');
  g.fillStyle = ban; rr(g, 24, 64, 976, 190, 18); g.fill();
  g.fillStyle = '#fff'; g.font = `700 50px ${FONT}`; g.fillText('Summer Drop', 60, 150);
  g.fillStyle = '#ffd36e'; g.font = `700 30px ${FONT}`; g.fillText('-30% semua koleksi', 62, 196);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath(); g.arc(840, 160, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; rr(g, 770, 110, 140, 100, 22); g.fill(); // tas
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(840, 112, 34, Math.PI, 0); g.stroke();
  // Grid produk
  const items = [['#00d4ff', 'Botol', '149.000'], ['#3dffa2', 'Tas', '349.000'], ['#ffae5c', 'Jam', '899.000'], ['#9b7bff', 'Headset', '529.000']];
  items.forEach(([col, name, price], i) => {
    const x = 24 + i * 248;
    g.fillStyle = '#15141c'; rr(g, x, 276, 232, 330, 14); g.fill();
    const glow = g.createRadialGradient(x + 116, 380, 0, x + 116, 380, 90);
    glow.addColorStop(0, col); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.45; g.fillStyle = glow; g.fillRect(x, 290, 232, 180); g.globalAlpha = 1;
    g.fillStyle = col;
    if (i === 0) { rr(g, x + 96, 320, 40, 110, 12); g.fill(); }
    else if (i === 1) { rr(g, x + 66, 350, 100, 80, 14); g.fill(); }
    else if (i === 2) { g.beginPath(); g.arc(x + 116, 380, 42, 0, Math.PI * 2); g.fill(); }
    else { g.lineWidth = 12; g.strokeStyle = col; g.beginPath(); g.arc(x + 116, 390, 44, Math.PI, 0); g.stroke(); rr(g, x + 62, 384, 24, 44, 8); g.fill(); rr(g, x + 146, 384, 24, 44, 8); g.fill(); }
    g.fillStyle = '#e8eef5'; g.font = `600 19px ${FONT}`; g.fillText(name, x + 18, 508);
    g.fillStyle = '#3dffa2'; g.font = `600 17px ${FONT}`; g.fillText(`Rp ${price}`, x + 18, 536);
    g.fillStyle = '#e8eef5'; rr(g, x + 18, 554, 196, 36, 18); g.fill();
    g.fillStyle = '#0b0a10'; g.font = `600 14px ${FONT}`; g.fillText('+ Keranjang', x + 72, 577);
  });
}

function cafe(g) {
  g.fillStyle = '#120c08';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#f3e3cf'; g.font = `600 24px ${FONT}`; g.fillText('Kopi Senja', 40, 42);
  g.fillStyle = 'rgba(243,227,207,0.45)';
  [560, 650, 740].forEach((x) => g.fillRect(x, 31, 60, 7));
  g.fillStyle = '#ffae5c'; rr(g, 850, 16, 150, 34, 17); g.fill();
  g.fillStyle = '#120c08'; g.font = `600 15px ${FONT}`; g.fillText('Reservasi', 890, 39);
  // Foto hero: langit senja + cangkir beruap
  g.save();
  rr(g, 24, 66, 560, 536, 18); g.clip();
  const sky = g.createLinearGradient(0, 66, 0, 602);
  sky.addColorStop(0, '#3b1d3a'); sky.addColorStop(0.5, '#d9734e'); sky.addColorStop(1, '#2a160d');
  g.fillStyle = sky; g.fillRect(24, 66, 560, 536);
  g.fillStyle = 'rgba(255,214,150,0.85)'; g.beginPath(); g.arc(400, 250, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1b0f09'; g.fillRect(24, 430, 560, 172);
  g.fillStyle = '#f3e3cf'; rr(g, 200, 340, 170, 120, 26); g.fill();
  g.strokeStyle = '#f3e3cf'; g.lineWidth = 14; g.beginPath(); g.arc(380, 395, 30, -Math.PI / 2, Math.PI / 2); g.stroke();
  g.fillStyle = '#6b3b1f'; g.beginPath(); g.ellipse(285, 344, 80, 12, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 5;
  for (const x of [250, 290, 330]) {
    g.beginPath(); g.moveTo(x, 320);
    g.bezierCurveTo(x - 20, 290, x + 20, 270, x, 230); g.stroke();
  }
  g.restore();
  g.fillStyle = '#f3e3cf'; g.font = `600 40px ${FONT}`; g.fillText('Menu hari ini', 620, 120);
  [['Es Kopi Susu', '28K'], ['Americano', '24K'], ['Matcha Latte', '32K'], ['Croissant', '22K'], ['Nasi Goreng Senja', '45K']].forEach(([n, p], i) => {
    const y = 180 + i * 64;
    g.fillStyle = '#f3e3cf'; g.font = `400 21px ${FONT}`; g.fillText(n, 620, y);
    g.fillStyle = '#ffae5c'; g.font = `600 21px ${FONT}`; g.fillText(p, 940, y);
    g.fillStyle = 'rgba(243,227,207,0.15)'; g.fillRect(620, y + 18, 380, 1);
  });
  g.fillStyle = 'rgba(243,227,207,0.6)'; g.font = `400 16px ${FONT}`; g.fillText('Buka setiap hari · 08.00 – 22.00', 620, 520);
}

function persona(g) {
  g.fillStyle = '#06080d';
  g.fillRect(0, 0, W, H);
  // Foto profil
  const ring = g.createLinearGradient(60, 60, 300, 300);
  ring.addColorStop(0, '#00d4ff'); ring.addColorStop(1, '#3dffa2');
  g.fillStyle = ring; g.beginPath(); g.arc(170, 190, 116, 0, Math.PI * 2); g.fill();
  g.save();
  g.beginPath(); g.arc(170, 190, 108, 0, Math.PI * 2); g.clip();
  const bg = g.createLinearGradient(0, 80, 0, 300);
  bg.addColorStop(0, '#5b2a86'); bg.addColorStop(1, '#ff7a59');
  g.fillStyle = bg; g.fillRect(60, 80, 220, 220);
  g.fillStyle = '#1a1020';
  g.beginPath(); g.arc(170, 170, 40, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(170, 290, 80, 70, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = '#fff'; g.font = `600 46px ${FONT}`; g.fillText('Alya Pratama', 330, 160);
  g.fillStyle = '#00d4ff'; g.font = `400 22px ${FONT}`; g.fillText('Fotografer & Content Creator', 332, 200);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = `400 17px ${FONT}`; g.fillText('Jakarta · Tersedia untuk proyek brand', 332, 236);
  [['Instagram', '128K', '#e1306c'], ['TikTok', '86K', '#3dffa2'], ['YouTube', '24K', '#ff4d4d']].forEach(([n, c, col], i) => {
    const x = 332 + i * 196;
    g.strokeStyle = col; g.lineWidth = 2; rr(g, x, 262, 180, 46, 23); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(x + 26, 285, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = `600 16px ${FONT}`; g.fillText(`${n} ${c}`, x + 44, 291);
  });
  g.fillStyle = '#3dffa2'; rr(g, 860, 30, 140, 40, 20); g.fill();
  g.fillStyle = '#06080d'; g.font = `600 16px ${FONT}`; g.fillText('Hire me', 900, 56);
  ['sunset', 'aurora', 'ocean', 'nebula'].forEach((k, i) => scene(g, 40 + i * 242, 350, 226, 250, k));
}

const PAGES = [landing, store, persona, trading, cafe, gallery];
const CYCLE = 2.8; // detik per desain
const SWAP = 0.75; // durasi pergantian

// Halaman dengan efek glitch (geser blok, pisah RGB, kotak putih) saat baru tampil.
function pageMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uTint: { value: new THREE.Color() }, uOpacity: { value: 1 }, uGlitch: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec3 uTint; uniform float uOpacity, uGlitch, uTime; varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 uv = vUv;
        float tick = floor(uTime * 24.0);
        float r = h(vec2(floor(uv.y * 22.0), tick));
        uv.x += (r - 0.5) * 0.16 * uGlitch * step(0.6, r);
        float s = 0.014 * uGlitch;
        vec3 c = vec3(texture2D(map, uv + vec2(s, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(s, 0.0)).b);
        float b = h(floor(uv * vec2(18.0, 11.0)) + tick);
        c = mix(c, vec3(1.0), step(1.0 - 0.16 * uGlitch, b));
        c *= 1.0 - 0.18 * uGlitch * step(0.5, fract(vUv.y * 180.0));
        gl_FragColor = vec4(c * uTint, uOpacity);
      }`,
    transparent: true,
  });
}

export function create(theme) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  const plane = new THREE.PlaneGeometry(4.4, 2.7);
  const edges = new THREE.EdgesGeometry(plane);
  const textures = PAGES.map(pageTexture);
  const edgeBack = theme.glow(theme.neon, 1);
  const edgeFront = theme.glow(theme.neon, 2.4);
  // 4 kartu bergiliran: depan, 2 di belakang, 1 tersembunyi yang masuk dari paling belakang.
  const cards = Array.from({ length: 4 }, () => {
    const mat = pageMaterial(textures[0]);
    const line = new THREE.LineBasicMaterial({ color: edgeBack.clone(), transparent: true });
    const p = new THREE.Group();
    p.add(new THREE.Mesh(plane, mat), new THREE.LineSegments(edges, line));
    rig.add(p);
    return { p, mat, line };
  });
  // Lapisan kaca di atas halaman depan: kilau yang menyapu.
  const glass = theme.glass(0);
  const sheen = new THREE.Mesh(plane, glass);
  rig.add(sheen);

  return {
    group,
    update(t, { local, mouse }) {
      const open = 1 - Math.min(1, Math.abs(local));
      const slot = (d, v) => v.set(d * (0.35 + 0.75 * open), d * (-0.05 - 0.3 * open), d * (0.25 + 0.6 * open));
      const n = Math.floor(t / CYCLE);
      const into = t - n * CYCLE; // detik sejak desain depan sekarang tampil
      const s = THREE.MathUtils.smootherstep(into, CYCLE - SWAP, CYCLE);
      cards.forEach((c, j) => {
        const rank = (j + n) % 4; // 3 = depan, 0 = tersembunyi
        c.mat.uniforms.map.value = textures[(n + 3 - rank) % PAGES.length];
        c.mat.uniforms.uTime.value = t;
        if (rank === 3) {
          // Kartu depan terlempar ke samping saat berganti.
          slot(0, c.p.position).add(new THREE.Vector3(3 * s, 0.5 * s, 1.2 * s));
          c.p.rotation.set(0, -0.8 * s, 0.15 * s);
          c.mat.uniforms.uOpacity.value = 1 - s;
          c.mat.uniforms.uGlitch.value = Math.max(1 - into / 0.5, 0) + s * 0.6;
        } else {
          const d = rank - 3 + s;
          slot(d, c.p.position);
          c.p.rotation.set(0, 0, 0);
          c.mat.uniforms.uOpacity.value = rank === 0 ? s * 0.9 : 0.9 + 0.1 * Math.max(d + 1, 0);
          c.mat.uniforms.uGlitch.value = rank === 2 ? s * s * 0.5 : 0;
        }
        const front = Math.max(1 + Math.min(rank - 3 + s, 0), 0) * (rank === 3 ? 1 - s : 1);
        c.mat.uniforms.uTint.value.copy(theme.ink).multiplyScalar(0.7 + 0.2 * front);
        c.line.color.copy(edgeBack).lerp(edgeFront, front);
        c.line.opacity = c.mat.uniforms.uOpacity.value;
      });
      slot(0, sheen.position).z += 0.01;
      sheen.visible = s === 0;
      rig.rotation.set(0.06 - mouse.y * 0.1, -0.5 + mouse.x * 0.2 + Math.sin(t * 0.3) * 0.05, 0);
      rig.position.y = Math.sin(t * 0.6) * 0.08;
      glass.uniforms.uTime.value = t;
    },
  };
}
