import * as THREE from 'three';
import { buildMark } from './hero.js';
import { smoothstep } from '../theme.js';

// Penutup: panah kembali dan menancap, logo utuh menyala.
export function create(theme) {
  const group = new THREE.Group();
  const mark = buildMark(theme);
  group.add(mark.group);
  const base = mark.arrow.position.clone();
  const dir = new THREE.Vector3(Math.cos(mark.arrow.rotation.z), Math.sin(mark.arrow.rotation.z), 0);

  return {
    group,
    update(t, { local, mouse }) {
      const k = smoothstep(-1.1, -0.15, local);
      mark.arrow.position.copy(base).addScaledVector(dir, -14 * (1 - k));
      mark.arrow.visible = k > 0.01;
      mark.group.scale.setScalar(0.75 + 0.25 * k);
      mark.group.rotation.y = mouse.x * 0.3 + (1 - k) * 0.6;
      mark.group.rotation.x = 0.08 - mouse.y * 0.2;
      mark.spin(t);
      mark.charge(smoothstep(0.85, 1, k));
    },
  };
}
