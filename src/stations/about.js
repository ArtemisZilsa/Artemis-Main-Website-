import * as THREE from 'three';
import { rng, dotTexture } from '../theme.js';
import { buildArrow, PLANTED } from './hero.js';
import { createEmbers, glowPointsMaterial, pointScale } from '../fx.js';

// "Di sinilah mimpimu dimulai": panah dari bulan menancap di pusat → ledakan partikel
// yang lalu tersusun menjadi pilar helix bercahaya (gaya Resn), dikelilingi jaringan titik (plexus).
// Pembentukan berjalan berbasis waktu sejak panah menancap, supaya tetap sinematik berapa pun kecepatan scroll.

const H = 8.5;       // tinggi helix
const FORM = 2.6;    // detik dari ledakan sampai helix utuh
const HIT = -0.2;    // local saat panah menancap (= hero HIT - 1)

function helixMaterial(theme, scale) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uForm: { value: 0 }, uScale: { value: scale }, uMap: { value: dotTexture() },
      uC0: { value: theme.glow(theme.neon, 1.6) }, uC1: { value: theme.glow(theme.neon2, 1.5) },
      uDust: { value: theme.glow(theme.ink, 0.5) }, uEmber: { value: theme.glow(theme.sun, 2.6) },
    },
    vertexShader: /* glsl */ `
      attribute float aU; attribute float aKind; attribute vec3 aSeed; attribute float aSize;
      uniform float uTime, uForm, uScale; uniform vec3 uC0, uC1, uDust, uEmber;
      varying vec3 vColor;
      const float TAU = 6.2831853;
      vec3 strand(float u, float side) {
        float ang = u * TAU * 2.2 + side * 3.14159 + uTime * 0.25;
        float r = 1.05 + 0.3 * sin(u * TAU * 1.3 + uTime * 0.6);
        return vec3(cos(ang) * r, (u - 0.5) * ${H.toFixed(1)}, sin(ang) * r);
      }
      void main() {
        vec3 helix;
        vec3 base;
        if (aKind < 1.5) {                 // dua untai helix, tiap untai = berkas serat
          helix = strand(aU, aKind) + aSeed * vec3(0.17, 0.08, 0.17);
          base = aKind < 0.5 ? uC0 : uC1;
        } else if (aKind < 2.5) {          // anak tangga antar untai
          float u = floor(aU * 26.0 + 0.5) / 26.0;
          helix = mix(strand(u, 0.0), strand(u, 1.0), aSeed.x * 0.5 + 0.5) + aSeed * 0.03;
          base = mix(uC0, uC1, aSeed.x * 0.5 + 0.5) * 0.7;
        } else {                           // debu yang mengorbit pelan
          float a = aSeed.x * 3.14159 + uTime * 0.08 * (0.6 + aSeed.z * 0.4);
          float r = 2.0 + abs(aSeed.y) * 2.8;
          helix = vec3(cos(a) * r, (aU - 0.5) * ${H.toFixed(1)} * 1.25, sin(a) * r);
          base = uDust;
        }
        if (aSeed.z > 0.88) base = uEmber;  // sisa bara di dalam helix
        // Ledakan dari pusat lalu tersusun dari bawah ke atas.
        float delay = aU * 0.35;
        float boom = smoothstep(0.0, 0.2, uForm);
        float settle = smoothstep(0.15 + delay * 0.6, 0.7 + delay * 0.6, uForm);
        vec3 burst = normalize(aSeed + vec3(0.001, 0.002, 0.0)) * (1.2 + length(aSeed) * 3.2);
        vec3 p = mix(burst * boom, helix, settle);
        float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + aSeed.x * 40.0);
        vColor = mix(uEmber * 1.6, base, settle) * twinkle * smoothstep(0.0, 0.03, uForm);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying vec3 vColor;
      void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vColor * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

function buildHelix(theme, n, scale) {
  const rand = rng(77);
  const u = new Float32Array(n);
  const kind = new Float32Array(n);
  const seed = new Float32Array(n * 3);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = rand();
    kind[i] = r < 0.36 ? 0 : r < 0.72 ? 1 : r < 0.86 ? 2 : 3;
    u[i] = rand();
    seed.set([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1], i * 3);
    size[i] = kind[i] === 3 ? 0.05 + rand() * 0.1 : 0.035 + rand() ** 3 * 0.09;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); // posisi dihitung di shader
  geo.setAttribute('aU', new THREE.BufferAttribute(u, 1));
  geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const pts = new THREE.Points(geo, helixMaterial(theme, scale));
  pts.frustumCulled = false;
  return pts;
}

// Jaringan titik bercahaya yang saling terhubung, mengelilingi helix.
function buildPlexus(theme, n, scale) {
  const rand = rng(5);
  const nodes = Array.from({ length: n }, () => {
    const a = (rand() - 0.5) * Math.PI * 1.2; // hanya sisi kanan & belakang, tidak menutupi teks
    const r = 3 + rand() * 2.8;
    return new THREE.Vector3(Math.cos(a) * r, (rand() - 0.5) * 8, Math.sin(a) * r);
  });
  const seg = [];
  nodes.forEach((p, i) => {
    let links = 0;
    for (let j = i + 1; j < n && links < 3; j++) {
      if (p.distanceTo(nodes[j]) < 2.4) { seg.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z); links++; }
    }
  });
  const g = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, 0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  g.add(new THREE.LineSegments(lineGeo, lineMat));
  const pg = new THREE.BufferGeometry().setFromPoints(nodes);
  const cols = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const palette = [theme.glow(theme.neon, 2), theme.glow(theme.neon2, 2), new THREE.Color(2.2, 2.4, 0.6)];
  nodes.forEach((_, i) => { palette[i % 3].toArray(cols, i * 3); sizes[i] = 0.12 + rand() * 0.16; });
  pg.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
  pg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const nodeMat = glowPointsMaterial(scale);
  g.add(new THREE.Points(pg, nodeMat));
  g.userData = { lineMat, cols: cols.slice(), pg };
  return g;
}

export function create(theme, quality) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);
  const scale = pointScale(quality.dpr);

  const helix = buildHelix(theme, quality.low ? 3000 : 8000, scale);
  const plexus = buildPlexus(theme, quality.low ? 36 : 64, scale);
  rig.add(helix, plexus);

  // Panah yang tertancap (pose sama persis dengan akhir lintasan di hero.js)
  const arrow = buildArrow(theme);
  arrow.position.copy(PLANTED.position);
  arrow.quaternion.copy(PLANTED.quaternion);
  arrow.scale.setScalar(PLANTED.scale);
  group.add(arrow);

  // Kilatan + gelombang saat menancap, bara yang terus menyala di titik tancap
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: new THREE.Color(4, 3, 2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const wave = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1, 96),
    new THREE.MeshBasicMaterial({ color: theme.glow(theme.sun, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const embers = createEmbers(quality.low ? 200 : 450, scale);
  group.add(flash, wave, embers.points);
  const center = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0.6, 0);

  let impactAt = null;
  let lastT = 0;
  return {
    group,
    update(t, { local, mouse, reduced }) {
      const dt = Math.min(Math.max(t - lastT, 0), 0.05);
      lastT = t;
      if (local > HIT && impactAt === null) impactAt = t;
      if (local < HIT - 0.2) impactAt = null; // gulir balik → bisa diputar ulang
      const form = reduced ? 1 : impactAt === null ? 0 : Math.min((t - impactAt) / FORM, 1);

      helix.material.uniforms.uTime.value = t;
      helix.material.uniforms.uForm.value = form;
      const { lineMat, cols, pg } = plexus.userData;
      const show = Math.min(Math.max((form - 0.4) / 0.6, 0), 1);
      lineMat.opacity = show * 0.35;
      const c = pg.attributes.aColor;
      for (let i = 0; i < c.array.length; i++) c.array[i] = cols[i] * show;
      c.needsUpdate = true;
      plexus.rotation.y = t * 0.03;
      rig.rotation.set(-mouse.y * 0.08, mouse.x * 0.15, 0);

      arrow.visible = local > HIT;
      const f = impactAt === null ? 1 : Math.min(form / 0.12, 1);
      flash.visible = impactAt !== null && f < 1;
      flash.scale.setScalar(1 + f * 7);
      flash.material.opacity = 1 - f;
      const w = Math.min(form / 0.35, 1);
      wave.visible = impactAt !== null && w < 1;
      wave.scale.setScalar(0.3 + w * 7);
      wave.material.opacity = (1 - w) * 0.8;

      if (arrow.visible && dt > 0) embers.emit(center, up, form < 0.2 ? 25 : 1, form < 0.2 ? 3 : 0.4);
      embers.update(dt);
    },
  };
}
