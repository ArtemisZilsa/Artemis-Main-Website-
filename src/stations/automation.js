import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { smoothstep, rng } from '../theme.js';

// Alur automasi lengkap ala n8n, 5 kolom:
// sumber pesan → AI agent → sumber data → tindakan → laporan & notifikasi.
// Gelombang paket data berjalan kolom demi kolom; teks langkah di panel ikut menyala (activeItem = kolom aktif).
// Label tile diambil dari content/<bahasa>.json → sections[automation].nodes.

const COL_X = [-5.2, -2.6, 0, 2.6, 5.2];
// [id, kolom, y, ikon]
const NODES = [
  ['wa', 0, 1.7, 'chat'], ['form', 0, 0, 'form'], ['email', 0, -1.7, 'mail'],
  ['ai', 1, 0, 'spark'],
  ['sheets', 2, 1.7, 'table'], ['crm', 2, 0, 'user'], ['cal', 2, -1.7, 'calendar'],
  ['reply', 3, 1.7, 'send'], ['invoice', 3, 0, 'doc'], ['book', 3, -1.7, 'calendar'],
  ['report', 4, 0.9, 'chart'], ['notify', 4, -0.9, 'bell'],
];
const EDGES = [
  ['wa', 'ai'], ['form', 'ai'], ['email', 'ai'],
  ['ai', 'sheets'], ['ai', 'crm'], ['ai', 'cal'],
  ['sheets', 'reply'], ['sheets', 'invoice'], ['crm', 'reply'], ['crm', 'invoice'], ['crm', 'book'], ['cal', 'book'],
  ['reply', 'report'], ['invoice', 'report'], ['invoice', 'notify'], ['book', 'notify'], ['book', 'report'],
];
const DEFAULT_LABELS = {
  wa: ['WHATSAPP', ''], form: ['FORM', ''], email: ['EMAIL', ''], ai: ['AI AGENT', ''], sheets: ['SHEETS', ''], crm: ['CRM', ''],
  cal: ['CALENDAR', ''], reply: ['REPLY', ''], invoice: ['INVOICE', ''], book: ['BOOKING', ''], report: ['REPORT', ''], notify: ['NOTIFY', ''],
};

const STEP = 1.6; // detik per kolom: 0.8 proses + 0.8 kirim
const CYCLE = STEP * 5 + 1.2;
const TILE = { w: 2.05, h: 0.82, d: 0.2 };
const MONO = '"Share Tech Mono", "Noto Sans JP", ui-monospace, monospace';

