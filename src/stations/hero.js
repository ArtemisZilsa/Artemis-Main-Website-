import * as THREE from 'three';
import { stops } from '../camera-path.js';
import { smoothstep, moonMaterial, dotTexture } from '../theme.js';

const ARROW_TILT = 0.62; // kemiringan panah di logo

// Halo neon di tepi bola (fresnel).
export function fresnelMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(vN, vV)), 3.0);
        gl_FragColor = vec4(uColor * f, f);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

// Garis-garis skala melingkar (sama seperti cincin loader).
export function makeTicks(theme, radius, count, k = 1.2) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.018, 0.12, 0.018),
    new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, k) }),
    count,
  );
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    o.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    o.rotation.set(0, 0, a - Math.PI / 2);
    o.scale.set(1, i % 10 === 0 ? 2.4 : 1, 1);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  }
  return mesh;
}

export function buildArrow(theme) {
  const g = new THREE.Group();
  const metal = theme.metal(0.3);
  const edge = new THREE.LineBasicMaterial({ color: theme.glow(theme.neon, 2.5) });
  const V = THREE.Vector2;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 7.6, 12), metal);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.2;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 7.6, 6), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 2.2) }));
  core.rotation.z = Math.PI / 2;
  core.position.set(-0.2, 0, 0.05);

  const flat = (pts) => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.08, bevelEnabled: false });
    geo.translate(0, 0, -0.04);
    const m = new THREE.Mesh(geo, metal);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edge));
    return m;
  };
  const head = flat([new V(1.1, 0), new V(0, 0.36), new V(0.22, 0), new V(0, -0.36)]);
  head.position.x = 3.5;
  const tail = flat([new V(0, 0), new V(1.15, 0.42), new V(0.85, 0), new V(1.15, -0.42)]);
  tail.position.x = -4.2;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 6) }));
  tip.position.x = 4.6;

  g.add(shaft, core, head, tail, tip);
  return g;
}

// Logo Artemis 3D: bulan (sabit dari cahaya), cincin orbit, skala, panah.
export function buildMark(theme) {
  const group = new THREE.Group();
  const R = 2.1;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 64),
    moonMaterial(theme),
  );
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.14, 64, 48), fresnelMaterial(theme.glow(theme.neon, 1.4)));

  const ring = new THREE.Group();
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.07, 24, 220), theme.metal(0.42)));
  const lineMat = new THREE.MeshBasicMaterial({ color: theme.glow(theme.neon, 3) });
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(2.72, 0.012, 8, 220), lineMat));
  const ticks = makeTicks(theme, 3.25, 120);

  const arrow = buildArrow(theme);
  arrow.position.set(0.1, -0.05, 2.35);
  arrow.rotation.z = ARROW_TILT;

  group.add(moon, atmo, ring, ticks, arrow);
  group.rotation.x = 0.08;
  const baseLine = lineMat.color.clone();
  return {
    group, ring, ticks, arrow, lineMat,
    spin(t) {
      moon.rotation.y = t * 0.02;
      ring.rotation.z = t * 0.06;
      ticks.rotation.z = -t * 0.03;
    },
    // 0..1: seberapa terang cincin neon
    charge(k) {
      lineMat.color.copy(baseLine).multiplyScalar(1 + k * 1.5);
    },
  };
}

// Wordmark raksasa bergaris tipis di belakang bulan (gaya Kerf K1 / Koi Mecha di threeui).
function buildWordmark(theme) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 360;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.font = '400 270px Michroma, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 2.5;
    g.strokeStyle = '#fff';
    g.strokeText('ARTEMIS', c.width / 2, c.height / 2);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.load('270px Michroma').then(draw).catch(() => {});
  const W = 24;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W, (W * c.height) / c.width),
    new THREE.MeshBasicMaterial({ map: tex, color: theme.glow(theme.ink, 0.5), transparent: true, depthWrite: false }),
  );
  mesh.position.set(0, 0.2, -6);
  return mesh;
}

// Lantai titik perspektif yang memudar ke tepi (gaya Tandem di threeui).
function buildFloor(theme) {
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  for (let x = -16; x <= 16; x += 0.5) {
    for (let z = -14; z <= 8; z += 0.5) {
      const fade = Math.max(0, 1 - Math.hypot(x / 16, z / 14)) ** 1.6;
      if (fade < 0.02) continue;
      pos.push(x, 0, z);
      c.copy(theme.neon).multiplyScalar(fade * 1.2);
      col.push(c.r, c.g, c.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const floor = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.09, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  floor.position.y = -3.6;
  return floor;
}

export function create(theme) {
  const group = new THREE.Group();
  const mark = buildMark(theme);
  const wordmark = buildWordmark(theme);
  const floor = buildFloor(theme);
  group.add(mark.group, wordmark, floor);

  // Panah dilepas dari logo dan terbang ke section "about".
  const arrow = mark.arrow;
  group.add(arrow); // lepas dari mark supaya tidak ikut miring oleh mouse
  const startPos = arrow.position.clone();
  const startQ = arrow.quaternion.clone();
  const endPos = new THREE.Vector3().fromArray(stops.about.at).sub(new THREE.Vector3().fromArray(stops.hero.at)).add(new THREE.Vector3(0, 2.2, -6));
  const endQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, Math.PI / 2 - 0.55, 0.1));
  const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(endQ);

  return {
    group,
    update(t, { local, mouse }) {
      mark.group.rotation.y = mouse.x * 0.3;
      mark.group.rotation.x = 0.08 - mouse.y * 0.2;
      mark.spin(t);
      wordmark.position.x = -mouse.x * 0.8;
      wordmark.material.opacity = 1 - smoothstep(0, 0.5, local);
      floor.position.z = (t * 0.4) % 0.5; // titik mengalir pelan ke arah kamera

      const k = smoothstep(0.08, 0.95, local);
      arrow.position.lerpVectors(startPos, endPos, k);
      arrow.position.y += Math.sin(k * Math.PI) * 1.6;
      arrow.position.addScaledVector(forward, Math.max(0, local - 1) * 40);
      arrow.quaternion.slerpQuaternions(startQ, endQ, k);
      arrow.visible = local < 1.5;
    },
  };
}
