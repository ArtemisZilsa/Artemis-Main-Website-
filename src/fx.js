import * as THREE from 'three';
import { dotTexture } from './theme.js';

// Partikel bercahaya dengan ukuran & warna per titik (dipakai bara api, helix, debu).
// size dalam unit dunia; scale = piksel per unit pada jarak 1 (≈ tinggi layar / 2 / tan(fov/2)).
export function glowPointsMaterial(scale) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTexture() }, uScale: { value: scale } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute vec3 aColor; varying vec3 vColor; uniform float uScale;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying vec3 vColor;
      void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vColor * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Warna bara menurut umur 0..1: putih panas → oranye → merah → padam.
const RAMP = [
  [0, new THREE.Color(4, 3.4, 2.2)],
  [0.15, new THREE.Color(3, 1.3, 0.3)],
  [0.45, new THREE.Color(1.4, 0.32, 0.06)],
  [1, new THREE.Color(0, 0, 0)],
];
function ramp(r, out) {
  for (let i = 1; i < RAMP.length; i++) {
    if (r <= RAMP[i][0]) return out.copy(RAMP[i - 1][1]).lerp(RAMP[i][1], (r - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]));
  }
  return out.copy(RAMP.at(-1)[1]);
}

// Bara api: simulasi sederhana di CPU (ring buffer). emit() lalu update(dt) tiap frame.
export function createEmbers(count, scale) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const vel = new Float32Array(count * 3);
  const age = new Float32Array(count).fill(1);
  const life = new Float32Array(count).fill(1);
  const big = new Uint8Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const points = new THREE.Points(geo, glowPointsMaterial(scale));
  points.frustumCulled = false;
  let next = 0;
  const c = new THREE.Color();
  return {
    points,
    // n partikel di titik p, arah dasar dir (unit/dtk), sebaran spread.
    emit(p, dir, n, spread = 1) {
      for (let k = 0; k < n; k++) {
        const i = next;
        next = (next + 1) % count;
        const flame = Math.random() < 0.3;
        big[i] = flame ? 1 : 0;
        pos.set([p.x, p.y, p.z], i * 3);
        const s = (flame ? 0.4 : 1) * spread;
        vel.set([
          dir.x * (0.5 + Math.random()) + (Math.random() - 0.5) * 2 * s,
          dir.y * (0.5 + Math.random()) + (Math.random() - 0.5) * 2 * s,
          dir.z * (0.5 + Math.random()) + (Math.random() - 0.5) * 2 * s,
        ], i * 3);
        age[i] = 0;
        life[i] = flame ? 0.35 + Math.random() * 0.4 : 0.6 + Math.random() * 1.1;
      }
    },
    update(dt) {
      const drag = Math.exp(-dt * 1.6);
      for (let i = 0; i < count; i++) {
        if (age[i] >= life[i]) { size[i] = 0; continue; }
        age[i] += dt;
        const j = i * 3;
        vel[j] *= drag; vel[j + 1] = vel[j + 1] * drag + dt * 0.9; vel[j + 2] *= drag; // naik pelan seperti panas
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
        const r = Math.min(age[i] / life[i], 1);
        ramp(r, c);
        col[j] = c.r; col[j + 1] = c.g; col[j + 2] = c.b;
        size[i] = big[i] ? 0.35 + r * 0.6 : 0.09 * (1 - r * 0.5);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
    },
  };
}

// Piksel per unit dunia pada jarak 1 untuk kamera fov 40° (dipakai uScale).
export const pointScale = (dpr) => (innerHeight * dpr) / 2 / Math.tan((40 * Math.PI) / 360);
