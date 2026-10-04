import * as THREE from 'three';
import { stops } from '../camera-path.js';
import { smoothstep, moonMaterial, dotTexture } from '../theme.js';
import { createEmbers, pointScale } from '../fx.js';

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

// Pose panah saat tertancap di pusat section About (dipakai juga oleh stations/about.js).
// Posisi relatif terhadap pusat About; ujung panah (x = 4.6) masuk sedikit ke pusat.
export const PLANTED = (() => {
  const dir = new THREE.Vector3(-0.45, -0.4, -0.8).normalize();
  const scale = 0.5;
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  const position = dir.clone().multiplyScalar(-(4.6 * scale - 0.5));
  return { dir, scale, quaternion, position };
})();

const LAUNCH = 0.12; // titik scroll (local) saat panah lepas
const HIT = 0.8;     // titik scroll saat panah menancap (sedikit sebelum kamera tiba)

// Semburan api di belakang ekor: kerucut aditif dengan kedip noise.
function buildFlame(theme) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uHot: { value: new THREE.Color(4, 3, 1.6) }, uCool: { value: theme.glow(theme.sun, 1.6) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vEdge;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vEdge = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uPower; uniform vec3 uHot, uCool; varying vec2 vUv; varying float vEdge;
      void main() {
        float along = vUv.y; // 0 = pangkal di ekor, 1 = ujung api
        float flick = 0.75 + 0.25 * sin(uTime * 40.0 + vUv.x * 30.0) * sin(uTime * 23.0 + along * 12.0);
        float streak = 0.6 + 0.4 * sin(vUv.x * 60.0 + uTime * 30.0 - along * 20.0);
        float a = pow(1.0 - along, 1.6) * pow(vEdge, 2.0) * flick * streak * uPower;
        gl_FragColor = vec4(mix(uHot, uCool, along) * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1, 24, 1, true), mat);
  cone.rotation.z = Math.PI / 2; // ujung kerucut menghadap -x (ke belakang panah)
  return cone;
}

