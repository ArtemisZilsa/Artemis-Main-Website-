import * as THREE from 'three';
import { smoothstep, moonMaterial, dotTexture, rng } from '../theme.js';
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

// Sel surya: kotak biru gelap dengan garis perak, sedikit gradien pantulan.
const cellTexture = () => canvasTex(512, 256, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0d2a5c'); bg.addColorStop(0.5, '#173f80'); bg.addColorStop(1, '#0a1f45');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(200,215,235,0.85)'; g.lineWidth = 3;
  for (let x = 0; x <= w; x += w / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y <= h; y += h / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = 'rgba(160,190,230,0.25)'; g.lineWidth = 1;
  for (let x = 0; x <= w; x += w / 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
});

// Foil emas berkerut (MLI): bercak terang-gelap acak, dipakai sebagai map + bumpMap.
const foilTexture = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#b0b0b0'; g.fillRect(0, 0, w, h);
  const rand = rng(31);
  for (let i = 0; i < 900; i++) {
    const x = rand() * w, y = rand() * h, r = 6 + rand() * 40;
    g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '255,255,255'},${0.05 + rand() * 0.12})`;
    g.beginPath();
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + rand(); g.lineTo(x + Math.cos(a) * r * (0.5 + rand()), y + Math.sin(a) * r * (0.5 + rand())); }
    g.fill();
  }
});

// Satelit detail: badan foil emas, dua sayap panel surya 3 segmen (berputar menghadap matahari),
// antena parabola, boom antena, kamera, pendorong + semburan RCS, lampu navigasi.
export function buildSatellite(theme) {
  const s = new THREE.Group();
  const env = { envMap: theme.envMap };
  const foil = foilTexture();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a443, metalness: 1, roughness: 0.32, map: foil, bumpMap: foil, bumpScale: 3, envMapIntensity: 1.1, ...env });
  const silver = theme.metal(0.28);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.8, roughness: 0.45, envMapIntensity: 0.5, ...env });
  const white = new THREE.MeshStandardMaterial({ color: 0xb8c0ca, metalness: 0.15, roughness: 0.65, side: THREE.DoubleSide, envMapIntensity: 0.6, ...env });

  // Badan + dek atas/bawah
  s.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1.1, 1), gold));
  for (const y of [0.58, -0.58]) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.06, 1.08), silver);
    deck.position.y = y;
    s.add(deck);
  }
  // Kamera / instrumen di depan
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.32, 32), dark);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0.18, 0.1, 0.66);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 32), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 1.2) }));
  glass.position.set(0.18, 0.1, 0.825);
  s.add(lens, glass);
  // Star tracker di dek atas
  for (const x of [-0.3, 0.3]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 16), dark);
    st.position.set(x, 0.7, -0.3);
    st.rotation.x = -0.5;
    s.add(st);
  }
  // Pendorong di bawah
  const nozzle = new THREE.CylinderGeometry(0.05, 0.11, 0.18, 20, 1, true);
  for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
    const n = new THREE.Mesh(nozzle, dark);
    n.position.set(x, -0.7, z);
    s.add(n);
  }
  // Antena parabola di atas boom
  const parabola = [];
  for (let i = 0; i <= 16; i++) { const r = (i / 16) * 0.55; parabola.push(new THREE.Vector2(r, r * r * 0.9)); }
  const dishG = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.LatheGeometry(parabola, 48), white);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), silver);
  feed.position.y = 0.15;
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 12), silver);
  horn.position.y = 0.32;
  horn.rotation.x = Math.PI;
  dishG.add(dish, feed, horn);
  dishG.position.set(-0.2, 1.05, 0.25);
  dishG.rotation.set(0.7, 0, 0.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), silver);
  mast.position.set(-0.2, 0.8, 0.12);
  mast.rotation.x = 0.35;
  s.add(dishG, mast);
  // Boom antena panjang + lampu merah
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), silver);
  boom.position.set(0.45, 1.1, -0.35);
  boom.rotation.z = -0.5;
  s.add(boom);

  // Sayap panel surya
  const cell = cellTexture();
  const cellMat = new THREE.MeshStandardMaterial({ map: cell, metalness: 0.55, roughness: 0.22, envMapIntensity: 1, emissive: 0x0a1a3a, ...env });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a929c, metalness: 0.6, roughness: 0.5, ...env });
  const panelGeo = new THREE.BoxGeometry(0.95, 0.03, 0.82);
  const panelEdges = new THREE.EdgesGeometry(panelGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xaab4c2 });
  const wings = [-1, 1].map((side) => {
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), silver);
    yoke.rotation.z = Math.PI / 2;
    yoke.position.x = side * 0.78;
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.14), dark);
    hinge.position.x = side * 1.05;
    s.add(yoke, hinge);
    const wing = new THREE.Group();
    wing.position.x = side * 1.1;
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(panelGeo, [frameMat, frameMat, cellMat, cellMat, frameMat, frameMat]);
      p.add(new THREE.LineSegments(panelEdges, edgeMat));
      p.position.x = side * (0.52 + k * 0.99);
      wing.add(p);
    }
    s.add(wing);
    return wing;
  });

  // Lampu navigasi + semburan pendorong (sprite bercahaya)
  const sprite = (color, size) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.setScalar(size);
    s.add(sp);
    return sp;
  };
  const red = sprite(theme.glow(new THREE.Color(0xff3355), 3), 0.25);
  red.position.set(0.82, 1.76, -0.35);
  const green = sprite(theme.glow(theme.neon2, 3), 0.22);
  green.position.set(-0.55, 0.6, 0.55);
  const puffs = [[-0.35, -0.35], [0.35, 0.35]].map(([x, z]) => {
    const p = sprite(theme.glow(theme.ink, 1.5), 0.5);
    p.position.set(x, -0.85, z);
    return p;
  });
  s.userData = { wings, red, green, puffs };
  return s;
}

const sunLocal = new THREE.Vector3();
// Animasi satelit: lampu berkedip, semburan RCS sesekali, panel berputar menghadap matahari.
function animateSatellite(sat, t, sunWorld) {
  const { wings, red, green, puffs } = sat.userData;
  red.visible = Math.sin(t * 5) > 0.6;
  green.visible = Math.sin(t * 5 + 2) > 0.6;
  puffs.forEach((p, i) => {
    const k = ((t + i * 1.7) % 3.4) / 0.35; // menyembur 0,35 dtk tiap 3,4 dtk
    p.visible = k < 1;
    p.material.opacity = 1 - k;
    p.scale.setScalar(0.3 + k * 0.6);
  });
  sat.worldToLocal(sunLocal.copy(sunWorld));
  const angle = Math.atan2(sunLocal.z, sunLocal.y);
  wings.forEach((w) => { w.rotation.x += (angle - w.rotation.x) * 0.05; });
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

  // --- Cahaya hangat dari matahari supaya foil emas & panel satelit berkilau
  const sunLight = new THREE.PointLight(theme.sun, 1.5, 40, 0);
  sunLight.position.copy(sun.position);
  group.add(sunLight);
  const sunWorld = new THREE.Vector3();

  // --- Satelit besar melayang di latar depan, satu kecil mengitari orbit proses, satu mengitari planet
  const hero = buildSatellite(theme);
  hero.scale.setScalar(0.5);
  group.add(hero);
  const sat = buildSatellite(theme);
  sat.scale.setScalar(0.2);
  rig.add(sat);
  const mini = buildSatellite(theme);
  mini.scale.setScalar(0.09);
  rig.add(mini);

  return {
    group,
    update(t, { local, mouse }) {
      const p = smoothstep(-0.9, 0.5, local);
      nodes.forEach((mat, k) => mat.color.copy(dim).lerp(lit, Math.min(Math.max(p * 4 - k, 0), 1)));
      arcGeo.setDrawRange(0, Math.max(2, Math.round(p * (ARC + 1))));

      sun.getWorldPosition(sunWorld);
      // Satelit besar: melayang pelan + berputar supaya semua sisinya terlihat; ikut parallax mouse.
      hero.position.set(0.6 + Math.sin(t * 0.21) * 0.4 - mouse.x * 0.6, 1.15 + Math.sin(t * 0.33) * 0.2 - mouse.y * 0.3, 5.6 + Math.sin(t * 0.17) * 0.5);
      hero.rotation.set(0.35 + Math.sin(t * 0.13) * 0.25, t * 0.12, 0.2 + Math.sin(t * 0.19) * 0.15);
      animateSatellite(hero, t, sunWorld);

      const a = t * 0.3;
      sat.position.set(Math.cos(a) * R, 0.35, Math.sin(a) * R);
      sat.rotation.set(0.2, -a, Math.sin(t) * 0.1);
      animateSatellite(sat, t, sunWorld);
      const b = t * 0.9;
      mini.position.set(Math.cos(b) * 1.7, Math.sin(b) * 0.35, Math.sin(b) * 1.7);
      mini.rotation.y = -b;
      animateSatellite(mini, t, sunWorld);

      planet.rotation.y = t * 0.1;
      halo.material.opacity = 0.85 + Math.sin(t * 1.3) * 0.15;
      rig.rotation.y = mouse.x * 0.25;
      rig.rotation.x = 0.5 - mouse.y * 0.1;
    },
  };
}
