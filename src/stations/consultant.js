import * as THREE from 'three';
import { dotTexture, rng, smoothstep } from '../theme.js';

// Kaca pembesar yang menyisir peta data bisnis: titik di bawah lensa membesar dan menyala,
// lalu lensa berhenti di satu temuan (titik hijau + kartu insight). Siklus 7 detik.

const CYCLE = 7;
const BOARD = { w: 7, h: 4 };

function insightTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(8,12,18,0.9)';
  g.beginPath(); g.roundRect(2, 2, 252, 124, 18); g.fill();
  g.strokeStyle = '#3dffa2'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#3dffa2';
  g.beginPath(); g.arc(46, 64, 24, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#04050c'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(34, 64); g.lineTo(43, 74); g.lineTo(59, 54); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(88, 44, 130, 12);
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(88, 70, 96, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function create(theme, quality) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(1);
  group.add(rig);
  const rand = rng(33);

  // --- Peta data: kluster titik, grid tipis, kartu dokumen
  const clusters = Array.from({ length: 5 }, () => new THREE.Vector2((rand() - 0.5) * BOARD.w * 0.8, (rand() - 0.5) * BOARD.h * 0.75));
  const pos = [];
  const size = [];
  for (let i = 0; i < 420; i++) {
    const near = i < 300;
    const c = clusters[i % clusters.length];
    const r = near ? Math.sqrt(-2 * Math.log(rand() + 1e-6)) * 0.35 : 0;
    const a = rand() * Math.PI * 2;
    const x = near ? c.x + Math.cos(a) * r : (rand() - 0.5) * BOARD.w;
    const y = near ? c.y + Math.sin(a) * r : (rand() - 0.5) * BOARD.h;
    pos.push(Math.max(-BOARD.w / 2, Math.min(BOARD.w / 2, x)), Math.max(-BOARD.h / 2, Math.min(BOARD.h / 2, y)), 0);
    size.push(0.6 + rand() * 0.9);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  const uniforms = {
    uLens: { value: new THREE.Vector2() },
    uTarget: { value: new THREE.Vector2() },
    uFound: { value: 0 },
    uR: { value: 0.75 },
    uScale: { value: 70 * quality.dpr },
    uMap: { value: dotTexture() },
    uDim: { value: theme.glow(theme.ink, 0.45) },
    uHot: { value: theme.glow(theme.neon, 2.2) },
    uFind: { value: theme.glow(theme.neon2, 3) },
  };
  rig.add(new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aSize; uniform vec2 uLens; uniform vec2 uTarget; uniform float uFound; uniform float uR; uniform float uScale;
      varying float vM; varying float vT;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vM = smoothstep(uR, uR * 0.5, distance(position.xy, uLens));
        vT = uFound * smoothstep(0.32, 0.0, distance(position.xy, uTarget));
        gl_PointSize = aSize * (1.0 + 1.9 * vM + 1.5 * vT) * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uDim; uniform vec3 uHot; uniform vec3 uFind; varying float vM; varying float vT;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        vec3 col = mix(mix(uDim, uHot, vM), uFind, vT);
        gl_FragColor = vec4(col, a * (0.5 + 0.5 * max(vM, vT)));
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })));

  const grid = [];
  for (let x = -BOARD.w / 2; x <= BOARD.w / 2 + 1e-6; x += 0.5) grid.push(x, -BOARD.h / 2, 0, x, BOARD.h / 2, 0);
  for (let y = -BOARD.h / 2; y <= BOARD.h / 2 + 1e-6; y += 0.5) grid.push(-BOARD.w / 2, y, 0, BOARD.w / 2, y, 0);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  rig.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: theme.neon, transparent: true, opacity: 0.07 })));

  // Garis penghubung antar kluster (relasi data)
  const links = [];
  clusters.forEach((a, i) => { const b = clusters[(i + 2) % clusters.length]; links.push(a.x, a.y, 0, b.x, b.y, 0); });
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(links, 3));
  rig.add(new THREE.LineSegments(linkGeo, new THREE.LineBasicMaterial({ color: theme.ink, transparent: true, opacity: 0.12 })));

  // Kartu dokumen kecil
  const docGeo = new THREE.BufferGeometry();
  const doc = [];
  for (let i = 0; i < 6; i++) {
    const x = (rand() - 0.5) * (BOARD.w - 1), y = (rand() - 0.5) * (BOARD.h - 0.8), w = 0.7, h = 0.45;
    doc.push(x, y, 0, x + w, y, 0, x + w, y, 0, x + w, y + h, 0, x + w, y + h, 0, x, y + h, 0, x, y + h, 0, x, y, 0);
    for (const f of [0.3, 0.55, 0.75]) doc.push(x + 0.1, y + h * f, 0, x + w * (f === 0.75 ? 0.45 : 0.85), y + h * f, 0);
  }
  docGeo.setAttribute('position', new THREE.Float32BufferAttribute(doc, 3));
  rig.add(new THREE.LineSegments(docGeo, new THREE.LineBasicMaterial({ color: theme.ink, transparent: true, opacity: 0.22 })));

  // --- Kaca pembesar
  const mag = new THREE.Group();
  const R = 0.8;
  mag.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 18, 96), theme.metal(0.25)));
  mag.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.08, 0.01, 8, 96), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 3) })));
  mag.add(new THREE.Mesh(new THREE.CircleGeometry(R - 0.07, 64), new THREE.ShaderMaterial({
    uniforms: { uTint: { value: theme.glow(theme.neon, 0.8) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform vec3 uTint; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float hl = smoothstep(0.22, 0.0, distance(vUv, vec2(0.33, 0.7)));
        float a = 0.05 + 0.3 * pow(r, 4.0) + hl * 0.35;
        gl_FragColor = vec4(uTint * pow(r, 3.0) + vec3(hl), a);
      }`,
    transparent: true, depthWrite: false,
  })));
  const dir = new THREE.Vector2(Math.SQRT1_2, -Math.SQRT1_2);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16), theme.metal(0.3));
  handle.position.set(dir.x * (R + 0.35), dir.y * (R + 0.35), 0);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.9, 20), new THREE.MeshStandardMaterial({ color: theme.moon, metalness: 0.4, roughness: 0.5, envMap: theme.envMap, envMapIntensity: 0.4 }));
  grip.position.set(dir.x * (R + 1.1), dir.y * (R + 1.1), 0);
  handle.rotation.z = grip.rotation.z = -3 * Math.PI / 4;
  mag.add(handle, grip);
  mag.position.z = 0.9;
  rig.add(mag);

  // --- Temuan: cincin denyut + kartu insight
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon2, 3), transparent: true }));
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshBasicMaterial({ map: insightTexture(), transparent: true, depthWrite: false }));
  rig.add(pulse, card);

  const search = new THREE.Vector2();
  return {
    group,
    update(t, { mouse }) {
      const c = t % CYCLE;
      const target = clusters[Math.floor(t / CYCLE) % 3];
      search.set(Math.sin(t * 0.9) * BOARD.w * 0.36, Math.sin(t * 1.3 + 0.5) * BOARD.h * 0.32);
      const k = smoothstep(4.2, 5.0, c) * (1 - smoothstep(6.5, CYCLE, c));
      const lens = search.clone().lerp(target, k);
      mag.position.x = lens.x;
      mag.position.y = lens.y;
      mag.rotation.set(Math.sin(t * 0.7) * 0.12, Math.cos(t * 0.6) * 0.15, Math.sin(t * 0.5) * 0.08);
      uniforms.uLens.value.copy(lens);
      uniforms.uTarget.value.copy(target);
      const found = smoothstep(4.9, 5.3, c) * (1 - smoothstep(6.5, CYCLE, c));
      uniforms.uFound.value = found;

      pulse.position.set(target.x, target.y, 0.05);
      pulse.scale.setScalar(1 + ((t * 1.5) % 1) * 1.2);
      pulse.material.opacity = found * (1 - ((t * 1.5) % 1));
      card.position.set(target.x + 1.25, target.y + 0.75, 1.2);
      card.material.opacity = found;
      card.visible = found > 0.01;

      rig.rotation.set(-0.12 - mouse.y * 0.1, 0.35 + mouse.x * 0.2, 0);
    },
  };
}