export function create(theme, quality) {
  const group = new THREE.Group();
  const mark = buildMark(theme);
  const wordmark = buildWordmark(theme);
  const floor = buildFloor(theme);
  group.add(mark.group, wordmark, floor);

  // Panah dilepas dari logo, mengisi tenaga, lalu melesat berapi ke pusat section "about".
  const arrow = mark.arrow;
  group.add(arrow); // lepas dari mark supaya tidak ikut miring oleh mouse
  const startPos = arrow.position.clone();
  const startQ = arrow.quaternion.clone();
  const aboutAt = new THREE.Vector3().fromArray(stops.about.at).sub(new THREE.Vector3().fromArray(stops.hero.at));
  const endPos = aboutAt.clone().add(PLANTED.position);
  // Lintasan kurva yang selalu berada di depan kamera (kanan-atas layar), lalu menukik ke pusat About.
  const path = new THREE.CubicBezierCurve3(
    startPos,
    startPos.clone().add(new THREE.Vector3(1, 1.5, -16)),
    endPos.clone().addScaledVector(PLANTED.dir, -6).add(new THREE.Vector3(0, 0.5, 0)),
    endPos,
  );
  const tangent = new THREE.Vector3();
  const along = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);

  const flame = buildFlame(theme);
  arrow.add(flame);
  const heat = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: theme.glow(theme.sun, 2.5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  heat.position.x = 4.5;
  arrow.add(heat);

  const embers = createEmbers(quality.low ? 700 : 1600, pointScale(quality.dpr));
  group.add(embers.points);
  const tail = new THREE.Vector3();
  const head = new THREE.Vector3();
  const back = new THREE.Vector3();
  const lastPos = startPos.clone();

  // Gelombang kejut di titik lepas
  const shock = new THREE.Mesh(
    new THREE.RingGeometry(0.97, 1, 96),
    new THREE.MeshBasicMaterial({ color: theme.glow(theme.sun, 2.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  shock.position.copy(startPos);
  const shock2 = shock.clone();
  shock2.material = shock.material.clone();
  shock2.material.color = theme.glow(theme.neon, 2.5);
  group.add(shock, shock2);

  let lastT = 0;
  const api = {
    group,
    shake: 0, // dibaca main.js → kamera bergetar
    update(t, { local, mouse }) {
      const dt = Math.min(Math.max(t - lastT, 0), 0.05);
      lastT = t;
      mark.group.position.y = -smoothstep(0.1, 0.45, local) * 6; // bulan turun menjauh saat panah lepas
      mark.group.rotation.y = mouse.x * 0.3;
      mark.group.rotation.x = 0.08 - mouse.y * 0.2;
      mark.spin(t);
      wordmark.position.x = -mouse.x * 0.8;
      wordmark.material.opacity = 1 - smoothstep(0, 0.22, local);
      floor.position.z = (t * 0.4) % 0.5; // titik mengalir pelan ke arah kamera

      // 1) Mengisi tenaga: bergetar, kepala memanas.  2) Melesat di sepanjang kurva.
      const charge = smoothstep(0.01, LAUNCH, local);
      const k = smoothstep(LAUNCH, HIT, local);
      const flying = k > 0 && k < 1;
      path.getPointAt(k, arrow.position);
      if (k === 0 && charge > 0) arrow.position.add(back.set(Math.sin(t * 90), Math.sin(t * 73), 0).multiplyScalar(0.03 * charge));
      path.getTangentAt(Math.min(k, 0.999), tangent);
      along.setFromUnitVectors(X, tangent.normalize());
      arrow.quaternion.slerpQuaternions(startQ, along, smoothstep(0, 0.12, k));
      arrow.scale.setScalar(1 - (1 - PLANTED.scale) * k);
      arrow.visible = local < HIT + 0.02;

      const speed = arrow.position.distanceTo(lastPos) / Math.max(dt, 1e-3);
      lastPos.copy(arrow.position);
      const power = flying ? Math.min(0.5 + speed * 0.02, 1.4) : 0;
      flame.material.uniforms.uTime.value = t;
      flame.material.uniforms.uPower.value = power;
      flame.scale.set(1, 1.2 + power * 3.5, 1);
      flame.position.x = -4.2 - flame.scale.y / 2;
      heat.scale.setScalar(0.3 + charge * 0.9);
      heat.material.opacity = charge * (1 - 0.5 * smoothstep(0, 0.1, k));

      // Bara keluar dari ekor (banyak saat melesat) dan percik kecil dari kepala saat mengisi tenaga.
      if (dt > 0 && arrow.visible) {
        const s = arrow.scale.x;
        tail.set(-4.4, 0, 0).applyQuaternion(arrow.quaternion).multiplyScalar(s).add(arrow.position);
        back.set(-1, 0, 0).applyQuaternion(arrow.quaternion);
        if (flying) embers.emit(tail, back.multiplyScalar(3), Math.min(Math.ceil(speed * dt * 9 + 3), 60), 1.2);
        else if (charge > 0.2) {
          head.set(4.5, 0, 0).applyQuaternion(arrow.quaternion).add(arrow.position);
          embers.emit(head, back.set(0, 1, 0), Math.ceil(charge * 3), 0.8);
        }
      }
      embers.update(dt);

      const e = smoothstep(LAUNCH - 0.01, LAUNCH + 0.14, local);
      shock.visible = shock2.visible = e > 0 && e < 1;
      shock.scale.setScalar(0.5 + e * 9);
      shock2.scale.setScalar(0.5 + smoothstep(0, 0.6, e) * 6);
      shock.material.opacity = (1 - e) * 0.9;
      shock2.material.opacity = (1 - smoothstep(0, 0.6, e)) * 0.7;

      // Hentakan saat lepas + getar halus selama terbang.
      api.shake = Math.sin(Math.PI * smoothstep(LAUNCH - 0.02, LAUNCH + 0.12, local)) * 0.35 + (flying ? 0.05 : 0) + charge * (1 - Math.min(k * 50, 1)) * 0.04;
    },
  };
  return api;
}
