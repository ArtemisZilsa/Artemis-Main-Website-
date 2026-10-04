import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Artemis Folio: ponsel menampilkan profil Instagram, ikon media sosial mengorbit,
// hati melayang naik, dan cetak biru website "sedang dibangun" di belakang.

const FONT = 'Sora, "Noto Sans JP", sans-serif';
const IG = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const run = () => { draw(c.getContext('2d'), w, h); tex.needsUpdate = true; };
  run();
  document.fonts?.ready.then(run);
  return tex;
}

function igGradient(g, x, y, w, h) {
  const gr = g.createLinearGradient(x, y + h, x + w, y);
  IG.forEach((c, i) => gr.addColorStop(i / (IG.length - 1), c));
  return gr;
}

// Layar profil ala Instagram
const profileTexture = () => canvasTex(400, 820, (g, w, h) => {
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.font = `600 16px ${FONT}`;
  g.fillText('9:41', 26, 30);
  g.font = `700 22px ${FONT}`;
  g.fillText('artemis.folio', 24, 78);
  // avatar dengan cincin gradien
  g.lineWidth = 5;
  g.strokeStyle = igGradient(g, 26, 100, 96, 96);
  g.beginPath(); g.arc(74, 150, 44, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#0b0f18';
  g.beginPath(); g.arc(74, 150, 38, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#dfe7f0';
  g.beginPath(); g.arc(74, 150, 24, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0b0f18';
  g.beginPath(); g.arc(84, 144, 22, 0, Math.PI * 2); g.fill();
  // statistik
  [['128', 'posts'], ['12.4K', 'followers'], ['312', 'following']].forEach(([n, l], i) => {
    const x = 160 + i * 80;
    g.fillStyle = '#fff'; g.font = `700 20px ${FONT}`; g.textAlign = 'center'; g.fillText(n, x, 146);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = `400 13px ${FONT}`; g.fillText(l, x, 168);
  });
  g.textAlign = 'left';
  g.fillStyle = '#fff'; g.font = `600 17px ${FONT}`; g.fillText('Artemis Studio', 24, 228);
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(24, 242, 250, 9); g.fillRect(24, 260, 190, 9);
  g.fillStyle = '#00a8e8'; g.beginPath(); g.roundRect(24, 284, 170, 36, 8); g.fill();
  g.fillStyle = '#262a33'; g.beginPath(); g.roundRect(204, 284, 172, 36, 8); g.fill();
  g.fillStyle = '#fff'; g.font = `600 15px ${FONT}`; g.fillText('Follow', 84, 308); g.fillText('Message', 258, 308);
  // highlight
  for (let i = 0; i < 4; i++) {
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.arc(56 + i * 84, 372, 28, 0, Math.PI * 2); g.stroke();
    g.fillStyle = ['#00d4ff', '#3dffa2', '#9b7bff', '#ffae5c'][i];
    g.globalAlpha = 0.6; g.beginPath(); g.arc(56 + i * 84, 372, 22, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  }
  // grid postingan 3x3
  const cell = (w - 4) / 3;
  const pal = [['#0b0420', '#00d4ff'], ['#2b1055', '#ffaf7b'], ['#020617', '#3dffa2'], ['#03203c', '#7ee8fa'], ['#1a0b2e', '#d76d77'], ['#0b0420', '#9b7bff'], ['#0f3d3e', '#3dffa2'], ['#2b1055', '#fa7e1e'], ['#03203c', '#00d4ff']];
  pal.forEach(([a, b], i) => {
    const x = (i % 3) * (cell + 2), y = 418 + Math.floor(i / 3) * (cell + 2);
    const gr = g.createLinearGradient(x, y, x + cell, y + cell);
    gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.fillRect(x, y, cell, cell);
    g.fillStyle = 'rgba(255,255,255,0.75)';
    if (i % 3 === 0) { g.beginPath(); g.arc(x + cell * 0.6, y + cell * 0.45, cell * 0.18, 0, Math.PI * 2); g.fill(); }
    else if (i % 3 === 1) { g.beginPath(); g.moveTo(x, y + cell); g.lineTo(x + cell * 0.4, y + cell * 0.5); g.lineTo(x + cell * 0.75, y + cell); g.fill(); }
    else { g.fillRect(x + cell * 0.25, y + cell * 0.3, cell * 0.5, cell * 0.4); }
  });
  // navigasi bawah
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.roundRect(34 + i * 76, h - 44, 22, 22, 6); g.fill(); }
});

// Ikon media sosial sebagai sprite (selalu menghadap kamera)
function iconTexture(kind) {
  return canvasTex(160, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const c = w / 2;
    if (kind === 'ig') {
      g.fillStyle = igGradient(g, 10, 10, 140, 140);
      g.beginPath(); g.roundRect(14, 14, 132, 132, 36); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 9;
      g.beginPath(); g.roundRect(42, 42, 76, 76, 22); g.stroke();
      g.beginPath(); g.arc(c, c, 18, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(104, 56, 6, 0, Math.PI * 2); g.fill();
      return;
    }
    g.fillStyle = 'rgba(20,26,38,0.85)';
    g.beginPath(); g.arc(c, c, 66, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.stroke();
    g.lineWidth = 9; g.lineJoin = g.lineCap = 'round';
    if (kind === 'heart') {
      g.fillStyle = '#ff3b6b';
      g.beginPath(); g.moveTo(c, 112);
      g.bezierCurveTo(30, 80, 46, 40, c, 62); g.bezierCurveTo(114, 40, 130, 80, c, 112); g.fill();
    } else if (kind === 'comment') {
      g.strokeStyle = '#fff';
      g.beginPath(); g.arc(c, 76, 34, Math.PI * 0.75, Math.PI * 2.5); g.lineTo(46, 112); g.closePath(); g.stroke();
    } else if (kind === 'play') {
      g.fillStyle = '#ff2d2d'; g.beginPath(); g.roundRect(34, 50, 92, 62, 16); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(70, 64); g.lineTo(96, 81); g.lineTo(70, 98); g.fill();
    } else if (kind === 'share') {
      g.strokeStyle = '#00d4ff';
      g.beginPath(); g.moveTo(40, 78); g.lineTo(122, 44); g.lineTo(96, 120); g.lineTo(78, 88); g.closePath(); g.stroke();
    } else if (kind === 'at') {
      g.strokeStyle = '#3dffa2';
      g.beginPath(); g.arc(c, c, 18, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(c, c, 38, Math.PI * 0.1, Math.PI * 1.95); g.stroke();
    }
  });
}

const notifTexture = () => canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#ff3b6b';
  g.beginPath(); g.roundRect(4, 14, w - 8, h - 28, 34); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(54, 66);
  g.bezierCurveTo(30, 52, 38, 30, 54, 40); g.bezierCurveTo(70, 30, 78, 52, 54, 66); g.fill();
  g.font = `700 32px ${FONT}`;
  g.fillText('1.2K', 96, 60);
});

export function create(theme) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  // Cetak biru di belakang
  const bp = new THREE.Group();
  bp.position.set(-0.9, 0.5, -2.4);
  bp.scale.setScalar(0.68);
  const W = 4.2, H = 2.6;
  const frame = new THREE.PlaneGeometry(W, H);
  const glass = theme.glass(0.04);
  bp.add(new THREE.Mesh(frame, glass));
  bp.add(new THREE.LineSegments(new THREE.EdgesGeometry(frame), new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, 1.4) })));
  const grid = [];
  for (let x = -W / 2; x <= W / 2 + 1e-6; x += 0.3) grid.push(x, -H / 2, 0, x, H / 2, 0);
  for (let y = -H / 2; y <= H / 2 + 1e-6; y += 0.3) grid.push(-W / 2, y, 0, W / 2, y, 0);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  bp.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: theme.neon, transparent: true, opacity: 0.12 })));
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.02), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 3) }));
  scan.position.z = 0.01;
  bp.add(scan);
  rig.add(bp);

  // Ponsel
  const phone = new THREE.Group();
  const PW = 1.32, PH = 2.7;
  phone.add(new THREE.Mesh(new RoundedBoxGeometry(PW, PH, 0.1, 6, 0.16), theme.metal(0.3)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.1, PH - 0.12), new THREE.MeshBasicMaterial({ map: profileTexture(), color: theme.ink.clone().multiplyScalar(0.92) }));
  screen.position.z = 0.051;
  const island = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  island.rotation.z = Math.PI / 2;
  island.position.set(0, PH / 2 - 0.13, 0.053);
  phone.add(screen, island);
  phone.position.set(0.6, 0, 0.4);
  rig.add(phone);

  // Ikon sosial mengorbit
  const kinds = ['ig', 'heart', 'comment', 'play', 'share', 'at'];
  const icons = kinds.map((k, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(k), transparent: true, depthWrite: false }));
    s.scale.setScalar(k === 'ig' ? 0.7 : 0.5);
    s.userData.a = (i / kinds.length) * Math.PI * 2;
    rig.add(s);
    return s;
  });
  const notif = new THREE.Sprite(new THREE.SpriteMaterial({ map: notifTexture(), transparent: true, depthWrite: false }));
  notif.scale.set(0.9, 0.34, 1);
  rig.add(notif);

  // Hati kecil yang melayang naik dari ponsel
  const heartMat = new THREE.SpriteMaterial({ map: iconTexture('heart'), transparent: true, depthWrite: false });
  const hearts = Array.from({ length: 5 }, (_, i) => {
    const s = new THREE.Sprite(heartMat.clone());
    s.userData.o = i / 5;
    rig.add(s);
    return s;
  });

  return {
    group,
    update(t, { mouse }) {
      scan.position.y = ((t * 0.35) % 1) * H - H / 2;
      glass.uniforms.uTime.value = t;
      phone.rotation.set(Math.sin(t * 0.6) * 0.05, -0.35 + Math.sin(t * 0.4) * 0.12, 0.04);
      phone.position.y = Math.sin(t * 0.9) * 0.08;
      icons.forEach((s) => {
        const a = s.userData.a + t * 0.35;
        s.position.set(0.6 + Math.cos(a) * 2.1, Math.sin(a * 2) * 0.35 + Math.sin(a) * 0.9, 0.4 + Math.sin(a) * 1.2);
      });
      const pop = (t % 3) / 3;
      notif.position.set(1.7, 1.25 + pop * 0.2, 0.9);
      notif.material.opacity = Math.sin(Math.min(pop, 0.999) * Math.PI);
      notif.scale.set(0.9 * (0.8 + 0.2 * Math.min(1, pop * 4)), 0.34 * (0.8 + 0.2 * Math.min(1, pop * 4)), 1);
      hearts.forEach((s) => {
        const k = (t * 0.25 + s.userData.o) % 1;
        s.position.set(1.25 + Math.sin(k * 9 + s.userData.o * 6) * 0.15, -0.6 + k * 2.4, 0.6);
        s.scale.setScalar(0.18 + k * 0.12);
        s.material.opacity = Math.sin(k * Math.PI);
      });
      rig.rotation.set(-mouse.y * 0.1, 0.25 + mouse.x * 0.2, 0);
    },
  };
}
