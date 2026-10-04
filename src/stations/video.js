import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from '../theme.js';

// Studio iklan: layar utama memutar cerita 3 babak (digambar ulang tiap frame):
// iklan motion graphic → grafik hasil kampanye naik → kontrak ditandatangani, cap DEAL.
// Batang grafik dan hujan koin keluar dari layar dalam 3D. Timeline editor dan pita film ikut bergerak.

const ACT = 3; // detik per babak
const AD_LEN = ACT * 3;
const WIPE = 0.45; // durasi sapuan diagonal antar babak
const STAMP = 1.5; // detik di babak DEAL saat cap jatuh
const FONT = 'Sora, "Noto Sans JP", sans-serif';
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const ease = (x) => 1 - (1 - clamp01(x)) ** 3;
const back = (x) => { x = clamp01(x); const c = 2.2; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n)));

function liveTexture(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, g: c.getContext('2d'), w, h };
}

// Babak 1: iklan produk dengan teks kinetik dan penghitung views.
function sceneAd(g, w, h, a, t) {
  const hue = 250 + Math.sin(t * 0.3) * 20;
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, `hsl(${hue}, 55%, 9%)`);
  bg.addColorStop(1, `hsl(${hue - 60}, 70%, 14%)`);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  const cx = w * 0.68, cy = h * 0.52;
  for (let k = 0; k < 4; k++) {
    const r = ((a * 120 + k * 70) % 280);
    g.strokeStyle = `rgba(0,212,255,${0.5 * (1 - r / 280)})`;
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  }
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 170);
  glow.addColorStop(0, 'rgba(61,255,162,0.35)');
  glow.addColorStop(1, 'rgba(61,255,162,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  // Produk melayang dengan kilau yang menyapu
  g.save();
  g.translate(cx, cy + Math.sin(t * 1.6) * 8);
  g.rotate(Math.sin(t * 0.8) * 0.06);
  g.scale(back(a / 0.6), back(a / 0.6));
  const body = g.createLinearGradient(-60, 0, 60, 0);
  body.addColorStop(0, '#1d2a3a'); body.addColorStop(0.5, '#cfe8ff'); body.addColorStop(1, '#22344a');
  g.fillStyle = body;
  g.beginPath(); g.roundRect(-58, -70, 116, 170, 26); g.fill();
  g.fillStyle = '#9ab3c9';
  g.beginPath(); g.roundRect(-22, -112, 44, 46, 8); g.fill();
  g.fillStyle = '#0b1220';
  g.fillRect(-40, -10, 80, 50);
  g.fillStyle = '#3dffa2';
  g.font = `600 16px ${FONT}`;
  g.textAlign = 'center';
  g.fillText('ARTEMIS', 0, 22);
  const sweep = ((a * 0.9) % 1) * 260 - 130;
  g.globalCompositeOperation = 'lighter';
  const sh = g.createLinearGradient(sweep - 30, 0, sweep + 30, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh;
  g.beginPath(); g.roundRect(-58, -70, 116, 170, 26); g.fill();
  g.restore();
  g.globalCompositeOperation = 'source-over';
  g.textAlign = 'left';

  for (let i = 0; i < 18; i++) {
    g.save();
    g.translate((i * 137 + a * 80) % w, (i * 71 + a * (50 + i * 6)) % h);
    g.rotate(a * 3 + i);
    g.fillStyle = i % 2 ? 'rgba(0,212,255,0.8)' : 'rgba(61,255,162,0.8)';
    g.fillRect(-4, -2, 8, 4);
    g.restore();
  }

  g.fillStyle = '#fff';
  g.font = `700 88px ${FONT}`;
  g.fillText('NEW', 48 - (1 - ease(a / 0.5)) * 300, h * 0.42);
  const word = 'COLLECTION';
  g.font = `600 36px ${FONT}`;
  g.fillStyle = '#00d4ff';
  g.fillText(word.slice(0, Math.floor(clamp01((a - 0.4) / 0.8) * word.length)), 52, h * 0.42 + 48);
  g.globalAlpha = ease((a - 1.3) / 0.5);
  g.fillStyle = '#3dffa2';
  g.beginPath(); g.roundRect(52, h * 0.42 + 76, 132, 38, 19); g.fill();
  g.fillStyle = '#04050c';
  g.font = `600 16px ${FONT}`;
  g.fillText('SHOP NOW', 76, h * 0.42 + 101);
  g.globalAlpha = 1;

  // Penghitung views di pojok
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath(); g.roundRect(20, 18, 178, 34, 17); g.fill();
  g.fillStyle = '#ff4d6d';
  g.beginPath(); g.arc(40, 35, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff';
  g.font = `600 15px ${FONT}`;
  g.fillText(`${fmt(ease(a / ACT) * 12400)} views`, 56, 41);
}

// Babak 2: dasbor hasil kampanye, angka menghitung naik, grafik melonjak.
function sceneData(g, w, h, b) {
  g.fillStyle = '#060b14';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = `600 14px ${FONT}`;
  g.fillText('CAMPAIGN RESULTS · 30 DAYS', 28, 36);
  const k = ease(b / 1.8);
  [['REACH', fmt(48200 * k)], ['CLICKS', fmt(3910 * k)], ['SALES', `+${Math.round(214 * k)}%`]].forEach(([l, v], i) => {
    const x = 28 + i * 200;
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.beginPath(); g.roundRect(x, 52, 184, 70, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.font = `400 12px ${FONT}`;
    g.fillText(l, x + 14, 74);
    g.fillStyle = i === 2 ? '#3dffa2' : '#fff';
    g.font = `700 28px ${FONT}`;
    g.fillText(v, x + 14, 108);
  });
  // Grafik
  const X0 = 40, Y0 = 140, CW = w - 80, CH = 180;
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(X0, Y0 + (CH / 4) * i); g.lineTo(X0 + CW, Y0 + (CH / 4) * i); g.stroke(); }
  const N = 14;
  const val = (i) => 0.08 + 0.86 * (i / (N - 1)) ** 2.2 + Math.sin(i * 1.7) * 0.03;
  const p = ease((b - 0.3) / 1.9) * (N - 1);
  for (let i = 0; i < N; i++) {
    const grow = clamp01(p - i + 1);
    g.fillStyle = 'rgba(0,212,255,0.18)';
    const bh = val(i) * CH * 0.8 * grow;
    g.fillRect(X0 + (i / (N - 1)) * CW - 9, Y0 + CH - bh, 18, bh);
  }
  const pt = (i) => [X0 + (i / (N - 1)) * CW, Y0 + CH - val(i) * CH];
  const tip = Math.floor(p);
  const frac = p - tip;
  const pts = Array.from({ length: tip + 1 }, (_, i) => pt(i));
  if (tip < N - 1) {
    const [ax, ay] = pt(tip), [bx, by] = pt(tip + 1);
    pts.push([ax + (bx - ax) * frac, ay + (by - ay) * frac]);
  }
  const area = g.createLinearGradient(0, Y0, 0, Y0 + CH);
  area.addColorStop(0, 'rgba(61,255,162,0.35)'); area.addColorStop(1, 'rgba(61,255,162,0)');
  g.fillStyle = area;
  g.beginPath(); g.moveTo(pts[0][0], Y0 + CH);
  pts.forEach(([x, y]) => g.lineTo(x, y));
  g.lineTo(pts.at(-1)[0], Y0 + CH); g.fill();
  g.strokeStyle = '#3dffa2'; g.lineWidth = 4; g.shadowColor = '#3dffa2'; g.shadowBlur = 16;
  g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.stroke();
  const [hx, hy] = pts.at(-1);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(hx, hy, 6, 0, Math.PI * 2); g.fill();
  g.shadowBlur = 0;
  // Lencana naik
  const s = back((b - 2.0) / 0.4);
  if (s > 0) {
    g.save();
    g.translate(w - 120, 70);
    g.scale(s, s);
    g.fillStyle = '#3dffa2';
    g.beginPath(); g.roundRect(-70, -22, 140, 44, 22); g.fill();
    g.fillStyle = '#04050c';
    g.font = `700 20px ${FONT}`;
    g.textAlign = 'center';
    g.fillText('▲ 214%', 0, 8);
    g.restore();
    g.textAlign = 'left';
  }
}

// Babak 3: kontrak ditandatangani, cap DEAL jatuh, nilai deal menghitung.
function sceneDeal(g, w, h, c) {
  const bg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  bg.addColorStop(0, '#0f3d2e'); bg.addColorStop(1, '#03070a');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const hit = c - STAMP;
  const shake = hit > 0 && hit < 0.25 ? Math.sin(hit * 90) * 6 * (1 - hit / 0.25) : 0;
  g.save();
  g.translate(w * 0.36 + shake, h * 0.5 + (1 - ease(c / 0.4)) * 120);
  g.rotate(-0.06);
  g.fillStyle = '#f4f7fb';
  g.beginPath(); g.roundRect(-150, -130, 300, 260, 8); g.fill();
  g.fillStyle = '#0b1220'; g.font = `700 18px ${FONT}`; g.fillText('CONTRACT', -126, -96);
  g.fillStyle = 'rgba(11,18,32,0.25)';
  for (let i = 0; i < 5; i++) g.fillRect(-126, -76 + i * 20, i === 4 ? 140 : 250, 7);
  g.fillStyle = 'rgba(11,18,32,0.4)'; g.fillRect(-126, 82, 160, 2);
  // Tanda tangan digambar
  const sk = clamp01((c - 0.45) / 0.8);
  g.strokeStyle = '#1a3cff'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 60 * sk; i++) {
    const u = i / 60;
    g.lineTo(-120 + u * 150, 70 - Math.sin(u * 14) * 12 * (1 - u * 0.5) - u * 8);
  }
  g.stroke();
  g.restore();
  // Cap DEAL
  if (hit > -0.2) {
    const s = hit < 0 ? 2.6 - (hit + 0.2) * 8 : 1 + Math.max(0, 0.12 - hit) * 2;
    g.save();
    g.translate(w * 0.42, h * 0.5);
    g.rotate(-0.22);
    g.scale(s, s);
    g.globalAlpha = hit < 0 ? 0.5 : 1;
    g.strokeStyle = '#3dffa2'; g.lineWidth = 6;
    g.beginPath(); g.roundRect(-110, -44, 220, 88, 10); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.roundRect(-100, -34, 200, 68, 6); g.stroke();
    g.fillStyle = '#3dffa2'; g.font = `800 52px ${FONT}`; g.textAlign = 'center';
    g.fillText('DEAL', 0, 18);
    g.restore();
    g.globalAlpha = 1;
    g.textAlign = 'left';
    if (hit > 0) {
      const r = ease(hit / 0.6) * 260;
      g.strokeStyle = `rgba(61,255,162,${0.6 * (1 - hit / 0.6)})`;
      g.lineWidth = 4;
      g.beginPath(); g.arc(w * 0.42, h * 0.5, r, 0, Math.PI * 2); g.stroke();
    }
  }
  // Nilai deal
  const v = ease((c - STAMP - 0.1) / 0.9);
  g.globalAlpha = clamp01((c - STAMP) / 0.3);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = `400 14px ${FONT}`;
  g.fillText('NEW CLIENT', w * 0.6, h * 0.36);
  g.fillStyle = '#fff'; g.font = `700 26px ${FONT}`;
  g.fillText(`+Rp ${Math.round(v * 25)}.000.000`, w * 0.6, h * 0.36 + 36);
  g.globalAlpha = 1;
}

const SCENES = [sceneAd, sceneData, sceneDeal];

// Satu frame cerita pada waktu a (0..AD_LEN), dengan sapuan diagonal saat pindah babak.
function drawAd({ g, w, h }, a, t) {
  const i = Math.floor(a / ACT);
  const local = a - i * ACT;
  if (local < WIPE) {
    SCENES[(i + 2) % 3](g, w, h, ACT, t);
    const x = -0.4 * w + ease(local / WIPE) * 1.8 * w;
    g.save();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(x + h * 0.45, 0); g.lineTo(x, h); g.lineTo(0, h); g.closePath();
    g.clip();
    SCENES[i](g, w, h, local, t);
    g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.shadowColor = '#00d4ff'; g.shadowBlur = 20;
    g.beginPath(); g.moveTo(x + h * 0.45, 0); g.lineTo(x, h); g.stroke();
    g.shadowBlur = 0;
  } else {
    SCENES[i](g, w, h, local, t);
  }
  // Kontrol pemutar
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.fillRect(0, h - 34, w, 34);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(56, h - 19, w - 160, 4);
  g.fillStyle = '#00d4ff';
  g.fillRect(56, h - 19, (w - 160) * (a / AD_LEN), 4);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(20, h - 26); g.lineTo(34, h - 17); g.lineTo(20, h - 8); g.fill();
  g.font = `400 14px ${FONT}`;
  g.fillText(`00:0${Math.floor(a)} / 00:0${AD_LEN}`, w - 94, h - 12);
}

function drawTimeline({ g, w, h }, a) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,12,18,0.88)';
  g.beginPath(); g.roundRect(0, 0, w, h, 14); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let x = 60; x < w; x += 29) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 16); g.stroke(); }
  const third = 1 / 3;
  const tracks = [
    [['#00d4ff', 0, third, 'AD'], ['#3dffa2', third, 2 * third, 'DATA'], ['#ffae5c', 2 * third, 1, 'DEAL']],
    [['#9b7bff', 0.05, 0.3], ['#9b7bff', 0.4, 0.62], ['#9b7bff', 0.72, 0.95]],
    [['#5a6b80', 0, 1]],
  ];
  const X0 = 60, TW = w - 80;
  tracks.forEach((clips, r) => {
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.font = `400 13px ${FONT}`;
    g.fillText(['V1', 'V2', 'A1'][r], 18, 40 + r * 28);
    clips.forEach(([col, s, e, label]) => {
      g.fillStyle = col;
      g.globalAlpha = 0.55;
      g.beginPath(); g.roundRect(X0 + s * TW, 26 + r * 28, (e - s) * TW - 3, 20, 5); g.fill();
      g.globalAlpha = 1;
      if (label) {
        g.fillStyle = '#04050c';
        g.font = `600 12px ${FONT}`;
        g.fillText(label, X0 + s * TW + 8, 41 + r * 28);
      }
    });
  });
  const px = X0 + (a / AD_LEN) * TW;
  g.fillStyle = '#fff';
  g.fillRect(px - 1, 4, 2, h - 8);
  g.beginPath(); g.moveTo(px - 7, 4); g.lineTo(px + 7, 4); g.lineTo(px, 13); g.fill();
}