function drawIcon(g, kind, x, y, s) {
  g.save();
  g.translate(x, y);
  g.lineWidth = 6;
  g.lineJoin = g.lineCap = 'round';
  g.strokeStyle = g.fillStyle = '#fff';
  g.beginPath();
  if (kind === 'chat') {
    g.roundRect(-s, -s * 0.7, s * 2, s * 1.3, 14);
    g.moveTo(-s * 0.4, s * 0.6); g.lineTo(-s * 0.7, s); g.lineTo(-s * 0.05, s * 0.6);
    g.stroke();
    for (const dx of [-0.45, 0, 0.45]) { g.beginPath(); g.arc(dx * s, -s * 0.05, 5, 0, Math.PI * 2); g.fill(); }
  } else if (kind === 'form') {
    g.roundRect(-s * 0.8, -s, s * 1.6, s * 2, 8);
    for (const f of [-0.45, 0.05]) { g.moveTo(-s * 0.5, f * s); g.lineTo(s * 0.5, f * s); }
    g.stroke();
    g.beginPath(); g.roundRect(-s * 0.5, s * 0.4, s, s * 0.35, 4); g.fill();
  } else if (kind === 'mail') {
    g.rect(-s, -s * 0.7, s * 2, s * 1.4);
    g.moveTo(-s, -s * 0.7); g.lineTo(0, s * 0.15); g.lineTo(s, -s * 0.7);
    g.stroke();
  } else if (kind === 'spark') {
    g.moveTo(0, -s); g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s);
    g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s); g.fill();
  } else if (kind === 'table') {
    g.rect(-s, -s * 0.75, s * 2, s * 1.5);
    for (const f of [-0.25, 0.25]) { g.moveTo(-s, f * s * 1.5); g.lineTo(s, f * s * 1.5); }
    g.moveTo(-s * 0.3, -s * 0.75); g.lineTo(-s * 0.3, s * 0.75);
    g.stroke();
  } else if (kind === 'user') {
    g.arc(0, -s * 0.35, s * 0.42, 0, Math.PI * 2);
    g.moveTo(-s * 0.85, s); g.quadraticCurveTo(-s * 0.85, s * 0.15, 0, s * 0.15); g.quadraticCurveTo(s * 0.85, s * 0.15, s * 0.85, s);
    g.stroke();
  } else if (kind === 'calendar') {
    g.roundRect(-s, -s * 0.75, s * 2, s * 1.65, 8);
    g.moveTo(-s, -s * 0.3); g.lineTo(s, -s * 0.3);
    g.moveTo(-s * 0.5, -s); g.lineTo(-s * 0.5, -s * 0.55);
    g.moveTo(s * 0.5, -s); g.lineTo(s * 0.5, -s * 0.55);
    g.stroke();
    g.beginPath(); g.moveTo(-s * 0.4, s * 0.3); g.lineTo(-s * 0.05, s * 0.6); g.lineTo(s * 0.5, 0); g.stroke();
  } else if (kind === 'send') {
    g.moveTo(-s, -s * 0.1); g.lineTo(s, -s * 0.8); g.lineTo(s * 0.3, s * 0.9); g.lineTo(0, s * 0.1); g.closePath();
    g.moveTo(0, s * 0.1); g.lineTo(s, -s * 0.8);
    g.stroke();
  } else if (kind === 'doc') {
    g.moveTo(-s * 0.75, -s); g.lineTo(s * 0.35, -s); g.lineTo(s * 0.75, -s * 0.6); g.lineTo(s * 0.75, s); g.lineTo(-s * 0.75, s); g.closePath();
    for (const f of [-0.35, 0.05, 0.45]) { g.moveTo(-s * 0.45, f * s); g.lineTo(s * 0.45, f * s); }
    g.stroke();
  } else if (kind === 'chart') {
    g.moveTo(-s, s); g.lineTo(s, s);
    g.stroke();
    [0.5, 0.9, 1.4].forEach((hgt, i) => g.fillRect(-s * 0.8 + i * s * 0.62, s - hgt * s, s * 0.4, hgt * s));
  } else if (kind === 'bell') {
    g.moveTo(-s * 0.8, s * 0.5); g.quadraticCurveTo(-s * 0.6, s * 0.3, -s * 0.6, -s * 0.1);
    g.quadraticCurveTo(-s * 0.6, -s * 0.85, 0, -s * 0.85); g.quadraticCurveTo(s * 0.6, -s * 0.85, s * 0.6, -s * 0.1);
    g.quadraticCurveTo(s * 0.6, s * 0.3, s * 0.8, s * 0.5); g.closePath();
    g.stroke();
    g.beginPath(); g.arc(0, s * 0.75, s * 0.18, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const run = (...args) => {
    draw(c.getContext('2d'), w, h, ...args);
    tex.needsUpdate = true;
  };
  run();
  document.fonts?.ready.then(() => run());
  return { tex, run };
}

// Muka tile: bingkai membulat, ikon, label. Warna (idle/aktif) diatur lewat material.color.
function faceTexture(label, sub, icon) {
  return canvasTexture(512, 204, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(6, 6, w - 12, h - 12, 32);
    g.stroke();
    drawIcon(g, icon, 88, h / 2, 36);
    g.fillStyle = '#fff';
    g.font = `400 38px ${MONO}`;
    g.fillText(label, 160, 94, w - 180);
    g.globalAlpha = 0.6;
    g.font = `400 25px ${MONO}`;
    g.fillText(sub, 160, 140, w - 180);
    g.globalAlpha = 1;
  }).tex;
}

