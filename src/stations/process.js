import * as THREE from 'three';
import { smoothstep, moonMaterial, dotTexture } from '../theme.js';
import { fresnelMaterial } from './hero.js';

// Tata surya kecil: empat titik proses di orbit (menyala satu per satu saat scroll),
// planet bercincin di tengah, satelit yang mengitari orbit, matahari dramatis dan planet jauh.

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Pita warna planet gas
const bandTexture = () => canvasTex(512, 256, (g, w, h) => {
  const cols = ['#c9d6e3', '#8fa6bd', '#e6eef5', '#6d8aa6', '#b5c7d8', '#41617f', '#d4e1ec'];
  let y = 0;
  let i = 0;
  while (y < h) {
    const bh = 10 + ((i * 37) % 30);
    g.fillStyle = cols[i % cols.length];
    g.fillRect(0, y, w, bh);
    y += bh;
    i++;
  }
  g.globalAlpha = 0.15;
  for (let k = 0; k < 400; k++) { g.fillStyle = k % 2 ? '#000' : '#fff'; g.fillRect((k * 53) % w, (k * 29) % h, 30, 2); }
});

// Cincin planet: lingkaran konsentris (UV RingGeometry planar → digambar melingkar)
const ringTexture = () => canvasTex(512, 512, (g, w) => {
  const c = w / 2;
  for (let r = 0; r < c; r += 3) {
    const t = r / c;
    if (t < 0.62) continue;
    g.strokeStyle = `rgba(220,235,255,${(0.25 + 0.35 * Math.abs(Math.sin(r * 0.21))) * (1 - Math.abs(t - 0.8) * 2.5)})`;
    g.lineWidth = 3;
    g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke();
  }
});

const panelTexture = () => canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#0b2440'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,212,255,0.7)'; g.lineWidth = 2;
  for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y <= h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
});

export function buildSatellite(theme, panelTex) {
  const s = new THREE.Group();
  const metal = theme.metal(0.3);
  s.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.24), metal));
  const pm = new THREE.MeshBasicMaterial({ map: panelTex, color: theme.glow(theme.ink, 0.9), side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), metal);
    arm.rotation.z = Math.PI / 2;
    arm.position.x = side * 0.29;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), pm);
    panel.position.x = side * 0.8;
    s.add(arm, panel);
  }
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.1, 20, 1, true), metal);
  dish.position.y = 0.2;
  dish.rotation.x = Math.PI;
  const blink = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon2, 5) }));
  blink.position.set(0, 0.27, 0);
  s.add(dish, blink);
  s.userData.blink = blink;
  return s;
}

export function create(theme) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.rotation.x = 0.5;
  group.add(rig);

  // --- Matahari di kejauhan (kanan-belakang)
  const sun = new THREE.Group();
  sun.position.set(8, 3.4, -13);
  sun.add(new THREE.Mesh(new THREE.SphereGeometry(2.3, 48, 32), new THREE.MeshBasicMaterial({ color: theme.glow(theme.sun, 2.2) })));
  sun.add(new THREE.Mesh(new THREE.SphereGeometry(2.3 * 1.35, 48, 32), fresnelMaterial(theme.glow(theme.sun, 1.8))));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: theme.glow(theme.sun, 0.8), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.setScalar(16);
  sun.add(halo);
  group.add(sun);

  // --- Planet jauh
  const far1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), moonMaterial(theme));
  far1.position.set(-7, 2.6, -9);
  const far2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 24), moonMaterial(theme));
  far2.material = far2.material.clone();
  far2.material.color = theme.neon2.clone().lerp(theme.ink, 0.5);
  far2.position.set(5.5, -2.4, -6);
  group.add(far1, far2);

  // --- Orbit proses
  const R = 3.8;
  const ring = (from, to, n) => Array.from({ length: n + 1 }, (_, i) => {
    const a = from + (to - from) * (i / n);
    return new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
  });
  rig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring(0, Math.PI * 2, 160)),
    new THREE.LineBasicMaterial({ color: theme.ink, transparent: true, opacity: 0.25 })));
  const ARC = 120;
  const arcGeo = new THREE.BufferGeometry().setFromPoints(ring(Math.PI, 0, ARC));
  rig.add(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, 3) })));

  // --- Planet bercincin di tengah
  const planet = new THREE.Group();
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 48), new THREE.MeshLambertMaterial({ map: bandTexture(), reflectivity: 0 })));
  const pRing = new THREE.Mesh(new THREE.RingGeometry(1.35, 2.25, 128), new THREE.MeshBasicMaterial({
    map: ringTexture(), color: theme.glow(theme.ink, 0.55), transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false,
  }));
  pRing.rotation.x = -Math.PI / 2 + 0.35;
  planet.add(pRing);
  planet.rotation.z = 0.25;
  rig.add(planet);

  // --- Titik proses
  const angles = [Math.PI * 0.92, Math.PI * 0.64, Math.PI * 0.36, Math.PI * 0.08];
  const dim = theme.glow(theme.ink, 0.35);
  const lit = theme.glow(theme.neon, 3);
  const nodes = angles.map((a) => {
    const mat = new THREE.MeshBasicMaterial({ color: dim.clone() });
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), mat);
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.01, 8, 48), mat);
    halo2.rotation.x = Math.PI / 2;
    n.add(halo2);
    n.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    rig.add(n);
    return mat;
  });

  // --- Satelit: satu mengitari orbit proses, satu kecil mengitari planet
  const panelTex = panelTexture();
  const sat = buildSatellite(theme, panelTex);
  sat.scale.setScalar(0.9);
  rig.add(sat);
  const mini = buildSatellite(theme, panelTex);
  mini.scale.setScalar(0.35);
  rig.add(mini);

  return {
    group,
    update(t, { local, mouse }) {
      const p = smoothstep(-0.9, 0.5, local);
      nodes.forEach((mat, k) => mat.color.copy(dim).lerp(lit, Math.min(Math.max(p * 4 - k, 0), 1)));
      arcGeo.setDrawRange(0, Math.max(2, Math.round(p * (ARC + 1))));

      const a = t * 0.3;
      sat.position.set(Math.cos(a) * R, 0.35, Math.sin(a) * R);
      sat.rotation.set(0.2, -a, Math.sin(t) * 0.1);
      sat.userData.blink.visible = Math.sin(t * 6) > 0;
      const b = t * 0.9;
      mini.position.set(Math.cos(b) * 1.7, Math.sin(b) * 0.35, Math.sin(b) * 1.7);
      mini.rotation.y = -b;
      mini.userData.blink.visible = Math.sin(t * 8) > 0;

      planet.rotation.y = t * 0.1;
      halo.material.opacity = 0.85 + Math.sin(t * 1.3) * 0.15;
      rig.rotation.y = mouse.x * 0.25;
      rig.rotation.x = 0.5 - mouse.y * 0.1;
    },
  };
}