export function create(theme, quality) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(0.85);
  group.add(rig);

  // Layar utama
  const screen = liveTexture(640, 360);
  const SW = 4.2, SH = (SW * 360) / 640;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.22, SH + 0.22, 0.12, 4, 0.08), theme.metal(0.35));
  frame.position.z = -0.07;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: screen.tex, color: theme.ink.clone().multiplyScalar(0.95) }));
  display.position.z = 0.001;
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(SW + 0.24, SH + 0.24)), new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, 2) }));
  edge.position.z = 0.002;
  rig.add(frame, display, edge);

  // Timeline editor
  const tl = liveTexture(640, 110);
  const timeline = new THREE.Mesh(new THREE.PlaneGeometry(SW, (SW * 110) / 640), new THREE.MeshBasicMaterial({ map: tl.tex, transparent: true, depthWrite: false }));
  timeline.position.set(0, -SH / 2 - 0.55, 0.25);
  timeline.rotation.x = -0.25;
  rig.add(timeline);

  // Batang grafik 3D yang tumbuh keluar dari layar (babak 2)
  const bars = new THREE.Group();
  bars.position.set(-0.4, -SH / 2 + 0.05, 0.75);
  rig.add(bars);
  const barGeo = new THREE.BoxGeometry(0.32, 1, 0.32).translate(0, 0.5, 0);
  const barEdges = new THREE.EdgesGeometry(barGeo);
  const barMat = new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon2, 0.35), transparent: true, opacity: 0.55, depthWrite: false });
  const barLine = new THREE.LineBasicMaterial({ color: theme.glow(theme.neon2, 2.2) });
  const HEIGHTS = [0.35, 0.55, 0.5, 0.95, 1.45];
  const barMeshes = HEIGHTS.map((_, i) => {
    const m = new THREE.Mesh(barGeo, barMat);
    m.add(new THREE.LineSegments(barEdges, barLine));
    m.position.x = i * 0.48;
    bars.add(m);
    return m;
  });
  // Panah naik melewati puncak batang
  const curve = new THREE.CatmullRomCurve3(HEIGHTS.map((y, i) => new THREE.Vector3(i * 0.48, y + 0.25, 0)).concat([new THREE.Vector3(4 * 0.48 + 0.4, 1.45 + 0.75, 0)]));
  const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.03, 8);
  const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon2, 3) }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 16), tube.material);
  bars.add(tube, head);

  // Koin yang menyembur saat cap DEAL jatuh (babak 3)
  const COINS = quality.low ? 24 : 48;
  const coins = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.022, 24),
    new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 1, roughness: 0.28, envMap: theme.envMap, envMapIntensity: 1.2 }),
    COINS,
  );
  coins.frustumCulled = false;
  rig.add(coins);
  const rand = rng(21);
  const coinSeeds = Array.from({ length: COINS }, () => ({
    v: new THREE.Vector3((rand() - 0.5) * 3.4, 1.8 + rand() * 1.8, 0.4 + rand() * 1.1),
    spin: new THREE.Vector3(rand() * 9, rand() * 9, rand() * 9),
    delay: rand() * 0.25,
  }));
  const o = new THREE.Object3D();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  // Pita film di belakang layar
  const strip = new THREE.Group();
  strip.position.set(1.4, 1.5, -3);
  strip.scale.setScalar(0.7);
  rig.add(strip);
  const frameGeo = new THREE.PlaneGeometry(1.7, 0.96);
  const stripGeo = new THREE.PlaneGeometry(1.86, 1.36);
  const stripMat = new THREE.MeshBasicMaterial({ color: theme.bg.clone().lerp(theme.ink, 0.06), side: THREE.DoubleSide });
  const holeGeo = new THREE.PlaneGeometry(0.09, 0.07);
  const holeMat = new THREE.MeshBasicMaterial({ color: theme.glow(theme.ink, 0.5) });
  const tints = [theme.neon, theme.neon2, theme.ink];
  const N = 7, STEP_A = 0.26, R = 6;
  const frames = Array.from({ length: N }, (_, i) => {
    const f = new THREE.Group();
    f.add(new THREE.Mesh(stripGeo, stripMat));
    const pic = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: theme.glow(tints[i % 3], 0.04) }));
    pic.position.z = 0.01;
    f.add(pic);
    const holes = new THREE.InstancedMesh(holeGeo, holeMat, 16);
    for (let k = 0; k < 16; k++) {
      o.position.set(-0.82 + (k % 8) * 0.235, k < 8 ? 0.6 : -0.6, 0.01);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      holes.setMatrixAt(k, o.matrix);
    }
    f.add(holes);
    strip.add(f);
    return f;
  });

  // Cahaya proyektor dari belakang
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 4, 48, 1, true),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: theme.glow(theme.neon, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uColor; varying vec2 vUv; void main(){ float a = pow(vUv.y, 2.0) * 0.18; gl_FragColor = vec4(uColor * a, a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.z = -2.2;
  rig.add(beam);

  const span = N * STEP_A;
  const tubeCount = tubeGeo.index.count;
  return {
    group,
    update(t, { mouse }) {
      const a = t % AD_LEN;
      drawAd(screen, a, t);
      screen.tex.needsUpdate = true;
      drawTimeline(tl, a);
      tl.tex.needsUpdate = true;

      // Babak 2: batang tumbuh berurutan, panah menyusul; menyusut di awal babak 3.
      const b = a - ACT;
      const shrink = 1 - ease((a - 2 * ACT) / 0.5);
      bars.visible = b > 0 && shrink > 0.01;
      if (bars.visible) {
        barMeshes.forEach((m, i) => { m.scale.y = Math.max(HEIGHTS[i] * back((b - 0.2 - i * 0.18) / 0.6) * shrink, 0.001); });
        const p = ease((b - 0.9) / 1.3) * shrink;
        tubeGeo.setDrawRange(0, Math.floor((p * tubeCount) / 3) * 3);
        head.visible = p > 0.02;
        curve.getPointAt(p, head.position);
        curve.getTangentAt(p, tangent);
        head.quaternion.setFromUnitVectors(up, tangent);
      }

      // Babak 3: koin menyembur dari layar mengikuti gravitasi.
      const c = a - 2 * ACT - STAMP;
      coins.visible = c > 0;
      if (coins.visible) {
        coinSeeds.forEach((s, i) => {
          const tau = Math.max(c - s.delay, 0);
          o.position.set(-0.34 + s.v.x * tau, s.v.y * tau - 2.6 * tau * tau, 0.3 + s.v.z * tau);
          o.rotation.set(s.spin.x * tau, s.spin.y * tau, s.spin.z * tau);
          o.scale.setScalar(tau > 0 ? 1 : 0);
          o.updateMatrix();
          coins.setMatrixAt(i, o.matrix);
        });
        coins.instanceMatrix.needsUpdate = true;
      }

      frames.forEach((f, i) => {
        const ang = ((i * STEP_A + t * 0.05) % span) - span / 2;
        f.position.set(Math.sin(ang) * R, 0, R - Math.cos(ang) * R);
        f.rotation.y = -ang;
      });
      rig.rotation.set(0.05 - mouse.y * 0.1, -0.38 + mouse.x * 0.22, 0);
      rig.position.y = Math.sin(t * 0.7) * 0.06;
    },
  };
}