export function create(theme, quality, section = {}) {
  const labels = { ...DEFAULT_LABELS, ...(section.nodes ?? {}) };
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(0.6);
  rig.position.x = 0.2;
  group.add(rig);

  const body = new THREE.MeshStandardMaterial({
    color: theme.moon.clone().lerp(theme.ink, 0.05), metalness: 0.7, roughness: 0.32, envMap: theme.envMap, envMapIntensity: 0.5,
  });
  const boxGeo = new RoundedBoxGeometry(TILE.w, TILE.h, TILE.d, 4, 0.11);
  const faceGeo = new THREE.PlaneGeometry(TILE.w * 0.98, TILE.h * 0.98);
  const ringGeo = new THREE.TorusGeometry(0.55, 0.012, 8, 96, Math.PI * 1.4);
  const idle = theme.glow(theme.ink, 0.5);
  const hot = theme.glow(theme.neon2, 2.4);
  const rand = rng(21);

  const nodes = new Map();
  for (const [id, col, y, icon] of NODES) {
    const n = new THREE.Group();
    const z = (rand() - 0.5) * 0.8;
    n.position.set(COL_X[col], y, z);
    if (id === 'ai') n.scale.setScalar(1.25);
    n.add(new THREE.Mesh(boxGeo, body));
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTexture(labels[id][0], labels[id][1], icon), color: idle.clone(), transparent: true, depthWrite: false });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = TILE.d / 2 + 0.002;
    n.add(face);
    const ringMat = new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(-TILE.w / 2 + 0.34, 0, TILE.d / 2 + 0.01);
    ring.scale.setScalar(0.6);
    n.add(ring);
    rig.add(n);
    nodes.set(id, { n, z, col, faceMat, ring, ringMat, heat: 0 });
  }

  // Inti AI: dua cincin yang mengorbit tile AI Agent.
  const aiNode = nodes.get('ai').n;
  const orbitMat = new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 2), transparent: true, opacity: 0.8 });
  const orbits = [0, 1].map((k) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(1.35 + k * 0.18, 0.008, 6, 128), orbitMat);
    aiNode.add(o);
    return o;
  });

  // Batang grafik 3D di atas tile laporan.
  const bars = [0.4, 0.75, 1.1].map((h, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1, 0.15), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 2) }));
    m.position.set(0.5 + i * 0.26, TILE.h / 2, 0);
    m.userData.h = h;
    nodes.get('report').n.add(m);
    return m;
  });

  // Jalur: dari sisi kanan tile ke sisi kiri tile berikutnya.
  const edges = EDGES.map(([a, b]) => {
    const A = nodes.get(a);
    const B = nodes.get(b);
    const from = A.n.position.clone().add(new THREE.Vector3((TILE.w / 2) * A.n.scale.x, 0, 0));
    const to = B.n.position.clone().add(new THREE.Vector3(-TILE.w / 2 * B.n.scale.x, 0, 0));
    const c1 = from.clone().add(new THREE.Vector3(0.7, 0, 0.2));
    const c2 = to.clone().add(new THREE.Vector3(-0.7, 0, 0.2));
    const curve = new THREE.CubicBezierCurve3(from, c1, c2, to);
    const mat = new THREE.MeshBasicMaterial({ color: idle.clone() });
    rig.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 6), mat));
    return { curve, mat, col: A.col, delay: rand() * 0.25, heat: 0 };
  });

  // Paket data: satu InstancedMesh untuk semua jalur (kepala + jejak).
  const TRAIL = 8;
  const packets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 10, 8), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon2, 4) }), edges.length * TRAIL);
  packets.frustumCulled = false;
  rig.add(packets);

  // Panel log eksekusi di bawah alur (seperti tab Executions di n8n).
  const order = NODES.map(([id]) => id);
  const log = canvasTexture(1024, 200, (g, w, h, step = -1) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(8,12,18,0.85)';
    g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill();
    g.strokeStyle = 'rgba(61,255,162,0.5)'; g.lineWidth = 2; g.stroke();
    g.font = `400 26px ${MONO}`;
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillText('EXECUTION LOG', 28, 40);
    const done = order.filter((id) => nodes.get(id).col <= step);
    done.slice(-4).forEach((id, i) => {
      const ms = 40 + ((id.length * 97) % 900);
      g.fillStyle = '#3dffa2';
      g.fillText('✓', 28, 80 + i * 32);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillText(`${labels[id][0]}`, 64, 80 + i * 32);
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillText(`${ms} ms`, 860, 80 + i * 32);
    });
  });
  const logPanel = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.17), new THREE.MeshBasicMaterial({ map: log.tex, transparent: true, depthWrite: false }));
  logPanel.position.set(0, -3.2, 0.3);
  rig.add(logPanel);

  const o = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  let lastT = null;
  let logStep = -2;

  const api = {
    group,
    activeItem: -1,
    update(t, { mouse, reduced }) {
      rig.rotation.set(-0.06 - mouse.y * 0.12, 0.42 + mouse.x * 0.2 + Math.sin(t * 0.2) * 0.04, 0);
      orbits[0].rotation.set(t * 0.9, t * 0.5, 0);
      orbits[1].rotation.set(-t * 0.6, 0.6, t * 0.7);
      if (reduced) { // tanpa animasi: seluruh alur menyala
        nodes.forEach((s) => s.faceMat.color.copy(hot));
        edges.forEach((e) => e.mat.color.copy(hot));
        bars.forEach((b) => { b.visible = true; b.scale.y = b.userData.h; b.position.y = TILE.h / 2 + b.userData.h / 2; });
        packets.visible = false;
        if (logStep !== 4) { logStep = 4; log.run(4); }
        api.activeItem = -1;
        return;
      }
      const dt = lastT === null ? 0 : Math.min(Math.max(t - lastT, 0), 0.1);
      lastT = t;
      const c = t % CYCLE;
      const colNow = Math.floor(c / STEP);       // kolom yang sedang aktif (0..4, 5 = jeda)
      const inCol = (c % STEP) / STEP;           // 0..0.5 proses, 0.5..1 kirim

      nodes.forEach((s) => {
        const working = s.col === colNow && inCol < 0.5;
        s.heat = working ? 1 : Math.max(0, s.heat - dt * 0.35);
        s.faceMat.color.copy(idle).lerp(hot, s.heat);
        const k = inCol / 0.5;
        s.ringMat.opacity = working ? Math.sin(k * Math.PI) : 0;
        s.ring.rotation.z = -t * 6;
        s.n.position.z = s.z + (working ? 0.15 * Math.sin(k * Math.PI) : 0);
      });

      edges.forEach((e, i) => {
        const moving = e.col === colNow && inCol >= 0.5;
        e.heat = moving ? 1 : Math.max(0, e.heat - dt * 0.5);
        e.mat.color.copy(idle).lerp(hot, e.heat * 0.8);
        const u0 = moving ? smoothstep(0.5 + e.delay * 0.5, 1, inCol) : -1;
        for (let j = 0; j < TRAIL; j++) {
          const u = u0 - j * 0.04;
          if (u0 < 0 || u < 0) {
            o.scale.setScalar(0);
          } else {
            e.curve.getPointAt(Math.min(u, 1), tmp);
            o.position.copy(tmp);
            o.scale.setScalar(1 - j / TRAIL);
          }
          o.updateMatrix();
          packets.setMatrixAt(i * TRAIL + j, o.matrix);
        }
      });
      packets.instanceMatrix.needsUpdate = true;

      const grow = smoothstep(STEP * 4, STEP * 4.8, c) * (1 - smoothstep(CYCLE - 0.5, CYCLE, c));
      bars.forEach((b, i) => {
        const h = Math.max(0.001, b.userData.h * smoothstep(i * 0.15, 1, grow));
        b.scale.y = h;
        b.position.y = TILE.h / 2 + h / 2;
        b.visible = h > 0.02;
      });

      const step = Math.min(colNow, 4);
      if (step !== logStep) { logStep = step; log.run(colNow > 4 ? 4 : step); }
      api.activeItem = step;
    },
  };
  return api;
}
