import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Studio iklan: layar utama memutar iklan motion graphic (digambar ulang tiap frame),
// timeline editor dengan playhead di bawahnya, dan pita film + cahaya proyektor di belakang.

const AD_LEN = 6; // detik per putaran iklan
const FONT = 'Sora, "Noto Sans JP", sans-serif';
const ease = (x) => 1 - (1 - Math.min(Math.max(x, 0), 1)) ** 3;

function liveTexture(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, g: c.getContext('2d'), w, h };
}

// Satu frame iklan pada waktu a (0..AD_LEN).
function drawAd({ g, w, h }, a, t) {
  const hue = 250 + Math.sin(t * 0.3) * 20;
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, `hsl(${hue}, 55%, 9%)`);
  bg.addColorStop(1, `hsl(${hue - 60}, 70%, 14%)`);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  // Lingkaran yang mengembang dari produk
  const cx = w * 0.68, cy = h * 0.52;
  for (let k = 0; k < 4; k++) {
    const r = ((a * 90 + k * 70) % 280);
    g.strokeStyle = `rgba(0,212,255,${0.5 * (1 - r / 280)})`;
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  }
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 170);
  glow.addColorStop(0, 'rgba(61,255,162,0.35)');
  glow.addColorStop(1, 'rgba(61,255,162,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  // Produk (botol) melayang, dengan kilau yang menyapu
  const float = Math.sin(t * 1.6) * 8;
  g.save();
  g.translate(cx, cy + float);
  g.rotate(Math.sin(t * 0.8) * 0.06);
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
  const sweep = ((a * 0.8) % 1) * 260 - 130;
  g.globalCompositeOperation = 'lighter';
  const sh = g.createLinearGradient(sweep - 30, 0, sweep + 30, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh;
  g.beginPath(); g.roundRect(-58, -70, 116, 170, 26); g.fill();
  g.restore();
  g.globalCompositeOperation = 'source-over';
  g.textAlign = 'left';

  // Konfeti berputar
  for (let i = 0; i < 18; i++) {
    const px = ((i * 137 + a * 60) % w);
    const py = ((i * 71 + a * (40 + i * 6)) % h);
    g.save();
    g.translate(px, py);
    g.rotate(a * 3 + i);
    g.fillStyle = i % 2 ? 'rgba(0,212,255,0.8)' : 'rgba(61,255,162,0.8)';
    g.fillRect(-4, -2, 8, 4);
    g.restore();
  }

  // Teks kinetik: NEW masuk dari kiri, COLLECTION diketik huruf demi huruf
  const inX = 48 - (1 - ease(a / 0.8)) * 300;
  g.fillStyle = '#fff';
  g.font = `700 88px ${FONT}`;
  g.fillText('NEW', inX, h * 0.42);
  const word = 'COLLECTION';
  const shown = Math.floor(Math.min(1, Math.max(0, (a - 0.8) / 1.4)) * word.length);
  g.font = `600 36px ${FONT}`;
  g.fillStyle = '#00d4ff';
  g.fillText(word.slice(0, shown), 52, h * 0.42 + 48);
  g.globalAlpha = ease((a - 2.4) / 0.6);
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.font = `400 20px ${FONT}`;
  g.fillText('Limited drop · 2026', 52, h * 0.42 + 84);
  g.fillStyle = '#3dffa2';
  g.beginPath(); g.roundRect(52, h * 0.42 + 104, 132, 38, 19); g.fill();
  g.fillStyle = '#04050c';
  g.font = `600 16px ${FONT}`;
  g.fillText('SHOP NOW', 76, h * 0.42 + 129);
  g.globalAlpha = 1;

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
  const tracks = [
    [['#00d4ff', 0, 0.35], ['#00d4ff', 0.38, 0.8]],
    [['#3dffa2', 0.1, 0.55], ['#3dffa2', 0.6, 1]],
    [['#9b7bff', 0, 1]],
  ];
  const X0 = 60, TW = w - 80;
  tracks.forEach((clips, r) => {
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.font = `400 13px ${FONT}`;
    g.fillText(['V1', 'V2', 'A1'][r], 18, 40 + r * 28);
    clips.forEach(([col, s, e]) => {
      g.fillStyle = col;
      g.globalAlpha = 0.55;
      g.beginPath(); g.roundRect(X0 + s * TW, 26 + r * 28, (e - s) * TW - 3, 20, 5); g.fill();
      g.globalAlpha = 1;
    });
  });
  const px = X0 + (a / AD_LEN) * TW;
  g.fillStyle = '#fff';
  g.fillRect(px - 1, 4, 2, h - 8);
  g.beginPath(); g.moveTo(px - 7, 4); g.lineTo(px + 7, 4); g.lineTo(px, 13); g.fill();
}

export function create(theme) {
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
    const o = new THREE.Object3D();
    for (let k = 0; k < 16; k++) {
      o.position.set(-0.82 + (k % 8) * 0.235, k < 8 ? 0.6 : -0.6, 0.01);
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
  return {
    group,
    update(t, { mouse }) {
      const a = t % AD_LEN;
      drawAd(screen, a, t);
      screen.tex.needsUpdate = true;
      drawTimeline(tl, a);
      tl.tex.needsUpdate = true;
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
