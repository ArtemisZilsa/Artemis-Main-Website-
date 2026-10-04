import * as THREE from 'three';

// Warna 3D dibaca dari styles/tokens.css supaya tema cukup diganti di satu tempat.
export function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  const neonStrength = parseFloat(v('--neon-strength'));
  const strength = Number.isFinite(neonStrength) ? neonStrength : 1;
  const theme = {
    bg: new THREE.Color(v('--c-bg')),
    ink: new THREE.Color(v('--c-ink')),
    mute: new THREE.Color(v('--c-mute')),
    neon: new THREE.Color(v('--c-neon')),
    neon2: new THREE.Color(v('--c-neon-2')),
    moon: new THREE.Color(v('--c-moon')),
    sun: new THREE.Color(v('--c-sun') || '#ffae5c'),
    neonStrength: strength,
    // Warna > 1 akan "menyala" lewat bloom. k = seberapa terang.
    glow: (color, k = 2) => color.clone().multiplyScalar(k * strength),
    envMap: null, // diisi main.js; hanya logam yang memantulkan lingkungan
    metal: (roughness = 0.25) => new THREE.MeshStandardMaterial({
      color: theme.ink, metalness: 1, roughness, envMap: theme.envMap, envMapIntensity: 0.4,
    }),
    // Kaca: gradien lembut + tepi berkilau + kilau neon yang menyapu. Update uniforms.uTime tiap frame.
    glass: (opacity = 0.06) => new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uTint: { value: theme.ink }, uNeon: { value: theme.glow(theme.neon, 1.5) }, uOpacity: { value: opacity } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uTint; uniform vec3 uNeon; uniform float uOpacity; varying vec2 vUv;
        void main() {
          float grad = mix(0.55, 1.0, vUv.y) * (1.0 - 0.35 * vUv.x);
          vec2 e = min(vUv, 1.0 - vUv);
          float rim = smoothstep(0.05, 0.0, min(e.x, e.y));
          float band = fract(uTime * 0.09) * 3.0 - 1.0;
          float sweep = smoothstep(0.12, 0.0, abs(vUv.x + vUv.y * 0.6 - band));
          float a = clamp(grad * uOpacity + rim * 0.12 + sweep * 0.18, 0.0, 1.0);
          gl_FragColor = vec4(uTint * (grad * uOpacity + rim * 0.15) + uNeon * sweep * 0.25, a);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }),
  };
  return theme;
}

// Permukaan bulan prosedural (kawah + maria). Dipakai sebagai map dan bumpMap.
let moonTex;
export function moonTexture() {
  if (moonTex) return moonTex;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const rand = rng(11);
  g.fillStyle = '#a8a8a8';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 7; i++) { // maria: bercak gelap besar
    const x = rand() * c.width, y = 120 + rand() * 280, r = 60 + rand() * 120;
    const m = g.createRadialGradient(x, y, 0, x, y, r);
    m.addColorStop(0, 'rgba(0,0,0,0.28)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 320; i++) { // kawah: lubang gelap + bibir terang
    const x = rand() * c.width, y = rand() * c.height, r = 2 + rand() ** 3 * 34;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fill();
    g.beginPath(); g.arc(x - r * 0.15, y - r * 0.15, r, Math.PI * 0.9, Math.PI * 1.9);
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = Math.max(1, r * 0.18); g.stroke();
  }
  for (let i = 0; i < 9000; i++) { // butiran
    g.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    g.fillRect(rand() * c.width, rand() * c.height, 2, 2);
  }
  moonTex = new THREE.CanvasTexture(c);
  moonTex.colorSpace = THREE.SRGBColorSpace;
  return moonTex;
}

export function moonMaterial(theme) {
  const tex = moonTexture();
  return new THREE.MeshLambertMaterial({ color: theme.ink, map: tex, bumpMap: tex, bumpScale: 1.5, reflectivity: 0 });
}

let dot;
export function dotTexture() {
  if (dot) return dot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c);
  return dot;
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// Random deterministik: bentuk objek sama di setiap kunjungan.
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
