import * as THREE from 'three';
import { rng } from '../theme.js';

// Tiga halaman website melayang: landing page bergambar luar angkasa (depan),
// dashboard trading, dan galeri portofolio. Semua digambar di canvas, tanpa file gambar.

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

export function create(theme) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  const plane = new THREE.PlaneGeometry(4.4, 2.7);
  const edges = new THREE.EdgesGeometry(plane);
  const pages = [gallery, trading, landing]; // terakhir = paling depan
  const panels = pages.map((draw, i) => {
    const front = i === pages.length - 1;
    const p = new THREE.Group();
    p.add(new THREE.Mesh(plane, new THREE.MeshBasicMaterial({
      map: pageTexture(draw), color: theme.ink.clone().multiplyScalar(front ? 0.9 : 0.7), transparent: true, opacity: front ? 1 : 0.9,
    })));
    p.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, front ? 2.4 : 1), transparent: true, opacity: front ? 1 : 0.6 })));
    rig.add(p);
    return p;
  });
  // Lapisan kaca di atas halaman depan: kilau yang menyapu.
  const glass = theme.glass(0);
  const sheen = new THREE.Mesh(plane, glass);
  sheen.position.z = 0.01;
  panels.at(-1).add(sheen);

  return {
    group,
    update(t, { local, mouse }) {
      const open = 1 - Math.min(1, Math.abs(local));
      panels.forEach((p, i) => {
        const d = i - (panels.length - 1); // 0 = depan, negatif = di belakang
        p.position.set(d * (0.35 + 0.75 * open), d * (-0.05 - 0.3 * open), d * (0.25 + 0.6 * open));
      });
      rig.rotation.set(0.06 - mouse.y * 0.1, -0.5 + mouse.x * 0.2 + Math.sin(t * 0.3) * 0.05, 0);
      rig.position.y = Math.sin(t * 0.6) * 0.08;
      glass.uniforms.uTime.value = t;
    },
  };
}
